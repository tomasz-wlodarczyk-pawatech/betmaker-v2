import { COUNTRIES } from "./countries";
import { apiRequest, queryClient } from "./queryClient";
import { BetSlipResult, BetSlipSelection, Country } from "@/types";

const API_BASE = "/api";

export interface GenerateBetslipOptions {
  timeRange?: "whenever" | "today" | "3h" | "48h" | "72h";
  selectionMode?: "all" | "hot" | "fav";
  minSelections?: number;
  maxSelections?: number;
  minLegOdds?: number;
  maxLegOdds?: number;
  randomMode?: boolean;
  excludedLeagues?: string[];
  excludedMarkets?: string[];
}

export async function generateBetslip(
  countryCode: string,
  targetOdds: number,
  options?: GenerateBetslipOptions,
): Promise<BetSlipResult | null> {
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
        excludedLeagues: options?.excludedLeagues ?? [],
        excludedMarkets: options?.excludedMarkets ?? [],
      },
    );

    return await response.json();
  } catch (error) {
    // The backend returns 404 "No suitable betslip found for the target odds"
    // when the algorithm can't hit the target. That's a valid "no match"
    // outcome, not a failure — return null so the caller shows the no-match
    // state (with "try other odds") instead of a generic error.
    // (apiRequest formats errors as `${status}: ${text}`, see queryClient.ts.)
    if (error instanceof Error && error.message.startsWith("404")) {
      return null;
    }
    console.error("Error generating betslip:", error);
    throw error;
  }
}

export interface AvailableFilters {
  leagues: string[];
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
  excludedLeagues?: string[];
  excludedMarkets?: string[];
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
