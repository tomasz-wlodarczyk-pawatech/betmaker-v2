import { Alert, Badge, Button } from "@aliengain/components";
import BetslipSelection from "@/components/BetslipSelection";
import { BetSlipResult } from "@/types";
import { useState, useCallback, useMemo, memo } from "react";
import { generateBookingCode } from "@/lib/api";
import { getCountryByBrand, useCountries } from "@/hooks/use-countries.ts";

interface BetslipResultsProps {
  result: BetSlipResult;
  targetOdds: number;
  onRegenerate: () => void;
  brandIdentifier: string;
}

const BetslipResults = memo(function BetslipResults({
  result,
  brandIdentifier,
}: BetslipResultsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: countries } = useCountries();

  const countryData = useMemo(
    () => getCountryByBrand(countries, brandIdentifier),
    [countries, brandIdentifier],
  );

  const selectionIds = useMemo(
    () => result.selections.map((selection) => selection.id),
    [result.selections],
  );

  const handleLoadBetslip = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const bookingData = await generateBookingCode(
        countryData?.countryIso2Code ?? "gh",
        selectionIds,
        brandIdentifier,
      );

      if (bookingData && bookingData.bookingCode && bookingData.domain) {
        const betPawaUrl = `http://gh.staging.betpawa.local:3000/?bookingCode=${bookingData.bookingCode}`;

        window.parent.postMessage(
          {
            type: "generated_booking_code",
            bookingCode: bookingData.bookingCode,
            brandIdentifier: brandIdentifier,
            domain: "http://gh.staging.betpawa.local:3000",
          },
          "*",
        );

        window.parent?.postMessage(
          {
            type: "CLOSE",
            payload: { redirectUrl: betPawaUrl },
          },
          "*",
        );
      }
    } catch (err) {
      console.error("Error loading betslip:", err);
      setError(
        "There was a problem loading your betslip. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectionIds, countryData, brandIdentifier]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginTop: "1rem",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.75rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid var(--colors-border-default)",
        }}
      >
        <SummaryStat
          label="Odds"
          value={result.totalOdds.toFixed(2)}
          highlight
        />
        <div
          style={{
            width: 1,
            height: 26,
            background: "var(--colors-border-default)",
            alignSelf: "center",
          }}
        />
        <SummaryStat
          label="Selections"
          value={String(result.selections.length)}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          paddingBottom: "5rem",
        }}
      >
        {result.selections.map((selection) => (
          <BetslipSelection key={selection.id} selection={selection} />
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

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0.75rem",
          background: "var(--colors-background-secondary)",
          borderTop: "1px solid var(--colors-border-default)",
        }}
      >
        <div
          style={{
            maxWidth: "64rem",
            margin: "0 auto",
          }}
        >
          <Button
            title={isLoading ? "Loading…" : "Add to Betslip"}
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            onClick={handleLoadBetslip}
          />
        </div>
      </div>
    </div>
  );
});

interface SummaryStatProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function SummaryStat({ label, value, highlight }: SummaryStatProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.125rem",
        padding: "0.25rem 1.25rem",
        background: "var(--colors-background-secondary)",
        borderRadius: "0.5rem",
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--colors-text-secondary)",
        }}
      >
        {label}:
      </span>
      {highlight ? (
        <Badge variant="default" size="default">
          {value}
        </Badge>
      ) : (
        <span
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--colors-text-primary)",
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export default BetslipResults;
