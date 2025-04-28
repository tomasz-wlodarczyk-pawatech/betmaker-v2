import { useState } from "react";
import OddsInput from "@/components/OddsInput";
import ProcessingState from "@/components/ProcessingState";
import ErrorState from "@/components/ErrorState";
import NoMatchState from "@/components/NoMatchState";
import BetslipResults from "@/components/BetslipResults";
import { generateBetslip } from "@/lib/api";
import { BetSlipResult } from "@/types";

// Helper function to generate random odds between min and max values
function getRandomOdds(min: number, max: number): number {
  // Get a random whole number between min and max
  return Math.round(Math.random() * (max - min) + min);
}

export default function Home() {
  // Initialize with random odds between 5 and 20
  const [targetOdds, setTargetOdds] = useState<number>(() => getRandomOdds(5, 20));
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [betslipResult, setBetslipResult] = useState<BetSlipResult | null>(null);
  const [noMatchFound, setNoMatchFound] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  
  const handleGenerateBetslip = async () => {
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
      const result = await generateBetslip(targetOdds);
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
      <OddsInput 
        targetOdds={targetOdds} 
        setTargetOdds={setTargetOdds} 
        onGenerate={handleGenerateBetslip}
        disabled={processing}
      />
      
      {processing && (
        <ProcessingState 
          progress={processingProgress} 
          message="Calculating optimal combinations" 
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
        />
      )}
    </>
  );
}