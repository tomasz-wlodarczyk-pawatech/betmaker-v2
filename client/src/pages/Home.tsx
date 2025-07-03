import { useState, useEffect, lazy, Suspense, memo, useCallback, useMemo } from "react";
import OddsInput from "@/components/OddsInput";
import { generateBetslip } from "@/lib/api";
import { BetSlipResult } from "@/types";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";
import { useDebounce } from "@/lib/performance";

// Lazy loaded components
const BetslipResults = lazy(() => import("@/components/BetslipResults"));
const ErrorState = lazy(() => import("@/components/ErrorState"));
const NoMatchState = lazy(() => import("@/components/NoMatchState"));
const ProcessingState = lazy(() => import("@/components/ProcessingState"));

const getRandomOdds = (min: number, max: number) =>
  Math.round(Math.random() * (max - min) + min);

interface HomeProps {
  brandIdentifier: string;
}

const Home = memo(function Home({ brandIdentifier }: HomeProps) {
  const { data: countries } = useCountries();
  const supportedBrandIdentifiers =
    countries?.map((c) => c.brandIdentifier.toLowerCase()) ?? [];

  const countryData = getCountryByBrand(countries, brandIdentifier);
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

  // Memoize country data to avoid recalculation
  const countryData = useMemo(() => 
    getCountryByBrand(countries, brandIdentifier), 
    [countries, brandIdentifier]
  );

  // Debounce the generate function to prevent excessive API calls
  const debouncedGenerate = useDebounce(generateBetslip, 300);

  const handleGenerateBetslip = useCallback(async () => {
    if (invalidBrand) return;

    setNoMatchFound(false);
    setBetslipResult(null);
    setError(false);
    setProcessing(true);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => Math.min(prev + 5, 95));
    }, 100);

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
  };

  const handleRetry = () => handleGenerateBetslip();
  const handleSuggestedOdds = (suggestedOdds: number) => {
    setTargetOdds(Math.round(suggestedOdds));
    setTimeout(() => handleGenerateBetslip(), 100);
  };

  return (
    <Suspense>
      {invalidBrand ? (
        <ErrorState
          message={`Invalid brand identifier: ${brandIdentifier}. Supported brands: ${supportedBrandIdentifiers.join(", ")}`}
          onRetry={() => (window.location.href = "/betpawa-ghana")}
        />
      ) : (
        <>
          <OddsInput
            targetOdds={targetOdds}
            setTargetOdds={setTargetOdds}
            onGenerate={handleGenerateBetslip}
            disabled={processing}
          />

          {processing && (
            <ProcessingState
              progress={processingProgress}
              message="Generating betslip"
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
              onTryLower={() => handleSuggestedOdds(targetOdds * 0.65)}
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
        </>
      )}
    </Suspense>
  );
});

export default Home;
