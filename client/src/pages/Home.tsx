import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "@aliengain/components";
import BetslipTypeCard from "@/components/BetslipTypeCard";
import OddsInput from "@/components/OddsInput";
import FiltersCard, {
  type ModeId,
  type TimeId,
} from "@/components/FiltersCard";
import ExcludeLeaguesPanel, {
  type ExcludeSelection,
} from "@/components/ExcludeLeaguesPanel";
import SavedBetslipsCard from "@/components/SavedBetslipsCard";
import SaveToast from "@/components/SaveToast";
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
  const [excluded, setExcluded] = useState<ExcludeSelection>({
    leagues: [],
    markets: [],
  });
  const [mode, setMode] = useState<ModeId>("all");
  const [time, setTime] = useState<TimeId>("any");
  const [savedToast, setSavedToast] = useState<string | null>(null);

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
      const result = await generateBetslip(countryCode, targetOdds, {
        excludedLeagues: excluded.leagues,
        excludedMarkets: excluded.markets,
      });

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
  }, [invalidBrand, targetOdds, countryCode, excluded.leagues, excluded.markets]);

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

        <FiltersCard
          mode={mode}
          onModeChange={setMode}
          time={time}
          onTimeChange={setTime}
        />

        <ExcludeLeaguesPanel
          countryCode={countryCode}
          brandIdentifier={brandIdentifier}
          value={excluded}
          onChange={setExcluded}
        />

        <SavedBetslipsCard />

        <Button
          title="GENERATE SELECTIONS"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleGenerateBetslip}
          disabled={processing}
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
            onClose={() => setBetslipResult(null)}
            brandIdentifier={brandIdentifier}
            mode={mode}
            time={time}
            onSaved={(code) => setSavedToast(code)}
          />
        )}
      </div>

      {savedToast && (
        <SaveToast
          bookingCode={savedToast}
          onClose={() => setSavedToast(null)}
        />
      )}
    </>
  );
});

export default Home;
