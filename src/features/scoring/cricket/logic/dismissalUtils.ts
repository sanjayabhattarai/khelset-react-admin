// src/features/scoring/cricket/logic/dismissalUtils.ts
// This file contains the "pure" logic for processing a wicket dismissal.
// It updates the stats for the batsman and bowler based on the type of wicket.

import { MatchData, WicketType, Innings, Batsman, Bowler } from '../types';

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

  // --- 1. Update Batting Stats ---
  // Find the batsman who got out and update their status and dismissal details.
  const batsmanIndex = innings.battingStats.findIndex(p => p.id === dismissedBatsmanId);
  if (batsmanIndex !== -1) {
    innings.battingStats[batsmanIndex].status = 'out';
    innings.battingStats[batsmanIndex].dismissal = {
      type: wicketType,
      bowlerId: currentBowlerId!,
      ...(fielderId && { fielderId }), // Only add fielderId if it exists
    };
  }

  // --- 2. Update Bowling Stats ---
  // A wicket is not credited to the bowler for a run out.
  const isBowlerWicket = wicketType !== 'run_out';
  if (isBowlerWicket && currentBowlerId) {
    const bowlerIndex = innings.bowlingStats.findIndex(b => b.id === currentBowlerId);
    if (bowlerIndex !== -1) {
      innings.bowlingStats[bowlerIndex].wickets += 1;
    }
  }

  // --- 3. Update Innings Wicket Count ---
  innings.wickets += 1;

  // --- 4. Clear the on-strike batsman ---
  // The new batsman will be selected by the UI and will replace this null value.
  if (updatedData.onStrikeBatsmanId === dismissedBatsmanId) {
    updatedData.onStrikeBatsmanId = null; 
  } else if (updatedData.nonStrikeBatsmanId === dismissedBatsmanId) {
    updatedData.nonStrikeBatsmanId = null;
  }

  return updatedData;
};
