import { memo, useState } from "react";
import { SegmentedControl } from "@aliengain/components";
import { IconBetslip, IconCirlceInfo } from "@aliengain/icons";

const BetslipTypeCard = memo(function BetslipTypeCard() {
  const [betslipType, setBetslipType] = useState<"target" | "random">("target");

  return (
    <section
      style={{
        background: "var(--colors-background-secondary)",
        borderRadius: "0 0 0.75rem 0.75rem",
        borderBottom: "1px solid var(--colors-border-default)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-xxs, 0.25rem)",
          padding: "var(--spacing-sm, 0.75rem)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 var(--spacing-xxs, 0.25rem)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xxs, 0.25rem)",
            }}
          >
            <IconBetslip size="sm" color="var(--colors-icon-primary)" />
            <span
              style={{
                fontFamily: "Roboto, sans-serif",
                fontSize: "1rem",
                lineHeight: "1.5rem",
                fontWeight: 400,
                color: "var(--colors-text-primary)",
              }}
            >
              Betslip Type
            </span>
          </div>
          <button
            type="button"
            aria-label="More info"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1rem",
              height: "1rem",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--colors-icon-secondary)",
            }}
          >
            <IconCirlceInfo size="sm" color="var(--colors-icon-secondary)" />
          </button>
        </div>
        <SegmentedControl
          fullWidth
          items={[
            { value: "target", label: "Target" },
            { value: "random", label: "Random", disabled: true },
          ]}
          value={betslipType}
          onChange={(value) => setBetslipType(value as "target" | "random")}
        />
      </div>
    </section>
  );
});

export default BetslipTypeCard;
