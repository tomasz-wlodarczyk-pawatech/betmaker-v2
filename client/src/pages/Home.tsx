import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useCallback,
  useMemo,
  memo,
} from "react";
import OddsInput from "@/components/OddsInput";
import { generateBetslip } from "@/lib/api";
import { BetSlipResult } from "@/types";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";

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

  // Memoize supported brand identifiers to avoid recalculation
  const supportedBrandIdentifiers = useMemo(
    () => countries?.map((c) => c.brandIdentifier.toLowerCase()) ?? [],
    [countries],
  );

  // Memoize country data to avoid recalculation
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

    // Simulate progress
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

  return (
    <Suspense>
      {invalidBrand ? (
        <ErrorState
          message={`Invalid brand identifier: ${brandIdentifier}. Supported brands: ${supportedBrandIdentifiers.join(", ")}`}
          onRetry={() => (window.location.href = "/betpawa-ghana")}
        />
      ) : (
        <div>
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
      )}
    </Suspense>
  );
});

export default Home;
