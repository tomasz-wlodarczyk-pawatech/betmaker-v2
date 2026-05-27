import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dropdown, IconButton, Toast } from "@aliengain/components";
import { IconCopy, IconShare, IconWhatsapp, IconX } from "@aliengain/icons";

interface ShareDropdownProps {
  shareText: string;
  shareUrl?: string;
  ariaLabel?: string;
}

function IconTelegram({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        d="M5.5 11.7l11.3-4.4c.5-.2 1 .1.8.7l-1.9 9c-.1.5-.5.6-.9.4l-2.8-2-1.3 1.3c-.2.2-.3.3-.6.3l.2-3 5.5-5c.2-.2 0-.3-.3-.1l-6.8 4.3-2.9-.9c-.6-.2-.7-.6 0-.9z"
        fill="#fff"
      />
    </svg>
  );
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
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.createElement("textarea");
        ta.value = payload;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showCopiedToast();
    } catch {
      // swallow
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
      <Dropdown open={open} onOpenChange={setOpen} sideOffset={6}>
        <Dropdown.Trigger>
          <IconButton
            aria-label={ariaLabel}
            icon={<IconShare size="sm" />}
            variant="tertiary"
            size="sm"
            buttonStyle="square"
          />
        </Dropdown.Trigger>
        <Dropdown.Content minWidth={220} style={{ padding: "var(--spacing-xxs, 0.25rem)" }}>
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
            leftIcon={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                }}
              >
                <IconTelegram size={20} />
              </span>
            }
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
