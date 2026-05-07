import { memo } from "react";
import { IconSpinner } from "@aliengain/icons";

interface ProcessingStateProps {
  progress: number;
  message?: string;
  detail?: string;
}

export default memo(function ProcessingState({
  progress,
  message = "Generating Betslip",
  detail,
}: ProcessingStateProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      style={{
        marginTop: "1rem",
        background: "var(--colors-background-secondary)",
        border: "1px solid var(--colors-border-default)",
        borderRadius: "0.75rem",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="var(--colors-background-tertiary)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="var(--colors-background-brand-default)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 300ms ease-in-out" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--colors-text-primary)",
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--colors-text-primary)",
          fontSize: "1rem",
          fontWeight: 500,
        }}
      >
        <IconSpinner size="sm" spin />
        <span>{message}</span>
      </div>

      {detail && (
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "var(--colors-text-secondary)",
          }}
        >
          {detail}
        </p>
      )}
    </div>
  );
});
