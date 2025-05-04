import { useState, useEffect } from "react";
import OddsInput from "@/components/OddsInput";
import ProcessingState from "@/components/ProcessingState";
import ErrorState from "@/components/ErrorState";
import NoMatchState from "@/components/NoMatchState";
import BetslipResults from "@/components/BetslipResults";
import { generateBetslip } from "@/lib/api";
import { BetSlipResult } from "@/types";

// List of supported country codes (duplicated from App.tsx for type safety)
const SUPPORTED_COUNTRIES = [
  'ao', 'bj', 'bw', 'cd', 'cf', 'cg', 'ci', 'cm', 'ga', 'gh', 
  'ke', 'lr', 'ls', 'mw', 'mz', 'ng', 'rw', 'sl', 'sn', 'tz', 'ug', 'zm', 'zw'
] as const;

type CountryCode = typeof SUPPORTED_COUNTRIES[number];

// Helper function to generate random odds between min and max values
function getRandomOdds(min: number, max: number): number {
  // Get a random whole number between min and max
  return Math.round(Math.random() * (max - min) + min);
}

interface HomeProps {
  country: string;
}

export default function Home({ country }: HomeProps) {
  // Validate country code
  const countryCode = country.toLowerCase() as CountryCode;
  
  // Initialize with random odds between 5 and 20
  const [targetOdds, setTargetOdds] = useState<number>(() => getRandomOdds(5, 20));
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [betslipResult, setBetslipResult] = useState<BetSlipResult | null>(null);
  const [noMatchFound, setNoMatchFound] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [countryError, setCountryError] = useState<boolean>(false);
  
  // Validate country on mount
  useEffect(() => {
    if (!SUPPORTED_COUNTRIES.includes(countryCode as any)) {
      setCountryError(true);
    } else {
      setCountryError(false);
    }
  }, [countryCode]);
  
  const handleGenerateBetslip = async () => {
    // Don't proceed if country is invalid
    if (countryError) {
      return;
    }
    
    // Reset states
    setNoMatchFound(false);
    setBetslipResult(null);
    setError(false);
    
    // Start processing
    setProcessing(true);
    setProcessingProgress(0);
    
    // Simulate processing progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = Math.min(prev + 5, 95);
        return newProgress;
      });
    }, 100);

    try {
      const result = await generateBetslip(countryCode, targetOdds);
      clearInterval(progressInterval);
      
      if (result) {
        setProcessingProgress(100);
        setTimeout(() => {
          setProcessing(false);
          setBetslipResult(result);
        }, 300);
      } else {
        setProcessingProgress(100);
        setTimeout(() => {
          setProcessing(false);
          setNoMatchFound(true);
        }, 300);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProcessing(false);
      setError(true);
      console.error("Error generating betslip:", error);
    }
  };

  const handleRetry = () => {
    handleGenerateBetslip();
  };

  const handleSuggestedOdds = (suggestedOdds: number) => {
    // Round to whole number
    const roundedOdds = Math.round(suggestedOdds);
    setTargetOdds(roundedOdds);
    setTimeout(() => handleGenerateBetslip(), 100);
  };

  const handleRegenerateBetslip = () => {
    handleGenerateBetslip();
  };

  return (
    <>
      {countryError ? (
        <ErrorState 
          message={`Invalid country code: ${country}. Supported countries include: ${SUPPORTED_COUNTRIES.join(', ')}`}
          onRetry={() => window.location.href = '/gh'}
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
              message={`Calculating optimal combinations for ${countryCode.toUpperCase()}`} 
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
              onRegenerate={handleRegenerateBetslip}
              country={countryCode}
            />
          )}
        </>
      )}
    </>
  );
}