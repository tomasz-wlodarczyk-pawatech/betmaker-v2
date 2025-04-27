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
  
  // Add some randomness to the search by shuffling selections
  const shuffledSelections = [...hotSelections].sort(() => Math.random() - 0.5);
  
  // Try different sizes of betslips - let's randomize this too
  // Sometimes start with larger selections, sometimes with smaller ones
  const randomStartSize = Math.random() < 0.5 ? 1 : Math.floor(Math.random() * 3) + 1;
  const searchSizes = Array.from({ length: 8 }, (_, i) => i + randomStartSize)
    .sort(() => Math.random() - 0.5); // Shuffle the sizes
  
  // Try to find combinations of different sizes
  for (const size of searchSizes) {
    const actualSize = Math.min(size, shuffledSelections.length);
    const result = findBestCombination(shuffledSelections, targetOdds, minOdds, maxOdds, actualSize);
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

  // If no combination found with normal search, try with greedy approach
  // Randomly choose between different search strategies for variety
  if (Math.random() < 0.5) {
    // Try with more selections using the standard algorithm
    const result = findBestCombination(shuffledSelections, targetOdds, minOdds, maxOdds, 50);
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
  } else {
    // Try with the greedy approach for different results
    const result = findGreedyCombination(shuffledSelections, targetOdds, minOdds, maxOdds);
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
  // Store multiple valid combinations instead of just the best one
  const validCombinations: Array<{
    totalOdds: number, 
    selections: HotSelection[], 
    diff: number
  }> = [];
  
  // Shuffle the selections to ensure randomness
  const shuffledSelections = [...hotSelections].sort(() => Math.random() - 0.5);
  
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
      validCombinations.push({
        totalOdds: currentOdds,
        selections: [...currentSelections],
        diff: diff
      });
      
      // If we have too many combinations, keep only the top 20
      if (validCombinations.length > 20) {
        validCombinations.sort((a, b) => a.diff - b.diff);
        validCombinations.length = 20;
      }
    }
    
    // Stop if we've reached the maximum number of selections
    if (currentSelections.length >= maxSize) {
      return;
    }
    
    // Try adding more selections
    for (let i = startIndex; i < shuffledSelections.length; i++) {
      const selection = shuffledSelections[i];
      
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
  
  // If we found valid combinations, randomly select one from the top performers
  if (validCombinations.length > 0) {
    // Sort by how close they are to target odds
    validCombinations.sort((a, b) => a.diff - b.diff);
    
    // Randomly select one of the top combinations
    // Get a random index from the top 50% of results, with minimum of 1 and maximum of 5
    const maxRandomIndex = Math.min(
      Math.max(1, Math.floor(validCombinations.length / 2)), 
      Math.min(5, validCombinations.length - 1)
    );
    const randomIndex = Math.floor(Math.random() * (maxRandomIndex + 1));
    
    const selected = validCombinations[randomIndex];
    return { totalOdds: selected.totalOdds, selections: selected.selections };
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
  // Clone and shuffle selections
  const shuffledSelections = [...hotSelections].sort(() => Math.random() - 0.5);
  
  // Try multiple starting points to get different results each time
  const startingPoints = [];
  for (let i = 0; i < Math.min(5, shuffledSelections.length); i++) {
    const randomIndex = Math.floor(Math.random() * shuffledSelections.length);
    startingPoints.push(randomIndex);
  }
  
  // Try building from each starting point and collect results
  const possibleCombinations = [];
  
  for (const startIndex of startingPoints) {
    let currentOdds = 1;
    const selectedSelections: HotSelection[] = [];
    const usedEventIds = new Set<string>();
    
    // Add the starting selection
    const startSelection = shuffledSelections[startIndex];
    selectedSelections.push(startSelection);
    usedEventIds.add(startSelection.eventId);
    currentOdds *= startSelection.odds;
    
    // Try to build a combination that gets close to the target odds
    for (const selection of shuffledSelections) {
      // Skip if we already used this event or it's the starting selection
      if (usedEventIds.has(selection.eventId)) {
        continue;
      }
      
      // Check if adding this selection would improve our odds
      const newOdds = currentOdds * selection.odds;
      if (newOdds <= maxOdds * 1.1 && Math.abs(newOdds - targetOdds) < Math.abs(currentOdds - targetOdds)) {
        selectedSelections.push(selection);
        usedEventIds.add(selection.eventId);
        currentOdds = newOdds;
        
        // If we're within range, add to possible combinations
        if (currentOdds >= minOdds && currentOdds <= maxOdds) {
          possibleCombinations.push({
            totalOdds: currentOdds,
            selections: [...selectedSelections],
            diff: Math.abs(currentOdds - targetOdds)
          });
        }
      }
    }
    
    // Even if not in range, add to possible combinations if we have selections
    if (selectedSelections.length > 1) {
      possibleCombinations.push({
        totalOdds: currentOdds,
        selections: [...selectedSelections],
        diff: Math.abs(currentOdds - targetOdds)
      });
    }
  }
  
  // If we found any combinations, pick a random one from the best few
  if (possibleCombinations.length > 0) {
    // Sort by how close they are to target odds
    possibleCombinations.sort((a, b) => a.diff - b.diff);
    
    // Take a random one from the top 3 (or fewer if we have less)
    const randomIndex = Math.floor(Math.random() * Math.min(3, possibleCombinations.length));
    const selected = possibleCombinations[randomIndex];
    
    return { 
      totalOdds: selected.totalOdds, 
      selections: selected.selections 
    };
  }
  
  return null;
}
