import { useCallback, memo } from "react";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OddsInputProps {
  targetOdds: number;
  setTargetOdds: (odds: number) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

const OddsInput = memo(function OddsInput({ 
  targetOdds, 
  setTargetOdds, 
  onGenerate,
  disabled = false 
}: OddsInputProps) {
  // Format the odds as a whole number
  const formattedOdds = Math.round(targetOdds);
  
  // Handle slider change - convert slider value (2-1000) for better user experience
  const handleSliderChange = useCallback((values: number[]) => {
    const value = values[0];
    setTargetOdds(value);
  }, [setTargetOdds]);

  // Decrease odds by 1 (minimum 2)
  const decreaseOdds = useCallback(() => {
    const newValue = Math.max(2, targetOdds - 1);
    setTargetOdds(newValue);
  }, [targetOdds, setTargetOdds]);

  // Increase odds by 1 (maximum 1000)
  const increaseOdds = useCallback(() => {
    const newValue = Math.min(1000, targetOdds + 1);
    setTargetOdds(newValue);
  }, [targetOdds, setTargetOdds]);
  
  return (
    <div className="mb-6">
      <div className="p-2">
        <div className="mb-4">
          <div className="text-[#252a2d] font-roboto text-lg font-bold leading-6">
            Select Odds for Betslip
          </div>
        </div>
        <div className="p-1 w-full">
          <div className="flex justify-center items-stretch mb-3 w-full h-12">
            {/* Left arrow */}
            <button 
              onClick={decreaseOdds}
              disabled={disabled || targetOdds <= 2}
              className="flex justify-center items-center bg-[#f4f5f0] border-0 px-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e6e7e2] transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-[#252a2d]" />
            </button>
            
            {/* Center display */}
            <div className="flex justify-center items-center bg-[#f4f5f0] border-l border-r border-[#e6e7e2] px-4 flex-grow text-center">
              <p className="text-[#252a2d] font-roboto text-xl font-bold">
                {formattedOdds}
              </p>
            </div>
            
            {/* Right arrow */}
            <button 
              onClick={increaseOdds}
              disabled={disabled || targetOdds >= 1000}
              className="flex justify-center items-center bg-[#f4f5f0] border-0 px-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e6e7e2] transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-[#252a2d]" />
            </button>
          </div>

          {/* Slider */}
          <div className="mb-6">
            <Slider 
              value={[targetOdds]} 
              onValueChange={handleSliderChange}
              min={2}
              max={1000}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* Generate Button */}
          <div className="flex flex-col justify-start items-start self-stretch flex-grow-0 flex-shrink-0 gap-2">
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
});

export default OddsInput;