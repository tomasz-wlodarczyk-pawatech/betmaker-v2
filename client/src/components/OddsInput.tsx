import { useCallback, memo } from "react";
import { Button, IconButton, SectionHeader } from "@aliengain/components";
import { IconChevronLeft, IconChevronRight } from "@aliengain/icons";

interface OddsInputProps {
  targetOdds: number;
  setTargetOdds: (odds: number) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

const OddsInput = memo(function OddsInput({
  targetOdds,
  setTargetOdds,
  onGenerate,
  disabled = false,
}: OddsInputProps) {
  const formattedOdds = Math.round(targetOdds);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTargetOdds(Number(e.target.value));
    },
    [setTargetOdds],
  );

  const decreaseOdds = useCallback(() => {
    const newValue = Math.max(2, targetOdds - 1);
    setTargetOdds(newValue);
    window.parent.postMessage(
      { type: "betslip_generator_odds_change", odds: newValue },
      "*",
    );
  }, [targetOdds, setTargetOdds]);

  const increaseOdds = useCallback(() => {
    const newValue = Math.min(1000, targetOdds + 1);
    setTargetOdds(newValue);
    window.parent.postMessage(
      { type: "betslip_generator_odds_change", odds: newValue },
      "*",
    );
  }, [targetOdds, setTargetOdds]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <SectionHeader>Select Odds for Betslip</SectionHeader>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--colors-background-secondary)",
          borderRadius: "0.75rem",
          border: "1px solid var(--colors-border-default)",
          padding: "0.5rem",
        }}
      >
        <IconButton
          aria-label="Decrease odds"
          icon={<IconChevronLeft size="md" />}
          variant="tonal"
          buttonStyle="circle"
          size="default"
          onClick={decreaseOdds}
          disabled={disabled || targetOdds <= 2}
        />

        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            lineHeight: "2rem",
            color: "var(--colors-text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formattedOdds}
        </div>

        <IconButton
          aria-label="Increase odds"
          icon={<IconChevronRight size="md" />}
          variant="tonal"
          buttonStyle="circle"
          size="default"
          onClick={increaseOdds}
          disabled={disabled || targetOdds >= 1000}
        />
      </div>

      <input
        type="range"
        className="odds-range"
        min={2}
        max={1000}
        step={1}
        value={targetOdds}
        onChange={handleSliderChange}
        disabled={disabled}
        aria-label="Target odds"
      />

      <Button
        title="Generate Selections"
        variant="primary"
        size="lg"
        fullWidth
        onClick={onGenerate}
        disabled={disabled}
      />
    </div>
  );
});

export default OddsInput;
