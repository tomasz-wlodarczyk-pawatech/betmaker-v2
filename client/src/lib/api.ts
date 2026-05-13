import { COUNTRIES } from "./countries";
import { apiRequest, queryClient } from "./queryClient";
import { BetSlipResult, Country } from "@/types";

const API_BASE = "/api";

export async function generateBetslip(
  countryCode: string,
  targetOdds: number,
  options?: { excludedLeagues?: string[]; excludedMarkets?: string[] },
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
        excludedLeagues: options?.excludedLeagues,
        excludedMarkets: options?.excludedMarkets,
      },
    );

    return await response.json();
  } catch (error) {
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
