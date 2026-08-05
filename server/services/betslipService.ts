import { Event, BetSlipResult, BetSlipSelection, HotSelection } from "@/types";
import type { BetslipDiagnostics } from "@shared/schema";

export interface EventFilterOptions {
  /** Leagues to generate from. Empty means every league is allowed. */
  selectedLeagues?: string[];
  /** Markets to generate from. Empty means every market is allowed. */
  selectedMarkets?: string[];
  /** "whenever" | "today" | "3h" | "48h" | "72h" — anything else means no time filter. */
  timeRange?: string;
}

/**
 * Upper-bound timestamp (ms) for a time-range window measured from now, or
 * `null` when no time filter applies ("whenever"/unknown).
 */
function timeRangeCutoff(timeRange: string): number | null {
  const now = Date.now();
  const HOUR = 3_600_000;
  switch (timeRange) {
    case "3h":
      return now + 3 * HOUR;
    case "48h":
      return now + 48 * HOUR;
    case "72h":
      return now + 72 * HOUR;
    case "today": {
      const d = new Date(now);
      return Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        23,
        59,
        59,
        999,
      );
    }
    default:
      return null;
  }
}

/**
 * Apply the user-facing filters to the raw upstream events before any betslip
 * logic runs: a kick-off time window and league/market selection. The selection
 * filters are "only-these" (not exclusions): an empty list means no restriction,
 * a non-empty list keeps ONLY the chosen leagues/markets. Leagues and markets
 * compose as AND — selecting both narrows to the chosen markets within the
 * chosen leagues. Events with an unparseable start time are kept (lenient) so
 * bad timestamps never silently drop otherwise-valid events. Markets are pruned
 * per event; an event left with no selected markets is dropped.
 */
export function filterEvents(
  events: Event[],
  options: EventFilterOptions = {},
): Event[] {
  const {
    selectedLeagues = [],
    selectedMarkets = [],
    timeRange = "whenever",
  } = options;

  let result = events;

  const cutoff = timeRangeCutoff(timeRange);
  if (cutoff !== null) {
    result = result.filter((e) => {
      const t = Date.parse((e as { start_time?: string })?.start_time ?? "");
      return Number.isNaN(t) ? true : t <= cutoff;
    });
  }

  // Keep only the chosen leagues (empty selection = every league allowed).
  if (selectedLeagues.length > 0) {
    const leagueSet = new Set(selectedLeagues);
    result = result.filter((e: any) => leagueSet.has(e?.competition));
  }

  // Within the surviving events, keep only the chosen markets (empty selection =
  // every market allowed). Events left with no markets are dropped.
  if (selectedMarkets.length > 0) {
    const marketSet = new Set(selectedMarkets);
    result = result
      .map((e: any) => ({
        ...e,
        markets: Array.isArray(e?.markets)
          ? e.markets.filter((m: any) => marketSet.has(m?.name))
          : e?.markets,
      }))
      .filter((e: any) => Array.isArray(e?.markets) && e.markets.length > 0);
  }

  return result;
}

/**
 * Generate a betslip with selections that match the target odds
 * Optimized for speed while maintaining randomness
 */
export interface GenerateBetslipOptions {
  selectionMode?: "all" | "hot" | "fav";
  /** Hard lower bound on the number of legs in the generated betslip. */
  minSelections?: number;
  /** Hard upper bound on the number of legs in the generated betslip. */
  maxSelections?: number;
  /** Lower bound on each individual leg's odds. */
  minLegOdds?: number;
  /** Upper bound on each individual leg's odds. */
  maxLegOdds?: number;
}

/**
 * Keep only selections whose odds fall within the per-leg odds window. Missing
 * bounds mean "no bound" on that side.
 */
function filterByLegOdds(
  selections: HotSelection[],
  minLegOdds?: number,
  maxLegOdds?: number,
): HotSelection[] {
  if (minLegOdds == null && maxLegOdds == null) {
    return selections;
  }
  const lo = minLegOdds ?? 0;
  const hi = maxLegOdds ?? Infinity;
  return selections.filter((s) => s.odds >= lo && s.odds <= hi);
}

export async function generateBetslip(
  events: Event[],
  targetOdds: number,
  tolerance: number = 0.15,
  options: GenerateBetslipOptions = {},
): Promise<BetSlipResult | null> {
  // Set a timeout to prevent long-running calculations
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 1000; // 1000ms max execution time

  // Extract all hot selections, then narrow to the per-leg odds window.
  const hotSelections = filterByLegOdds(
    getHotSelections(events, options.selectionMode ?? "all"),
    options.minLegOdds,
    options.maxLegOdds,
  );

  if (hotSelections.length === 0) {
    return null;
  }

  // Define acceptable range
  const minOdds = targetOdds * (1 - tolerance);
  const maxOdds = targetOdds * (1 + tolerance);

  // Resolve the selection-count range as a HARD constraint. We can never use
  // more legs than there are distinct events (one selection per event), so the
  // upper bound is capped accordingly. Absent options fall back to "no lower
  // bound" and "as many as there are events".
  const distinctEvents = new Set(hotSelections.map((s) => s.eventId)).size;
  const minSel = Math.max(1, Math.floor(options.minSelections ?? 1));
  const maxSel = Math.min(
    Math.floor(options.maxSelections ?? distinctEvents),
    distinctEvents,
  );

  // Infeasible request: more legs required than there are distinct events.
  if (minSel > maxSel) {
    return null;
  }

  const toResult = (r: {
    totalOdds: number;
    selections: HotSelection[];
  }): BetSlipResult => ({
    totalOdds: r.totalOdds,
    selections: r.selections.map((s: HotSelection) => ({
      id: s.id,
      eventName: s.eventName,
      eventId: s.eventId,
      competition: s.competition,
      marketName: s.marketName,
      selectionName: s.name,
      odds: s.odds.toString(),
      startTime: s.startTime,
      isHot: s.isHot,
    })),
  });

  // Primary path: build combinations that respect the leg-count range.
  const counted = findCombinationWithCount(
    hotSelections,
    targetOdds,
    minOdds,
    maxOdds,
    minSel,
    maxSel,
    startTime,
    MAX_EXECUTION_TIME,
  );
  if (counted) {
    return toResult(counted);
  }

  // Best-effort fallback ONLY when the caller imposed no real count constraint,
  // so we never silently violate a min/max the user actually set.
  const unconstrained =
    minSel <= 1 && options.maxSelections == null;
  if (unconstrained) {
    const fast = findFastCombination(
      hotSelections,
      targetOdds,
      minOdds,
      maxOdds,
    );
    if (fast) {
      return toResult(fast);
    }
  }

  return null;
}

/**
 * Explain why `generateBetslip` came back empty, so the UI can say more than
 * "no betslip matched these filters".
 *
 * The reachable total-odds window follows from the pool: a slip takes at most one
 * leg per event, and decimal odds are always > 1, so the highest total is the
 * `maxSel` priciest legs multiplied together and the lowest is the `minSel`
 * cheapest. If the target window sits outside that span, no search could ever
 * have succeeded and we can name the exact blocker; if it sits inside, the target
 * was reachable in principle and the generic message stands.
 *
 * Call this only after a null result — it re-derives the pool (a couple of passes
 * over the already-filtered events) rather than complicating the hot path.
 */
export function describeInfeasibility(
  events: Event[],
  targetOdds: number,
  tolerance: number = 0.15,
  options: GenerateBetslipOptions = {},
): BetslipDiagnostics {
  const pool = filterByLegOdds(
    getHotSelections(events, options.selectionMode ?? "all"),
    options.minLegOdds,
    options.maxLegOdds,
  );

  const bestByEvent = new Map<string, number>();
  const worstByEvent = new Map<string, number>();
  for (const s of pool) {
    const best = bestByEvent.get(s.eventId);
    if (best === undefined || s.odds > best) bestByEvent.set(s.eventId, s.odds);
    const worst = worstByEvent.get(s.eventId);
    if (worst === undefined || s.odds < worst)
      worstByEvent.set(s.eventId, s.odds);
  }

  const availableLegs = bestByEvent.size;
  if (availableLegs === 0) {
    return { reason: "no-selections", availableLegs: 0 };
  }

  const minSel = Math.max(1, Math.floor(options.minSelections ?? 1));
  if (minSel > availableLegs) {
    return { reason: "not-enough-events", availableLegs, requiredLegs: minSel };
  }
  const maxSel = Math.min(
    Math.floor(options.maxSelections ?? availableLegs),
    availableLegs,
  );

  const product = (odds: number[]) => odds.reduce((acc, o) => acc * o, 1);
  const maxReachableOdds = product(
    Array.from(bestByEvent.values())
      .sort((a, b) => b - a)
      .slice(0, maxSel),
  );
  const minReachableOdds = product(
    Array.from(worstByEvent.values())
      .sort((a, b) => a - b)
      .slice(0, minSel),
  );

  if (maxReachableOdds < targetOdds * (1 - tolerance)) {
    return { reason: "target-too-high", availableLegs, maxReachableOdds };
  }
  if (minReachableOdds > targetOdds * (1 + tolerance)) {
    return {
      reason: "target-too-low",
      availableLegs,
      minReachableOdds,
      requiredLegs: minSel,
    };
  }
  return {
    reason: "no-combination",
    availableLegs,
    maxReachableOdds,
    minReachableOdds,
  };
}

export interface SwitchSelectionOptions {
  /** Events already used in the slip — the replacement must come from outside. */
  excludeEventIds: string[];
  /** The leg being replaced; excluded defensively (its event is normally in
   * `excludeEventIds` already). */
  currentSelectionId: string;
  /** Odds of the leg being replaced. */
  replacedSelectionOdds: number;
  /** Slip's overall target odds. */
  targetOdds: number;
  /** Slip's current combined odds (before the swap). */
  currentTotalOdds: number;
  selectionMode?: string;
  /** Lower bound on the replacement leg's odds. */
  minLegOdds?: number;
  /** Upper bound on the replacement leg's odds. */
  maxLegOdds?: number;
}

/**
 * Find a single replacement leg for a betslip swap. Picks a selection from an
 * event not already in the slip whose odds steer the new combined odds back
 * toward the target, with light randomness so repeat swaps vary.
 *
 * NOTE: this only filters by event. The caller is expected to pass events that
 * have already been narrowed to the selected leagues/markets (the switch route
 * runs `filterEvents` first), so a swap stays within the same selection. The
 * `excludeEventIds` here is an unrelated concept — the legs already in the slip,
 * so the replacement always comes from a fresh event.
 */
export function findReplacementSelection(
  events: Event[],
  options: SwitchSelectionOptions,
): BetSlipSelection | null {
  // A swap must stay inside the mode the slip was built in, or a Favorites slip
  // would quietly gain a non-favourite leg on the first switch.
  const mode =
    options.selectionMode === "hot" || options.selectionMode === "fav"
      ? options.selectionMode
      : "all";
  const all = filterByLegOdds(
    getHotSelections(events, mode),
    options.minLegOdds,
    options.maxLegOdds,
  );

  const excluded = new Set(options.excludeEventIds);
  const candidates = all.filter(
    (s) => !excluded.has(s.eventId) && s.id !== options.currentSelectionId,
  );
  if (candidates.length === 0) {
    return null;
  }

  // Odds the replacement should contribute so the new combined odds land back
  // near the target: target / (current total with the replaced leg removed).
  const baseOdds = options.currentTotalOdds / options.replacedSelectionOdds;
  const needed =
    Number.isFinite(baseOdds) && baseOdds > 0
      ? options.targetOdds / baseOdds
      : options.replacedSelectionOdds;

  candidates.sort(
    (a, b) => Math.abs(a.odds - needed) - Math.abs(b.odds - needed),
  );

  // Random pick among the closest few for variety on repeat swaps.
  const topN = Math.min(5, candidates.length);
  const pick = candidates[Math.floor(Math.random() * topN)];

  return {
    id: pick.id,
    eventName: pick.eventName,
    eventId: pick.eventId,
    competition: pick.competition,
    marketName: pick.marketName,
    selectionName: pick.name,
    odds: pick.odds.toString(),
    startTime: pick.startTime,
    isHot: pick.isHot,
  };
}

/**
 * Build betslip combinations whose leg count falls within [minSel, maxSel] and
 * whose combined odds land in [minOdds, maxOdds]. Each attempt picks a random
 * target leg count `k` in range and greedily fills `k` legs, steering every
 * pick toward the per-leg odds still needed to reach the target product. This
 * makes the leg-count filter a hard constraint that genuinely shapes the result
 * (unlike a collect-then-filter pass, which would rarely produce large slips).
 */
function findCombinationWithCount(
  selections: HotSelection[],
  targetOdds: number,
  minOdds: number,
  maxOdds: number,
  minSel: number,
  maxSel: number,
  startTime: number,
  maxExecutionTime: number,
): { totalOdds: number; selections: HotSelection[] } | null {
  const valid: Array<{
    totalOdds: number;
    selections: HotSelection[];
    diff: number;
  }> = [];

  const MAX_ATTEMPTS = 800;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (Date.now() - startTime > maxExecutionTime) {
      break;
    }

    // Random target leg count within the allowed range for variety.
    const k = minSel + Math.floor(Math.random() * (maxSel - minSel + 1));

    const chosen: HotSelection[] = [];
    const usedEventIds = new Set<string>();
    let product = 1;

    for (let step = 0; step < k; step++) {
      const remainingLegs = k - step;
      // Odds each remaining leg should contribute, on average, to hit target.
      const neededPerLeg = Math.pow(targetOdds / product, 1 / remainingLegs);

      // Candidates: one selection per event.
      const candidates = selections.filter(
        (s) => !usedEventIds.has(s.eventId),
      );
      if (candidates.length === 0) {
        break;
      }

      // Pick among the few selections closest to the needed per-leg odds,
      // with a touch of randomness so repeat generations vary.
      candidates.sort(
        (a, b) =>
          Math.abs(a.odds - neededPerLeg) - Math.abs(b.odds - neededPerLeg),
      );
      const topN = Math.min(5, candidates.length);
      const pick = candidates[Math.floor(Math.random() * topN)];

      chosen.push(pick);
      usedEventIds.add(pick.eventId);
      product *= pick.odds;
    }

    if (
      chosen.length === k &&
      product >= minOdds &&
      product <= maxOdds
    ) {
      valid.push({
        totalOdds: product,
        selections: [...chosen],
        diff: Math.abs(product - targetOdds),
      });

      // Enough variety collected — stop early.
      if (valid.length >= 30) {
        break;
      }
    }
  }

  if (valid.length === 0) {
    return null;
  }

  // Prefer combinations closest to target, but randomise among the best few.
  valid.sort((a, b) => a.diff - b.diff);
  const topRange = Math.min(5, valid.length);
  const selected = valid[Math.floor(Math.random() * topRange)];
  return { totalOdds: selected.totalOdds, selections: selected.selections };
}

/**
 * The favourite of a match is the team the book prices lowest, so Favorites
 * mode only looks at the match-result market and only at its two team outcomes:
 * the draw is never a "favourite" even on the rare card where it is priced
 * below one of the teams. Upstream names this market `1X2 | Full Time` with
 * selections `1` / `X` / `2`.
 */
const MATCH_RESULT_MARKET_PREFIX = "1X2";
const TEAM_OUTCOMES = new Set(["1", "2"]);

function isFavouriteCandidate(marketName: string, selectionName: string): boolean {
  return (
    marketName.trim().startsWith(MATCH_RESULT_MARKET_PREFIX) &&
    TEAM_OUTCOMES.has(selectionName.trim())
  );
}

/**
 * Flatten events into the candidate pool the combination finders work from,
 * narrowed by the caller's selection mode:
 *
 * - `all` — every selection of every market. A superset of the other two modes.
 * - `hot` — only selections the upstream flags as hot (`hot === 1`).
 * - `fav` — one leg per event: the favoured team, i.e. the cheaper of the two
 *   sides in the match-result market (1.12 vs 2.45 → the 1.12 side).
 *
 * Selections with unparseable odds are dropped in every mode: they can't take
 * part in a product, and leaving them in would let a `NaN` poison a slip.
 */
function getHotSelections(
  events: Event[],
  mode: "all" | "hot" | "fav" = "all",
): HotSelection[] {
  const selections: HotSelection[] = [];

  events.forEach((event) => {
    // Favorites compares across the event's markets (there is only ever one
    // match-result market, but the winner is tracked per event so a duplicate
    // upstream market can't contribute two legs for the same match).
    let favourite: HotSelection | null = null;

    event.markets.forEach((market) => {
      market.selections.forEach((selection) => {
        if (mode === "hot" && selection.hot !== 1) return;
        if (mode === "fav" && !isFavouriteCandidate(market.name, selection.name))
          return;

        const odds = parseFloat(selection.odds);
        if (!Number.isFinite(odds)) return;

        const candidate: HotSelection = {
          id: selection.id,
          name: selection.name,
          odds,
          eventId: event.event_id,
          eventName: event.event_name,
          competition: event.competition,
          marketName: market.name,
          startTime: event.start_time,
          isHot: selection.hot === 1,
        };

        if (mode === "fav") {
          // Ties keep the first one seen, matching the upstream ordering.
          if (favourite === null || candidate.odds < favourite.odds) {
            favourite = candidate;
          }
          return;
        }

        selections.push(candidate);
      });
    });

    if (favourite !== null) {
      selections.push(favourite);
    }
  });

  return selections;
}

/**
 * Find the best combination of selections that match the target odds
 */
function findBestCombination(
  hotSelections: HotSelection[],
  targetOdds: number,
  minOdds: number,
  maxOdds: number,
  maxSize: number
): { totalOdds: number, selections: HotSelection[] } | null {
  // Store multiple valid combinations instead of just the best one
  const validCombinations: Array<{
    totalOdds: number, 
    selections: HotSelection[], 
    diff: number
  }> = [];
  
  // Shuffle the selections to ensure randomness
  const shuffledSelections = [...hotSelections].sort(() => Math.random() - 0.5);
  
  /**
   * Recursive function to find all combinations
   */
  function findCombinations(
    startIndex: number,
    currentSelections: HotSelection[],
    currentOdds: number,
    usedEventIds: Set<string>
  ) {
    // Check if current combination matches criteria
    if (currentOdds >= minOdds && currentOdds <= maxOdds) {
      const diff = Math.abs(currentOdds - targetOdds);
      validCombinations.push({
        totalOdds: currentOdds,
        selections: [...currentSelections],
        diff: diff
      });
      
      // If we have too many combinations, keep only the top 20
      if (validCombinations.length > 20) {
        validCombinations.sort((a, b) => a.diff - b.diff);
        validCombinations.length = 20;
      }
    }
    
    // Stop if we've reached the maximum number of selections
    if (currentSelections.length >= maxSize) {
      return;
    }
    
    // Try adding more selections
    for (let i = startIndex; i < shuffledSelections.length; i++) {
      const selection = shuffledSelections[i];
      
      // Skip if we already have a selection from this event
      if (usedEventIds.has(selection.eventId)) {
        continue;
      }
      
      // Skip if adding this would exceed max odds
      const newOdds = currentOdds * selection.odds;
      if (newOdds > maxOdds * 1.1) { // Add 10% buffer to avoid pruning too early
        continue;
      }
      
      // Add the selection and continue searching
      currentSelections.push(selection);
      usedEventIds.add(selection.eventId);
      
      findCombinations(i + 1, currentSelections, newOdds, usedEventIds);
      
      // Backtrack
      currentSelections.pop();
      usedEventIds.delete(selection.eventId);
    }
  }
  
  // Start the search
  findCombinations(0, [], 1, new Set<string>());
  
  // If we found valid combinations, randomly select one from the top performers
  if (validCombinations.length > 0) {
    // Sort by how close they are to target odds
    validCombinations.sort((a, b) => a.diff - b.diff);
    
    // Randomly select one of the top combinations
    // Get a random index from the top 50% of results, with minimum of 1 and maximum of 5
    const maxRandomIndex = Math.min(
      Math.max(1, Math.floor(validCombinations.length / 2)), 
      Math.min(5, validCombinations.length - 1)
    );
    const randomIndex = Math.floor(Math.random() * (maxRandomIndex + 1));
    
    const selected = validCombinations[randomIndex];
    return { totalOdds: selected.totalOdds, selections: selected.selections };
  }
  
  return null;
}

/**
 * Optimized combination finder with timeout to prevent long-running calculations
 */
function findOptimizedCombination(
  hotSelections: HotSelection[],
  targetOdds: number,
  minOdds: number,
  maxOdds: number,
  maxSize: number,
  startTime: number,
  maxExecutionTime: number
): { totalOdds: number, selections: HotSelection[] } | null {
  // Store valid combinations
  const validCombinations: Array<{
    totalOdds: number, 
    selections: HotSelection[], 
    diff: number
  }> = [];
  
  // Pre-sort selections by ascending odds for more efficient search
  const sortedSelections = [...hotSelections].sort((a, b) => a.odds - b.odds);
  
  // Identify possible starting selections that aren't too large
  const possibleStartingSelections = sortedSelections.filter(s => s.odds <= maxOdds);
  
  // If there are no suitable starting selections, return null
  if (possibleStartingSelections.length === 0) {
    return null;
  }
  
  // Randomly select 3 starting points (or fewer if we have less)
  const startingPoints = [];
  for (let i = 0; i < Math.min(3, possibleStartingSelections.length); i++) {
    const randomIndex = Math.floor(Math.random() * possibleStartingSelections.length);
    startingPoints.push(randomIndex);
  }
  
  // Try each starting point
  for (const startIndex of startingPoints) {
    const startSelection = possibleStartingSelections[startIndex];
    const currentSelections = [startSelection];
    const usedEventIds = new Set<string>([startSelection.eventId]);
    const currentOdds = startSelection.odds;
    
    // If the starting selection is already within range, add it
    if (currentOdds >= minOdds && currentOdds <= maxOdds) {
      validCombinations.push({
        totalOdds: currentOdds,
        selections: [...currentSelections],
        diff: Math.abs(currentOdds - targetOdds)
      });
    }
    
    // Do a depth-first search with a small depth limit for speed
    depthFirstSearch(
      sortedSelections, 
      currentSelections, 
      usedEventIds, 
      currentOdds, 
      1, // Start at depth 1 since we already have one selection
      maxSize,
      targetOdds,
      minOdds,
      maxOdds,
      validCombinations,
      startTime,
      maxExecutionTime
    );
    
    // Check if we've exceeded our time limit
    if (Date.now() - startTime > maxExecutionTime) {
      break;
    }
  }
  
  // If we found valid combinations, pick a random one from the best few
  if (validCombinations.length > 0) {
    // Sort by how close they are to target odds
    validCombinations.sort((a, b) => a.diff - b.diff);
    
    // Randomly select from top 3 (or fewer if we have less)
    const randomIndex = Math.floor(Math.random() * Math.min(3, validCombinations.length));
    const selected = validCombinations[randomIndex];
    
    return { totalOdds: selected.totalOdds, selections: selected.selections };
  }
  
  return null;
}

/**
 * Depth-first search with time limit and early termination
 */
function depthFirstSearch(
  selections: HotSelection[],
  currentSelections: HotSelection[],
  usedEventIds: Set<string>,
  currentOdds: number,
  depth: number,
  maxDepth: number,
  targetOdds: number,
  minOdds: number,
  maxOdds: number,
  validCombinations: Array<{ totalOdds: number, selections: HotSelection[], diff: number }>,
  startTime: number,
  maxExecutionTime: number
): void {
  // Check time limit
  if (Date.now() - startTime > maxExecutionTime) {
    return;
  }
  
  // If we've reached max depth, stop
  if (depth >= maxDepth) {
    return;
  }
  
  // Try adding each possible selection
  for (const selection of selections) {
    // Skip if we already have a selection from this event
    if (usedEventIds.has(selection.eventId)) {
      continue;
    }
    
    // Calculate new odds
    const newOdds = currentOdds * selection.odds;
    
    // If new odds would exceed max odds by too much, skip
    if (newOdds > maxOdds * 1.1) {
      continue;
    }
    
    // Add selection
    currentSelections.push(selection);
    usedEventIds.add(selection.eventId);
    
    // Check if current combination is valid
    if (newOdds >= minOdds && newOdds <= maxOdds) {
      const diff = Math.abs(newOdds - targetOdds);
      validCombinations.push({
        totalOdds: newOdds,
        selections: [...currentSelections],
        diff: diff
      });
      
      // Keep only the best 10 combinations for memory efficiency
      if (validCombinations.length > 10) {
        validCombinations.sort((a, b) => a.diff - b.diff);
        validCombinations.length = 10;
      }
    }
    
    // Continue search
    depthFirstSearch(
      selections,
      currentSelections,
      usedEventIds,
      newOdds,
      depth + 1,
      maxDepth,
      targetOdds,
      minOdds,
      maxOdds,
      validCombinations,
      startTime,
      maxExecutionTime
    );
    
    // Backtrack
    currentSelections.pop();
    usedEventIds.delete(selection.eventId);
  }
}

/**
 * Fast combination finder using a greedy approach for better performance
 */
function findFastCombination(
  hotSelections: HotSelection[],
  targetOdds: number,
  minOdds: number,
  maxOdds: number
): { totalOdds: number, selections: HotSelection[] } | null {
  // Clone and shuffle selections
  const shuffledSelections = [...hotSelections].sort(() => Math.random() - 0.5);
  
  // Try multiple starting points to get different results each time
  const startingPoints = [];
  for (let i = 0; i < Math.min(5, shuffledSelections.length); i++) {
    const randomIndex = Math.floor(Math.random() * shuffledSelections.length);
    startingPoints.push(randomIndex);
  }
  
  // Try building from each starting point and collect results
  const possibleCombinations = [];
  
  for (const startIndex of startingPoints) {
    let currentOdds = 1;
    const selectedSelections: HotSelection[] = [];
    const usedEventIds = new Set<string>();
    
    // Add the starting selection
    const startSelection = shuffledSelections[startIndex];
    selectedSelections.push(startSelection);
    usedEventIds.add(startSelection.eventId);
    currentOdds *= startSelection.odds;
    
    // Try to build a combination that gets close to the target odds
    for (const selection of shuffledSelections) {
      // Skip if we already used this event or it's the starting selection
      if (usedEventIds.has(selection.eventId)) {
        continue;
      }
      
      // Check if adding this selection would improve our odds
      const newOdds = currentOdds * selection.odds;
      if (newOdds <= maxOdds * 1.1 && Math.abs(newOdds - targetOdds) < Math.abs(currentOdds - targetOdds)) {
        selectedSelections.push(selection);
        usedEventIds.add(selection.eventId);
        currentOdds = newOdds;
        
        // If we're within range, add to possible combinations
        if (currentOdds >= minOdds && currentOdds <= maxOdds) {
          possibleCombinations.push({
            totalOdds: currentOdds,
            selections: [...selectedSelections],
            diff: Math.abs(currentOdds - targetOdds)
          });
        }
      }
    }
    
    // Even if not in range, add to possible combinations if we have selections
    if (selectedSelections.length > 1) {
      possibleCombinations.push({
        totalOdds: currentOdds,
        selections: [...selectedSelections],
        diff: Math.abs(currentOdds - targetOdds)
      });
    }
  }
  
  // If we found any combinations, pick a random one from the best few
  if (possibleCombinations.length > 0) {
    // Sort by how close they are to target odds
    possibleCombinations.sort((a, b) => a.diff - b.diff);
    
    // Take a random one from the top 3 (or fewer if we have less)
    const randomIndex = Math.floor(Math.random() * Math.min(3, possibleCombinations.length));
    const selected = possibleCombinations[randomIndex];
    
    return { 
      totalOdds: selected.totalOdds, 
      selections: selected.selections 
    };
  }
  
  return null;
}
