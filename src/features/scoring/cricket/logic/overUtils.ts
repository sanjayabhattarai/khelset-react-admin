// src/features/scoring/cricket/logic/overUtils.ts
// This file contains the "pure" logic for processing the end of a cricket over.

import { MatchData, Innings } from '../types';

/**
 * Processes the end of an over, updating overs count and rotating the strike.
 * @param currentMatchData The current state of the match before the over ended.
 * @returns The updated match data after processing the end of the over.
 */
export const processEndOfOver = (
  currentMatchData: MatchData
): MatchData => {
  // Create a deep copy to avoid direct mutation of the original state.
  const updatedData = JSON.parse(JSON.stringify(currentMatchData));
  const inningsKey = `innings${updatedData.currentInnings}` as const;
  const innings: Innings = updatedData[inningsKey];

  // --- 1. Finalize Over Counts ---
  // Ensure the overs count is a whole number.
  innings.overs = Math.ceil(innings.overs);
  // Reset the ball count for the next over.
  innings.ballsInOver = 0;

  // --- 2. Rotate Strike ---
  // At the end of every over, the batsmen swap ends.
  [updatedData.onStrikeBatsmanId, updatedData.nonStrikeBatsmanId] = 
    [updatedData.nonStrikeBatsmanId, updatedData.onStrikeBatsmanId];

  // --- 3. Update Bowler Information ---
  // The current bowler becomes the "previous" bowler to prevent them from
  // bowling the next over. The UI will then prompt for a new bowler.
  updatedData.previousBowlerId = updatedData.currentBowlerId;
  updatedData.currentBowlerId = null;

  return updatedData;
};
