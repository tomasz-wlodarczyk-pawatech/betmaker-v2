import { memo, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Checkbox, Chip } from "@aliengain/components";
import InfoTooltipButton from "./InfoTooltipButton";
import {
  IconChevronDown,
  IconChevronUp,
  IconFilter,
  IconGlobe,
  IconX,
  type FlagProps,
} from "@aliengain/icons";
import { fetchAvailableFilters, type AvailableFilters } from "@/lib/api";
import { PawabloxFlag } from "./PawabloxFlag";

// Fallback region slug when the catalogue didn't carry one: lower-case the
// display name and hyphenate, which matches the `CountryIsoMap` slug keys for
// the sportsbook's region names (e.g. "Republic of Korea" → "republic-of-korea").
function slugifyCountry(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

interface ParsedLeague {
  raw: string;
  sport: string;
  country: string;
  name: string;
}

interface CountryGroup {
  country: string;
  leagues: ParsedLeague[];
}

function parseLeague(raw: string): ParsedLeague {
  const [sport, country, ...rest] = raw.split(" - ");
  return {
    raw,
    sport: sport?.trim() ?? "",
    country: country?.trim() ?? "",
    name: rest.join(" - ").trim(),
  };
}

function groupByCountry(leagues: string[]): CountryGroup[] {
  const map = new Map<string, ParsedLeague[]>();
  for (const raw of leagues) {
    const parsed = parseLeague(raw);
    const list = map.get(parsed.country) ?? [];
    list.push(parsed);
    map.set(parsed.country, list);
  }
  return Array.from(map.entries())
    .map(([country, list]) => ({ country, leagues: list }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

export interface LeagueMarketSelection {
  leagues: string[];
  markets: string[];
}

interface LeaguesMarketsPanelProps {
  countryCode: string;
  brandIdentifier: string;
  timeRange?: string;
  value: LeagueMarketSelection;
  onChange: (next: LeagueMarketSelection) => void;
}

const LeaguesMarketsPanel = memo(function LeaguesMarketsPanel({
  countryCode,
  brandIdentifier,
  timeRange = "whenever",
  value,
  onChange,
}: LeaguesMarketsPanelProps) {
  const [open, setOpen] = useState(false);
  const [popularOpen, setPopularOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(false);
  const [marketsOpen, setMarketsOpen] = useState(false);
  const [openCountries, setOpenCountries] = useState<Record<string, boolean>>(
    {},
  );

  const enabled = open && Boolean(countryCode) && Boolean(brandIdentifier);

  const { data, isLoading, error } = useQuery<AvailableFilters>({
    queryKey: ["filters-available", countryCode, brandIdentifier, timeRange],
    queryFn: () =>
      fetchAvailableFilters(countryCode, brandIdentifier, timeRange),
    enabled,
    staleTime: 60_000,
  });

  // Split leagues into popular vs other by the upstream `preferred` flag
  // (carried in `popularLeagues`), then group each partition by country. A
  // country with both preferred and non-preferred competitions appears in both
  // sections, each showing only its relevant leagues.
  const { popularCountries, otherCountries } = useMemo(() => {
    const all = data?.leagues ?? [];
    const popularSet = new Set(data?.popularLeagues ?? []);
    const popularRaws = all.filter((raw) => popularSet.has(raw));
    const otherRaws = all.filter((raw) => !popularSet.has(raw));
    return {
      popularCountries: groupByCountry(popularRaws),
      otherCountries: groupByCountry(otherRaws),
    };
  }, [data?.leagues, data?.popularLeagues]);

  const allLeagues = useMemo(
    () => data?.leagues ?? [],
    [data?.leagues],
  );
  const leaguesByName = useMemo(() => {
    const m = new Map<string, ParsedLeague>();
    for (const raw of allLeagues) {
      const p = parseLeague(raw);
      m.set(raw, p);
    }
    return m;
  }, [allLeagues]);

  // Resolve a region's flag slug: prefer the upstream slug from the catalogue,
  // falling back to a slugified display name so flags still render if the map
  // is incomplete (e.g. the events-derived fallback path).
  const regionSlugs = data?.regionSlugs;
  const slugForCountry = useCallback(
    (country: string) => regionSlugs?.[country] ?? slugifyCountry(country),
    [regionSlugs],
  );

  const totalSelected = value.leagues.length + value.markets.length;

  const handleToggleLeague = useCallback(
    (raw: string) => {
      const set = new Set(value.leagues);
      if (set.has(raw)) {
        set.delete(raw);
      } else {
        set.add(raw);
      }
      onChange({ leagues: Array.from(set), markets: value.markets });
    },
    [value.leagues, value.markets, onChange],
  );

  const handleToggleMarket = useCallback(
    (market: string) => {
      const set = new Set(value.markets);
      if (set.has(market)) {
        set.delete(market);
      } else {
        set.add(market);
      }
      onChange({ leagues: value.leagues, markets: Array.from(set) });
    },
    [value.leagues, value.markets, onChange],
  );

  const handleToggleCountry = useCallback(
    (countryLeagueIds: string[]) => {
      const selectedSet = new Set(value.leagues);
      const allSelected = countryLeagueIds.every((id) => selectedSet.has(id));
      if (allSelected) {
        countryLeagueIds.forEach((id) => selectedSet.delete(id));
      } else {
        countryLeagueIds.forEach((id) => selectedSet.add(id));
      }
      onChange({ leagues: Array.from(selectedSet), markets: value.markets });
    },
    [value.leagues, value.markets, onChange],
  );

  const handleClearAll = useCallback(() => {
    onChange({ leagues: [], markets: [] });
  }, [onChange]);

  const handleRemoveChip = useCallback(
    (raw: string, kind: "league" | "market") => {
      if (kind === "league") {
        onChange({
          leagues: value.leagues.filter((l) => l !== raw),
          markets: value.markets,
        });
      } else {
        onChange({
          leagues: value.leagues,
          markets: value.markets.filter((m) => m !== raw),
        });
      }
    },
    [value, onChange],
  );

  const toggleCountryOpen = useCallback((country: string) => {
    setOpenCountries((prev) => ({ ...prev, [country]: !prev[country] }));
  }, []);

  const selectedChips = useMemo(() => {
    const leagues = value.leagues.map((raw) => {
      const country = leaguesByName.get(raw)?.country ?? "";
      return {
        raw,
        kind: "league" as const,
        label: leaguesByName.get(raw)?.name ?? raw,
        country,
        slug: country ? slugForCountry(country) : undefined,
      };
    });
    const markets = value.markets.map((raw) => ({
      raw,
      kind: "market" as const,
      label: raw,
      country: "",
      slug: undefined,
    }));
    return [...leagues, ...markets];
  }, [value, leaguesByName, slugForCountry]);

  return (
    <div
      style={{
        background: "var(--colors-background-secondary)",
        border: "1px solid var(--colors-border-default)",
        borderRadius: "var(--radius-lg, 0.75rem)",
        overflow: "hidden",
      }}
    >
      <PanelHeader
        open={open}
        count={totalSelected}
        onToggle={() => setOpen((v) => !v)}
      />

      {open && (
        <>
          <ChipsRow
            chips={selectedChips}
            onClear={handleClearAll}
            onRemove={handleRemoveChip}
          />

          <Divider />

          {isLoading && (
            <div
              style={{
                padding: "var(--spacing-sm, 0.75rem)",
                color: "var(--colors-text-secondary)",
                fontFamily: "Roboto, sans-serif",
                fontSize: "0.875rem",
              }}
            >
              Loading filters…
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "var(--spacing-sm, 0.75rem)",
                color: "var(--colors-text-error, #d33)",
                fontFamily: "Roboto, sans-serif",
                fontSize: "0.875rem",
              }}
            >
              Couldn't load filters.
            </div>
          )}

          {!isLoading && !error && (
            <>
              {popularCountries.length > 0 && (
                <SectionAccordion
                  title="Popular Leagues"
                  open={popularOpen}
                  onToggle={() => setPopularOpen((v) => !v)}
                >
                  {popularCountries.map((group) => (
                    <CountryRow
                      key={group.country}
                      group={group}
                      countrySlug={slugForCountry(group.country)}
                      open={openCountries[`popular:${group.country}`] ?? false}
                      selectedLeagues={value.leagues}
                      onToggleOpen={() =>
                        toggleCountryOpen(`popular:${group.country}`)
                      }
                      onToggleCountry={() =>
                        handleToggleCountry(group.leagues.map((l) => l.raw))
                      }
                      onToggleLeague={handleToggleLeague}
                    />
                  ))}
                </SectionAccordion>
              )}

              {otherCountries.length > 0 && (
                <>
                  {popularCountries.length > 0 && <Divider />}
                  <SectionAccordion
                    title="Other Leagues"
                    open={otherOpen}
                    onToggle={() => setOtherOpen((v) => !v)}
                  >
                    {otherCountries.map((group) => (
                      <CountryRow
                        key={group.country}
                        group={group}
                        countrySlug={slugForCountry(group.country)}
                        open={openCountries[`other:${group.country}`] ?? false}
                        selectedLeagues={value.leagues}
                        onToggleOpen={() =>
                          toggleCountryOpen(`other:${group.country}`)
                        }
                        onToggleCountry={() =>
                          handleToggleCountry(group.leagues.map((l) => l.raw))
                        }
                        onToggleLeague={handleToggleLeague}
                      />
                    ))}
                  </SectionAccordion>
                </>
              )}

              {data?.markets && data.markets.length > 0 && (
                <>
                  <Divider />
                  <SectionAccordion
                    title="Markets"
                    open={marketsOpen}
                    onToggle={() => setMarketsOpen((v) => !v)}
                  >
                    {data.markets.map((market) => (
                      <CheckboxRow
                        key={market}
                        label={market}
                        checked={value.markets.includes(market)}
                        onChange={() => handleToggleMarket(market)}
                        indent={0}
                      />
                    ))}
                  </SectionAccordion>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
});

function PanelHeader({
  open,
  count,
  onToggle,
}: {
  open: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label="Select leagues and markets"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--spacing-sm, 0.75rem)",
        background: "var(--colors-background-secondary)",
        border: "none",
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--spacing-xs, 0.5rem)",
          flex: "1 1 auto",
          minWidth: 0,
        }}
      >
        <IconFilter size="md" color="var(--colors-icon-primary)" />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--spacing-xxs, 0.25rem)",
          }}
        >
          <span
            style={{
              fontFamily: "Roboto, sans-serif",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              fontWeight: 700,
              color: "var(--colors-text-primary)",
            }}
          >
            Select Leagues &amp; Markets
          </span>
          {count > 0 && (
            <Badge
              variant="default"
              size="sm"
              style={{
                background: "var(--colors-badge-primary, #9ce800)",
                color: "var(--colors-text-on-brand, #252a2d)",
                fontFamily: "Roboto, sans-serif",
                fontWeight: 700,
              }}
            >
              {count}
            </Badge>
          )}
          <InfoTooltipButton
            inline
            title="Select Leagues & Markets"
            sections={[
              {
                title: "Leagues",
                description:
                  "Pick the competitions to build from. The generator only uses selected leagues. Leave empty to allow every league.",
              },
              {
                title: "Markets",
                description:
                  "Pick the bet types to build from (for example BTTS or Over/Under). Only selected markets are offered. Leave empty to allow every market.",
              },
            ]}
            tip="Your selection is sticky across regenerations until you change it or reset filters. With nothing selected, the generator uses everything."
          />
        </span>
      </span>
      {open ? (
        <IconChevronUp size="md" color="var(--colors-icon-primary)" />
      ) : (
        <IconChevronDown size="md" color="var(--colors-icon-primary)" />
      )}
    </button>
  );
}

function ChipsRow({
  chips,
  onClear,
  onRemove,
}: {
  chips: Array<{
    raw: string;
    kind: "league" | "market";
    label: string;
    country: string;
    slug?: string;
  }>;
  onClear: () => void;
  onRemove: (raw: string, kind: "league" | "market") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--spacing-xs, 0.5rem)",
        alignItems: "center",
        padding:
          "var(--spacing-none, 0) var(--padding-screen-default, 0.75rem) var(--spacing-xs, 0.5rem)",
        overflowX: "auto",
      }}
    >
      <Button
        title="Clear All"
        variant="tertiary"
        size="sm"
        buttonStyle="square"
        onClick={onClear}
        disabled={chips.length === 0}
        style={{ flex: "0 0 auto" }}
      />
      {chips.map((chip) => (
        <Chip
          key={`${chip.kind}:${chip.raw}`}
          size="sm"
          active
          rightIcon={<IconX size="sm" />}
          leftIcon={chip.kind === "league" ? <FlagFor slug={chip.slug} size="sm" /> : undefined}
          onClick={() => onRemove(chip.raw, chip.kind)}
          style={{ flex: "0 0 auto" }}
        >
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        width: "100%",
        background: "var(--colors-background-tertiary, #e4e6e7)",
      }}
    />
  );
}

function SectionAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--spacing-sm, 0.75rem)",
          background: "transparent",
          border: "none",
          font: "inherit",
          color: "inherit",
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
        }}
      >
        <span
          style={{
            fontFamily: "Roboto, sans-serif",
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
            fontWeight: 700,
            color: "var(--colors-text-primary)",
          }}
        >
          {title}
        </span>
        {open ? (
          <IconChevronUp size="md" color="var(--colors-icon-primary)" />
        ) : (
          <IconChevronDown size="md" color="var(--colors-icon-primary)" />
        )}
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
      )}
    </div>
  );
}

function CountryRow({
  group,
  countrySlug,
  open,
  selectedLeagues,
  onToggleOpen,
  onToggleCountry,
  onToggleLeague,
}: {
  group: CountryGroup;
  countrySlug: string;
  open: boolean;
  selectedLeagues: string[];
  onToggleOpen: () => void;
  onToggleCountry: () => void;
  onToggleLeague: (raw: string) => void;
}) {
  const selectedSet = useMemo(() => new Set(selectedLeagues), [selectedLeagues]);
  const allChecked = group.leagues.every((l) => selectedSet.has(l.raw));
  const someChecked =
    !allChecked && group.leagues.some((l) => selectedSet.has(l.raw));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding:
            "var(--spacing-xs, 0.5rem) var(--spacing-sm, 0.75rem)",
          gap: "var(--spacing-xs, 0.5rem)",
        }}
      >
        <Checkbox
          checked={allChecked}
          ref={(el) => {
            if (el) (el as HTMLInputElement).indeterminate = someChecked;
          }}
          onChange={onToggleCountry}
          aria-label={`Toggle all leagues in ${group.country}`}
        />
        <FlagFor slug={countrySlug} size="md" />
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: "1 1 auto",
            minWidth: 0,
            background: "transparent",
            border: "none",
            padding: 0,
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontFamily: "Roboto, sans-serif",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              fontWeight: 400,
              color: "var(--colors-text-primary)",
            }}
          >
            {group.country}
          </span>
          {open ? (
            <IconChevronUp size="md" color="var(--colors-icon-primary)" />
          ) : (
            <IconChevronDown size="md" color="var(--colors-icon-primary)" />
          )}
        </button>
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {group.leagues.map((league) => (
            <CheckboxRow
              key={league.raw}
              label={league.name}
              checked={selectedSet.has(league.raw)}
              onChange={() => onToggleLeague(league.raw)}
              indent={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  indent,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  indent: 0 | 1;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-xs, 0.5rem)",
        padding: `var(--spacing-xs, 0.5rem) var(--spacing-sm, 0.75rem) var(--spacing-xs, 0.5rem) calc(var(--spacing-sm, 0.75rem) + ${
          indent === 1 ? "2rem" : "0px"
        })`,
        cursor: "pointer",
      }}
    >
      <Checkbox
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
      <span
        style={{
          fontFamily: "Roboto, sans-serif",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          fontWeight: 400,
          color: "var(--colors-text-primary)",
        }}
      >
        {label}
      </span>
    </label>
  );
}

// Render a region's flag from its slug (or ISO code), resolved through the same
// CountryIsoMap the sportsbook uses. Falls back to a globe icon for regions
// without a national flag (e.g. "International") or unknown slugs.
function FlagFor({
  slug,
  size = "md",
}: {
  slug?: string;
  size?: FlagProps["size"];
}) {
  return (
    <PawabloxFlag
      slug={slug}
      size={size}
      fallback={
        <IconGlobe
          size={size === "sm" ? "sm" : "md"}
          color="var(--colors-icon-primary)"
        />
      }
    />
  );
}

export default LeaguesMarketsPanel;
