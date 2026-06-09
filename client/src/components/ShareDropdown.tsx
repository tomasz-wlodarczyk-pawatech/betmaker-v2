import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dropdown, IconButton, Toast } from "@aliengain/components";
import { IconCopy, IconShare, IconTelegram, IconWhatsapp, IconX } from "@aliengain/icons";

interface ShareDropdownProps {
  shareText: string;
  shareUrl?: string;
  ariaLabel?: string;
}

// Legacy synchronous clipboard write. Used as a fallback when the async
// Clipboard API is unavailable or blocked (e.g. Chrome enforces the
// `clipboard-write` Permissions Policy inside cross-origin iframes, where this
// app is embedded). Must be called within a user gesture. Returns whether the
// copy succeeded.
function copyViaExecCommand(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function IconXLogo({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

const ShareDropdown = memo(function ShareDropdown({
  shareText,
  shareUrl,
  ariaLabel = "Share",
}: ShareDropdownProps) {
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const composedText = useMemo(() => {
    if (shareUrl) return `${shareText} ${shareUrl}`;
    return shareText;
  }, [shareText, shareUrl]);

  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    [],
  );

  const showCopiedToast = useCallback(() => {
    setToastVisible(true);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const payload = shareUrl ?? shareText;

    // Try the async Clipboard API first (works in Safari and outside iframes).
    // In a cross-origin iframe without `allow="clipboard-write"` (our case when
    // embedded by the host), Chrome blocks it via the clipboard-write Permissions
    // Policy and the promise rejects — so we must fall back to execCommand, which
    // is not gated by that policy. The legacy path runs in the same task as the
    // click, so the user gesture is still active.
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(payload);
        showCopiedToast();
        return;
      } catch {
        // fall through to the execCommand fallback below
      }
    }

    if (copyViaExecCommand(payload)) {
      showCopiedToast();
    }
  }, [shareUrl, shareText, showCopiedToast]);

  const handleOpenSocial = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  const whatsappHref = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(composedText)}`,
    [composedText],
  );
  const telegramHref = useMemo(() => {
    const url = shareUrl ?? "";
    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
  }, [shareUrl, shareText]);
  const twitterHref = useMemo(
    () => `https://x.com/intent/tweet?text=${encodeURIComponent(composedText)}`,
    [composedText],
  );

  return (
    <>
      <Dropdown open={open} onOpenChange={setOpen}>
        <Dropdown.Anchor>
          <Dropdown.Trigger>
            <IconButton
              aria-label={ariaLabel}
              icon={<IconShare size="sm" />}
              variant="tertiary"
              size="sm"
              buttonStyle="square"
            />
          </Dropdown.Trigger>
          <Dropdown.Content
            align="end"
            minWidth={220}
            style={{ padding: "var(--spacing-xxs, 0.25rem)" }}
          >
          <Dropdown.Item
            leftIcon={<IconCopy size="sm" color="var(--colors-icon-primary)" />}
            onClick={handleCopyLink}
          >
            Copy Link
          </Dropdown.Item>
          <Dropdown.Item
            leftIcon={<IconWhatsapp size="sm" color="var(--colors-icon-primary)" />}
            onClick={() => handleOpenSocial(whatsappHref)}
          >
            WhatsApp
          </Dropdown.Item>
          <Dropdown.Item
            leftIcon={<IconTelegram size="sm" color="var(--colors-icon-primary)" />}
            onClick={() => handleOpenSocial(telegramHref)}
          >
            Telegram
          </Dropdown.Item>
          <Dropdown.Item
            leftIcon={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  color: "var(--colors-icon-primary)",
                }}
              >
                <IconXLogo size={16} />
              </span>
            }
            onClick={() => handleOpenSocial(twitterHref)}
          >
            Twitter / X
          </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Anchor>
      </Dropdown>

      {toastVisible &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
              transform: "translateX(-50%)",
              width: "calc(100vw - 1.5rem)",
              maxWidth: "20rem",
              zIndex: 1100,
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <Toast variant="success" description="Copied!" icon={false} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
});

export default ShareDropdown;
