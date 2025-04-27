import { RefreshCw, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BetslipSelection from "@/components/BetslipSelection";
import { BetSlipResult } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface BetslipResultsProps {
  result: BetSlipResult;
  targetOdds: number;
  onRegenerate: () => void;
}

export default function BetslipResults({ 
  result, 
  targetOdds, 
  onRegenerate 
}: BetslipResultsProps) {
  const { toast } = useToast();
  
  const handleSaveBetslip = () => {
    toast({
      title: "Betslip saved!",
      description: "Your betslip has been saved successfully.",
    });
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
            <p className="text-xl font-bold">{targetOdds.toFixed(2)}</p>
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

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-3 border-t border-neutral-medium">
          <button 
            onClick={onRegenerate}
            className="flex items-center justify-center text-primary border border-primary rounded-md px-4 py-2 hover:bg-primary/5 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Generate New Betslip
          </button>
          <button 
            onClick={handleSaveBetslip}
            className="flex items-center justify-center bg-secondary text-white rounded-md px-4 py-2 hover:bg-secondary/90 transition-colors"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Betslip
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
