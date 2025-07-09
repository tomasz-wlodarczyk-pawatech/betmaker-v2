import { format, parseISO } from "date-fns";
import { BetSlipSelection } from "@/types";
import { memo, useMemo } from "react";

interface BetslipSelectionProps {
  selection: BetSlipSelection;
}

const BetslipSelection = memo(function BetslipSelection({
  selection,
}: BetslipSelectionProps) {
  // Memoize formatted date to avoid recalculation
  const formattedDate = useMemo(() => {
    if (!selection.startTime) return "Upcoming";

    const date = parseISO(selection.startTime);
    const time = format(date, "h:mm a");

    return `${time} `;
  }, [selection.startTime]);

  const formattedDay = useMemo(() => {
    if (!selection.startTime) return "Upcoming";

    const date = parseISO(selection.startTime);

    const day = format(date, "EEE");
    const dateNum = format(date, "dd/MM");

    return `${day} ${dateNum}`;
  }, [selection.startTime]);

  // Memoize formatted odds to avoid recalculation
  const formattedOdds = useMemo(
    () => parseFloat(selection.odds).toFixed(2),
    [selection.odds],
  );

  return (
    <div className="border-b border-neutral-medium hover:bg-neutral-light transition-colors">
      <div className="py-3 px-4 space-y-0.5">
        {/* Event name with odds */}
        <div className="flex justify-between items-center w-full">
          <div className="flex">
            <h4 className="text-[var(--Typography-Neutral,#252A2D)] text-right font-roboto text-[12px] not-italic font-normal leading-[18px] lowercase mr-1">
              {formattedDate}
            </h4>
            <h4 className="text-[var(--Typography-Neutral,#252A2D)] text-right font-roboto text-[12px] font-bold leading-[18px] not-italic">
              {formattedDay}
            </h4>
          </div>
          <div className="flex h-5 min-w-[20px] px-[6px] justify-center items-center rounded-[1200px] bg-[#353B40] text-[12px] font-normal leading-[18px] text-white font-roboto lowercase">
            {formattedOdds}
          </div>
        </div>

        {/* Event details */}
        <div className="text-[var(--text-neutral-dark,#252A2D)] font-roboto text-[12px] not-italic font-normal leading-[16px]">
          {selection.competition}
        </div>
        <div className="text-[#252A2D)] font-roboto text-[16px] font-bold leading-[22px] not-italic">
          {selection.eventName}
        </div>

        {/* Selection details */}
        <div className="flex flex-row items-center">
          <div className="text-[var(--text-neutral-dark,#252A2D)] font-roboto text-[13px] font-medium leading-[16px] not-italic">
            {selection.marketName} - {selection.selectionName}
          </div>
          {selection.isHot && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="17"
              viewBox="0 0 12 17"
              fill="none"
            >
              <path
                d="M3.47618 13.283L5.3245 14.3576L4.33587 11.5851L5.21697 9.42455L6.35393 8.87373L6.28668 10.0171L7.83358 12.4383L7.58117 14.3361L8.97816 12.9176L9.6874 10.3171L4.96415 3.35742L4.96415 5.47045L2.3125 9.77938L2.44456 11.5636L3.47618 13.283Z"
                fill="#FF7A00"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
});

export default BetslipSelection;
