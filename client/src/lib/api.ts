import { COUNTRIES } from "./countries";
import { ApiError, apiRequest, queryClient } from "./queryClient";
import { BetSlipResult, BetSlipSelection, Country } from "@/types";
import type { BetslipDiagnostics } from "@shared/schema";
import type { SavedBetslip } from "@/hooks/use-saved-betslips";

const API_BASE = "/api";

export interface GenerateBetslipOptions {
  timeRange?: "whenever" | "today" | "3h" | "48h" | "72h";
  selectionMode?: "all" | "hot" | "fav";
  minSelections?: number;
  maxSelections?: number;
  minLegOdds?: number;
  maxLegOdds?: number;
  randomMode?: boolean;
  selectedLeagues?: string[];
  selectedMarkets?: string[];
}

export interface GenerateBetslipOutcome {
  /** The betslip, or null when nothing matched the filters. */
  result: BetSlipResult | null;
  /** Why nothing matched, when the server could pin it down. */
  diagnostics?: BetslipDiagnostics;
}

export async function generateBetslip(
  countryCode: string,
  targetOdds: number,
  options?: GenerateBetslipOptions,
): Promise<GenerateBetslipOutcome> {
  try {
    const countries = COUNTRIES as Country[];

    const countryData = countries?.find(
      (c) => c.countryIso2Code.toLowerCase() === countryCode.toLowerCase(),
    );

    if (!countryData) {
      throw new Error(`Invalid country code: ${countryCode}`);
    }

    const response = await apiRequest(
      "POST",
      `${API_BASE}/${countryCode}/betslip/generate`,
      {
        targetOdds,
        brandIdentifier: countryData.brandIdentifier,
        timeRange: options?.timeRange ?? "whenever",
        minSelections: options?.minSelections,
        maxSelections: options?.maxSelections,
        minLegOdds: options?.minLegOdds,
        maxLegOdds: options?.maxLegOdds,
        selectionMode: options?.selectionMode ?? "all",
        randomMode: options?.randomMode ?? false,
        selectedLeagues: options?.selectedLeagues ?? [],
        selectedMarkets: options?.selectedMarkets ?? [],
      },
    );

    return { result: await response.json() };
  } catch (error) {
    // The backend returns 404 "No suitable betslip found for the target odds"
    // when the algorithm can't hit the target. That's a valid "no match"
    // outcome, not a failure — return a null result so the caller shows the
    // no-match state instead of a generic error, along with the diagnostics the
    // server attaches so it can explain which limit was hit.
    if (error instanceof ApiError && error.status === 404) {
      const body = error.json<{ diagnostics?: BetslipDiagnostics }>();
      return { result: null, diagnostics: body?.diagnostics };
    }
    console.error("Error generating betslip:", error);
    throw error;
  }
}

export interface AvailableFilters {
  leagues: string[];
  /** Subset of `leagues` flagged as popular (upstream `preferred === true`). */
  popularLeagues: string[];
  /** Region display name → upstream slug, for resolving a country flag. */
  regionSlugs: Record<string, string>;
  markets: string[];
}

export async function fetchAvailableFilters(
  countryCode: string,
  brandIdentifier: string,
  timeRange: string = "whenever",
): Promise<AvailableFilters> {
  const response = await apiRequest(
    "POST",
    `${API_BASE}/${countryCode}/filters/available`,
    { brandIdentifier, timeRange },
  );
  return response.json();
}

export interface SwitchSelectionParams {
  brandIdentifier: string;
  currentSelectionId: string;
  excludeEventIds: string[];
  timeRange?: "whenever" | "today" | "3h" | "48h" | "72h";
  selectionMode?: string;
  targetOdds: number;
  currentTotalOdds: number;
  replacedSelectionOdds: number;
  selectedLeagues?: string[];
  selectedMarkets?: string[];
  minLegOdds?: number;
  maxLegOdds?: number;
}

export async function switchSelection(
  countryCode: string,
  params: SwitchSelectionParams,
): Promise<BetSlipSelection | null> {
  const response = await apiRequest(
    "POST",
    `${API_BASE}/${countryCode}/selection/switch`,
    params,
  );
  const data = await response.json();
  return data?.selection ?? null;
}

// Saved betslips synced to the logged-in user's miniapp preferences. The
// session token comes from the lobby (`?sid=`) and is forwarded as a Bearer
// header; the country segment is validated server-side but the upstream is
// selected by brand, so any supported country works here.
export async function fetchSavedBetslipsFromPreferences(
  country: string,
  brandIdentifier: string,
  sessionToken: string,
): Promise<SavedBetslip[]> {
  const response = await apiRequest(
    "GET",
    `${API_BASE}/${country}/preferences/betslips?brand=${encodeURIComponent(brandIdentifier)}`,
    undefined,
    { Authorization: `Bearer ${sessionToken}` },
  );
  const data = await response.json();
  return Array.isArray(data?.savedBetslips)
    ? (data.savedBetslips as SavedBetslip[])
    : [];
}

export async function saveBetslipsToPreferences(
  country: string,
  brandIdentifier: string,
  sessionToken: string,
  savedBetslips: SavedBetslip[],
): Promise<SavedBetslip[]> {
  const response = await apiRequest(
    "PUT",
    `${API_BASE}/${country}/preferences/betslips`,
    { savedBetslips, brandIdentifier },
    { Authorization: `Bearer ${sessionToken}` },
  );
  const data = await response.json();
  return Array.isArray(data?.savedBetslips)
    ? (data.savedBetslips as SavedBetslip[])
    : savedBetslips;
}

export async function generateBookingCode(
  country: string,
  selectionIds: string[],
  brandIdentifier: string,
): Promise<{ bookingCode: string; domain: string }> {
  try {
    const response = await apiRequest(
      "POST",
      `${API_BASE}/${country}/booking/generate`,
      {
        selectionIds,
        brandIdentifier,
      },
    );

    return await response.json();
  } catch (error) {
    console.error("Error generating booking code:", error);
    throw error;
  }
}
