import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NoMatchStateProps {
  targetOdds: number;
  onTryLower: () => void;
  onTryHigher: () => void;
}

export default function NoMatchState({ 
  targetOdds, 
  onTryLower, 
  onTryHigher 
}: NoMatchStateProps) {
  
  const lowerOdds = Math.round(targetOdds * 0.65 * 100) / 100;
  const higherOdds = Math.round(targetOdds * 1.5 * 100) / 100;

  return (
    <Card className="mb-6 border-l-4 border-accent">
      <CardContent className="p-5">
        <div className="flex items-start">
          <Trophy className="text-accent mr-3 h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">No matching combinations found</h3>
            <p className="text-sm mt-1">
              We couldn't find a combination matching your target odds ({targetOdds.toFixed(2)} ±15%).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button 
                onClick={onTryLower}
                className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                Try lower odds ({lowerOdds.toFixed(2)})
              </button>
              <button 
                onClick={onTryHigher}
                className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                Try higher odds ({higherOdds.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
