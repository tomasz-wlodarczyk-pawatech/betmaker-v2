import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "@aliengain/components";
import { IconCircleInfo } from "@aliengain/icons";
import BetslipTypeCard, { type BetslipType } from "@/components/BetslipTypeCard";
import OddsInput from "@/components/OddsInput";
import FiltersCard, {
  DEFAULT_LEG_ODDS,
  LEG_ODDS_MIN,
  LEG_ODDS_MAX,
  type ModeId,
  type TimeId,
} from "@/components/FiltersCard";
import LeaguesMarketsPanel, {
  type LeagueMarketSelection,
} from "@/components/LeaguesMarketsPanel";
import SavedBetslipsCard from "@/components/SavedBetslipsCard";
import SaveToast from "@/components/SaveToast";
import { generateBetslip } from "@/lib/api";
import {
  checkBetslipFeasibility,
  describePoolInfeasibility,
  feasibleRandomTargets,
  type FeasibilityResult,
} from "@/lib/feasibility";
import { RANDOM_TARGET_MAX, RANDOM_TARGET_MIN } from "@/lib/odds";
import type { BetslipDiagnostics } from "@shared/schema";
import { BetSlipResult } from "@/types";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";
import BetslipResults from "@/components/BetslipResults";
import ErrorState from "@/components/ErrorState";
import NoMatchState from "@/components/NoMatchState";
import ProcessingState from "@/components/ProcessingState";

const getRandomOdds = (min: number, max: number) =>
  Math.round(Math.random() * (max - min) + min);

const pickRandom = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

// Squeeze a leg-odds range into the current cap. This is presentation only: the
// range the user actually asked for is kept intact in `desiredLegOdds`, so
// raising the cap again restores their window instead of leaving it dented.
const clampLegOdds = (
  [lo, hi]: [number, number],
  cap: number,
): [number, number] =>
  lo <= cap && hi <= cap
    ? [lo, hi]
    : [lo > cap ? LEG_ODDS_MIN : lo, Math.min(hi, cap)];

interface HomeProps {
  brandIdentifier: string;
}

const Home = memo(function Home({ brandIdentifier }: HomeProps) {
  const { data: countries } = useCountries();

  const supportedBrandIdentifiers = useMemo(
    () => countries?.map((c) => c.brandIdentifier.toLowerCase()) ?? [],
    [countries],
  );

  const countryData = useMemo(
    () => getCountryByBrand(countries, brandIdentifier),
    [countries, brandIdentifier],
  );

  const countryCode = countryData?.countryIso2Code.toLowerCase() || "";

  const [targetOdds, setTargetOdds] = useState(() =>
    getRandomOdds(RANDOM_TARGET_MIN, RANDOM_TARGET_MAX),
  );
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [betslipResult, setBetslipResult] = useState<BetSlipResult | null>(
    null,
  );
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [noMatchDiagnostics, setNoMatchDiagnostics] = useState<
    BetslipDiagnostics | undefined
  >(undefined);
  const [error, setError] = useState(false);
  const [invalidBrand, setInvalidBrand] = useState(false);
  const [selected, setSelected] = useState<LeagueMarketSelection>({
    leagues: [],
    markets: [],
  });
  const [mode, setMode] = useState<ModeId>("all");
  const [time, setTime] = useState<TimeId>("any");
  const [legs, setLegs] = useState<[number, number]>([1, 60]);
  // The leg-odds window the user asked for, stored unclamped. What the UI shows
  // is this squeezed into `legOddsCap` — see `legOdds` below.
  const [desiredLegOdds, setDesiredLegOdds] =
    useState<[number, number]>(DEFAULT_LEG_ODDS);
  const [betslipType, setBetslipType] = useState<BetslipType>("target");
  const [savedToast, setSavedToast] = useState<string | null>(null);

  useEffect(() => {
    const isValid = supportedBrandIdentifiers.includes(
      brandIdentifier.toLowerCase(),
    );
    setInvalidBrand(!isValid);
  }, [brandIdentifier, supportedBrandIdentifiers]);

  // A single leg can never exceed the slip's total odds (total = product of all
  // legs), so the leg-odds range is capped at the Target Total Odds itself:
  // leg odds above the target are impossible and make no sense to offer.
  //
  // Random mode has no user-chosen target — it's rolled at generate time — so
  // there is nothing to cap against and the full span stays available. Capping
  // it here on a target the user can't even see is what used to trap the slider
  // at whatever they'd last picked in Target mode.
  const legOddsCap = useMemo(
    () =>
      betslipType === "random"
        ? LEG_ODDS_MAX
        : Math.min(LEG_ODDS_MAX, targetOdds),
    [betslipType, targetOdds],
  );

  // What the filters actually show and generate with. Derived, never stored, so
  // lowering the target and raising it again is fully reversible.
  const legOdds = useMemo(
    () => clampLegOdds(desiredLegOdds, legOddsCap),
    [desiredLegOdds, legOddsCap],
  );

  const handleLegOddsChange = useCallback(
    (next: [number, number]) => {
      setDesiredLegOdds((current) => {
        const [shownLo, shownHi] = clampLegOdds(current, legOddsCap);
        return [
          next[0] === shownLo ? current[0] : next[0],
          // A max thumb resting exactly on a binding cap was put there by the
          // cap, not by the user — leave their real upper bound untouched so it
          // comes back when the cap lifts.
          next[1] === shownHi && shownHi !== current[1] ? current[1] : next[1],
        ];
      });
    },
    [legOddsCap],
  );

  // Targets Random mode is allowed to roll, given the current filters. Empty
  // means the whole span is unreachable — the only case worth warning about
  // when there's no target on screen to point at.
  const randomTargets = useMemo(
    () =>
      betslipType === "random"
        ? feasibleRandomTargets({
            minLegOdds: legOdds[0],
            maxLegOdds: legOdds[1],
            minLegs: legs[0],
            maxLegs: legs[1],
          })
        : [],
    [betslipType, legOdds, legs],
  );

  // Whether the current filter combination can arithmetically produce a betslip
  // at all (total odds = product of legs). When it can't, we warn live and skip
  // the pointless API call — the detector has no false positives, so a "false"
  // here is a true dead end, not bad luck.
  const feasibility = useMemo<FeasibilityResult>(() => {
    if (betslipType === "random") {
      if (randomTargets.length > 0) return { feasible: true };
      return {
        feasible: false,
        reason: `No random target between ${RANDOM_TARGET_MIN} and ${RANDOM_TARGET_MAX} is reachable at these leg odds and leg counts. Widen your leg-odds range or allow more legs.`,
      };
    }
    return checkBetslipFeasibility({
      targetOdds,
      minLegOdds: legOdds[0],
      maxLegOdds: legOdds[1],
      minLegs: legs[0],
      maxLegs: legs[1],
    });
  }, [betslipType, randomTargets, targetOdds, legOdds, legs]);

  // "Randomise filters" anchors its maths on a target. Random mode hasn't rolled
  // one yet, so anchor on the middle of the span — filters that suit the middle
  // suit most of it — rather than on a stale, hidden Target-mode value.
  const filtersAnchorOdds =
    betslipType === "random"
      ? Math.round((RANDOM_TARGET_MIN + RANDOM_TARGET_MAX) / 2)
      : targetOdds;

  // Why the last generate came back empty, when the server could name it. Null
  // falls back to NoMatchState's generic copy.
  const poolReason = useMemo(
    () => describePoolInfeasibility(noMatchDiagnostics),
    [noMatchDiagnostics],
  );

  const handleGenerateBetslip = useCallback(async () => {
    if (invalidBrand) return;

    // Mathematically impossible filters: the live warning is already on screen,
    // so just bail — no spinner, no postMessage, no API call.
    if (!feasibility.feasible) return;

    // Random mode rolls a fresh target on every generate — that's the whole
    // point of the mode, and why the OddsInput card is hidden. Reusing the
    // Target-mode value here is what made "Random" behave like "Target with the
    // input hidden". The roll is drawn from the pre-checked feasible list, so it
    // can't land on a target the current filters forbid.
    const effectiveTarget =
      betslipType === "random" ? pickRandom(randomTargets) : targetOdds;
    if (effectiveTarget === undefined) return;
    if (effectiveTarget !== targetOdds) setTargetOdds(effectiveTarget);

    setNoMatchFound(false);
    setNoMatchDiagnostics(undefined);
    setBetslipResult(null);
    setError(false);
    setProcessing(true);
    setProcessingProgress(0);
    window.parent.postMessage(
      {
        type: "betslip_generator_selections",
        targetOdds: effectiveTarget,
      },
      "*",
    );

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => Math.min(prev + Math.random() * 15, 85));
    }, 200);

    try {
      const { result, diagnostics } = await generateBetslip(
        countryCode,
        effectiveTarget,
        {
          timeRange: time === "any" ? "whenever" : time,
          selectionMode: mode,
          minSelections: legs[0],
          maxSelections: legs[1],
          minLegOdds: legOdds[0],
          maxLegOdds: legOdds[1],
          selectedLeagues: selected.leagues,
          selectedMarkets: selected.markets,
        },
      );

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setTimeout(() => {
        setProcessing(false);
        if (result) {
          setBetslipResult(result);
        } else {
          setNoMatchDiagnostics(diagnostics);
          setNoMatchFound(true);
        }
      }, 300);
    } catch (error) {
      clearInterval(progressInterval);
      setProcessing(false);
      setError(true);
      console.error("Error generating betslip:", error);
    }
  }, [
    invalidBrand,
    feasibility.feasible,
    betslipType,
    randomTargets,
    targetOdds,
    countryCode,
    time,
    mode,
    legs,
    legOdds,
    selected.leagues,
    selected.markets,
  ]);

  const handleRetry = useCallback(
    () => handleGenerateBetslip(),
    [handleGenerateBetslip],
  );

  if (invalidBrand) {
    return (
      <ErrorState
        message={`Invalid brand identifier: ${brandIdentifier}. Supported brands: ${supportedBrandIdentifiers.join(", ")}`}
        onRetry={() => (window.location.href = "/betpawa-ghana")}
      />
    );
  }

  return (
    <>
      <BetslipTypeCard value={betslipType} onChange={setBetslipType} />

      <div
        style={{
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {betslipType === "target" && (
          <OddsInput
            targetOdds={targetOdds}
            setTargetOdds={setTargetOdds}
            onGenerate={handleGenerateBetslip}
            disabled={processing}
          />
        )}

        <FiltersCard
          mode={mode}
          onModeChange={setMode}
          time={time}
          onTimeChange={setTime}
          legs={legs}
          onLegsChange={setLegs}
          legOdds={legOdds}
          onLegOddsChange={handleLegOddsChange}
          legOddsMax={legOddsCap}
          targetOdds={filtersAnchorOdds}
        />

        <LeaguesMarketsPanel
          countryCode={countryCode}
          brandIdentifier={brandIdentifier}
          value={selected}
          onChange={setSelected}
        />

        <SavedBetslipsCard />

        {!feasibility.feasible && (
          <NoMatchState
            title="These filters can't make a betslip"
            description={feasibility.reason}
          />
        )}

        {feasibility.feasible && feasibility.tight && (
          <NoMatchState
            variant="neutral"
            icon={<IconCircleInfo size="md" />}
            title="These filters are very tight"
            description={feasibility.reason}
          />
        )}

        <Button
          title="GENERATE SELECTIONS"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleGenerateBetslip}
          disabled={processing}
          isLoading={processing}
        />

        {processing && (
          <ProcessingState
            progress={processingProgress}
            message="Generating Selections"
          />
        )}

        {error && feasibility.feasible && (
          <ErrorState
            message="Unable to generate betslip. Please try again later."
            onRetry={handleRetry}
          />
        )}

        {noMatchFound && feasibility.feasible && !feasibility.tight && (
          <NoMatchState {...(poolReason ?? {})} />
        )}

        {betslipResult && (
          <BetslipResults
            result={betslipResult}
            targetOdds={targetOdds}
            onRegenerate={handleGenerateBetslip}
            onResultChange={setBetslipResult}
            onClose={() => setBetslipResult(null)}
            brandIdentifier={brandIdentifier}
            mode={mode}
            time={time}
            selected={selected}
            legOdds={legOdds}
            onSaved={(code) => setSavedToast(code)}
          />
        )}
      </div>

      {savedToast && (
        <SaveToast
          bookingCode={savedToast}
          onClose={() => setSavedToast(null)}
        />
      )}
    </>
  );
});

export default Home;
