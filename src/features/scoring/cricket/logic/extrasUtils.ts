// src/features/scoring/cricket/logic/extrasUtils.ts
// This file contains the "pure" logic for processing extras in a cricket match.

import { MatchData, Innings } from '../types';

/**
 * Represents the parameters for an extra delivery.
 */
export interface ExtrasParams {
  type: 'wide' | 'no_ball' | 'bye' | 'leg_bye';
  runs: number; // The number of additional runs taken (e.g., on a wide that goes to the boundary)
}

/**
 * Processes an extra delivery and updates the match state.
 * @param currentMatchData The current state of the match.
 * @param params The details of the extra.
 * @returns The updated match data.
 */
export const processExtra = (
  currentMatchData: MatchData,
  params: ExtrasParams
): MatchData => {
  const { type, runs } = params;

  // Create a deep copy to avoid direct state mutation.
  const updatedData = JSON.parse(JSON.stringify(currentMatchData));
  const inningsKey = `innings${updatedData.currentInnings}` as const;
  const innings: Innings = updatedData[inningsKey];
  const currentBowler = innings.bowlingStats.find(b => b.id === updatedData.currentBowlerId);

  if (!currentBowler) {
    console.error("Extras logic error: Active bowler not found.");
    return currentMatchData;
  }

  // --- 1. Calculate Runs ---
  // For wides and no-balls, there is always at least 1 extra run, plus any runs taken.
  const baseExtraRun = (type === 'wide' || type === 'no_ball') ? 1 : 0;
  const totalRunsFromExtra = baseExtraRun + runs;

  // --- 2. Update Innings and Bowler Score ---
  innings.score += totalRunsFromExtra;
  currentBowler.runs += totalRunsFromExtra;

  // --- 3. Handle Ball Legality and Over Progression ---
  // Wides and no-balls do not count as a legal delivery, so the ball must be re-bowled.
  const isLegalDelivery = (type === 'bye' || type === 'leg_bye');
  if (isLegalDelivery) {
    innings.ballsInOver += 1;
    // Note: The main `processDelivery` function will handle the end-of-over logic.
  }

  // --- 4. Handle Free Hit for No-Ball ---
  if (type === 'no_ball') {
    updatedData.isFreeHit = true;
  }

  return updatedData;
};
