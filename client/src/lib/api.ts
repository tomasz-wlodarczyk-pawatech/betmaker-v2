import { apiRequest } from "./queryClient";
import { BetSlipResult, Event } from "@/types";

const API_BASE = "/api";

export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE}/events/popular`);
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  return response.json();
}

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
