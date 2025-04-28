import { apiRequest } from "./queryClient";
import { BetSlipResult } from "@/types";

const API_BASE = "/api";

export async function generateBetslip(targetOdds: number): Promise<BetSlipResult | null> {
  try {
    const response = await apiRequest("POST", `${API_BASE}/betslip/generate`, {
      targetOdds
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error generating betslip:", error);
    throw error;
  }
}

export async function generateBookingCode(selectionIds: string[]): Promise<{ code: string }> {
  try {
    const response = await apiRequest("POST", `${API_BASE}/booking/generate`, {
      selectionIds
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error generating booking code:", error);
    throw error;
  }
}