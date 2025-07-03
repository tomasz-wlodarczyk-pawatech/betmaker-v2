import { format, parseISO } from "date-fns";
import { BetSlipSelection } from "@/types";
import { memo, useMemo } from "react";

interface BetslipSelectionProps {
  selection: BetSlipSelection;
}

const BetslipSelection = memo(function BetslipSelection({ selection }: BetslipSelectionProps) {
  // Memoize formatted date to avoid recalculation
  const formattedDate = useMemo(() => {
    if (!selection.startTime) return "Upcoming";
    
    const date = parseISO(selection.startTime);
    const time = format(date, "h:mm a");
    const day = format(date, "EEE");
    const dateNum = format(date, "dd/MM");
    
    return `${time} ${day} ${dateNum}`;
  }, [selection.startTime]);

  // Memoize formatted odds to avoid recalculation
  const formattedOdds = useMemo(() => 
    parseFloat(selection.odds).toFixed(2), 
    [selection.odds]
  );

  return (
    <div className="border border-neutral-medium hover:bg-neutral-light transition-colors">
      <div className="p-3">
        {/* Event name with odds */}
        <div className="flex justify-between items-center w-full">
          <h4 className="text-[#252a2d] font-medium text-base">{selection.eventName}</h4>
          <div className="bg-[#9CE800] text-[#252a2d] text-base font-bold px-2 py-0.5 rounded">
            {formattedOdds}
          </div>
        </div>
        
        {/* Event details */}
        <div className="text-xs text-neutral-dark mt-1">
          {formattedDate} - Football - {selection.competition}
        </div>
        
        {/* Selection details */}
        <div className="mt-2 text-sm text-[#252a2d]">
          {selection.marketName} - {selection.selectionName}
        </div>
      </div>
    </div>
  );
});

export default BetslipSelection;