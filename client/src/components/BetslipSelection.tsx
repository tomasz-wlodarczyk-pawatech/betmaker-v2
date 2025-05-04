import { format } from "date-fns";
import { BetSlipSelection } from "@/types";
import { FaFire } from "react-icons/fa";

interface BetslipSelectionProps {
  selection: BetSlipSelection;
}

export default function BetslipSelection({ selection }: BetslipSelectionProps) {
  // Format the date for display
  const formattedDate = selection.startTime ? 
    format(new Date(selection.startTime), "dd MMM HH:mm") : 
    "Upcoming";

  return (
    <div className="border border-neutral-medium rounded-md p-3 hover:bg-neutral-light transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="w-full">
          <h4 className="font-medium text-secondary">{selection.eventName}</h4>
          <div className="text-xs text-neutral-dark mt-1">
            {selection.competition} - {formattedDate}
          </div>
          <div className="flex items-center mt-2">
            <div className="text-sm">
              {selection.marketName} - {selection.selectionName}
              {selection.isHot && (
                <span className="ml-1 text-red-500 inline-flex items-center">
                  <FaFire className="h-3 w-3" />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="bg-secondary text-white text-sm font-bold px-2 py-1 rounded ml-4 whitespace-nowrap">
          <span>{parseFloat(selection.odds).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
