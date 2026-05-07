import { format, parseISO } from "date-fns";
import { memo, useMemo } from "react";
import {
  Badge,
  MatchCard,
  MatchCardBetline,
  MatchCardCompetition,
  MatchCardHeader,
  MatchCardTeams,
} from "@aliengain/components";
import { IconFlameFilled } from "@aliengain/icons";
import { BetSlipSelection } from "@/types";

interface BetslipSelectionProps {
  selection: BetSlipSelection;
}

const SEPARATORS = [" vs ", " VS ", " v ", " - "];

function splitEventName(name: string): { home: string; away: string } {
  for (const sep of SEPARATORS) {
    const idx = name.indexOf(sep);
    if (idx > 0) {
      return {
        home: name.slice(0, idx).trim(),
        away: name.slice(idx + sep.length).trim(),
      };
    }
  }
  return { home: name, away: "" };
}

const BetslipSelection = memo(function BetslipSelection({
  selection,
}: BetslipSelectionProps) {
  const { time, date } = useMemo(() => {
    if (!selection.startTime) return { time: undefined, date: "Upcoming" };
    const parsed = parseISO(selection.startTime);
    return {
      time: format(parsed, "h:mm a"),
      date: `${format(parsed, "EEE")} ${format(parsed, "dd/MM")}`,
    };
  }, [selection.startTime]);

  const formattedOdds = useMemo(
    () => parseFloat(selection.odds).toFixed(2),
    [selection.odds],
  );

  const teams = useMemo(
    () => splitEventName(selection.eventName),
    [selection.eventName],
  );

  return (
    <MatchCard>
      <MatchCardHeader
        time={time}
        date={date}
        leftIcon={
          selection.isHot ? (
            <IconFlameFilled
              size="sm"
              color="var(--colors-background-secondary-brand-default)"
            />
          ) : undefined
        }
        badges={
          <Badge variant="inverse" size="sm">
            {formattedOdds}
          </Badge>
        }
      />
      <MatchCardCompetition>{selection.competition}</MatchCardCompetition>
      {teams.away ? (
        <MatchCardTeams homeTeam={teams.home} awayTeam={teams.away} />
      ) : (
        <div
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "1rem",
            lineHeight: "1.25rem",
            fontWeight: 700,
            color: "var(--colors-text-primary)",
          }}
        >
          {selection.eventName}
        </div>
      )}
      <MatchCardBetline>
        <span
          style={{
            fontSize: "0.8125rem",
            color: "var(--colors-text-secondary)",
          }}
        >
          {selection.marketName}
        </span>
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--colors-text-primary)",
          }}
        >
          {selection.selectionName}
        </span>
      </MatchCardBetline>
    </MatchCard>
  );
});

export default BetslipSelection;
