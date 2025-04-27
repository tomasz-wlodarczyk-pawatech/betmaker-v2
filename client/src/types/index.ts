// API types matching the format from the API
export interface EventSelection {
  id: string;
  name: string;
  odds: string;
  hot: number;
}

export interface EventMarket {
  name: string;
  selections: EventSelection[];
}

export interface Event {
  start_time: string;
  competition: string;
  event_name: string;
  event_id: string;
  scoreboard: any[];
  markets: EventMarket[];
}

// Processed selection for betslip display
export interface BetSlipSelection {
  id: string;
  eventName: string;
  eventId: string;
  competition: string;
  marketName: string;
  selectionName: string;
  odds: string;
  startTime: string;
  isHot?: boolean; // Flag to indicate this is a hot selection
}

// Final betslip result
export interface BetSlipResult {
  totalOdds: number;
  selections: BetSlipSelection[];
}

// Types for betslip generation algorithm
export interface HotSelection {
  id: string;
  name: string;
  odds: number;
  eventId: string;
  eventName: string;
  competition: string;
  marketName: string;
  startTime: string;
}
