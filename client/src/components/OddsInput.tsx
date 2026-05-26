import { useCallback, useMemo, useState, memo } from "react";
import { IconButton, Input, Tabs } from "@aliengain/components";
import { IconChevronLeft, IconChevronRight } from "@aliengain/icons";
import { DualSliderTrack } from "./DualSliderTrack";

interface OddsInputProps {
  targetOdds: number;
  setTargetOdds: (odds: number) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

const MIN_ODDS = 1.01;
const MAX_ODDS = 1000;
const TOLERANCE = 0.15;

type Mode = "exact" | "range";

const formatOdds = (n: number): string => {
  const rounded = Math.round(n);
  return Math.abs(n - rounded) < 0.005 ? String(rounded) : n.toFixed(2);
};

const computeRange = (odds: number): [number, number] => {
  const tol = odds * TOLERANCE;
  const round =
    odds < 5
      ? (n: number) => Math.round(n * 100) / 100
      : (n: number) => Math.round(n);
  const minR = Math.max(MIN_ODDS, round(odds - tol));
  const maxR = Math.max(minR, Math.min(MAX_ODDS, round(odds + tol)));
  return [minR, maxR];
};

const OddsInput = memo(function OddsInput({
  targetOdds,
  setTargetOdds,
  disabled = false,
}: OddsInputProps) {
  const [inputDraft, setInputDraft] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("exact");
  const [rangeOdds, setRangeOdds] = useState<[number, number]>(() =>
    computeRange(targetOdds),
  );
  const [minDraft, setMinDraft] = useState<string | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);

  const range = useMemo(() => {
    const [min, max] = computeRange(targetOdds);
    return { min, max };
  }, [targetOdds]);

  const broadcastOdds = useCallback((value: number) => {
    window.parent.postMessage(
      { type: "betslip_generator_odds_change", odds: value },
      "*",
    );
  }, []);

  const updateOdds = useCallback(
    (value: number) => {
      const clamped = Math.min(MAX_ODDS, Math.max(MIN_ODDS, value));
      setTargetOdds(clamped);
      broadcastOdds(clamped);
    },
    [setTargetOdds, broadcastOdds],
  );

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTargetOdds(Number(e.target.value));
    },
    [setTargetOdds],
  );

  const decreaseOdds = useCallback(
    () => updateOdds(Math.round(targetOdds) - 1),
    [targetOdds, updateOdds],
  );

  const increaseOdds = useCallback(
    () => updateOdds(Math.round(targetOdds) + 1),
    [targetOdds, updateOdds],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputDraft(e.target.value);
    },
    [],
  );

  const commitInput = useCallback(() => {
    if (inputDraft === null) return;
    const parsed = parseFloat(inputDraft.replace(",", "."));
    if (Number.isFinite(parsed)) updateOdds(parsed);
    setInputDraft(null);
  }, [inputDraft, updateOdds]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    [],
  );

  const clampOdds = useCallback(
    (n: number) => Math.min(MAX_ODDS, Math.max(MIN_ODDS, n)),
    [],
  );

  const commitRangeMin = useCallback(() => {
    if (minDraft === null) return;
    const parsed = parseFloat(minDraft.replace(",", "."));
    if (Number.isFinite(parsed)) {
      const next = Math.min(clampOdds(parsed), rangeOdds[1]);
      setRangeOdds([next, rangeOdds[1]]);
    }
    setMinDraft(null);
  }, [minDraft, clampOdds, rangeOdds]);

  const commitRangeMax = useCallback(() => {
    if (maxDraft === null) return;
    const parsed = parseFloat(maxDraft.replace(",", "."));
    if (Number.isFinite(parsed)) {
      const next = Math.max(clampOdds(parsed), rangeOdds[0]);
      setRangeOdds([rangeOdds[0], next]);
    }
    setMaxDraft(null);
  }, [maxDraft, clampOdds, rangeOdds]);

  const handleModeChange = useCallback(
    (next: Mode) => {
      if (next === "range") {
        setRangeOdds(computeRange(targetOdds));
      } else {
        const mid = Math.round((rangeOdds[0] + rangeOdds[1]) / 2);
        updateOdds(mid);
      }
      setMode(next);
    },
    [targetOdds, rangeOdds, updateOdds],
  );

  const inputValue = inputDraft ?? formatOdds(targetOdds);
  const sliderPercent =
    ((targetOdds - MIN_ODDS) / (MAX_ODDS - MIN_ODDS)) * 100;
  const sliderBackground = `linear-gradient(to right, var(--colors-background-brand-default) 0%, var(--colors-background-brand-default) ${sliderPercent}%, var(--colors-background-tertiary) ${sliderPercent}%, var(--colors-background-tertiary) 100%)`;

  return (
    <Card>
      <Tabs
        activeType={mode}
        onActiveTypeChange={(v) => handleModeChange(v as Mode)}
      >
        <Tabs.List>
          <Tabs.Tab value="exact">Exact Mode</Tabs.Tab>
          <Tabs.Tab value="range">Range Mode</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <div
        style={{
          padding:
            "var(--spacing-sm, 0.75rem) var(--spacing-md, 1rem) var(--spacing-xl, 1.5rem)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-md, 1rem)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xxs, 0.25rem)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--spacing-xs, 0.5rem)",
              padding: "0 var(--spacing-xxs, 0.25rem)",
            }}
          >
            <span
              style={{
                fontFamily: "Roboto, sans-serif",
                fontSize: "1rem",
                lineHeight: "1.5rem",
                fontWeight: 400,
                color: "var(--colors-text-primary)",
              }}
            >
              Target Total Odds
            </span>
            {mode === "exact" && (
              <span
                style={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "0.75rem",
                  lineHeight: "1rem",
                  fontWeight: 400,
                  color: "var(--colors-text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ±15% ({formatOdds(range.min)} - {formatOdds(range.max)})
              </span>
            )}
          </div>

          {mode === "exact" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-xs, 0.5rem)",
              }}
            >
              <IconButton
                aria-label="Decrease odds"
                icon={<IconChevronLeft size="md" />}
                variant="tonal"
                buttonStyle="square"
                size="default"
                onClick={decreaseOdds}
                disabled={disabled || targetOdds <= MIN_ODDS}
              />
              <Input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={commitInput}
                onKeyDown={handleInputKeyDown}
                disabled={disabled}
                fullWidth
                aria-label="Target odds"
              />
              <IconButton
                aria-label="Increase odds"
                icon={<IconChevronRight size="md" />}
                variant="tonal"
                buttonStyle="square"
                size="default"
                onClick={increaseOdds}
                disabled={disabled || targetOdds >= MAX_ODDS}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: "var(--spacing-xs, 0.5rem)",
              }}
            >
              <Input
                fullWidth
                type="text"
                inputMode="decimal"
                value={minDraft ?? formatOdds(rangeOdds[0])}
                onChange={(e) => setMinDraft(e.target.value)}
                onBlur={commitRangeMin}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                disabled={disabled}
                aria-label="Target odds minimum"
              />
              <Input
                fullWidth
                type="text"
                inputMode="decimal"
                value={maxDraft ?? formatOdds(rangeOdds[1])}
                onChange={(e) => setMaxDraft(e.target.value)}
                onBlur={commitRangeMax}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                disabled={disabled}
                aria-label="Target odds maximum"
              />
            </div>
          )}
        </div>

        {mode === "exact" ? (
          <input
            type="range"
            className="odds-range"
            min={MIN_ODDS}
            max={MAX_ODDS}
            step={0.01}
            value={targetOdds}
            onChange={handleSliderChange}
            disabled={disabled}
            aria-label="Target odds slider"
            style={{ background: sliderBackground }}
          />
        ) : (
          <DualSliderTrack
            min={MIN_ODDS}
            max={MAX_ODDS}
            step={0.01}
            value={rangeOdds}
            onChange={setRangeOdds}
            label="Target odds range"
          />
        )}
      </div>
    </Card>
  );
});

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--colors-background-secondary)",
        borderRadius: "1rem",
        border: "1px solid var(--colors-border-default)",
        overflow: "hidden",
      }}
    >
      {children}
    </section>
  );
}

export default OddsInput;
