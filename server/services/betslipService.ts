import { Event, BetSlipResult, BetSlipSelection, HotSelection } from "@/types";

/**
 * Generate a betslip with selections that match the target odds
 */
export async function generateBetslip(
  events: Event[],
  targetOdds: number,
  tolerance: number = 0.15
): Promise<BetSlipResult | null> {
  // Extract all hot selections
  const hotSelections = getHotSelections(events);
  
  if (hotSelections.length === 0) {
    return null;
  }

  // Define acceptable range
  const minOdds = targetOdds * (1 - tolerance);
  const maxOdds = targetOdds * (1 + tolerance);
  
  // Find a combination that matches the target odds
  // Try to minimize the number of selections first, starting with 1 and going up to 10
  for (let size = 1; size <= Math.min(10, hotSelections.length); size++) {
    const result = findBestCombination(hotSelections, targetOdds, minOdds, maxOdds, size);
    if (result) {
      // Convert to BetSlipResult format
      return {
        totalOdds: result.totalOdds,
        selections: result.selections.map(s => ({
          id: s.id,
          eventName: s.eventName,
          eventId: s.eventId,
          competition: s.competition,
          marketName: s.marketName,
          selectionName: s.name,
          odds: s.odds.toString(),
          startTime: s.startTime
        }))
      };
    }
  }

  // If no combination found, try with more selections (up to 50)
  const result = findBestCombination(hotSelections, targetOdds, minOdds, maxOdds, 50);
  if (result) {
    return {
      totalOdds: result.totalOdds,
      selections: result.selections.map(s => ({
        id: s.id,
        eventName: s.eventName,
        eventId: s.eventId,
        competition: s.competition,
        marketName: s.marketName,
        selectionName: s.name,
        odds: s.odds.toString(),
        startTime: s.startTime
      }))
    };
  }

  return null;
}

/**
 * Extract all hot selections from events
 */
function getHotSelections(events: Event[]): HotSelection[] {
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
 * Find the best combination of selections that match the target odds
 */
function findBestCombination(
  hotSelections: HotSelection[],
  targetOdds: number,
  minOdds: number,
  maxOdds: number,
  maxSize: number
): { totalOdds: number, selections: HotSelection[] } | null {
  let bestCombination: HotSelection[] | null = null;
  let bestDiff = Infinity;
  
  // Sort selections by odds (ascending) to optimize search
  hotSelections.sort((a, b) => a.odds - b.odds);
  
  /**
   * Recursive function to find all combinations
   */
  function findCombinations(
    startIndex: number,
    currentSelections: HotSelection[],
    currentOdds: number,
    usedEventIds: Set<string>
  ) {
    // Check if current combination matches criteria
    if (currentOdds >= minOdds && currentOdds <= maxOdds) {
      const diff = Math.abs(currentOdds - targetOdds);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestCombination = [...currentSelections];
      }
    }
    
    // Stop if we've reached the maximum number of selections
    if (currentSelections.length >= maxSize) {
      return;
    }
    
    // Try adding more selections
    for (let i = startIndex; i < hotSelections.length; i++) {
      const selection = hotSelections[i];
      
      // Skip if we already have a selection from this event
      if (usedEventIds.has(selection.eventId)) {
        continue;
      }
      
      // Skip if adding this would exceed max odds
      const newOdds = currentOdds * selection.odds;
      if (newOdds > maxOdds * 1.1) { // Add 10% buffer to avoid pruning too early
        continue;
      }
      
      // Add the selection and continue searching
      currentSelections.push(selection);
      usedEventIds.add(selection.eventId);
      
      findCombinations(i + 1, currentSelections, newOdds, usedEventIds);
      
      // Backtrack
      currentSelections.pop();
      usedEventIds.delete(selection.eventId);
    }
  }
  
  // Start the search
  findCombinations(0, [], 1, new Set<string>());
  
  if (bestCombination) {
    const totalOdds = bestCombination.reduce((total, selection) => total * selection.odds, 1);
    return { totalOdds, selections: bestCombination };
  }
  
  return null;
}

/**
 * Fallback function using a greedy approach for better performance
 * with large numbers of selections
 */
function findGreedyCombination(
  hotSelections: HotSelection[],
  targetOdds: number,
  minOdds: number,
  maxOdds: number
): { totalOdds: number, selections: HotSelection[] } | null {
  // Clone and sort selections by how close they are to 1.0 (ascending)
  const sortedSelections = [...hotSelections].sort((a, b) => 
    Math.abs(a.odds - 1) - Math.abs(b.odds - 1)
  );
  
  let currentOdds = 1;
  const selectedSelections: HotSelection[] = [];
  const usedEventIds = new Set<string>();
  
  // Try to build a combination that gets close to the target odds
  for (const selection of sortedSelections) {
    // Skip if we already used this event
    if (usedEventIds.has(selection.eventId)) {
      continue;
    }
    
    // Check if adding this selection would improve our odds
    const newOdds = currentOdds * selection.odds;
    if (newOdds <= maxOdds && Math.abs(newOdds - targetOdds) < Math.abs(currentOdds - targetOdds)) {
      selectedSelections.push(selection);
      usedEventIds.add(selection.eventId);
      currentOdds = newOdds;
      
      // If we're within range, we're done
      if (currentOdds >= minOdds && currentOdds <= maxOdds) {
        return { totalOdds: currentOdds, selections: selectedSelections };
      }
    }
  }
  
  // If we completed the loop but didn't find a match within range
  if (selectedSelections.length > 0) {
    return { totalOdds: currentOdds, selections: selectedSelections };
  }
  
  return null;
}
