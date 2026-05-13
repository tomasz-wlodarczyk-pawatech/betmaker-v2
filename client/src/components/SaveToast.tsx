import { memo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Toast } from "@aliengain/components";

interface SaveToastProps {
  bookingCode: string;
  onClose: () => void;
  autoDismissMs?: number;
}

const SaveToast = memo(function SaveToast({
  bookingCode,
  onClose,
  autoDismissMs = 4000,
}: SaveToastProps) {
  useEffect(() => {
    if (!autoDismissMs) return;
    const t = window.setTimeout(onClose, autoDismissMs);
    return () => window.clearTimeout(t);
  }, [autoDismissMs, onClose, bookingCode]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        transform: "translateX(-50%)",
        width: "calc(100vw - 1.5rem)",
        maxWidth: "30.5rem",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <Toast variant="success" onClose={onClose}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-xxxs, 0.125rem)",
            }}
          >
            <span
              style={{
                fontFamily: "Roboto, sans-serif",
                fontSize: "1rem",
                lineHeight: "1.5rem",
                fontWeight: 700,
                color: "var(--colors-text-primary-inverse, #ffffff)",
              }}
            >
              Betslip Saved
            </span>
            <span
              style={{
                fontFamily: "Roboto, sans-serif",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
                fontWeight: 400,
                color: "var(--colors-text-primary-inverse, #ffffff)",
                letterSpacing: "0.02em",
              }}
            >
              BOOKING CODE:{" "}
              <span style={{ fontWeight: 700 }}>{bookingCode}</span>
            </span>
          </div>
        </Toast>
      </div>
    </div>,
    document.body,
  );
});

export default SaveToast;
