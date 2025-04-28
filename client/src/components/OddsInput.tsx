import { Volleyball } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

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
  // Local state to track slider value for smoother UI
  const [sliderValue, setSliderValue] = useState<number[]>([targetOdds]);
  
  // Update local state when targetOdds changes externally
  useEffect(() => {
    setSliderValue([targetOdds]);
  }, [targetOdds]);
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setSliderValue(value);
    setTargetOdds(newValue);
  };
  
  // Handle manual input change as backup
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) value = 10;
    if (value < 2) value = 2;
    if (value > 1000) value = 1000;
    setTargetOdds(value);
  };

  // Display common odds markers
  const commonOddsMarkers = [
    { value: 2, label: "2x" },
    { value: 10, label: "10x" },
    { value: 100, label: "100x" },
    { value: 500, label: "500x" },
    { value: 1000, label: "1000x" }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="pt-5">
        <h2 className="text-lg font-medium mb-4">Set Your Target Odds</h2>
        
        <div className="space-y-6">
          {/* Odds input field and value display */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="totalOdds" className="text-sm font-medium">
                Desired Total Odds
              </label>
              <div className="flex items-center bg-neutral-light rounded-md px-3 py-1">
                <span className="font-medium text-lg">{targetOdds.toFixed(2)}</span>
                <span className="text-neutral-dark ml-1">x</span>
              </div>
            </div>
            
            {/* Slider */}
            <Slider
              id="totalOdds-slider"
              defaultValue={[targetOdds]}
              value={sliderValue}
              min={2}
              max={1000}
              step={0.01}
              onValueChange={handleSliderChange}
              disabled={disabled}
              className="py-4"
            />
            
            {/* Min/Max markers */}
            <div className="flex justify-between text-xs text-neutral-dark">
              <span>Min: 2</span>
              <span>Max: 1000</span>
            </div>
          </div>
          
          {/* Generate button aligned to the right */}
          <div className="flex justify-end">
            <button 
              onClick={onGenerate}
              disabled={disabled}
              className="bg-secondary hover:bg-secondary/90 text-white font-medium py-2.5 px-6 rounded-md transition-colors shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Volleyball className="h-4 w-4 mr-2" />
              Generate
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
