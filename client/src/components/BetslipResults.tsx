import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Backdrop,
  Badge,
  Button,
  IconButton,
} from "@aliengain/components";
import {
  IconBookmark,
  IconFlameFilled,
  IconRotateCw,
  IconX,
} from "@aliengain/icons";
import { generateBookingCode, switchSelection } from "@/lib/api";
import { getCountryByBrand, useCountries } from "@/hooks/use-countries";
import { useSavedBetslips } from "@/hooks/use-saved-betslips";
import { BetSlipResult, BetSlipSelection } from "@/types";
import { type ModeId, type TimeId } from "@/components/FiltersCard";
import { type ExcludeSelection } from "@/components/ExcludeLeaguesPanel";
import ShareDropdown from "@/components/ShareDropdown";

interface BetslipResultsProps {
  result: BetSlipResult;
  targetOdds: number;
  onRegenerate: () => void;
  onResultChange: (result: BetSlipResult) => void;
  onClose: () => void;
  brandIdentifier: string;
  mode: ModeId;
  time: TimeId;
  excluded: ExcludeSelection;
  legOdds: [number, number];
  onSaved: (bookingCode: string) => void;
}

const BetslipResults = memo(function BetslipResults({
  result,
  targetOdds,
  onRegenerate,
  onResultChange,
  onClose,
  brandIdentifier,
  mode,
  time,
  excluded,
  legOdds,
  onSaved,
}: BetslipResultsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const { data: countries } = useCountries();
  const { add: addSavedBetslip } = useSavedBetslips();

  const countryData = useMemo(
    () => getCountryByBrand(countries, brandIdentifier),
    [countries, brandIdentifier],
  );

  const selectionIds = useMemo(
    () => result.selections.map((s) => s.id),
    [result.selections],
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const shareText = useMemo(() => {
    const lines = result.selections
      .map(
        (s) =>
          `${s.eventName} — ${s.marketName}: ${s.selectionName} @ ${s.odds}`,
      )
      .join("\n");
    return `Check out my betslip on betPawa — total odds ${result.totalOdds.toFixed(2)}.\n${lines}`;
  }, [result]);

  useEffect(() => {
    let cancelled = false;
    setShareUrl(undefined);
    if (selectionIds.length === 0) return;
    void (async () => {
      try {
        const bookingData = await generateBookingCode(
          countryData?.countryIso2Code?.toLowerCase() ?? "gh",
          selectionIds,
          brandIdentifier,
        );
        if (cancelled) return;
        if (bookingData?.bookingCode && bookingData?.domain) {
          setShareUrl(
            `${bookingData.domain}/?bookingCode=${bookingData.bookingCode}`,
          );
        }
      } catch {
        // share will fall back to text-only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectionIds, countryData, brandIdentifier]);

  const handleSaveForLater = useCallback(async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      setError(null);
      const bookingData = await generateBookingCode(
        countryData?.countryIso2Code?.toLowerCase() ?? "gh",
        selectionIds,
        brandIdentifier,
      );
      if (!bookingData?.bookingCode) {
        throw new Error("Missing booking code");
      }
      addSavedBetslip({
        bookingCode: bookingData.bookingCode,
        totalOdds: result.totalOdds,
        selections: result.selections,
        mode,
        time,
        domain: bookingData.domain ?? "",
      });
      onSaved(bookingData.bookingCode);
      window.parent.postMessage(
        {
          type: "betslip_generator_save_for_later",
          selections: selectionIds,
          totalOdds: result.totalOdds,
          bookingCode: bookingData.bookingCode,
        },
        "*",
      );
    } catch (err) {
      console.error("Error saving betslip:", err);
      setError("There was a problem saving your betslip. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    selectionIds,
    result.totalOdds,
    result.selections,
    countryData,
    brandIdentifier,
    mode,
    time,
    addSavedBetslip,
    onSaved,
  ]);

  const handleAddToBetslip = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const bookingData = await generateBookingCode(
        countryData?.countryIso2Code?.toLowerCase() ?? "gh",
        selectionIds,
        brandIdentifier,
      );

      if (bookingData?.bookingCode && bookingData?.domain) {
        const betPawaUrl = `${bookingData.domain}/?bookingCode=${bookingData.bookingCode}`;

        window.parent.postMessage(
          {
            type: "generated_booking_code",
            bookingCode: bookingData.bookingCode,
            brandIdentifier,
            domain: bookingData.domain,
          },
          "*",
        );

        window.parent?.postMessage(
          { type: "CLOSE", payload: { redirectUrl: betPawaUrl } },
          "*",
        );
      }
    } catch (err) {
      console.error("Error loading betslip:", err);
      setError("There was a problem loading your betslip. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectionIds, countryData, brandIdentifier]);

  const handleSwap = useCallback(
    async (selection: BetSlipSelection) => {
      if (swappingId) return;
      try {
        setSwappingId(selection.id);
        setError(null);

        const newSelection = await switchSelection(
          countryData?.countryIso2Code?.toLowerCase() ?? "gh",
          {
            brandIdentifier,
            currentSelectionId: selection.id,
            excludeEventIds: result.selections.map((s) => s.eventId),
            timeRange: time === "any" ? "whenever" : time,
            selectionMode: mode,
            targetOdds,
            currentTotalOdds: result.totalOdds,
            replacedSelectionOdds: Number(selection.odds),
            excludedLeagues: excluded.leagues,
            excludedMarkets: excluded.markets,
            minLegOdds: legOdds[0],
            maxLegOdds: legOdds[1],
          },
        );

        if (!newSelection) {
          setError("No alternative selection is available right now.");
          return;
        }

        const selections = result.selections.map((s) =>
          s.id === selection.id ? newSelection : s,
        );
        const totalOdds = selections.reduce(
          (acc, s) => acc * Number(s.odds),
          1,
        );
        onResultChange({ totalOdds, selections });
      } catch (err) {
        console.error("Error switching selection:", err);
        setError(
          "There was a problem switching this selection. Please try again.",
        );
      } finally {
        setSwappingId(null);
      }
    },
    [
      swappingId,
      result.selections,
      result.totalOdds,
      countryData,
      brandIdentifier,
      time,
      mode,
      targetOdds,
      excluded.leagues,
      excluded.markets,
      legOdds,
      onResultChange,
    ],
  );

  return createPortal(
    <>
      <Backdrop visible onClose={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Generated betslip"
        className="bottom-sheet"
      >
        <ResultsHeader
          totalOdds={result.totalOdds}
          legs={result.selections.length}
          shareText={shareText}
          shareUrl={shareUrl}
          onClose={handleClose}
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
              flexShrink: 0,
              background: "var(--colors-background-secondary, #ffffff)",
              border: "1px solid var(--colors-border-default, #e4e6e7)",
              borderRadius: "var(--radius-lg, 0.75rem)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {result.selections.map((selection, idx) => (
              <SelectionRow
                key={selection.id}
                selection={selection}
                isLast={idx === result.selections.length - 1}
                onSwap={() => handleSwap(selection)}
                isSwapping={swappingId === selection.id}
              />
            ))}
          </div>

          {error && (
            <Alert
              variant="error"
              title="Error loading betslip"
              description={error}
              onClose={() => setError(null)}
            />
          )}
        </div>

        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xs, 0.5rem)",
            padding: "var(--spacing-sm, 0.75rem)",
            paddingTop: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-xs, 0.5rem)",
            }}
          >
            <Button
              title={isSaving ? "SAVING…" : "SAVE FOR LATER"}
              variant="tonal"
              size="lg"
              buttonStyle="square"
              fullWidth
              leftIcon={<IconBookmark size="sm" />}
              onClick={handleSaveForLater}
              isLoading={isSaving}
              disabled={isSaving}
              style={{ flex: "1 1 0" }}
            />
            <Button
              title="GENERATE NEW"
              variant="tonal"
              size="lg"
              buttonStyle="square"
              fullWidth
              leftIcon={<IconRotateCw size="sm" />}
              onClick={onRegenerate}
              style={{ flex: "1 1 0" }}
            />
          </div>
          <Button
            title={isLoading ? "LOADING…" : "ADD TO BETSLIP"}
            variant="primary"
            size="lg"
            buttonStyle="square"
            fullWidth
            isLoading={isLoading}
            onClick={handleAddToBetslip}
          />
        </div>
      </div>
    </>,
    document.body,
  );
});

function ResultsHeader({
  totalOdds,
  legs,
  shareText,
  shareUrl,
  onClose,
}: {
  totalOdds: number;
  legs: number;
  shareText: string;
  shareUrl?: string;
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
        <ShareDropdown shareText={shareText} shareUrl={shareUrl} />
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
  onSwap,
  isSwapping,
}: {
  selection: BetSlipSelection;
  isLast: boolean;
  onSwap: () => void;
  isSwapping: boolean;
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
        paddingRight: "var(--spacing-xs, 0.5rem)",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-xxxs, 0.125rem)",
          }}
        >
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
          <IconButton
            aria-label="Switch this selection"
            icon={<IconRotateCw size="sm" />}
            variant="tertiary"
            size="sm"
            buttonStyle="square"
            onClick={onSwap}
            isLoading={isSwapping}
            disabled={isSwapping}
          />
        </div>
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

export default BetslipResults;
