import { memo, useState } from "react";
import { Accordion, Button, Chip, Input } from "@aliengain/components";
import {
  IconCirlceInfo,
  IconFilter,
  IconFlame,
  IconHash,
  IconLayoutGrid,
  IconStar,
  IconStopwatch,
  IconTrendingUp,
} from "@aliengain/icons";

const FiltersCard = memo(function FiltersCard() {
  const [open, setOpen] = useState(true);

  return (
    <Accordion
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--colors-text-primary)",
          }}
        >
          <IconFilter size="md" />
          <span>Filters</span>
        </div>
      }
      isOpen={open}
      onToggle={setOpen}
      chevronPosition="right"
    >
      <div
        style={{
          padding: "0.5rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <Button
          title="RANDOMISE FILTERS"
          variant="secondary"
          size="default"
          fullWidth
          disabled
        />

        <FilterRow
          icon={<IconTrendingUp size="md" />}
          label="Leg Odds"
          divider
        >
          <RangeWithSlider
            minPlaceholder="1.10"
            maxPlaceholder="100"
            sliderMin={1}
            sliderMax={100}
            sliderStart={1}
            sliderEnd={100}
          />
        </FilterRow>

        <FilterRow icon={<IconHash size="md" />} label="# Legs" divider>
          <RangeWithSlider
            minPlaceholder="1"
            maxPlaceholder="60"
            sliderMin={1}
            sliderMax={60}
            sliderStart={1}
            sliderEnd={60}
          />
        </FilterRow>

        <FilterRow icon={<IconFlame size="md" />} label="Mode" divider>
          <ChipGroup
            options={[
              { id: "all", label: "All", icon: <IconLayoutGrid size="sm" /> },
              {
                id: "hot",
                label: "Hot Picks",
                icon: <IconFlame size="sm" />,
              },
              { id: "fav", label: "Favorites", icon: <IconStar size="sm" /> },
            ]}
            activeId="all"
          />
        </FilterRow>

        <FilterRow icon={<IconStopwatch size="md" />} label="Time">
          <ChipGroup
            options={[
              { id: "any", label: "Any" },
              { id: "today", label: "Today" },
              { id: "3h", label: "3h" },
              { id: "48h", label: "48h" },
              { id: "72h", label: "72h" },
            ]}
            activeId="any"
          />
        </FilterRow>
      </div>
    </Accordion>
  );
});

interface FilterRowProps {
  icon: React.ReactNode;
  label: string;
  divider?: boolean;
  children: React.ReactNode;
}

function FilterRow({ icon, label, divider, children }: FilterRowProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        paddingBottom: divider ? "1rem" : 0,
        borderBottom: divider
          ? "1px solid var(--colors-border-default)"
          : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--colors-text-primary)",
            fontSize: "0.9375rem",
            fontWeight: 600,
          }}
        >
          {icon}
          <span>{label}</span>
        </div>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            color: "var(--colors-text-secondary)",
          }}
        >
          <IconCirlceInfo size="md" />
        </span>
      </div>
      {children}
    </div>
  );
}

interface RangeWithSliderProps {
  minPlaceholder: string;
  maxPlaceholder: string;
  sliderMin: number;
  sliderMax: number;
  sliderStart: number;
  sliderEnd: number;
}

function RangeWithSlider({
  minPlaceholder,
  maxPlaceholder,
  sliderMin,
  sliderMax,
  sliderStart,
  sliderEnd,
}: RangeWithSliderProps) {
  const startPercent =
    ((sliderStart - sliderMin) / (sliderMax - sliderMin)) * 100;
  const endPercent =
    ((sliderEnd - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Input
          fullWidth
          placeholder={minPlaceholder}
          disabled
          aria-label="Minimum"
        />
        <Input
          fullWidth
          placeholder={maxPlaceholder}
          disabled
          aria-label="Maximum"
        />
      </div>
      <div
        className="odds-range-track"
        style={
          {
            "--range-start": `${startPercent}%`,
            "--range-end": `${endPercent}%`,
          } as React.CSSProperties
        }
      >
        <span className="odds-range-thumb" style={{ left: `${startPercent}%` }} />
        <span className="odds-range-thumb" style={{ left: `${endPercent}%` }} />
      </div>
    </div>
  );
}

interface ChipOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

function ChipGroup({
  options,
  activeId,
}: {
  options: ChipOption[];
  activeId: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      {options.map((option) => (
        <Chip
          key={option.id}
          size="default"
          active={option.id === activeId}
          leftIcon={option.icon}
          disabled
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

export default FiltersCard;
