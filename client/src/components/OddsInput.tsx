import { useCallback, useMemo, useState, memo } from "react";
import { IconButton, Input, Tabs } from "@aliengain/components";
import { IconChevronLeft, IconChevronRight } from "@aliengain/icons";

interface OddsInputProps {
  targetOdds: number;
  setTargetOdds: (odds: number) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

const MIN_ODDS = 2;
const MAX_ODDS = 1000;
const TOLERANCE = 0.15;

const OddsInput = memo(function OddsInput({
  targetOdds,
  setTargetOdds,
  disabled = false,
}: OddsInputProps) {
  const formattedOdds = Math.round(targetOdds);
  const [inputDraft, setInputDraft] = useState<string | null>(null);

  const range = useMemo(() => {
    const tolerance = formattedOdds * TOLERANCE;
    return {
      min: Math.max(MIN_ODDS, Math.round(formattedOdds - tolerance)),
      max: Math.round(formattedOdds + tolerance),
    };
  }, [formattedOdds]);

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
    () => updateOdds(targetOdds - 1),
    [targetOdds, updateOdds],
  );

  const increaseOdds = useCallback(
    () => updateOdds(targetOdds + 1),
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
    const parsed = parseInt(inputDraft, 10);
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

  const inputValue = inputDraft ?? String(formattedOdds);

  return (
    <Card>
      <Tabs activeType="exact" onActiveTypeChange={() => undefined}>
          <Tabs.List>
            <Tabs.Tab value="exact">Exact Mode</Tabs.Tab>
            <Tabs.Tab value="range" disabled>
              Range Mode
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <div
          style={{
            padding: "0.75rem 1rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--colors-text-primary)",
              }}
            >
              Target Total Odds
            </span>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--colors-text-secondary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ±15% ({range.min} – {range.max})
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
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
              type="number"
              inputMode="numeric"
              min={MIN_ODDS}
              max={MAX_ODDS}
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

          <input
            type="range"
            className="odds-range"
            min={MIN_ODDS}
            max={MAX_ODDS}
            step={1}
            value={targetOdds}
            onChange={handleSliderChange}
            disabled={disabled}
            aria-label="Target odds slider"
          />
        </div>
      </Card>
  );
});

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--colors-background-secondary)",
        borderRadius: "0.75rem",
        border: "1px solid var(--colors-border-default)",
        overflow: "hidden",
      }}
    >
      {children}
    </section>
  );
}

export default OddsInput;
