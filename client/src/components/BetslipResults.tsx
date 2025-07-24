import { Loader2 } from "lucide-react";
import BetslipSelection from "@/components/BetslipSelection";
import { BetSlipResult } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { generateBookingCode } from "@/lib/api";
import { getCountryByBrand, useCountries } from "@/hooks/use-countries.ts";

interface BetslipResultsProps {
  result: BetSlipResult;
  targetOdds: number;
  onRegenerate: () => void;
  brandIdentifier: string;
}

/**
 * Layout strategy:
 * ┌───────────── bg-white h-full flex-col ────────────┐
 * │  HEADER (odds / selections summary)               │  <- static height
 * │────────────────────────────────────────────────────│
 * │  SCROLLABLE LIST (overflow‑y‑auto)                 │  <- grows & scrolls
 * │────────────────────────────────────────────────────│
 * │  STICKY FOOTER (Load Betslip)                      │  <- always visible
 * └────────────────────────────────────────────────────┘
 */

const BetslipResults = memo(function BetslipResults({
  result,
  targetOdds,
  onRegenerate,
  brandIdentifier,
}: BetslipResultsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);
  const { data: countries } = useCountries();

  // Memoize country data to avoid recalculation on every render
  const countryData = useMemo(
    () => getCountryByBrand(countries, brandIdentifier),
    [countries, brandIdentifier],
  );

  const domain = countryData?.rootDomain || "betpawa.com.gh";

  // Memoize selection IDs to avoid recalculation
  const selectionIds = useMemo(
    () => result.selections.map((selection) => selection.id),
    [result.selections],
  );

  const handleLoadBetslip = useCallback(async () => {
    const betslipWindow = window.open("about:blank");

    try {
      setIsLoading(true);

      const bookingData = await generateBookingCode(
        countryData?.countryIso2Code ?? "gh",
        selectionIds,
      );

      if (bookingData && bookingData.code) {
        const betPawaUrl = `https://www.${domain}/?bookingCode=${bookingData.code}`;

        window.parent.postMessage(
          {
            type: "generated_booking_code",
            bookingCode: bookingData.code,
            brandIdentifier: brandIdentifier,
            domain: domain,
          },
          "*",
        );

        if (betslipWindow) {
          betslipWindow.location.href = betPawaUrl;
        }
      } else {
        if (betslipWindow) {
          betslipWindow.close();
        }
      }
    } catch (error) {
      console.error("Error loading betslip:", error);
      toast({
        title: "Error loading betslip",
        description:
          "There was a problem loading your betslip. Please try again.",
        variant: "destructive",
      });

      if (betslipWindow) {
        betslipWindow.close();
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectionIds, countryData, brandIdentifier, domain, toast]);

  useEffect(() => {
    setTimeout(() => {
      if (stickyRef.current) {
        stickyRef.current.style.transform = 'translateY(1px)';
        stickyRef.current.style.transform = 'translateY(0)';
      }
    }, 100);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white ">
      {/* HEADER */}
      <div className="mb-4 p-2 flex flex-row justify-center items-center gap-3 border-b border-[#E6E7E2]">
        <div className="bg-neutral-light rounded-md px-6 py-2">
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-neutral-dark">Odds:</p>
            <p className="text-base font-bold text-secondary">
              {result.totalOdds.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="h-[26px] w-[1px] bg-[#E6E7E2]"></div>
        <div className="bg-neutral-light rounded-md px-6 py-2">
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-neutral-dark">Selections:</p>
            <p className="text-base font-bold">{result.selections.length}</p>
          </div>
        </div>
      </div>

      {/* SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto  ">
        {result.selections.map((selection) => (
          <BetslipSelection key={selection.id} selection={selection} />
        ))}
        {/* phantom padding so last item isn’t hidden under footer */}
        <div className="h-10" />
      </div>

      {/* STICKY FOOTER */}
      <div className="sticky bottom-0 left-0 right-0 p-2 bg-white ">
        <button
          onClick={handleLoadBetslip}
          disabled={isLoading}
          className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-[#9ce800] text-[#252a2d] font-bold uppercase disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#8BD700] transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading…</span>
            </>
          ) : (
            <span>Add to Betslip</span>
          )}
        </button>
      </div>
    </div>
  );
});

export default BetslipResults;
