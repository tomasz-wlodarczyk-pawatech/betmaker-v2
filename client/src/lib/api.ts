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

export async function generateBookingCode(selectionIds: string[]): Promise<{ code: string }> {
  try {
    const response = await fetch('https://www.betpawa.com.gh/api/sportsbook/v2/booking-number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pawa-brand': 'betpawa-ghana',
        'x-pawa-language': 'en'
      },
      body: JSON.stringify({
        selections: selectionIds
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate booking code: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating booking code:", error);
    throw error;
  }
}
