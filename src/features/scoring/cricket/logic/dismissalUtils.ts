// src/features/scoring/cricket/logic/dismissalUtils.ts
// This file has been updated to correctly handle the "Free Hit" rule for wickets.

import { MatchData, WicketType, Innings } from '../types';

/**
 * Processes a wicket dismissal and updates the state of the match accordingly.
 * @param currentMatchData The current state of the match.
 * @param wicketType The type of dismissal (e.g., 'bowled', 'caught').
 * @param dismissedBatsmanId The ID of the batsman who is out.
 * @param fielderId The ID of the fielder involved (for catches, run outs, stumpings).
 * @returns The updated match data after processing the wicket.
 */
export const processWicket = (
  currentMatchData: MatchData,
  wicketType: WicketType,
  dismissedBatsmanId: string,
  fielderId?: string
): MatchData => {
  // Create a deep copy to avoid direct mutation.
  const updatedData = JSON.parse(JSON.stringify(currentMatchData));
  const inningsKey = `innings${updatedData.currentInnings}` as const;
  const innings: Innings = updatedData[inningsKey];
  const currentBowlerId = updatedData.currentBowlerId;
  const isFreeHit = updatedData.isFreeHit; // Get the free hit status from the match data.

  // --- 1. Check if the Wicket is Valid ---
  // A wicket does not count on a free hit, unless it is a run-out.
  const isWicketValid = !isFreeHit || wicketType === 'run_out';

  if (!isWicketValid) {
    // If the wicket is not valid (e.g., bowled on a free hit), we simply return
    // the original data without making any changes to the score or stats.
    return currentMatchData;
  }

  // --- 2. Update Batting Stats ---
  // Find the batsman who got out and update their status and dismissal details.
  const batsmanIndex = innings.battingStats.findIndex(p => p.id === dismissedBatsmanId);
  if (batsmanIndex !== -1) {
    innings.battingStats[batsmanIndex].status = 'out';
    
    const dismissalInfo: { type: WicketType; bowlerId: string; fielderId?: string } = {
      type: wicketType,
      bowlerId: currentBowlerId!,
    };
    if (fielderId) {
      dismissalInfo.fielderId = fielderId;
    }
    innings.battingStats[batsmanIndex].dismissal = dismissalInfo;
  }

  // --- 3. Update Bowling Stats ---
  // FIXED: Don't increment bowler wickets here because processEnhancedDelivery already handles it
  // This prevents double counting when wicket button is clicked
  // const isBowlerWicket = wicketType !== 'run_out' && isWicketValid;
  // if (isBowlerWicket && currentBowlerId) {
  //   const bowlerIndex = innings.bowlingStats.findIndex(b => b.id === currentBowlerId);
  //   if (bowlerIndex !== -1) {
  //     innings.bowlingStats[bowlerIndex].wickets += 1;
  //   }
  // }

  // --- 4. Update Innings Wicket Count ---
  // FIXED: Don't increment wickets here because processEnhancedDelivery already handles it
  // This prevents double counting when wicket button is clicked
  // innings.wickets += 1; // REMOVED - handled by processEnhancedDelivery

  // --- 5. Clear the dismissed batsman from their current position ---
  // The UI will then prompt for a new batsman to replace them.
  if (updatedData.onStrikeBatsmanId === dismissedBatsmanId) {
    updatedData.onStrikeBatsmanId = null; 
  } else if (updatedData.nonStrikeBatsmanId === dismissedBatsmanId) {
    updatedData.nonStrikeBatsmanId = null;
  }

  return updatedData;
};
