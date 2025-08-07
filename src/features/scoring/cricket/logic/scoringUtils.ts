// src/features/scoring/cricket/logic/scoringUtils.ts
// This file has been updated with a more robust and accurate implementation
// of the core cricket scoring rules.

import { MatchData, Innings } from '../types';

export interface DeliveryParams {
  runs: number; // Additional runs scored by batsmen (for extras, this is runs beyond the penalty)
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
  // Calculate penalty runs (1 for wide/no-ball, 0 for bye/leg-bye)
  const penaltyRuns = (extraType === 'wide' || extraType === 'no_ball') ? 1 : 0;
  
  // Total runs = penalty + runs taken by batsmen
  const totalRuns = penaltyRuns + runs;
  
  // Update team score and bowler's runs conceded
  innings.score += totalRuns;
  currentBowler.runs += totalRuns;

  // --- 2. Update Batsman Stats ---
  // For wides, batsman doesn't face the ball (no ball count increment)
  // For no-balls, batsman faces the ball but it doesn't count towards balls faced
  // For byes/leg-byes, it's a legal delivery so batsman faces it
  if (extraType !== 'wide') {
    onStrikeBatsman.balls += 1;
  }
  
  // Batsman gets credit for runs only if they actually hit/ran for them
  // For byes/leg-byes: batsman doesn't get runs (they're extras)
  // For wides: batsman doesn't get runs (they're extras) 
  // For no-balls: batsman gets runs if they hit it
  if (extraType === 'no_ball' || (!extraType && isLegal)) {
    onStrikeBatsman.runs += runs;
    
    // Count boundaries for batsman stats
    if (runs === 4) onStrikeBatsman.fours += 1;
    if (runs === 6) onStrikeBatsman.sixes += 1;
  }

  // --- 3. Handle Strike Rotation ---
  // Strike changes when batsmen run odd number of runs
  // This applies to all extras where batsmen can run (wide, no-ball, bye, leg-bye)
  if (runs > 0 && runs % 2 === 1) {
    [updatedData.onStrikeBatsmanId, updatedData.nonStrikeBatsmanId] = 
      [updatedData.nonStrikeBatsmanId, updatedData.onStrikeBatsmanId];
  }

  // --- 4. Handle Over Progression ---
  let isOverComplete = false;
  
  // Only legal deliveries count towards over completion
  // Wides and no-balls don't count, must be re-bowled
  if (isLegal || extraType === 'bye' || extraType === 'leg_bye') {
    innings.ballsInOver += 1;
    
    // ✨ FIX: A more robust way to calculate overs to avoid floating point errors.
    // We calculate the display value based on the number of balls in the over.
    const totalBallsInInnings = (Math.floor(innings.overs) * 6) + innings.ballsInOver;
    innings.overs = calculateOversDisplay(totalBallsInInnings);
    
    const totalBallsForBowler = (Math.floor(currentBowler.overs) * 6) + innings.ballsInOver;
    currentBowler.overs = calculateOversDisplay(totalBallsForBowler);

    if (innings.ballsInOver >= 6) {
      isOverComplete = true;
      innings.ballsInOver = 0; // Reset for next over
    }
  }

  // --- 5. Handle Wickets ---
  let isWicketFallen = false;
  if (isWicket && !updatedData.isFreeHit) {
    isWicketFallen = true;
    // ✨ FIX: The wicket count for the innings is now correctly incremented here.
    innings.wickets += 1;
    
    // Update bowler's wicket count (bowler gets credit except for run-outs)
    // For wides: only run-out possible (bowler doesn't get wicket)
    // For no-balls: run-out or stumped possible (bowler doesn't get wicket)
    // For normal deliveries: bowler gets wicket credit
    if (extraType !== 'wide' && extraType !== 'no_ball') {
      currentBowler.wickets += 1;
    }
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
