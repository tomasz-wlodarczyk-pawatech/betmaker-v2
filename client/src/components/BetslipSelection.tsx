import { format, parseISO } from "date-fns";
import { BetSlipSelection } from "@/types";

interface BetslipSelectionProps {
  selection: BetSlipSelection;
}

export default function BetslipSelection({ selection }: BetslipSelectionProps) {
  // Format the date for display in the required format: "9:45 PM Sun 18/05"
  const formatEventDate = (dateString: string) => {
    if (!dateString) return "Upcoming";
    
    const date = parseISO(dateString);
    const time = format(date, "h:mm a");
    const day = format(date, "EEE");
    const dateNum = format(date, "dd/MM");
    
    return `${time} ${day} ${dateNum}`;
  };
  
  const formattedDate = selection.startTime ? formatEventDate(selection.startTime) : "Upcoming";

  return (
    <div className="border border-neutral-medium hover:bg-neutral-light transition-colors">
      <div className="p-3">
        {/* Event name with odds */}
        <div className="flex justify-between items-center w-full">
          <h4 className="text-[#252a2d] font-medium text-base">{selection.eventName}</h4>
          <div className="bg-[#9CE800] text-[#252a2d] text-base font-bold px-2 py-0.5 rounded">
            {parseFloat(selection.odds).toFixed(2)}
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
}
