import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Dropdown, IconButton, Toast } from "@aliengain/components";
import { IconCopy, IconShare, IconTelegram, IconWhatsapp, IconX } from "@aliengain/icons";

interface ShareDropdownProps {
  shareText: string;
  shareUrl?: string;
  ariaLabel?: string;
}

/**
 * Pawablox's `Dropdown.Content` is `position: absolute; top: 100%` inside the
 * anchor and does no collision handling, so the menu can only grow downward:
 * on a saved betslip row sitting near the bottom of the mini-app viewport it
 * ran off the bottom edge, and in the bottom sheet an `overflow: hidden`
 * ancestor would clip it. So we portal the content to <body> and place it with
 * fixed coordinates measured off the trigger, flipping above when there isn't
 * room below. Outside-click dismissal still works — pawablox's hook does DOM
 * `contains` checks and the portalled node is a real child of <body>.
 */
const MENU_MIN_WIDTH = 220;
const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;
const MENU_MIN_HEIGHT = 120;
// Four items plus the content padding. Only used for the very first measure of
// a freshly mounted menu, before its real height can be read off the DOM.
const MENU_ESTIMATED_HEIGHT = 208;

interface MenuPosition {
  top: number | "auto";
  bottom: number | "auto";
  right: number;
  maxHeight: number;
  maxWidth: number;
  dropUp: boolean;
}

function samePosition(a: MenuPosition | null, b: MenuPosition): boolean {
  return (
    a !== null &&
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.right === b.right &&
    a.maxHeight === b.maxHeight &&
    a.maxWidth === b.maxWidth &&
    a.dropUp === b.dropUp
  );
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
  const anchorRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const measure = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    // Layout viewport, not `window.inner*`: a fixed element's offsets and
    // `getBoundingClientRect` both resolve against the box inside the
    // scrollbars, so using innerWidth would shift the menu by the scrollbar
    // width wherever one is shown.
    const doc = document.documentElement;
    const vw = doc.clientWidth || window.innerWidth;
    const vh = doc.clientHeight || window.innerHeight;
    const height = contentRef.current?.offsetHeight || MENU_ESTIMATED_HEIGHT;

    const spaceBelow = vh - rect.bottom - MENU_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_MARGIN;
    // Flip only when below genuinely can't fit and above is the roomier side,
    // so the common case keeps the familiar downward menu.
    const dropUp = spaceBelow < height && spaceAbove > spaceBelow;

    const next: MenuPosition = {
      top: dropUp ? "auto" : rect.bottom + MENU_GAP,
      bottom: dropUp ? vh - rect.top + MENU_GAP : "auto",
      // Right-aligned to the trigger, clamped so a trigger near the left edge
      // can't push the menu off-screen on the other side.
      right: Math.min(
        Math.max(vw - rect.right, VIEWPORT_MARGIN),
        Math.max(vw - MENU_MIN_WIDTH - VIEWPORT_MARGIN, VIEWPORT_MARGIN),
      ),
      // Whatever room is left becomes the cap; the content already scrolls its
      // own overflow, so a cramped viewport shrinks the menu instead of
      // spilling it past the edge.
      maxHeight: Math.max(dropUp ? spaceAbove : spaceBelow, MENU_MIN_HEIGHT),
      maxWidth: Math.max(vw - VIEWPORT_MARGIN * 2, MENU_MIN_WIDTH),
      dropUp,
    };

    setPosition((prev) => (samePosition(prev, next) ? prev : next));
  }, []);

  // Runs in the commit phase, so the first measure of a newly mounted menu
  // lands before paint and the menu never flashes at the wrong spot.
  const setContentNode = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (node) measure();
    },
    [measure],
  );

  useLayoutEffect(() => {
    if (!open) return;
    // Covers the reopen-within-150ms case, where the exit transition has kept
    // the node mounted and the ref callback above doesn't fire again.
    measure();
    window.addEventListener("resize", measure);
    // Capture phase: the trigger may live inside a scrolling bottom sheet, not
    // just the document.
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

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
        <Dropdown.Anchor ref={anchorRef}>
          <Dropdown.Trigger>
            <IconButton
              aria-label={ariaLabel}
              icon={<IconShare size="sm" />}
              variant="tertiary"
              size="sm"
              buttonStyle="square"
            />
          </Dropdown.Trigger>
        </Dropdown.Anchor>
        {createPortal(
          <Dropdown.Content
            ref={setContentNode}
            align="end"
            minWidth={MENU_MIN_WIDTH}
            style={{
              position: "fixed",
              top: position?.top ?? 0,
              bottom: position?.bottom ?? "auto",
              left: "auto",
              right: position?.right ?? VIEWPORT_MARGIN,
              maxWidth: position?.maxWidth,
              maxHeight: position?.maxHeight,
              transformOrigin: position?.dropUp ? "bottom center" : "top center",
              // Nothing to show until the first measure lands.
              visibility: position ? "visible" : "hidden",
              padding: "var(--spacing-xxs, 0.25rem)",
            }}
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
          </Dropdown.Content>,
          document.body,
        )}
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
