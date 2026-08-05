import { memo, useCallback, useState } from "react";
import { Button, Chip, Input } from "@aliengain/components";
import {
  IconChevronDown,
  IconChevronUp,
  IconFlame,
  IconHash,
  IconLayoutGrid,
  IconRotateCw,
  IconSettings,
  IconStar,
  IconStopwatch,
  IconTrendingUp,
} from "@aliengain/icons";
import InfoTooltipButton from "./InfoTooltipButton";
import type { InfoSection } from "./InfoModal";
import { DualSliderTrack } from "./DualSliderTrack";
import { randomiseFeasibleFilters } from "@/lib/feasibility";

export const LEG_ODDS_MIN = 1.01;
// Matches MAX_ODDS in lib/odds.ts: a one-leg slip is a legitimate betslip, so a
// single leg has to be able to reach the highest allowed total on its own.
export const LEG_ODDS_MAX = 1000;
const LEGS_MIN = 1;
const LEGS_MAX = 60;

export const DEFAULT_LEG_ODDS: [number, number] = [LEG_ODDS_MIN, LEG_ODDS_MAX];
const DEFAULT_LEGS: [number, number] = [LEGS_MIN, LEGS_MAX];

export type ModeId = "all" | "hot" | "fav";
export type TimeId = "any" | "today" | "3h" | "48h" | "72h";

interface FiltersCardProps {
  mode: ModeId;
  onModeChange: (next: ModeId) => void;
  time: TimeId;
  onTimeChange: (next: TimeId) => void;
  legs: [number, number];
  onLegsChange: (next: [number, number]) => void;
  legOdds: [number, number];
  onLegOddsChange: (next: [number, number]) => void;
  // Upper bound for leg odds, capped to the Target Total Odds: a single leg can
  // never exceed the slip total, so leg odds above the target are impossible.
  legOddsMax: number;
  // Target total odds the slip must reach — the randomiser needs it to roll a
  // leg-odds/leg-count combination that can actually produce a betslip.
  targetOdds: number;
}

const FiltersCard = memo(function FiltersCard({
  mode,
  onModeChange,
  time,
  onTimeChange,
  legs,
  onLegsChange,
  legOdds,
  onLegOddsChange,
  legOddsMax,
  targetOdds,
}: FiltersCardProps) {
  const [open, setOpen] = useState(true);

  const legOddsDefault: [number, number] = [LEG_ODDS_MIN, legOddsMax];

  const handleReset = useCallback(() => {
    onLegOddsChange([LEG_ODDS_MIN, legOddsMax]);
    onLegsChange(DEFAULT_LEGS);
    onModeChange("all");
    onTimeChange("any");
  }, [onModeChange, onTimeChange, onLegsChange, onLegOddsChange, legOddsMax]);

  const handleRandomise = useCallback(() => {
    // Roll a leg-odds/leg-count window that can actually reach the target — the
    // maths (total odds = product of legs) is baked into the helper, so this can
    // never produce a combination the feasibility gate would reject.
    const { legOdds: nextLegOdds, legs: nextLegs } = randomiseFeasibleFilters({
      targetOdds,
      legOddsMin: LEG_ODDS_MIN,
      legOddsMax,
      legsMin: LEGS_MIN,
      legsMax: LEGS_MAX,
    });
    onLegOddsChange(nextLegOdds);
    onLegsChange(nextLegs);

    // Mode and Time don't affect whether the target is reachable, so they stay
    // fully random for variety.
    const modes: ModeId[] = ["all", "hot", "fav"];
    onModeChange(modes[Math.floor(Math.random() * modes.length)]);

    const times: TimeId[] = ["any", "today", "3h", "48h", "72h"];
    onTimeChange(times[Math.floor(Math.random() * times.length)]);
  }, [
    targetOdds,
    onModeChange,
    onTimeChange,
    onLegsChange,
    onLegOddsChange,
    legOddsMax,
  ]);

  const dirty =
    legOdds[0] !== legOddsDefault[0] ||
    legOdds[1] !== legOddsDefault[1] ||
    legs[0] !== DEFAULT_LEGS[0] ||
    legs[1] !== DEFAULT_LEGS[1] ||
    mode !== "all" ||
    time !== "any";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xs, 0.5rem)",
      }}
    >
      <FiltersHeader open={open} onToggle={setOpen} />

      {open && (
        <div
          style={{
            background: "var(--colors-background-secondary)",
            border: "1px solid var(--colors-border-default)",
            borderRadius: "var(--radius-lg, 0.75rem)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              paddingTop: "var(--spacing-lg, 1.25rem)",
              paddingBottom: 0,
              paddingLeft: "var(--spacing-sm, 0.75rem)",
              paddingRight: "var(--spacing-sm, 0.75rem)",
              display: "flex",
              gap: "var(--spacing-xs, 0.5rem)",
            }}
          >
            <Button
              title="RANDOMISE FILTERS"
              variant="tonal"
              size="sm"
              fullWidth
              onClick={handleRandomise}
              style={{
                flex: "1 1 0",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            />
            {dirty && (
              <Button
                title="RESET FILTERS"
                variant="tertiary"
                size="sm"
                fullWidth
                leftIcon={<IconRotateCw size="sm" />}
                onClick={handleReset}
                style={{
                  flex: "1 1 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              />
            )}
          </div>

          <RangeFilter
            icon={<IconTrendingUp size="sm" />}
            label="Leg Odds"
            min={LEG_ODDS_MIN}
            max={legOddsMax}
            step={0.01}
            value={legOdds}
            defaultValue={legOddsDefault}
            onChange={onLegOddsChange}
            info={{
              title: "Leg Odds",
              sections: [
                {
                  title: "What this controls",
                  description:
                    "Sets the minimum and maximum odds for each individual selection in your betslip. Selections outside this range are excluded.",
                },
                {
                  title: "When to narrow it",
                  description:
                    "Use a tighter range to avoid heavy favourites or longshots. Widen it to give the generator more picks to combine.",
                },
              ],
              tip: "Lower odds picks land more often, higher odds picks pay more. Tune this range to match the risk you want.",
            }}
          />

          <RangeFilter
            icon={<IconHash size="sm" />}
            label="Legs"
            min={LEGS_MIN}
            max={LEGS_MAX}
            step={1}
            value={legs}
            defaultValue={DEFAULT_LEGS}
            onChange={onLegsChange}
            info={{
              title: "Legs",
              sections: [
                {
                  title: "What this controls",
                  description:
                    "Sets the minimum and maximum number of selections the generator can include in a single betslip.",
                },
                {
                  title: "How it affects results",
                  description:
                    "More legs multiply your odds faster but every leg has to win. Fewer legs are safer but pay less.",
                },
              ],
              tip: "Stick to a smaller range when chasing higher reliability, expand it when targeting big odds.",
            }}
          />

          <ChipFilter
            icon={<IconFlame size="sm" />}
            label="Mode"
            chips={[
              {
                id: "all",
                label: "All",
                icon: <IconLayoutGrid size="md" />,
                grow: true,
              },
              { id: "hot", label: "Hot Picks", icon: <IconFlame size="md" /> },
              { id: "fav", label: "Favorites", icon: <IconStar size="md" /> },
            ]}
            activeId={mode}
            onSelect={(id) => onModeChange(id as ModeId)}
            info={{
              title: "Mode",
              sections: [
                {
                  title: "All",
                  description:
                    "Considers every selection available from the upstream events feed.",
                },
                {
                  title: "Hot Picks",
                  description:
                    "Only uses selections currently marked as trending by the platform.",
                },
                {
                  title: "Favorites",
                  description:
                    "Limits the generator to selections you have starred as favourites.",
                },
              ],
              tip: "Hot Picks is a good shortcut when you want momentum, Favorites when you trust your own shortlist.",
            }}
          />

          <ChipFilter
            icon={<IconStopwatch size="sm" />}
            label="Time"
            allGrow
            chips={[
              { id: "any", label: "Any" },
              { id: "today", label: "Today" },
              { id: "3h", label: "3h" },
              { id: "48h", label: "48h" },
              { id: "72h", label: "72h" },
            ]}
            activeId={time}
            onSelect={(id) => onTimeChange(id as TimeId)}
            info={{
              title: "Time",
              sections: [
                {
                  title: "What this controls",
                  description:
                    "Limits selections to events kicking off within the chosen window from now.",
                },
                {
                  title: "Tighter windows",
                  description:
                    "Use shorter ranges like 3h or Today to focus on imminent action. Use 48h or 72h to plan ahead.",
                },
              ],
              tip: "Shorter windows usually give fresher odds; longer windows give more options to combine.",
            }}
          />
        </div>
      )}
    </div>
  );
});

function FiltersHeader({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Collapse filters" : "Expand filters"}
      aria-expanded={open}
      onClick={() => onToggle(!open)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--spacing-xs, 0.5rem)",
          padding: "0 var(--spacing-xs, 0.5rem)",
        }}
      >
        <IconSettings size="lg" color="var(--colors-icon-primary)" />
        <span
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "1.125rem",
            lineHeight: "1.75rem",
            fontWeight: 700,
            color: "var(--colors-text-primary)",
          }}
        >
          Filters
        </span>
      </span>
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2rem",
          height: "2rem",
          background: "var(--colors-background-secondary)",
          borderRadius: "var(--radius-round-button-radius, 9999px)",
          color: "var(--colors-icon-primary)",
          flexShrink: 0,
        }}
      >
        {open ? (
          <IconChevronUp size="md" color="var(--colors-icon-primary)" />
        ) : (
          <IconChevronDown size="md" color="var(--colors-icon-primary)" />
        )}
      </span>
    </button>
  );
}

interface InfoConfig {
  title: string;
  sections: InfoSection[];
  tip?: string;
}

interface RangeFilterProps {
  icon: React.ReactNode;
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  defaultValue: [number, number];
  onChange: (next: [number, number]) => void;
  info: InfoConfig;
}

function RangeFilter({
  icon,
  label,
  min,
  max,
  step,
  value,
  defaultValue,
  onChange,
  info,
}: RangeFilterProps) {
  const [minDraft, setMinDraft] = useState<string | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  const format = (n: number) => {
    const rounded = Math.round(n);
    return Math.abs(n - rounded) < 0.005 ? String(rounded) : n.toFixed(decimals);
  };
  const pristine =
    value[0] === defaultValue[0] && value[1] === defaultValue[1];

  const clamp = useCallback(
    (n: number) => Math.min(max, Math.max(min, n)),
    [min, max],
  );

  const commitMin = useCallback(() => {
    if (minDraft === null) return;
    const parsed = parseFloat(minDraft.replace(",", "."));
    if (Number.isFinite(parsed)) {
      const next = Math.min(clamp(parsed), value[1]);
      onChange([next, value[1]]);
    }
    setMinDraft(null);
  }, [minDraft, clamp, value, onChange]);

  const commitMax = useCallback(() => {
    if (maxDraft === null) return;
    const parsed = parseFloat(maxDraft.replace(",", "."));
    if (Number.isFinite(parsed)) {
      const next = Math.max(clamp(parsed), value[0]);
      onChange([value[0], next]);
    }
    setMaxDraft(null);
  }, [maxDraft, clamp, value, onChange]);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--colors-border-default)",
        paddingTop: "var(--spacing-sm, 0.75rem)",
        paddingBottom: "var(--spacing-lg, 1.25rem)",
        paddingLeft: "var(--spacing-sm, 0.75rem)",
        paddingRight: "var(--spacing-sm, 0.75rem)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-lg, 1.25rem)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-xxs, 0.25rem)",
        }}
      >
        <FilterHeaderRow icon={icon} label={label} info={info} />
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-xs, 0.5rem)",
            alignItems: "stretch",
          }}
        >
          <Input
            fullWidth
            type="text"
            inputMode="decimal"
            value={minDraft ?? (pristine ? "" : format(value[0]))}
            placeholder={format(defaultValue[0])}
            onChange={(e) => setMinDraft(e.target.value)}
            onBlur={commitMin}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label={`${label} minimum`}
          />
          <Input
            fullWidth
            type="text"
            inputMode="decimal"
            value={maxDraft ?? (pristine ? "" : format(value[1]))}
            placeholder={format(defaultValue[1])}
            onChange={(e) => setMaxDraft(e.target.value)}
            onBlur={commitMax}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label={`${label} maximum`}
          />
        </div>
      </div>
      <DualSliderTrack
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        label={label}
      />
    </div>
  );
}

interface ChipDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
  grow?: boolean;
}

interface ChipFilterProps {
  icon: React.ReactNode;
  label: string;
  chips: ChipDef[];
  activeId: string;
  onSelect: (id: string) => void;
  allGrow?: boolean;
  info: InfoConfig;
}

function ChipFilter({
  icon,
  label,
  chips,
  activeId,
  onSelect,
  allGrow,
  info,
}: ChipFilterProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--colors-border-default)",
        padding: "var(--spacing-sm, 0.75rem)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xxs, 0.25rem)",
      }}
    >
      <FilterHeaderRow icon={icon} label={label} info={info} />
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-xxs, 0.25rem)",
        }}
      >
        {chips.map((chip) => (
          <Chip
            key={chip.id}
            size="default"
            active={chip.id === activeId}
            leftIcon={chip.icon}
            onClick={() => onSelect(chip.id)}
            style={
              allGrow || chip.grow
                ? { flex: "1 0 0", minWidth: 0 }
                : { flex: "0 0 auto" }
            }
          >
            {chip.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function FilterHeaderRow({
  icon,
  label,
  info,
}: {
  icon: React.ReactNode;
  label: string;
  info: InfoConfig;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--spacing-xxs, 0.25rem)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-xxs, 0.25rem)",
          color: "var(--colors-icon-primary)",
        }}
      >
        {icon}
        <span
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            fontWeight: 400,
            color: "var(--colors-text-primary)",
          }}
        >
          {label}
        </span>
      </div>
      <InfoTooltipButton
        title={info.title}
        sections={info.sections}
        tip={info.tip}
        ariaLabel={`${label} info`}
      />
    </div>
  );
}

export default FiltersCard;
