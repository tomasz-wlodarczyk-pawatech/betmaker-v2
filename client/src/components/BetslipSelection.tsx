import { format, parseISO } from "date-fns";
import { BetSlipSelection } from "@/types";

interface BetslipSelectionProps {
  selection: BetSlipSelection;
}

export default function BetslipSelection({ selection }: BetslipSelectionProps) {
  // Format the date for display in the required format: "12:00pm Tue 15/12"
  const formatEventDate = (dateString: string) => {
    if (!dateString) return "Upcoming";
    
    const date = parseISO(dateString);
    const time = format(date, "h:mma");
    const day = format(date, "EEE");
    const dateNum = format(date, "dd/MM");
    
    return `${time} ${day} ${dateNum}`;
  };
  
  const formattedDate = selection.startTime ? formatEventDate(selection.startTime) : "Upcoming";

  return (
    <div className="border border-neutral-medium rounded-md p-3 hover:bg-neutral-light transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="w-full">
          <h4 className="font-medium text-secondary">{selection.eventName}</h4>
          <div className="text-xs text-neutral-dark mt-1">
            {formattedDate} Football - {selection.competition}
          </div>
          <div className="flex items-center mt-2">
            <div className="text-sm">
              {selection.marketName} - {selection.selectionName}
            </div>
          </div>
        </div>
        <div className="bg-[#9CE800] text-[#252a2d] text-sm font-bold px-2 py-1 rounded ml-4 whitespace-nowrap">
          <span>{parseFloat(selection.odds).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
