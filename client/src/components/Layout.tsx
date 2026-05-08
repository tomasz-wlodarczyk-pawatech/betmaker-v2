import { ReactNode, useCallback } from "react";
import { IconButton } from "@aliengain/components";
import { IconX } from "@aliengain/icons";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const handleClose = useCallback(() => {
    window.parent?.postMessage(
      { type: "CLOSE", payload: { redirectUrl: null } },
      "*",
    );
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--colors-background-default)",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--colors-background-inverse-default)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "32rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.625rem 0.75rem",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.5rem",
                background: "var(--colors-background-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
              aria-hidden
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2.5l2.6 5.27 5.81.85-4.21 4.1.99 5.78L12 15.77l-5.19 2.73.99-5.78L3.59 8.62l5.81-.85L12 2.5z"
                  fill="#9ce800"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              betMaker
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                background: "var(--colors-background-inverse-secondary)",
                color: "#ffffff",
                padding: "0.375rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              GH₵ 882.10
            </span>
            <IconButton
              aria-label="Close"
              icon={<IconX size="md" />}
              variant="inverse"
              buttonStyle="square"
              size="sm"
              onClick={handleClose}
            />
          </div>
        </div>
      </header>
      <main
        style={{
          flex: "1 1 auto",
          width: "100%",
          maxWidth: "32rem",
          margin: "0 auto",
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
    </div>
  );
}
