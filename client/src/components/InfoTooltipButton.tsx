import { memo, useState } from "react";
import { IconCirlceInfo } from "@aliengain/icons";
import InfoModal, { type InfoSection } from "./InfoModal";

interface InfoTooltipButtonProps {
  title: string;
  sections: InfoSection[];
  tip?: string;
  ariaLabel?: string;
  /**
   * When true, the trigger renders as a span with role="button" so it can be
   * nested inside another button without producing invalid HTML.
   */
  inline?: boolean;
}

const triggerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1rem",
  height: "1rem",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "var(--colors-icon-primary)",
};

const InfoTooltipButton = memo(function InfoTooltipButton({
  title,
  sections,
  tip,
  ariaLabel,
  inline = false,
}: InfoTooltipButtonProps) {
  const [open, setOpen] = useState(false);
  const label = ariaLabel ?? `${title} info`;

  const handleOpen = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      {inline ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={label}
          onClick={handleOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpen(event);
            }
          }}
          style={triggerStyle}
        >
          <IconCirlceInfo size="sm" color="var(--colors-icon-primary)" />
        </span>
      ) : (
        <button
          type="button"
          aria-label={label}
          onClick={handleOpen}
          style={triggerStyle}
        >
          <IconCirlceInfo size="sm" color="var(--colors-icon-primary)" />
        </button>
      )}
      <InfoModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={title}
        sections={sections}
        tip={tip}
      />
    </>
  );
});

export default InfoTooltipButton;
