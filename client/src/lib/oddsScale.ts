/**
 * Mapping between a slider's 0–1 track position and the value it represents.
 *
 * `fromPosition` returns a value already snapped to whatever granularity the
 * scale considers sensible at that point on the track, so callers can hand the
 * result straight to `onChange`.
 */
export interface SliderScale {
  toPosition: (value: number) => number;
  fromPosition: (position: number) => number;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Even spread across [min, max] — the plain slider behaviour. */
export function createLinearScale(
  min: number,
  max: number,
  step: number,
): SliderScale {
  const span = max - min;
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  const factor = Math.pow(10, decimals);
  return {
    toPosition: (value) =>
      span <= 0 ? 0 : clamp((value - min) / span, 0, 1),
    fromPosition: (position) => {
      const raw = min + clamp(position, 0, 1) * span;
      const stepped = Math.round((raw - min) / step) * step + min;
      return clamp(Math.round(stepped * factor) / factor, min, max);
    },
  };
}

// Odds are always > 1, so the part that actually varies is the profit (value − 1):
// 1.01 → 1.02 doubles the profit, while 900 → 901 barely moves it. Taking the log
// of the profit is what warps the track towards the low end.
const MIN_PROFIT = 1e-4;
const profit = (value: number) => Math.max(value - 1, MIN_PROFIT);

// Snap granularity by magnitude: 0.01 where users tune carefully, round numbers
// higher up where a single pixel is worth several points of odds anyway.
const ODDS_STEPS: Array<[limit: number, step: number]> = [
  [2, 0.01],
  [5, 0.05],
  [10, 0.1],
  [50, 0.5],
  [100, 1],
  [Infinity, 5],
];

const snapOdds = (value: number) => {
  const [, step] = ODDS_STEPS.find(([limit]) => value < limit) ?? [0, 1];
  return Math.round(Math.round(value / step) * step * 100) / 100;
};

/**
 * Logarithmic odds scale: the value grows by a constant *factor* per pixel
 * instead of a constant amount, so the low odds most slips are built from get
 * the bulk of the track and it accelerates from there.
 *
 * Share of the track given to 1.01–2, by upper bound: ~40% at 1000, ~50% at 100,
 * ~60% at 20, ~68% at 10. The curve is smooth — there is no gear-change point
 * where the thumb suddenly speeds up.
 */
export function createOddsScale(min: number, max: number): SliderScale {
  const lo = Math.log(profit(min));
  const span = Math.log(profit(max)) - lo;
  return {
    toPosition: (value) =>
      span <= 0
        ? 0
        : clamp((Math.log(profit(clamp(value, min, max))) - lo) / span, 0, 1),
    fromPosition: (position) => {
      if (span <= 0) return min;
      const raw = 1 + Math.exp(lo + clamp(position, 0, 1) * span);
      // Snapping can overshoot either end (e.g. a 3.33 max snapped to 3.35), so
      // clamp last — that keeps both endpoints exactly reachable.
      return clamp(snapOdds(raw), min, max);
    },
  };
}
