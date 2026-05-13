import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Button, Chip, Input } from "@aliengain/components";
import {
  IconChevronDown,
  IconChevronUp,
  IconCirlceInfo,
  IconFlame,
  IconHash,
  IconLayoutGrid,
  IconRotateCw,
  IconSettings,
  IconStar,
  IconStopwatch,
  IconTrendingUp,
} from "@aliengain/icons";

const LEG_ODDS_MIN = 1.1;
const LEG_ODDS_MAX = 100;
const LEGS_MIN = 1;
const LEGS_MAX = 60;

const DEFAULT_LEG_ODDS: [number, number] = [LEG_ODDS_MIN, LEG_ODDS_MAX];
const DEFAULT_LEGS: [number, number] = [LEGS_MIN, LEGS_MAX];

type ModeId = "all" | "hot" | "fav";
type TimeId = "any" | "today" | "3h" | "48h" | "72h";

const FiltersCard = memo(function FiltersCard() {
  const [open, setOpen] = useState(true);
  const [legOdds, setLegOdds] = useState<[number, number]>(DEFAULT_LEG_ODDS);
  const [legs, setLegs] = useState<[number, number]>(DEFAULT_LEGS);
  const [mode, setMode] = useState<ModeId>("all");
  const [time, setTime] = useState<TimeId>("any");

  const handleReset = useCallback(() => {
    setLegOdds(DEFAULT_LEG_ODDS);
    setLegs(DEFAULT_LEGS);
    setMode("all");
    setTime("any");
  }, []);

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
              style={{
                flex: "1 1 0",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            />
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
          </div>

          <RangeFilter
            icon={<IconTrendingUp size="sm" />}
            label="Leg Odds"
            min={LEG_ODDS_MIN}
            max={LEG_ODDS_MAX}
            step={0.1}
            value={legOdds}
            onChange={setLegOdds}
          />

          <RangeFilter
            icon={<IconHash size="sm" />}
            label="Legs"
            min={LEGS_MIN}
            max={LEGS_MAX}
            step={1}
            value={legs}
            onChange={setLegs}
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
            onSelect={(id) => setMode(id as ModeId)}
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
            onSelect={(id) => setTime(id as TimeId)}
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

interface RangeFilterProps {
  icon: React.ReactNode;
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
}

function RangeFilter({
  icon,
  label,
  min,
  max,
  step,
  value,
  onChange,
}: RangeFilterProps) {
  const [minDraft, setMinDraft] = useState<string | null>(null);
  const [maxDraft, setMaxDraft] = useState<string | null>(null);
  const decimals = step < 1 ? 1 : 0;
  const format = (n: number) =>
    decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));

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
        <FilterHeaderRow icon={icon} label={label} />
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
            value={minDraft ?? format(value[0])}
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
            value={maxDraft ?? format(value[1])}
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
}

function ChipFilter({
  icon,
  label,
  chips,
  activeId,
  onSelect,
  allGrow,
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
      <FilterHeaderRow icon={icon} label={label} />
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
}: {
  icon: React.ReactNode;
  label: string;
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
      <IconCirlceInfo size="sm" color="var(--colors-icon-secondary)" />
    </div>
  );
}

interface DualSliderTrackProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  label: string;
}

function DualSliderTrack({
  min,
  max,
  step,
  value,
  onChange,
  label,
}: DualSliderTrackProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;
  const range = max - min;
  const toPercent = (v: number) => ((v - min) / range) * 100;
  const startPercent = toPercent(value[0]);
  const endPercent = toPercent(value[1]);

  const snap = useCallback(
    (raw: number) => {
      const stepped = Math.round((raw - min) / step) * step + min;
      const decimals = step < 1 ? 1 : 0;
      const factor = Math.pow(10, decimals);
      return Math.round(stepped * factor) / factor;
    },
    [min, step],
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const node = trackRef.current;
      if (!node) return min;
      const rect = node.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const clamped = Math.min(1, Math.max(0, ratio));
      return snap(min + clamped * range);
    },
    [min, range, snap],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const thumb = draggingRef.current;
      if (!thumb) return;
      const next = valueFromClientX(e.clientX);
      const [v0, v1] = valueRef.current;
      if (thumb === "min") {
        if (next === v0) return;
        onChangeRef.current([Math.min(next, v1), v1]);
      } else {
        if (next === v1) return;
        onChangeRef.current([v0, Math.max(next, v0)]);
      }
    };
    const onUp = () => {
      draggingRef.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [valueFromClientX]);

  const startDrag = (thumb: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = thumb;
    document.body.style.userSelect = "none";
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleTrackPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).classList.contains("odds-range-thumb")) {
      return;
    }
    const next = valueFromClientX(e.clientX);
    const [v0, v1] = valueRef.current;
    const closerToMin = Math.abs(next - v0) <= Math.abs(next - v1);
    const thumb: "min" | "max" = closerToMin ? "min" : "max";
    if (thumb === "min") {
      onChangeRef.current([Math.min(next, v1), v1]);
    } else {
      onChangeRef.current([v0, Math.max(next, v0)]);
    }
    draggingRef.current = thumb;
    document.body.style.userSelect = "none";
  };

  return (
    <div
      ref={trackRef}
      className="odds-range-track"
      onPointerDown={handleTrackPointerDown}
      style={
        {
          "--range-start": `${startPercent}%`,
          "--range-end": `${endPercent}%`,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className="odds-range-thumb"
        aria-label={`${label} minimum`}
        aria-valuemin={min}
        aria-valuemax={value[1]}
        aria-valuenow={value[0]}
        onPointerDown={startDrag("min")}
        style={{ left: `${startPercent}%` }}
      />
      <button
        type="button"
        className="odds-range-thumb"
        aria-label={`${label} maximum`}
        aria-valuemin={value[0]}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        onPointerDown={startDrag("max")}
        style={{ left: `${endPercent}%` }}
      />
    </div>
  );
}

export default FiltersCard;
