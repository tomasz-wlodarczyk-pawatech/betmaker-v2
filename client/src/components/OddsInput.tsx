import { Volleyball } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OddsInputProps {
  targetOdds: number;
  setTargetOdds: (odds: number) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

export default function OddsInput({ 
  targetOdds, 
  setTargetOdds, 
  onGenerate,
  disabled = false 
}: OddsInputProps) {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) value = 10;
    if (value < 2) value = 2;
    if (value > 1000) value = 1000;
    setTargetOdds(value);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-5">
        <h2 className="text-lg font-medium mb-4">Set Your Target Odds</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <label htmlFor="totalOdds" className="block text-sm font-medium mb-1">
              Desired Total Odds
            </label>
            <div className="flex">
              <input 
                type="number" 
                id="totalOdds" 
                className="w-full rounded-l-md border border-neutral-medium p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={targetOdds} 
                onChange={handleInputChange}
                min="2" 
                max="1000"
                disabled={disabled}
              />
              <span className="bg-neutral-medium px-3 flex items-center rounded-r-md text-neutral-dark font-medium">x</span>
            </div>
            <div className="text-xs text-neutral-dark mt-1">Min: 2, Max: 1000</div>
          </div>
          <div className="sm:self-end">
            <button 
              onClick={onGenerate}
              disabled={disabled}
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-medium py-2 px-6 rounded-md transition-colors shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Volleyball className="h-4 w-4 mr-1" />
              Generate Betslip
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
