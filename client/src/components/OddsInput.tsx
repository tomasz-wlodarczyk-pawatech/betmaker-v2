import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  // Format the odds as a whole number
  const formattedOdds = Math.round(targetOdds);
  
  // Handle slider change - convert slider value (2-1000) for better user experience
  const handleSliderChange = (values: number[]) => {
    const value = values[0];
    setTargetOdds(value);
  };

  // Decrease odds by 1 (minimum 2)
  const decreaseOdds = () => {
    const newValue = Math.max(2, targetOdds - 1);
    setTargetOdds(newValue);
  };

  // Increase odds by 1 (maximum 1000)
  const increaseOdds = () => {
    const newValue = Math.min(1000, targetOdds + 1);
    setTargetOdds(newValue);
  };
  
  return (
    <div className="mb-6">
      <div className="p-4">
        <div className="mb-4">
          <div className="text-[#252a2d] font-roboto text-lg font-bold leading-6">
            Target Odds for Your Bet Slip
          </div>
        </div>
        <div className="p-1 w-full">
          <div className="flex justify-center items-stretch mb-3 w-full h-12">
            {/* Left arrow */}
            <button 
              onClick={decreaseOdds}
              disabled={disabled}
              className="bg-[#f4f5f0] px-2 rounded-l cursor-pointer hover:bg-[#e6e7e2] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease odds by 1"
            >
              <ChevronLeft className="text-[#252a2d]" size={24} />
            </button>

            {/* Odds display */}
            <div className="text-[#252a2d] text-xl font-bold bg-[#f4f5f0] px-4 py-2 flex-grow text-center border-x border-[#e6e7e2] flex items-center justify-center">
              {formattedOdds}
            </div>

            {/* Right arrow */}
            <button 
              onClick={increaseOdds}
              disabled={disabled}
              className="bg-[#f4f5f0] px-2 rounded-r cursor-pointer hover:bg-[#e6e7e2] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase odds by 1"
            >
              <ChevronRight className="text-[#252a2d]" size={24} />
            </button>
          </div>
          
          {/* Slider with custom green styling */}
          <div className="green-slider my-6 w-full">
            <Slider
              defaultValue={[targetOdds]}
              min={2}
              max={1000}
              step={1}
              value={[targetOdds]}
              onValueChange={handleSliderChange}
              disabled={disabled}
              className="w-full"
            />
          </div>
          
          {/* Generate betslip button */}
          <div className="flex flex-col justify-start items-start self-stretch flex-grow-0 flex-shrink-0 gap-2 mt-6">
            <button
              onClick={onGenerate}
              disabled={disabled}
              className="flex justify-center items-center self-stretch flex-grow-0 flex-shrink-0 h-9 gap-2 px-3 bg-[#9ce800] w-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8BD700] transition-colors"
            >
              <div className="flex justify-start items-start flex-grow-0 flex-shrink-0 relative">
                <p className="flex-grow-0 flex-shrink-0 text-sm font-bold text-left uppercase text-[#252a2d]">
                  Generate Betslip
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
