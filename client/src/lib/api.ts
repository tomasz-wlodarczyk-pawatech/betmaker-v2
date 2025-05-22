import { apiRequest, queryClient } from "./queryClient";
import { BetSlipResult, Country } from "@/types";

const API_BASE = "/api";

export async function generateBetslip(
  countryCode: string,
  targetOdds: number,
): Promise<BetSlipResult | null> {
  try {
    const countries = queryClient.getQueryData(["countries"]) as Country[];

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
      },
    );

    return await response.json();
  } catch (error) {
    console.error("Error generating betslip:", error);
    throw error;
  }
}

export async function generateBookingCode(
  country: string,
  selectionIds: string[],
): Promise<{ code: string }> {
  try {
    const response = await apiRequest(
      "POST",
      `${API_BASE}/${country}/booking/generate`,
      {
        selectionIds,
      },
    );

    return await response.json();
  } catch (error) {
    console.error("Error generating booking code:", error);
    throw error;
  }
}
