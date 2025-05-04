import { ExternalLink, Loader2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="mb-6">
      <CardContent className="pt-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Generated Betslip</h2>
          <div className="flex items-center">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-xs text-white mr-1">
              ✓
            </div>
            <span className="text-sm font-medium">Matched your criteria</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="bg-neutral-light rounded-md p-3 flex-1">
            <p className="text-sm text-neutral-dark">Target Odds</p>
            <p className="text-xl font-bold">{Math.round(targetOdds)}</p>
          </div>
          <div className="bg-neutral-light rounded-md p-3 flex-1">
            <p className="text-sm text-neutral-dark">Actual Odds</p>
            <p className="text-xl font-bold text-secondary">{result.totalOdds.toFixed(2)}</p>
          </div>
          <div className="bg-neutral-light rounded-md p-3 flex-1">
            <p className="text-sm text-neutral-dark">Selections</p>
            <p className="text-xl font-bold">{result.selections.length}</p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button 
            onClick={handleLoadBetslip}
            disabled={isLoading}
            className="flex items-center justify-center bg-secondary text-white rounded-md px-4 py-2 hover:bg-secondary/90 transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-1" />
            )}
            Load Betslip
          </button>
        </div>

        <div className="border-t border-neutral-medium pt-4 mb-4">
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
      </CardContent>
    </Card>
  );
}
