import { format } from "date-fns";
import { BetSlipSelection } from "@/types";
import { FaFire } from "react-icons/fa";

interface BetslipSelectionProps {
  selection: BetSlipSelection;
}

export default function BetslipSelection({ selection }: BetslipSelectionProps) {
  // Format the date for display
  const formattedDate = selection.startTime ? 
    format(new Date(selection.startTime), "h:mma EEE dd/MM") : 
    "12:00pm Tue 15/12";

  return (
    <div className="border-b border-gray-200 py-4">
      <div className="text-xs text-gray-500 mb-1">{formattedDate}</div>
      <div className="font-medium">{selection.eventName}</div>
      <div className="text-xs text-gray-500 mb-2">
        {selection.competition}
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex space-x-4">
          <button className="border border-gray-300 rounded py-1 px-3 text-primary font-bold">
            1
            <span className="block text-gray-800">{selection.selectionName === "1" ? parseFloat(selection.odds).toFixed(2) : "12.75"}</span>
          </button>
          
          <button className="border border-gray-300 rounded py-1 px-3 text-primary font-bold">
            X
            <span className="block text-gray-800">12.75</span>
          </button>
          
          <button className="border border-gray-300 rounded py-1 px-3 text-primary font-bold">
            2
            <span className="block text-gray-800">{selection.selectionName === "2" ? parseFloat(selection.odds).toFixed(2) : "12.75"}</span>
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          +34
        </div>
      </div>
    </div>
  );
}
