// src/features/scoring/cricket/logic/scoringUtils.ts
// This file contains the core "pure" logic for processing a delivery in a cricket match.
// It has been updated to correctly calculate the bowler's overs.

import { MatchData, Innings } from '../types';

/**
 * Represents the details of a single delivery action.
 */
export interface DeliveryParams {
  runs: number;
  isLegal: boolean;
  isWicket?: boolean;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye';
}

/**
 * Processes a single delivery and calculates the new state of the match.
 * @param currentMatchData The current state of the match, including the custom rules.
 * @param params The details of the delivery that just occurred.
 * @returns An object containing the updated match data and flags indicating the match state.
 */
export const processDelivery = (
  currentMatchData: MatchData,
  params: DeliveryParams
) => {
  const { runs, isLegal, isWicket = false, extraType } = params;

  // Create a deep copy to avoid mutating the original state directly.
  const updatedData = JSON.parse(JSON.stringify(currentMatchData));
  const inningsKey = `innings${updatedData.currentInnings}` as const;
  const innings: Innings = updatedData[inningsKey];
  const rules = updatedData.rules; // Get the custom rules for this match.

  const onStrikeBatsman = innings.battingStats.find(p => p.id === updatedData.onStrikeBatsmanId);
  const currentBowler = innings.bowlingStats.find(b => b.id === updatedData.currentBowlerId);

  if (!onStrikeBatsman || !currentBowler) {
    console.error("Scoring logic error: Active batsman or bowler not found in stats.");
    return { updatedData: currentMatchData, isOverComplete: false, isWicketFallen: false, isInningsOver: false };
  }

  // --- 1. Update Scores and Extras ---
  const extraRuns = (extraType === 'wide' || extraType === 'no_ball') ? 1 : 0;
  innings.score += runs + extraRuns;
  currentBowler.runs += runs + extraRuns;

  // --- 2. Update Batsman Stats ---
  if (extraType !== 'wide') {
    onStrikeBatsman.balls += 1;
  }
  if (isLegal && !extraType) {
    onStrikeBatsman.runs += runs;
  }

  // --- 3. Handle Strike Rotation ---
  if (isLegal && runs % 2 === 1) {
    [updatedData.onStrikeBatsmanId, updatedData.nonStrikeBatsmanId] = 
      [updatedData.nonStrikeBatsmanId, updatedData.onStrikeBatsmanId];
  }

  // --- 4. Handle Over Progression ---
  let isOverComplete = false;
  if (isLegal) {
    innings.ballsInOver += 1;
    
    // ✨ FIX: Correctly update both the innings and the bowler's overs count for each ball.
    const bowlerOversInteger = Math.floor(currentBowler.overs);
    const inningsOversInteger = Math.floor(innings.overs);
    
    // Update the overs display for each ball (e.g., 4.1, 4.2).
    innings.overs = parseFloat(`${inningsOversInteger}.${innings.ballsInOver}`);
    currentBowler.overs = parseFloat(`${bowlerOversInteger}.${innings.ballsInOver}`);

    // Check if the over is complete (6 legal balls).
    if (innings.ballsInOver >= 6) {
      isOverComplete = true;
      innings.ballsInOver = 0;
      // Round up to the next whole number at the end of the over.
      innings.overs = inningsOversInteger + 1;
      currentBowler.overs = bowlerOversInteger + 1;
      
      // At the end of an over, the strike always rotates.
      [updatedData.onStrikeBatsmanId, updatedData.nonStrikeBatsmanId] = 
        [updatedData.nonStrikeBatsmanId, updatedData.onStrikeBatsmanId];
    }
  }

  // --- 5. Handle Wickets ---
  let isWicketFallen = false;
  if (isWicket && extraType !== 'no_ball' && !updatedData.isFreeHit) {
    isWicketFallen = true;
  }

  // --- 6. Handle Free Hit ---
  updatedData.isFreeHit = (extraType === 'no_ball');

  // --- 7. Check for End of Innings ---
  let isInningsOver = false;
  if (isWicketFallen && (innings.wickets + 1) >= (rules.playersPerTeam - 1)) {
    isInningsOver = true;
  }
  if (isOverComplete && (Math.floor(innings.overs)) >= rules.totalOvers) {
      isInningsOver = true;
  }

  // Return the new state and flags for the UI to act upon.
  return { updatedData, isOverComplete, isWicketFallen, isInningsOver };
};
