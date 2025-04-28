import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import OddsInput from "@/components/OddsInput";
import LoadingState from "@/components/LoadingState";
import ProcessingState from "@/components/ProcessingState";
import ErrorState from "@/components/ErrorState";
import NoMatchState from "@/components/NoMatchState";
import BetslipResults from "@/components/BetslipResults";
import { fetchEvents, generateBetslip } from "@/lib/api";
import { BetSlipResult } from "@/types";

// Helper function to generate random odds between min and max values
function getRandomOdds(min: number, max: number): number {
  // Get a random decimal number between min and max, with 2 decimal places
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export default function Home() {
  // Initialize with random odds between 5 and 20
  const [targetOdds, setTargetOdds] = useState<number>(() => getRandomOdds(5, 20));
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [betslipResult, setBetslipResult] = useState<BetSlipResult | null>(null);
  const [noMatchFound, setNoMatchFound] = useState<boolean>(false);

  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['/api/events/popular'],
    queryFn: fetchEvents,
    // Enable the query to run automatically on component mount
    enabled: true
  });
  
  // We've removed the automatic betslip generation on load

  const handleGenerateBetslip = async () => {
    // Reset states
    setNoMatchFound(false);
    setBetslipResult(null);

    // Only proceed if we have the events data
    if (eventsData) {
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
        console.error("Error generating betslip:", error);
      }
    }
  };

  const handleRetry = () => {
    refetchEvents();
  };

  const handleSuggestedOdds = (suggestedOdds: number) => {
    setTargetOdds(suggestedOdds);
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
        disabled={isLoadingEvents || processing}
      />

      {isLoadingEvents && <LoadingState message="Fetching available events..." />}
      
      {processing && (
        <ProcessingState 
          progress={processingProgress} 
          message="Calculating optimal combinations" 
        />
      )}

      {eventsError && (
        <ErrorState 
          message="Unable to connect to the events API. Please try again later."
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
