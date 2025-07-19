// src/features/scoring/cricket/logic/scoringUtils.ts
// This file has been updated with a more robust and accurate implementation
// of the core cricket scoring rules.

import { MatchData, Innings } from '../types';

export interface DeliveryParams {
  runs: number;
  isLegal: boolean;
  isWicket?: boolean;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye';
}

/**
 * A helper function to format the overs display correctly (e.g., 4.5, 5.0).
 * @param balls The total number of legal balls bowled in the innings.
 * @returns A number representing the overs in the format X.Y.
 */
const calculateOversDisplay = (balls: number): number => {
  const completedOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return parseFloat(`${completedOvers}.${remainingBalls}`);
};

export const processDelivery = (
  currentMatchData: MatchData,
  params: DeliveryParams
) => {
  const { runs, isLegal, isWicket = false, extraType } = params;

  const updatedData = JSON.parse(JSON.stringify(currentMatchData));
  const inningsKey = `innings${updatedData.currentInnings}` as const;
  const innings: Innings = updatedData[inningsKey];
  const rules = updatedData.rules;

  const battingStats = Array.isArray(innings.battingStats) ? innings.battingStats : [];
  const bowlingStats = Array.isArray(innings.bowlingStats) ? innings.bowlingStats : [];

  const onStrikeBatsman = battingStats.find(p => p.id === updatedData.onStrikeBatsmanId);
  const currentBowler = bowlingStats.find(b => b.id === updatedData.currentBowlerId);

  if (!onStrikeBatsman || !currentBowler) {
    console.error("Scoring logic error: Active batsman or bowler not found in stats.");
    return { updatedData: currentMatchData, isOverComplete: false, isWicketFallen: false, isInningsOver: false };
  }

  // --- 1. Update Scores and Extras ---
  const extraRuns = (extraType === 'wide' || extraType === 'no_ball') ? 1 : 0;
  innings.score += runs + extraRuns;
  currentBowler.runs += runs + extraRuns;

  // --- 2. Update Batsman Stats ---
  if (extraType !== 'wide') onStrikeBatsman.balls += 1;
  if (isLegal && !extraType) onStrikeBatsman.runs += runs;

  // --- 3. Handle Strike Rotation ---
  if (isLegal && runs % 2 === 1) {
    [updatedData.onStrikeBatsmanId, updatedData.nonStrikeBatsmanId] = 
      [updatedData.nonStrikeBatsmanId, updatedData.onStrikeBatsmanId];
  }

  // --- 4. Handle Over Progression ---
  let isOverComplete = false;
  if (isLegal) {
    innings.ballsInOver += 1;
    
    // ✨ FIX: A more robust way to calculate overs to avoid floating point errors.
    // We calculate the display value based on the number of balls in the over.
    const totalBallsInInnings = (Math.floor(innings.overs) * 6) + innings.ballsInOver;
    innings.overs = calculateOversDisplay(totalBallsInInnings);
    
    const totalBallsForBowler = (Math.floor(currentBowler.overs) * 6) + innings.ballsInOver;
    currentBowler.overs = calculateOversDisplay(totalBallsForBowler);

    if (innings.ballsInOver >= 6) {
      isOverComplete = true;
    }
  }

  // --- 5. Handle Wickets ---
  let isWicketFallen = false;
  if (isWicket && !updatedData.isFreeHit) {
    isWicketFallen = true;
    // ✨ FIX: The wicket count for the innings is now correctly incremented here.
    innings.wickets += 1;
  }

  // --- 6. Handle Free Hit ---
  updatedData.isFreeHit = (extraType === 'no_ball');

  // --- 7. Complete End of Innings Logic ---
  let isInningsOver = false;
  
  // Condition 1: All wickets have fallen.
  // We check the new wicket count against the number of players rule.
  if (innings.wickets >= (rules.playersPerTeam - 1)) {
    isInningsOver = true;
  }
  
  // Condition 2: All overs have been bowled.
  // ✨ FIX: This now correctly checks the final overs count.
  if (isOverComplete && innings.overs >= rules.totalOvers) {
      isInningsOver = true;
  }

  // Condition 3: Target score has been chased in the second innings.
  if (updatedData.currentInnings === 2) {
      const targetScore = (updatedData.innings1.score || 0) + 1;
      if (innings.score >= targetScore) {
          isInningsOver = true;
      }
  }
  
  // Update the original innings object with the modified stats.
  updatedData[inningsKey].battingStats = battingStats;
  updatedData[inningsKey].bowlingStats = bowlingStats;

  return { updatedData, isOverComplete, isWicketFallen, isInningsOver };
};
