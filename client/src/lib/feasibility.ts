import { TOLERANCE, formatOdds } from "./odds";

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
