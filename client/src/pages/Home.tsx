import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "@aliengain/components";
import { IconChevronDown, IconFilter } from "@aliengain/icons";
import BetslipTypeCard from "@/components/BetslipTypeCard";
import OddsInput from "@/components/OddsInput";
import FiltersCard from "@/components/FiltersCard";
import { generateBetslip } from "@/lib/api";
import { BetSlipResult } from "@/types";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";
import BetslipResults from "@/components/BetslipResults";
import ErrorState from "@/components/ErrorState";
import NoMatchState from "@/components/NoMatchState";
import ProcessingState from "@/components/ProcessingState";

const getRandomOdds = (min: number, max: number) =>
  Math.round(Math.random() * (max - min) + min);

interface HomeProps {
  brandIdentifier: string;
}

const Home = memo(function Home({ brandIdentifier }: HomeProps) {
  const { data: countries } = useCountries();

  const supportedBrandIdentifiers = useMemo(
    () => countries?.map((c) => c.brandIdentifier.toLowerCase()) ?? [],
    [countries],
  );

  const countryData = useMemo(
    () => getCountryByBrand(countries, brandIdentifier),
    [countries, brandIdentifier],
  );

  const countryCode = countryData?.countryIso2Code.toLowerCase() || "";

  const [targetOdds, setTargetOdds] = useState(() => getRandomOdds(5, 20));
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [betslipResult, setBetslipResult] = useState<BetSlipResult | null>(
    null,
  );
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [error, setError] = useState(false);
  const [invalidBrand, setInvalidBrand] = useState(false);

  useEffect(() => {
    const isValid = supportedBrandIdentifiers.includes(
      brandIdentifier.toLowerCase(),
    );
    setInvalidBrand(!isValid);
  }, [brandIdentifier, supportedBrandIdentifiers]);

  const handleGenerateBetslip = useCallback(async () => {
    if (invalidBrand) return;

    setNoMatchFound(false);
    setBetslipResult(null);
    setError(false);
    setProcessing(true);
    setProcessingProgress(0);
    window.parent.postMessage(
      {
        type: "betslip_generator_selections",
        targetOdds: targetOdds,
      },
      "*",
    );

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => Math.min(prev + Math.random() * 15, 85));
    }, 200);

    try {
      const result = await generateBetslip(countryCode, targetOdds);

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setTimeout(() => {
        setProcessing(false);
        result ? setBetslipResult(result) : setNoMatchFound(true);
      }, 300);
    } catch (error) {
      clearInterval(progressInterval);
      setProcessing(false);
      setError(true);
      console.error("Error generating betslip:", error);
    }
  }, [invalidBrand, targetOdds, countryCode]);

  const handleRetry = useCallback(
    () => handleGenerateBetslip(),
    [handleGenerateBetslip],
  );

  const handleSuggestedOdds = useCallback(
    (suggestedOdds: number) => {
      setTargetOdds(Math.round(suggestedOdds));
      setTimeout(() => handleGenerateBetslip(), 100);
    },
    [handleGenerateBetslip],
  );

  if (invalidBrand) {
    return (
      <ErrorState
        message={`Invalid brand identifier: ${brandIdentifier}. Supported brands: ${supportedBrandIdentifiers.join(", ")}`}
        onRetry={() => (window.location.href = "/betpawa-ghana")}
      />
    );
  }

  return (
    <>
      <BetslipTypeCard />

      <div
        style={{
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <OddsInput
          targetOdds={targetOdds}
          setTargetOdds={setTargetOdds}
          onGenerate={handleGenerateBetslip}
          disabled={processing}
        />

        <FiltersCard />

        <ExcludeLeaguesRow />

        <Button
          title="GENERATE SELECTIONS"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleGenerateBetslip}
          disabled={processing}
          style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
        />

        {processing && (
          <ProcessingState
            progress={processingProgress}
            message="Generating Selections"
          />
        )}

        {error && (
          <ErrorState
            message="Unable to generate betslip. Please try again later."
            onRetry={handleRetry}
          />
        )}

        {noMatchFound && (
          <NoMatchState
            targetOdds={targetOdds}
            onTryLower={() => handleSuggestedOdds(targetOdds * 0.7)}
            onTryHigher={() => handleSuggestedOdds(targetOdds * 1.5)}
          />
        )}

        {betslipResult && (
          <BetslipResults
            result={betslipResult}
            targetOdds={targetOdds}
            onRegenerate={handleGenerateBetslip}
            brandIdentifier={brandIdentifier}
          />
        )}
      </div>
    </>
  );
});

function ExcludeLeaguesRow() {
  return (
    <button
      type="button"
      disabled
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        padding: "0.875rem 1rem",
        background: "var(--colors-background-secondary)",
        border: "1px solid var(--colors-border-default)",
        borderRadius: "0.75rem",
        cursor: "not-allowed",
        opacity: 0.85,
        font: "inherit",
        color: "var(--colors-text-primary)",
        textAlign: "left",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9375rem",
          fontWeight: 600,
        }}
      >
        <IconFilter size="md" />
        Exclude Leagues & Markets
        <span style={{ color: "var(--colors-text-secondary)" }}>
          {" "}
        </span>
      </span>
      <IconChevronDown size="md" />
    </button>
  );
}

export default Home;
