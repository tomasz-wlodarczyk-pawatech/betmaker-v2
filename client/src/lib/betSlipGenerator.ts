import { Event, HotSelection } from "@/types";

/**
 * Helper functions for the betslip generation logic
 * Note: Most of the complex betslip generation logic happens on the server
 * These are helper functions for the client side
 */

/**
 * Extract all hot selections from the events data
 */
export function getHotSelections(events: Event[]): HotSelection[] {
  const hotSelections: HotSelection[] = [];
  
  events.forEach(event => {
    event.markets.forEach(market => {
      market.selections.forEach(selection => {
        if (selection.hot === 1) {
          hotSelections.push({
            id: selection.id,
            name: selection.name,
            odds: parseFloat(selection.odds),
            eventId: event.event_id,
            eventName: event.event_name,
            competition: event.competition,
            marketName: market.name,
            startTime: event.start_time
          });
        }
      });
    });
  });
  
  return hotSelections;
}

/**
 * Check if the total odds falls within the acceptable range of the target
 */
export function isWithinRange(totalOdds: number, targetOdds: number, tolerance: number = 0.15): boolean {
  const lowerBound = targetOdds * (1 - tolerance);
  const upperBound = targetOdds * (1 + tolerance);
  return totalOdds >= lowerBound && totalOdds <= upperBound;
}

/**
 * Calculate the total odds for a given set of selections
 */
export function calculateTotalOdds(selections: HotSelection[]): number {
  return selections.reduce((total, selection) => total * selection.odds, 1);
}
