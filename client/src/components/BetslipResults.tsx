import { Loader2 } from "lucide-react";
import BetslipSelection from "@/components/BetslipSelection";
import { BetSlipResult } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateBookingCode } from "@/lib/api";

// Mapping of country codes to BetPawa domains
const COUNTRY_DOMAINS: Record<string, string> = {
  ao: 'betpawa.ao',
  bj: 'betpawa.bj',
  bw: 'betpawa.co.bw',
  cd: 'betpawa.cd',
  cf: 'betpawa.cf',
  cg: 'betpawa.cg',
  ci: 'betpawa.ci',
  cm: 'betpawa.cm',
  ga: 'betpawa.ga',
  gh: 'betpawa.com.gh',
  ke: 'betpawa.co.ke',
  lr: 'betpawa.com.lr',
  ls: 'betpawa.co.ls',
  mw: 'betpawa.mw',
  mz: 'betpawa.co.mz',
  ng: 'betpawa.ng',
  rw: 'betpawa.rw',
  sl: 'betpawa.sl',
  sn: 'betpawa.sn',
  tz: 'betpawa.co.tz',
  ug: 'betpawa.ug',
  zm: 'betpawa.co.zm',
  zw: 'betpawa.co.zw',
};

interface BetslipResultsProps {
  result: BetSlipResult;
  targetOdds: number;
  onRegenerate: () => void;
  country: string;
}

export default function BetslipResults({ 
  result, 
  targetOdds,
  onRegenerate,
  country
}: BetslipResultsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the correct domain for this country
  const domain = COUNTRY_DOMAINS[country] || 'betpawa.com.gh'; // Default to Ghana if not found
  
  const handleLoadBetslip = async () => {
    try {
      setIsLoading(true);
      
      // Extract selection IDs from the betslip result
      const selectionIds = result.selections.map(selection => selection.id);
      
      // Generate booking code from BetPawa API with country-specific URL
      const bookingData = await generateBookingCode(country, selectionIds);
      
      if (bookingData && bookingData.code) {
        // Construct the URL with booking code and correct country domain
        const betPawaUrl = `https://www.${domain}/?bookingCode=${bookingData.code}`;
        
        // Open in new window
        window.open(betPawaUrl, '_blank');
        
        toast({
          title: "Betslip loaded!",
          description: `Booking code: ${bookingData.code} for ${country.toUpperCase()}`,
        });
      }
    } catch (error) {
      console.error('Error loading betslip:', error);
      toast({
        title: "Error loading betslip",
        description: "There was a problem loading your betslip. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="p-2">
        <div className="mb-4">
          <h2 className="text-[#252a2d] font-roboto text-lg font-bold leading-6">Generated Betslip</h2>
        </div>
        
        <div className="mb-4">
          <div className="bg-neutral-light rounded-md p-1 mb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-dark">Actual Odds:</p>
              <p className="text-base font-bold text-secondary">{result.totalOdds.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-neutral-light rounded-md p-1 mb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-dark">Selections:</p>
              <p className="text-base font-bold">{result.selections.length}</p>
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
                    <p className="flex-grow-0 flex-shrink-0 text-sm font-bold text-left uppercase text-[#252a2d]">Loading...</p>
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
              <BetslipSelection 
                key={selection.id}
                selection={selection}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
