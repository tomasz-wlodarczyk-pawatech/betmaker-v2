import { memo } from "react";
import { Button, Modal } from "@aliengain/components";

export interface InfoSection {
  title: string;
  description: string;
}

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: InfoSection[];
  tip?: string;
  ctaLabel?: string;
}

const InfoModal = memo(function InfoModal({
  isOpen,
  onClose,
  title,
  sections,
  tip,
  ctaLabel = "GOT IT!",
}: InfoModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-md, 1rem)",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm, 0.75rem)",
            paddingTop: "var(--spacing-xxs, 0.25rem)",
            paddingBottom: "var(--spacing-xxs, 0.25rem)",
          }}
        >
          {sections.map((section) => (
            <div
              key={section.title}
              style={{
                background: "var(--colors-background-default)",
                borderRadius: "var(--radius-md, 0.5rem)",
                padding: "var(--spacing-sm, 0.75rem)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-xxxs, 0.125rem)",
              }}
            >
              <div
                style={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "1rem",
                  lineHeight: "1.5rem",
                  fontWeight: 700,
                  color: "var(--colors-text-primary)",
                }}
              >
                {section.title}
              </div>
              <div
                style={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "0.875rem",
                  lineHeight: "1.25rem",
                  fontWeight: 400,
                  color: "var(--colors-text-primary)",
                }}
              >
                {section.description}
              </div>
            </div>
          ))}

          {tip && (
            <div
              style={{
                background: "var(--colors-background-success)",
                border: "1px solid var(--colors-border-success)",
                borderRadius: "var(--radius-md, 0.5rem)",
                padding: "var(--spacing-sm, 0.75rem)",
                display: "flex",
                gap: "var(--spacing-xxs, 0.25rem)",
                alignItems: "flex-start",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: "1rem",
                  lineHeight: "1.5rem",
                }}
              >
                💡
              </span>
              <span
                style={{
                  flex: "1 1 0",
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "0.75rem",
                  lineHeight: "1rem",
                  fontWeight: 400,
                  color: "var(--colors-text-primary)",
                }}
              >
                {tip}
              </span>
            </div>
          )}
        </div>

        <Button
          title={ctaLabel}
          variant="outline"
          size="default"
          fullWidth
          onClick={onClose}
        />
      </div>
    </Modal>
  );
});

export default InfoModal;
