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
import { checkBetslipFeasibility } from "@/lib/feasibility";
import { BetSlipResult } from "@/types";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";
import BetslipResults from "@/components/BetslipResults";
import ErrorState from "@/components/ErrorState";
import NoMatchState from "@/components/NoMatchState";
import ProcessingState from "@/components/ProcessingState";

const getRandomOdds = (min: number, max: number) =>
  Math.round(Math.random() * (max - min) + min);

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

  const [targetOdds, setTargetOdds] = useState(() => getRandomOdds(5, 20));
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [betslipResult, setBetslipResult] = useState<BetSlipResult | null>(
    null,
  );
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [error, setError] = useState(false);
  const [invalidBrand, setInvalidBrand] = useState(false);
  const [selected, setSelected] = useState<LeagueMarketSelection>({
    leagues: [],
    markets: [],
  });
  const [mode, setMode] = useState<ModeId>("all");
  const [time, setTime] = useState<TimeId>("any");
  const [legs, setLegs] = useState<[number, number]>([1, 60]);
  const [legOdds, setLegOdds] = useState<[number, number]>(DEFAULT_LEG_ODDS);
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
  const legOddsCap = useMemo(
    () => Math.min(LEG_ODDS_MAX, targetOdds),
    [targetOdds],
  );

  // Keep leg odds in sync with the target: pull the range down whenever it
  // would exceed the cap. If the whole range sits above the cap, fall back to
  // the full allowed span so the generator still has picks to work with.
  useEffect(() => {
    setLegOdds((current) => {
      const [lo, hi] = current;
      if (lo <= legOddsCap && hi <= legOddsCap) return current;
      const nextLo = lo > legOddsCap ? LEG_ODDS_MIN : lo;
      const nextHi = Math.min(hi, legOddsCap);
      return [nextLo, nextHi];
    });
  }, [legOddsCap]);

  // Whether the current filter combination can arithmetically produce a betslip
  // at all (total odds = product of legs). When it can't, we warn live and skip
  // the pointless API call — the detector has no false positives, so a "false"
  // here is a true dead end, not bad luck.
  const feasibility = useMemo(
    () =>
      checkBetslipFeasibility({
        targetOdds,
        minLegOdds: legOdds[0],
        maxLegOdds: legOdds[1],
        minLegs: legs[0],
        maxLegs: legs[1],
      }),
    [targetOdds, legOdds, legs],
  );

  const handleGenerateBetslip = useCallback(async () => {
    if (invalidBrand) return;

    // Mathematically impossible filters: the live warning is already on screen,
    // so just bail — no spinner, no postMessage, no API call.
    if (!feasibility.feasible) return;

    setNoMatchFound(false);
    setBetslipResult(null);
    setError(false);
    setProcessing(true);
    setProcessingProgress(0);
    window.parent.postMessage(
      {
        type: "betslip_generator_selections",
        targetOdds: targetOdds,
      },
      "*",
    );

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => Math.min(prev + Math.random() * 15, 85));
    }, 200);

    try {
      const result = await generateBetslip(countryCode, targetOdds, {
        timeRange: time === "any" ? "whenever" : time,
        selectionMode: mode,
        minSelections: legs[0],
        maxSelections: legs[1],
        minLegOdds: legOdds[0],
        maxLegOdds: legOdds[1],
        selectedLeagues: selected.leagues,
        selectedMarkets: selected.markets,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setTimeout(() => {
        setProcessing(false);
        result ? setBetslipResult(result) : setNoMatchFound(true);
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
          onLegOddsChange={setLegOdds}
          legOddsMax={legOddsCap}
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
          <NoMatchState />
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
