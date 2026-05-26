import { memo, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Backdrop, Badge, Button, IconButton } from "@aliengain/components";
import { IconFlameFilled, IconShare, IconX } from "@aliengain/icons";
import { SavedBetslip } from "@/hooks/use-saved-betslips";
import { BetSlipSelection } from "@/types";

interface SavedBetslipDetailsProps {
  slip: SavedBetslip;
  onClose: () => void;
  onUse: (slip: SavedBetslip) => void;
  onDelete: (slip: SavedBetslip) => void;
  onShare: (slip: SavedBetslip) => void;
}

const SavedBetslipDetails = memo(function SavedBetslipDetails({
  slip,
  onClose,
  onUse,
  onDelete,
  onShare,
}: SavedBetslipDetailsProps) {
  const handleShare = useCallback(() => onShare(slip), [slip, onShare]);
  const handleUse = useCallback(() => onUse(slip), [slip, onUse]);
  const handleDelete = useCallback(() => onDelete(slip), [slip, onDelete]);

  return createPortal(
    <>
      <Backdrop visible onClose={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Saved betslip ${slip.bookingCode}`}
        className="bottom-sheet"
      >
        <DetailsHeader
          totalOdds={slip.totalOdds}
          legs={slip.selections.length}
          onShare={handleShare}
          onClose={onClose}
        />

        <div
          className="bottom-sheet__body"
          style={{
            padding: "var(--spacing-sm, 0.75rem)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm, 0.75rem)",
          }}
        >
          <div
            style={{
              background: "var(--colors-background-secondary, #ffffff)",
              border: "1px solid var(--colors-border-default, #e4e6e7)",
              borderRadius: "var(--radius-lg, 0.75rem)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {slip.selections.map((selection, idx) => (
              <SelectionRow
                key={selection.id}
                selection={selection}
                isLast={idx === slip.selections.length - 1}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-xs, 0.5rem)",
            }}
          >
            <Button
              title="USE BETSLIP"
              variant="primary"
              size="lg"
              buttonStyle="square"
              fullWidth
              onClick={handleUse}
            />
            <Button
              title="DELETE"
              variant="tonal"
              size="lg"
              buttonStyle="square"
              fullWidth
              onClick={handleDelete}
            />
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
});

function DetailsHeader({
  totalOdds,
  legs,
  onShare,
  onClose,
}: {
  totalOdds: number;
  legs: number;
  onShare: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--colors-background-secondary, #ffffff)",
        borderBottom: "1px solid var(--colors-border-default, #e4e6e7)",
        paddingLeft: "var(--spacing-sm, 0.75rem)",
        paddingRight: "var(--spacing-xs, 0.5rem)",
        paddingTop: "var(--spacing-xs, 0.5rem)",
        paddingBottom: "var(--spacing-xs, 0.5rem)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-lg, 1.25rem)",
        }}
      >
        <Stat label="Total Odds" value={totalOdds.toFixed(2)} />
        <div
          aria-hidden
          style={{
            width: 1,
            alignSelf: "stretch",
            background: "var(--colors-border-default, #e4e6e7)",
          }}
        />
        <Stat label="Legs" value={String(legs)} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm, 0.75rem)",
        }}
      >
        <IconButton
          aria-label="Share"
          icon={<IconShare size="sm" />}
          variant="tertiary"
          size="sm"
          buttonStyle="square"
          onClick={onShare}
        />
        <IconButton
          aria-label="Close"
          icon={<IconX size="sm" />}
          variant="tonal"
          size="sm"
          buttonStyle="circle"
          onClick={onClose}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
    >
      <span
        style={{
          fontFamily: "Roboto, sans-serif",
          fontSize: "0.75rem",
          lineHeight: "1rem",
          fontWeight: 400,
          color: "var(--colors-text-secondary, #7a8185)",
        }}
      >
        {label}
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
        {value}
      </span>
    </div>
  );
}

function SelectionRow({
  selection,
  isLast,
}: {
  selection: BetSlipSelection;
  isLast: boolean;
}) {
  const { time, date } = useMemo(
    () => formatStartTime(selection.startTime),
    [selection.startTime],
  );

  const [home, away] = useMemo(
    () => splitTeams(selection.eventName),
    [selection.eventName],
  );

  const breadcrumb = useMemo(
    () => formatBreadcrumb(selection.competition),
    [selection.competition],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xxs, 0.25rem)",
        paddingTop: "var(--spacing-xs, 0.5rem)",
        paddingBottom: "var(--spacing-sm, 0.75rem)",
        paddingLeft: "var(--spacing-sm, 0.75rem)",
        paddingRight: "var(--spacing-sm, 0.75rem)",
        borderBottom: isLast
          ? "none"
          : "1px solid var(--colors-border-default, #e4e6e7)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-xxs, 0.25rem)",
            fontFamily: "Roboto, sans-serif",
            fontSize: "0.75rem",
            lineHeight: "1.125rem",
            color: "var(--colors-text-primary, #252a2d)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontWeight: 400 }}>{time}</span>
          <span style={{ fontWeight: 700 }}>{date}</span>
        </div>
        <Badge
          variant="default"
          size="default"
          style={{
            background: "var(--colors-badge-primary, #9ce800)",
            color: "var(--colors-text-on-brand, #252a2d)",
            fontFamily: "Roboto, sans-serif",
            fontWeight: 700,
            fontSize: "0.75rem",
            lineHeight: "1rem",
            padding: "0.125rem var(--spacing-2, 0.5rem)",
            borderRadius: "var(--radius-badge-radius, 0.75rem)",
            minWidth: "1.25rem",
          }}
        >
          {Number(selection.odds).toFixed(2)}
        </Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "0.75rem",
            lineHeight: "1rem",
            color: "var(--colors-text-secondary, #7a8185)",
          }}
        >
          {breadcrumb}
        </span>
        <span
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "1rem",
            lineHeight: "1.375rem",
            fontWeight: 500,
            color: "var(--colors-text-primary, #252a2d)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {home} - {away}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-xxxs, 0.125rem)",
        }}
      >
        <span
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "0.75rem",
            lineHeight: "1rem",
            fontWeight: 400,
            color: "var(--colors-text-primary, #252a2d)",
          }}
        >
          {selection.marketName} - {selection.selectionName}
        </span>
        {selection.isHot && (
          <IconFlameFilled size="sm" color="var(--colors-icon-primary)" />
        )}
      </div>
    </div>
  );
}

function formatStartTime(iso: string): { time: string; date: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { time: "", date: "" };

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minStr = minutes < 10 ? `0${minutes}` : String(minutes);
  const time = `${hours}:${minStr}${ampm}`;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[d.getDay()];
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  return { time, date: `${dayName} ${dd}/${mm}` };
}

function splitTeams(eventName: string): [string, string] {
  const parts = eventName.split(" - ");
  if (parts.length >= 2) {
    const home = parts[0];
    const away = parts.slice(1).join(" - ");
    return [home, away];
  }
  return [eventName, ""];
}

function formatBreadcrumb(competition: string): string {
  return competition.replace(/\s-\s/g, " / ");
}

export default SavedBetslipDetails;
