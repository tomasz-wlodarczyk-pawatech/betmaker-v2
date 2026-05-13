import { memo, useCallback, useState } from "react";
import { Badge, IconButton } from "@aliengain/components";
import {
  IconBookmark,
  IconChevronDown,
  IconChevronUp,
  IconShare,
  IconX,
} from "@aliengain/icons";
import { SavedBetslip, useSavedBetslips } from "@/hooks/use-saved-betslips";

const MODE_LABEL: Record<SavedBetslip["mode"], string> = {
  all: "All",
  hot: "Hot Picks",
  fav: "Favorites",
};

const TIME_LABEL: Record<SavedBetslip["time"], string> = {
  any: "Anytime",
  today: "Today",
  "3h": "3h",
  "48h": "48h",
  "72h": "72h",
};

function formatOdds(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });
}

const SavedBetslipsCard = memo(function SavedBetslipsCard() {
  const { slips, remove } = useSavedBetslips();
  const [open, setOpen] = useState(true);

  const handleShare = useCallback((slip: SavedBetslip) => {
    const url = `${slip.domain}/?bookingCode=${slip.bookingCode}`;
    const text = `Betslip ${slip.bookingCode} — total odds ${formatOdds(
      slip.totalOdds,
    )}\n${url}`;
    const nav = typeof navigator === "undefined" ? null : navigator;
    if (nav && typeof (nav as any).share === "function") {
      void (nav as any)
        .share({ title: "Betslip", text, url })
        .catch(() => undefined);
    } else if (nav && (nav as any).clipboard?.writeText) {
      void (nav as any).clipboard.writeText(text);
    }
  }, []);

  if (slips.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xs, 0.5rem)",
      }}
    >
      <SavedBetslipsHeader open={open} onToggle={setOpen} />
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xs, 0.5rem)",
          }}
        >
          {slips.map((slip) => (
            <SavedBetslipRow
              key={slip.id}
              slip={slip}
              onShare={handleShare}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function SavedBetslipsHeader({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Collapse saved betslips" : "Expand saved betslips"}
      aria-expanded={open}
      onClick={() => onToggle(!open)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--spacing-xs, 0.5rem)",
          padding: "0 var(--spacing-xs, 0.5rem)",
        }}
      >
        <IconBookmark size="md" color="var(--colors-icon-primary)" />
        <span
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            fontWeight: 700,
            color: "var(--colors-text-primary)",
          }}
        >
          Saved Betslips
        </span>
      </span>
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2rem",
          height: "2rem",
          background: "var(--colors-background-secondary)",
          borderRadius: "var(--radius-round-button-radius, 9999px)",
          color: "var(--colors-icon-primary)",
          flexShrink: 0,
        }}
      >
        {open ? (
          <IconChevronUp size="md" color="var(--colors-icon-primary)" />
        ) : (
          <IconChevronDown size="md" color="var(--colors-icon-primary)" />
        )}
      </span>
    </button>
  );
}

function SavedBetslipRow({
  slip,
  onShare,
  onRemove,
}: {
  slip: SavedBetslip;
  onShare: (slip: SavedBetslip) => void;
  onRemove: (id: string) => void;
}) {
  const legs = slip.selections.length;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--spacing-xs, 0.5rem)",
        background: "var(--colors-background-secondary, #ffffff)",
        border: "1px solid var(--colors-border-default, #e4e6e7)",
        borderRadius: "var(--radius-lg, 0.75rem)",
        padding: "var(--spacing-xs, 0.5rem)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-xs, 0.5rem)",
          minWidth: 0,
        }}
      >
        <div
          style={{
            background: "var(--colors-background-default, #f2f2f3)",
            border: "1px solid var(--colors-border-default, #e4e6e7)",
            borderRadius: "var(--radius-md, 0.5rem)",
            padding:
              "var(--spacing-xxs, 0.25rem) var(--spacing-xs, 0.5rem)",
            width: "4rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Roboto, sans-serif",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              fontWeight: 400,
              color: "var(--colors-text-primary, #252a2d)",
            }}
          >
            Odds
          </span>
          <span
            style={{
              fontFamily: "Roboto, sans-serif",
              fontSize: "1rem",
              lineHeight: "1.5rem",
              fontWeight: 700,
              color: "var(--colors-text-primary, #252a2d)",
            }}
          >
            {formatOdds(slip.totalOdds)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xxs, 0.25rem)",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Roboto, sans-serif",
              fontSize: "1rem",
              lineHeight: "1.5rem",
              fontWeight: 700,
              color: "var(--colors-text-primary, #252a2d)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {slip.bookingCode}
          </span>
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              flexWrap: "wrap",
            }}
          >
            <SavedBadge>{legs} {legs === 1 ? "leg" : "legs"}</SavedBadge>
            <SavedBadge>{MODE_LABEL[slip.mode]}</SavedBadge>
            <SavedBadge>{TIME_LABEL[slip.time]}</SavedBadge>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-xs, 0.5rem)",
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label={`Share betslip ${slip.bookingCode}`}
          icon={<IconShare size="sm" />}
          variant="tertiary"
          size="sm"
          buttonStyle="circle"
          onClick={() => onShare(slip)}
        />
        <IconButton
          aria-label={`Remove betslip ${slip.bookingCode}`}
          icon={<IconX size="sm" />}
          variant="tertiary"
          size="sm"
          buttonStyle="circle"
          onClick={() => onRemove(slip.id)}
        />
      </div>
    </div>
  );
}

function SavedBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      size="default"
      style={{
        background: "var(--colors-badge-outline, #ffffff)",
        border:
          "1px solid var(--colors-badge-outline-border, #e4e6e7)",
        color: "var(--colors-text-primary, #252a2d)",
        fontFamily: "Roboto, sans-serif",
        fontWeight: 700,
        fontSize: "0.75rem",
        lineHeight: "1rem",
        padding: "0.125rem var(--spacing-2, 0.5rem)",
        borderRadius: "var(--radius-badge-radius, 0.75rem)",
        minWidth: "1.25rem",
      }}
    >
      {children}
    </Badge>
  );
}

export default SavedBetslipsCard;
