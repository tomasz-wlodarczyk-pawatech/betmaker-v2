import { memo, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { BetSlipResult } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateBookingCode } from "@/lib/api";
import { getCountryByBrand, useCountries } from "@/hooks/use-countries";

interface BetslipResultsProps {
  result: BetSlipResult;
  targetOdds: number;
  onRegenerate: () => void;
  brandIdentifier: string;
}

// Optimized Selection component to prevent re-renders
const OptimizedBetslipSelection = memo(function OptimizedBetslipSelection({ 
  selection 
}: { 
  selection: BetSlipResult['selections'][0] 
}) {
  const formattedDate = useMemo(() => {
    if (!selection.startTime) return "Upcoming";
    
    const date = new Date(selection.startTime);
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    return `${time} ${day} ${dateNum}`;
  }, [selection.startTime]);

  const formattedOdds = useMemo(() => 
    parseFloat(selection.odds).toFixed(2), 
    [selection.odds]
  );

  return (
    <div className="border border-neutral-medium hover:bg-neutral-light transition-colors">
      <div className="p-3">
        <div className="flex justify-between items-center w-full">
          <h4 className="text-[#252a2d] font-medium text-base">{selection.eventName}</h4>
          <div className="bg-[#9CE800] text-[#252a2d] text-base font-bold px-2 py-0.5 rounded">
            {formattedOdds}
          </div>
        </div>
        
        <div className="text-xs text-neutral-dark mt-1">
          {formattedDate} - Football - {selection.competition}
        </div>
        
        <div className="text-sm text-[#252a2d] font-medium mt-1">
          {selection.marketName} - {selection.selectionName}
        </div>
      </div>
    </div>
  );
});

export default memo(function OptimizedBetslipResults({
  result,
  targetOdds,
  onRegenerate,
  brandIdentifier,
}: BetslipResultsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { data: countries } = useCountries();
  
  // Pre-calculate and memoize all expensive operations
  const memoizedData = useMemo(() => {
    const countryData = getCountryByBrand(countries, brandIdentifier);
    const domain = countryData?.rootDomain || "betpawa.com.gh";
    const selectionIds = result.selections.map((selection) => selection.id);
    const totalOdds = result.totalOdds.toFixed(2);
    const selectionCount = result.selections.length;
    
    return { countryData, domain, selectionIds, totalOdds, selectionCount };
  }, [countries, brandIdentifier, result.selections, result.totalOdds]);

  const handleLoadBetslip = useCallback(async () => {
    try {
      setIsLoading(true);

      const bookingData = await generateBookingCode(
        memoizedData.countryData?.countryIso2Code ?? "gh",
        memoizedData.selectionIds,
      );

      if (bookingData?.code) {
        // Send message to parent window
        window.parent.postMessage({
          type: "generated_booking_code",
          bookingCode: bookingData.code,
          brandIdentifier: brandIdentifier,
          domain: memoizedData.domain
        }, "*");

        const betPawaUrl = `https://www.${memoizedData.domain}/?bookingCode=${bookingData.code}`;
        window.open(betPawaUrl, "_blank");

        toast({
          title: "Betslip loaded!",
          description: `Booking code: ${bookingData.code} for ${brandIdentifier.toUpperCase()}`,
        });
      }
    } catch (error) {
      console.error("Error loading betslip:", error);
      toast({
        title: "Error loading betslip",
        description: "There was a problem loading your betslip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [memoizedData, brandIdentifier, toast]);

  return (
    <div className="mb-6">
      <div className="p-2">
        <div className="mb-4">
          <h2 className="text-[#252a2d] font-roboto text-lg font-bold leading-6">
            Generated Betslip
          </h2>
        </div>

        <div className="mb-4">
          <div className="bg-neutral-light rounded-md p-1 mb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-dark">Actual Odds:</p>
              <p className="text-base font-bold text-secondary">
                {memoizedData.totalOdds}
              </p>
            </div>
          </div>
          <div className="bg-neutral-light rounded-md p-1 mb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-dark">Selections:</p>
              <p className="text-base font-bold">{memoizedData.selectionCount}</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex flex-col justify-start items-start self-stretch flex-grow-0 flex-shrink-0 gap-2">
            <button
              onClick={handleLoadBetslip}
              disabled={isLoading}
              className="flex justify-center items-center self-stretch flex-grow-0 flex-shrink-0 h-9 gap-2 px-3 bg-[#9ce800] w-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8BD700] transition-colors"
            >
              <div className="flex justify-start items-start flex-grow-0 flex-shrink-0 relative">
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <p className="flex-grow-0 flex-shrink-0 text-sm font-bold text-left uppercase text-[#252a2d]">
                      Loading...
                    </p>
                  </span>
                ) : (
                  <p className="flex-grow-0 flex-shrink-0 text-sm font-bold text-left uppercase text-[#252a2d]">
                    Load Betslip
                  </p>
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium mb-3">Betslip Selections</h3>
          <div className="space-y-3">
            {result.selections.map((selection) => (
              <OptimizedBetslipSelection key={selection.id} selection={selection} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});