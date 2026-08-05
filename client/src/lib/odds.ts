// Backend rejects target odds below 2 (see shared/schema.ts targetOdds.min(2)),
// so the minimum selectable target must match to avoid a non-descriptive error.
export const MIN_ODDS = 2;
export const MAX_ODDS = 1000;
export const TOLERANCE = 0.15;

// The span the Random betslip type rolls its target total odds from. Kept
// deliberately modest: higher targets need long accumulators that the real
// selection pool rarely supports, so rolling them would mostly return no match.
export const RANDOM_TARGET_MIN = 5;
export const RANDOM_TARGET_MAX = 20;

export const formatOdds = (n: number): string => {
  const rounded = Math.round(n);
  return Math.abs(n - rounded) < 0.005 ? String(rounded) : n.toFixed(2);
};

// The acceptable total-odds window for a target (target ± 15%), matching the
// "±15% (min - max)" hint shown next to Target Total Odds.
export const computeRange = (odds: number): [number, number] => {
  const tol = odds * TOLERANCE;
  const round =
    odds < 5
      ? (n: number) => Math.round(n * 100) / 100
      : (n: number) => Math.round(n);
  const minR = Math.max(MIN_ODDS, round(odds - tol));
  const maxR = Math.max(minR, Math.min(MAX_ODDS, round(odds + tol)));
  return [minR, maxR];
};
