import { Search } from "lucide-react";
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
    // The slider step is already set to 1, but ensure it's rounded to whole number
    const roundedValue = Math.round(newValue);
    setSliderValue([roundedValue]);
    setTargetOdds(roundedValue);
  };
  
  // Handle manual input change as backup
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) value = 10;
    if (value < 2) value = 2;
    if (value > 1000) value = 1000;
    // Round to whole number
    value = Math.round(value);
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
    <div className="mb-6 bg-white">
      {/* Info banner */}
      <div className="bg-gray-100 p-3 mb-4 text-sm text-center border-y border-gray-200">
        Add 3 legs to your betslip to earn up to a 1000% Win Bonus.
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {/* Odds input field and value display */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="totalOdds" className="text-sm font-medium">
                Desired Odds
              </label>
              <div className="flex items-center rounded-md">
                <span className="font-bold text-lg">{Math.round(targetOdds)}</span>
                <span className="text-gray-500 ml-1">x</span>
              </div>
            </div>
            
            {/* Slider */}
            <Slider
              id="totalOdds-slider"
              defaultValue={[targetOdds]}
              value={sliderValue}
              min={2}
              max={1000}
              step={1}
              onValueChange={handleSliderChange}
              disabled={disabled}
              className="py-4"
            />
            
            {/* Min/Max markers */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: 2</span>
              <span>Max: 1000</span>
            </div>
          </div>
          
          {/* Generate button full width */}
          <div>
            <button 
              onClick={onGenerate}
              disabled={disabled}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4 mr-2" />
              Find Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
