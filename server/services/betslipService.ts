import { Event, BetSlipResult, BetSlipSelection, HotSelection } from "@/types";

/**
 * Generate a betslip with selections that match the target odds
 * Optimized for speed while maintaining randomness
 */
export async function generateBetslip(
  events: Event[],
  targetOdds: number,
  tolerance: number = 0.15
): Promise<BetSlipResult | null> {
  // Set a timeout to prevent long-running calculations
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 500; // 500ms max execution time
  
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
  
  // Use fast algorithm directly instead of trying multiple approaches
  // Randomly choose between different algorithms for variety
  const useGreedy = Math.random() < 0.7; // Use greedy approach 70% of the time for speed
  
  if (useGreedy) {
    // Use the faster greedy approach
    const result = findFastCombination(shuffledSelections, targetOdds, minOdds, maxOdds);
    if (result) {
      return {
        totalOdds: result.totalOdds,
        selections: result.selections.map((s: HotSelection) => ({
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
    // Use the optimized combination finder with a random size limit
    const maxSize = Math.floor(Math.random() * 3) + 2; // 2-4 selections for better performance
    const result = findOptimizedCombination(shuffledSelections, targetOdds, minOdds, maxOdds, maxSize, startTime, MAX_EXECUTION_TIME);
    if (result) {
      return {
        totalOdds: result.totalOdds,
        selections: result.selections.map((s: HotSelection) => ({
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

  // As a fallback, if we couldn't find anything, use the fastest approach
  const result = findFastCombination(shuffledSelections, targetOdds, minOdds, maxOdds);
  if (result) {
    return {
      totalOdds: result.totalOdds,
      selections: result.selections.map((s: HotSelection) => ({
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
 * Optimized combination finder with timeout to prevent long-running calculations
 */
function findOptimizedCombination(
  hotSelections: HotSelection[],
  targetOdds: number,
  minOdds: number,
  maxOdds: number,
  maxSize: number,
  startTime: number,
  maxExecutionTime: number
): { totalOdds: number, selections: HotSelection[] } | null {
  // Store valid combinations
  const validCombinations: Array<{
    totalOdds: number, 
    selections: HotSelection[], 
    diff: number
  }> = [];
  
  // Pre-sort selections by ascending odds for more efficient search
  const sortedSelections = [...hotSelections].sort((a, b) => a.odds - b.odds);
  
  // Identify possible starting selections that aren't too large
  const possibleStartingSelections = sortedSelections.filter(s => s.odds <= maxOdds);
  
  // If there are no suitable starting selections, return null
  if (possibleStartingSelections.length === 0) {
    return null;
  }
  
  // Randomly select 3 starting points (or fewer if we have less)
  const startingPoints = [];
  for (let i = 0; i < Math.min(3, possibleStartingSelections.length); i++) {
    const randomIndex = Math.floor(Math.random() * possibleStartingSelections.length);
    startingPoints.push(randomIndex);
  }
  
  // Try each starting point
  for (const startIndex of startingPoints) {
    const startSelection = possibleStartingSelections[startIndex];
    const currentSelections = [startSelection];
    const usedEventIds = new Set<string>([startSelection.eventId]);
    const currentOdds = startSelection.odds;
    
    // If the starting selection is already within range, add it
    if (currentOdds >= minOdds && currentOdds <= maxOdds) {
      validCombinations.push({
        totalOdds: currentOdds,
        selections: [...currentSelections],
        diff: Math.abs(currentOdds - targetOdds)
      });
    }
    
    // Do a depth-first search with a small depth limit for speed
    depthFirstSearch(
      sortedSelections, 
      currentSelections, 
      usedEventIds, 
      currentOdds, 
      1, // Start at depth 1 since we already have one selection
      maxSize,
      targetOdds,
      minOdds,
      maxOdds,
      validCombinations,
      startTime,
      maxExecutionTime
    );
    
    // Check if we've exceeded our time limit
    if (Date.now() - startTime > maxExecutionTime) {
      break;
    }
  }
  
  // If we found valid combinations, pick a random one from the best few
  if (validCombinations.length > 0) {
    // Sort by how close they are to target odds
    validCombinations.sort((a, b) => a.diff - b.diff);
    
    // Randomly select from top 3 (or fewer if we have less)
    const randomIndex = Math.floor(Math.random() * Math.min(3, validCombinations.length));
    const selected = validCombinations[randomIndex];
    
    return { totalOdds: selected.totalOdds, selections: selected.selections };
  }
  
  return null;
}

/**
 * Depth-first search with time limit and early termination
 */
function depthFirstSearch(
  selections: HotSelection[],
  currentSelections: HotSelection[],
  usedEventIds: Set<string>,
  currentOdds: number,
  depth: number,
  maxDepth: number,
  targetOdds: number,
  minOdds: number,
  maxOdds: number,
  validCombinations: Array<{ totalOdds: number, selections: HotSelection[], diff: number }>,
  startTime: number,
  maxExecutionTime: number
): void {
  // Check time limit
  if (Date.now() - startTime > maxExecutionTime) {
    return;
  }
  
  // If we've reached max depth, stop
  if (depth >= maxDepth) {
    return;
  }
  
  // Try adding each possible selection
  for (const selection of selections) {
    // Skip if we already have a selection from this event
    if (usedEventIds.has(selection.eventId)) {
      continue;
    }
    
    // Calculate new odds
    const newOdds = currentOdds * selection.odds;
    
    // If new odds would exceed max odds by too much, skip
    if (newOdds > maxOdds * 1.1) {
      continue;
    }
    
    // Add selection
    currentSelections.push(selection);
    usedEventIds.add(selection.eventId);
    
    // Check if current combination is valid
    if (newOdds >= minOdds && newOdds <= maxOdds) {
      const diff = Math.abs(newOdds - targetOdds);
      validCombinations.push({
        totalOdds: newOdds,
        selections: [...currentSelections],
        diff: diff
      });
      
      // Keep only the best 10 combinations for memory efficiency
      if (validCombinations.length > 10) {
        validCombinations.sort((a, b) => a.diff - b.diff);
        validCombinations.length = 10;
      }
    }
    
    // Continue search
    depthFirstSearch(
      selections,
      currentSelections,
      usedEventIds,
      newOdds,
      depth + 1,
      maxDepth,
      targetOdds,
      minOdds,
      maxOdds,
      validCombinations,
      startTime,
      maxExecutionTime
    );
    
    // Backtrack
    currentSelections.pop();
    usedEventIds.delete(selection.eventId);
  }
}

/**
 * Fast combination finder using a greedy approach for better performance
 */
function findFastCombination(
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
