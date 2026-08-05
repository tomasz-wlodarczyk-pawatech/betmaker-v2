import {
  RANDOM_TARGET_MAX,
  RANDOM_TARGET_MIN,
  TOLERANCE,
  formatOdds,
} from "./odds";
import type { BetslipDiagnostics } from "@shared/schema";

export interface FeasibilityInput {
  targetOdds: number;
  /** Lower bound on each leg's odds (legOdds[0]). */
  minLegOdds: number;
  /** Upper bound on each leg's odds (legOdds[1]). */
  maxLegOdds: number;
  /** Minimum number of legs (legs[0]). */
  minLegs: number;
  /** Maximum number of legs (legs[1]). */
  maxLegs: number;
}

export interface FeasibilityResult {
  feasible: boolean;
  /**
   * Feasible, but only just: reaching the target forces nearly every leg to sit
   * near the max leg odds, so the real data will usually come up empty. The UI
   * shows a soft advisory (it does NOT block generation).
   */
  tight?: boolean;
  /** User-facing explanation, set when !feasible OR when tight. */
  reason?: string;
  /** Fewest legs that could reach the target, when that's the blocker. */
  minLegsNeeded?: number;
}

/**
 * How much room there must be between the per-leg odds the target demands and
 * the user's max leg odds before we consider the combo comfortable. A headroom
 * below this means "to hit the target, almost every leg has to be near the max"
 * — mathematically possible, but the data rarely supplies it.
 */
const TIGHT_HEADROOM = 1.1;

/**
 * Decide whether the chosen filters can *arithmetically* produce a betslip.
 *
 * Combined odds = product of leg odds, so for `n` legs each within
 * [minLegOdds, maxLegOdds] the achievable total spans [minLegOdds^n, maxLegOdds^n].
 * That envelope is the WIDEST possible range — real selections only ever offer a
 * subset of it. A betslip is possible iff some whole leg count in [minLegs, maxLegs]
 * produces an envelope overlapping the target window (targetOdds ± TOLERANCE).
 *
 * Because the envelope is the widest case, a `feasible: false` result is a true
 * arithmetic dead end, never a false positive — which is what makes it safe to
 * skip the API call and show the message immediately.
 */
export function checkBetslipFeasibility(
  input: FeasibilityInput,
): FeasibilityResult {
  const { targetOdds, minLegOdds, maxLegOdds } = input;

  // Never block on bad/degenerate data. Leg odds are always > 1 in practice
  // (LEG_ODDS_MIN = 1.01), but guard so we can't divide by log(1) = 0 below or
  // flag "impossible" off invalid input.
  if (
    !Number.isFinite(targetOdds) ||
    !Number.isFinite(minLegOdds) ||
    !Number.isFinite(maxLegOdds) ||
    targetOdds <= 0 ||
    maxLegOdds <= 1
  ) {
    return { feasible: true };
  }

  const minLegs = Math.max(1, Math.floor(input.minLegs));
  const maxLegs = Math.max(minLegs, Math.floor(input.maxLegs));

  const targetLow = targetOdds * (1 - TOLERANCE);
  const targetHigh = targetOdds * (1 + TOLERANCE);

  // Iterating whole leg counts (≤ 60) sidesteps every log/divide-by-zero edge
  // case in the detection itself; logs are used only for the message below.
  // Feasible leg counts form a contiguous range, so the largest feasible n is
  // also the most forgiving (most legs ⇒ lowest per-leg odds needed).
  let maxFeasibleN = 0;
  for (let n = minLegs; n <= maxLegs; n++) {
    const reachableHigh = Math.pow(maxLegOdds, n);
    const reachableLow = Math.pow(minLegOdds, n);
    if (reachableHigh >= targetLow && reachableLow <= targetHigh) {
      maxFeasibleN = n;
    }
  }

  const target = formatOdds(targetOdds);

  if (maxFeasibleN > 0) {
    // Feasible. Check the most forgiving config (most legs): the per-leg
    // geometric mean needed just to reach the bottom of the window. If even that
    // sits within TIGHT_HEADROOM of the max leg odds, the slip is barely
    // possible — warn softly, but don't block.
    const requiredMean = Math.max(
      minLegOdds,
      Math.pow(targetLow, 1 / maxFeasibleN),
    );
    if (maxLegOdds / requiredMean < TIGHT_HEADROOM) {
      return {
        feasible: true,
        tight: true,
        reason: `To reach ~${target} almost every leg must be near your max leg odds (${formatOdds(maxLegOdds)}). Results may be limited — raise Max Leg Odds or increase Max Legs.`,
      };
    }
    return { feasible: true };
  }

  // No leg count works — classify why so we can guide the user to the right fix.

  // Can't climb high enough: even the most legs at the highest leg odds fall
  // short of the target window. (Ciaran's cases.)
  if (Math.pow(maxLegOdds, maxLegs) < targetLow) {
    const minLegsNeeded = Math.ceil(Math.log(targetLow) / Math.log(maxLegOdds));
    return {
      feasible: false,
      minLegsNeeded,
      reason: `To reach odds of ~${target} you'd need at least ${minLegsNeeded} legs at max leg odds ${formatOdds(maxLegOdds)}. Increase Max Legs or raise your leg odds.`,
    };
  }

  // Overshoot: even the fewest legs at the lowest leg odds blow past the window.
  if (Math.pow(minLegOdds, minLegs) > targetHigh) {
    return {
      feasible: false,
      reason: `With at least ${minLegs} ${minLegs === 1 ? "leg" : "legs"} at these leg odds the total can't stay near ${target}. Lower Min Legs or reduce your leg odds.`,
    };
  }

  // The envelope jumps over the window between consecutive whole leg counts
  // (narrow leg-odds range).
  return {
    feasible: false,
    reason: `No whole number of legs lands within ±15% of ${target} at these leg odds. Widen your leg-odds range.`,
  };
}

/** The filter half of a feasibility check — everything except the target. */
export type RandomTargetFilters = Omit<FeasibilityInput, "targetOdds">;

/**
 * Whole targets in [RANDOM_TARGET_MIN, RANDOM_TARGET_MAX] that the current
 * filters can actually reach.
 *
 * Random mode rolls from this list rather than the raw span, so it can never
 * hand the generator a target the user's own filters forbid. It also lets the UI
 * warn only when the *whole* span is a dead end — with no target on screen,
 * checking a single value would be arbitrary.
 *
 * Comfortable targets are preferred; the `tight` ones are returned only when
 * nothing else is reachable, so a workable-but-cramped filter set still rolls.
 */
export function feasibleRandomTargets(filters: RandomTargetFilters): number[] {
  const comfortable: number[] = [];
  const reachable: number[] = [];

  for (let target = RANDOM_TARGET_MIN; target <= RANDOM_TARGET_MAX; target++) {
    const check = checkBetslipFeasibility({ ...filters, targetOdds: target });
    if (!check.feasible) continue;
    reachable.push(target);
    if (!check.tight) comfortable.push(target);
  }

  return comfortable.length > 0 ? comfortable : reachable;
}

/**
 * Turn the server's post-hoc diagnostics into no-match copy. This complements
 * `checkBetslipFeasibility`, which can only reason about the odds arithmetic: the
 * cases below depend on what the *data* offers (how many matches the time range,
 * mode and league/market filters leave, and what those can combine to), which
 * only the server knows.
 *
 * Returns null for `no-combination` — the target was reachable in principle, so
 * `NoMatchState`'s generic "try widening your filters" copy is the honest answer.
 */
export function describePoolInfeasibility(
  diagnostics: BetslipDiagnostics | undefined,
): { title: string; description: string } | null {
  if (!diagnostics) return null;

  const legs = diagnostics.availableLegs;
  const matches = `${legs} ${legs === 1 ? "match" : "matches"}`;

  switch (diagnostics.reason) {
    case "no-selections":
      return {
        title: "No matches fit these filters",
        description:
          "Nothing is available for this combination of mode, time range and leagues/markets. Widen the time range or clear some leagues, markets and leg-odds limits.",
      };

    case "not-enough-events":
      return {
        title: "Not enough matches for that many legs",
        description: `These filters leave only ${matches} to pick from, but you asked for at least ${diagnostics.requiredLegs} legs. Lower Min Legs or widen the time range.`,
      };

    case "target-too-high":
      return {
        title: "Target odds out of reach",
        description: `Only ${matches} fit these filters, and the highest total they can combine to is ${formatOdds(diagnostics.maxReachableOdds ?? 0)}. Lower your target odds or widen the time range.`,
      };

    case "target-too-low": {
      const lowest = formatOdds(diagnostics.minReachableOdds ?? 0);
      return {
        title: "Target odds too low for these filters",
        description:
          (diagnostics.requiredLegs ?? 1) > 1
            ? `The ${diagnostics.requiredLegs} cheapest legs available already multiply to ${lowest}. Raise your target odds or lower Min Legs.`
            : `The cheapest match fitting these filters is ${lowest}, already above your target window. Raise your target odds or lower Min Leg Odds.`,
      };
    }

    default:
      return null;
  }
}

export interface RandomFilterBounds {
  /** Target total odds the slip must reach (the product of all legs). */
  targetOdds: number;
  /** Hard floor for any leg's odds (LEG_ODDS_MIN). */
  legOddsMin: number;
  /** Hard ceiling for any leg's odds — already capped to the target upstream. */
  legOddsMax: number;
  /** Smallest number of legs the UI allows (LEGS_MIN). */
  legsMin: number;
  /** Largest number of legs the UI allows (LEGS_MAX). */
  legsMax: number;
}

export interface RandomFilterResult {
  legOdds: [number, number];
  legs: [number, number];
}

/**
 * Per-leg odds floor for the randomiser. Real selections rarely sit below ~1.1,
 * so we refuse leg counts whose required geometric mean drops under this — those
 * only look feasible on paper (1.01^60 ≈ 1.8) but never produce real slips.
 */
const RANDOM_MEAN_FLOOR = 1.15;

/**
 * Produce a random-but-*achievable* filter set for the given target.
 *
 * The old randomiser rolled leg-odds and leg-count ranges independently of the
 * target, so it almost always landed outside the target window and tripped the
 * "these filters can't make a betslip" gate. This instead anchors on the maths:
 * total odds = product of legs, so `n` legs need a per-leg geometric mean of
 * `target^(1/n)`. We keep only the leg counts whose mean is both believable
 * (≥ RANDOM_MEAN_FLOOR) and clears the max-leg-odds cap with enough headroom to
 * avoid the "tight" advisory, pick one, then spread a leg-odds and leg-count
 * window around it. Every candidate is re-checked with checkBetslipFeasibility,
 * and a guaranteed-feasible window is returned if the random rolls fall short —
 * so the randomiser can never hand back an impossible combination.
 */
export function randomiseFeasibleFilters(
  bounds: RandomFilterBounds,
): RandomFilterResult {
  const { targetOdds } = bounds;
  const legOddsMin = Math.max(1.01, bounds.legOddsMin);
  const legOddsMax = Math.max(legOddsMin, bounds.legOddsMax);
  const legsMin = Math.max(1, Math.floor(bounds.legsMin));
  const legsMax = Math.max(legsMin, Math.floor(bounds.legsMax));

  const geoMean = (n: number) => Math.pow(targetOdds, 1 / n);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

  // Leg counts whose required per-leg mean is realistic AND leaves headroom
  // below the cap (so the result reads as comfortable, never "tight").
  const candidates: number[] = [];
  for (let n = legsMin; n <= legsMax; n++) {
    const mean = geoMean(n);
    if (mean >= RANDOM_MEAN_FLOOR && mean <= legOddsMax / TIGHT_HEADROOM) {
      candidates.push(n);
    }
  }

  const fallback = (): RandomFilterResult => {
    const n =
      candidates.length > 0
        ? candidates[Math.floor(candidates.length / 2)]
        : Math.min(
            legsMax,
            Math.max(
              legsMin,
              Math.round(Math.log(targetOdds) / Math.log(Math.max(1.2, legOddsMax))),
            ),
          );
    // The widest allowed leg-odds window with a valid leg count is always both
    // feasible and non-tight (see checkBetslipFeasibility), so this can't fail.
    return {
      legOdds: [legOddsMin, legOddsMax],
      legs: [n, Math.min(legsMax, n + 2)],
    };
  };

  if (candidates.length === 0) return fallback();

  // Try a handful of varied rolls; verify each against the real feasibility
  // check and only accept feasible, non-tight sets.
  for (let attempt = 0; attempt < 12; attempt++) {
    const n = candidates[Math.floor(Math.random() * candidates.length)];
    const mean = geoMean(n);

    const hi = round2(Math.min(legOddsMax, mean * rand(1.35, 2.2)));
    const lo = round2(Math.max(legOddsMin, Math.min(mean * rand(0.55, 0.85), hi)));

    const legsLo = Math.max(legsMin, n - Math.floor(Math.random() * 3));
    const legsHi = Math.min(legsMax, n + Math.floor(Math.random() * 4));

    const check = checkBetslipFeasibility({
      targetOdds,
      minLegOdds: lo,
      maxLegOdds: hi,
      minLegs: legsLo,
      maxLegs: legsHi,
    });
    if (check.feasible && !check.tight) {
      return { legOdds: [lo, hi], legs: [legsLo, legsHi] };
    }
  }

  return fallback();
}
