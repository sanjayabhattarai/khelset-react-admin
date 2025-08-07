// src/features/scoring/cricket/logic/enhancedScoringUtils.ts
// Enhanced scoring logic to properly handle wides and no-balls with runs, wickets, and strike changes

import { MatchData, Innings, ExtraType, WicketType } from '../types';

export interface EnhancedDeliveryParams {
  runs: number;
  isLegal: boolean;
  isWicket?: boolean;
  extraType?: ExtraType;
  wicketType?: WicketType;
  runType?: 'hit' | 'bye' | 'leg_bye'; // New field to specify how runs were scored on no-ball
}

/**
 * Enhanced delivery processing that properly handles:
 * 1. Wide/no-ball penalty runs + additional runs by batsmen
 * 2. Strike rotation based on runs completed by batsmen
 * 3. Proper run attribution between batsman and extras
 * 4. Wicket handling with correct ball counting
 */
export const processEnhancedDelivery = (
  currentMatchData: MatchData,
  params: EnhancedDeliveryParams
) => {
  const { runs, isLegal, isWicket = false, extraType, wicketType, runType = 'hit' } = params;

  const updatedData = JSON.parse(JSON.stringify(currentMatchData));
  const inningsKey = `innings${updatedData.currentInnings}` as const;
  const innings: Innings = updatedData[inningsKey];
  const rules = updatedData.rules;

  const battingStats = Array.isArray(innings.battingStats) ? innings.battingStats : [];
  const bowlingStats = Array.isArray(innings.bowlingStats) ? innings.bowlingStats : [];

  const onStrikeBatsman = battingStats.find(p => p.id === updatedData.onStrikeBatsmanId);
  const currentBowler = bowlingStats.find(b => b.id === updatedData.currentBowlerId);

  if (!onStrikeBatsman || !currentBowler) {
    console.error("Enhanced scoring logic error: Active batsman or bowler not found in stats.");
    return { updatedData: currentMatchData, isOverComplete: false, isWicketFallen: false, isInningsOver: false };
  }

  // --- 1. Calculate Run Distribution ---
  let penaltyRuns = 0;      // Runs given as penalty (wide/no-ball = 1, bye/leg-bye = 0)
  let batsmanRuns = 0;      // Runs credited to batsman
  let extraRuns = 0;        // Runs credited as extras
  let totalRuns = 0;        // Total runs added to team score

  if (extraType === 'wide') {
    // Wide: 1 penalty + runs taken by batsmen, all go to extras
    // FIXED: Only penalty run (1) goes to bowler's account, additional runs don't count against bowler
    penaltyRuns = 1;
    extraRuns = penaltyRuns + runs;
    batsmanRuns = 0; // Batsman never gets credit on wide
    totalRuns = penaltyRuns + runs;
  } else if (extraType === 'no_ball') {
    // No-ball: Complex logic based on how runs were scored
    penaltyRuns = 1;
    
    if (runType === 'hit') {
      // Batsman hit the ball: penalty to extras, runs to batsman
      batsmanRuns = runs;
      extraRuns = penaltyRuns;
      totalRuns = penaltyRuns + runs;
    } else if (runType === 'bye' || runType === 'leg_bye') {
      // Bye/leg-bye on no-ball: penalty + runs to extras, nothing to batsman
      batsmanRuns = 0;
      extraRuns = penaltyRuns + runs;
      totalRuns = penaltyRuns + runs;
    } else {
      // Default case (backward compatibility)
      batsmanRuns = 0;
      extraRuns = penaltyRuns + runs;
      totalRuns = penaltyRuns + runs;
    }
  } else if (extraType === 'bye' || extraType === 'leg_bye') {
    // Bye/Leg-bye: All runs go to extras, batsman gets no credit
    extraRuns = runs;
    batsmanRuns = 0;
    totalRuns = runs;
  } else {
    // Normal delivery: All runs go to batsman
    batsmanRuns = runs;
    extraRuns = 0;
    totalRuns = runs;
  }

  // --- 2. Update Team Score and Bowler Stats ---
  innings.score += totalRuns;
  
  // CRITICAL FIX: Bowler accounting rules per cricket regulations
  if (extraType === 'wide') {
    // Wide: Only penalty run (1) counts against bowler
    currentBowler.runs += penaltyRuns; // Only 1 penalty run
  } else if (extraType === 'no_ball') {
    // No-ball: Only penalty + batsman hits count against bowler
    // Byes and leg-byes on no-ball do NOT count against bowler
    if (runType === 'hit') {
      currentBowler.runs += totalRuns; // Penalty + runs hit by batsman
    } else {
      currentBowler.runs += penaltyRuns; // Only penalty (1), not the byes/leg-byes
    }
  } else if (extraType === 'bye' || extraType === 'leg_bye') {
    // Byes and leg-byes: No runs charged to bowler (fielding/wicket-keeper error)
    // Bowler gets no additional runs charged
  } else {
    // Normal delivery: All runs charged to bowler
    currentBowler.runs += totalRuns;
  }

  // --- 3. Update Batsman Stats ---
  // Ball counting rules:
  // - Wide: Batsman doesn't face the ball (no ball count)
  // - No-ball: Batsman faces ball but it doesn't count towards balls faced
  // - Bye/Leg-bye: Legal delivery, counts as ball faced
  // - Normal: Legal delivery, counts as ball faced
  if (extraType !== 'wide' && extraType !== 'no_ball') {
    onStrikeBatsman.balls += 1;
  }

  // Credit runs to batsman
  if (batsmanRuns > 0) {
    onStrikeBatsman.runs += batsmanRuns;
    
    // Count boundaries (only if batsman actually hit it)
    if (batsmanRuns === 4) onStrikeBatsman.fours += 1;
    if (batsmanRuns === 6) onStrikeBatsman.sixes += 1;
  }

  // --- 4. Handle Strike Rotation ---
  // CRITICAL FIX: Strike changes based on runs physically completed by batsmen
  // For normal deliveries: use batsmanRuns (runs credited to batsman)
  // For extras (wide/bye/leg-bye): use 'runs' parameter (runs physically taken by batsmen)
  // For no-ball with hits: use batsmanRuns (runs credited to batsman)
  // For no-ball with byes/leg-byes: use 'runs' parameter (runs physically taken)
  
  let runsForStrikeChange = 0;
  if (extraType === 'wide' || extraType === 'bye' || extraType === 'leg_bye') {
    // For these extras, batsmen physically run the 'runs' amount
    runsForStrikeChange = runs;
  } else if (extraType === 'no_ball' && (runType === 'bye' || runType === 'leg_bye')) {
    // For no-ball byes/leg-byes, batsmen physically run the 'runs' amount
    runsForStrikeChange = runs;
  } else {
    // For normal deliveries and no-ball hits, use runs credited to batsman
    runsForStrikeChange = batsmanRuns;
  }
  
  if (runsForStrikeChange > 0 && runsForStrikeChange % 2 === 1) {
    [updatedData.onStrikeBatsmanId, updatedData.nonStrikeBatsmanId] = 
      [updatedData.nonStrikeBatsmanId, updatedData.onStrikeBatsmanId];
  }

  // --- 5. Handle Over Progression ---
  let isOverComplete = false;
  
  // Only legal deliveries count towards over completion
  // Wide and no-ball must be re-bowled
  if (isLegal && extraType !== 'wide' && extraType !== 'no_ball') {
    innings.ballsInOver += 1;
    
    // Calculate overs display
    const totalBallsInInnings = (Math.floor(innings.overs) * 6) + innings.ballsInOver;
    innings.overs = calculateOversDisplay(totalBallsInInnings);
    
    const totalBallsForBowler = (Math.floor(currentBowler.overs) * 6) + innings.ballsInOver;
    currentBowler.overs = calculateOversDisplay(totalBallsForBowler);

    if (innings.ballsInOver >= 6) {
      isOverComplete = true;
    }
  }

  // --- 6. Handle Wickets ---
  let isWicketFallen = false;
  if (isWicket) {
    // Check if wicket is valid (free hit rule)
    const isWicketValid = !updatedData.isFreeHit || 
                         wicketType === 'run_out' || 
                         wicketType === 'stumped';
    
    if (isWicketValid) {
      isWicketFallen = true;
      innings.wickets += 1;
      
      // Credit wicket to bowler (except for run out)
      if (wicketType !== 'run_out') {
        currentBowler.wickets += 1;
      }
    }
  }

  // --- 7. Handle Free Hit ---
  // FIXED: Free hit applies after no-ball regardless of whether wicket fell
  // (because on no-ball, only run-out and stumped are valid dismissals)
  updatedData.isFreeHit = (extraType === 'no_ball');

  // --- 8. Check End of Innings Conditions ---
  let isInningsOver = false;
  
  // All wickets fallen
  if (innings.wickets >= (rules.playersPerTeam - 1)) {
    isInningsOver = true;
  }
  
  // All overs completed - FIXED: Use completed overs count instead of decimal overs
  if (isOverComplete) {
    const completedOvers = Math.ceil(innings.overs); // Round up to get completed overs count
    if (completedOvers >= rules.totalOvers) {
      isInningsOver = true;
    }
  }

  // Target chased in second innings
  if (updatedData.currentInnings === 2) {
    const targetScore = (updatedData.innings1.score || 0) + 1;
    if (innings.score >= targetScore) {
      isInningsOver = true;
    }
  }
  
  // Update the innings data
  updatedData[inningsKey].battingStats = battingStats;
  updatedData[inningsKey].bowlingStats = bowlingStats;

  return { 
    updatedData, 
    isOverComplete, 
    isWicketFallen, 
    isInningsOver,
    runsBreakdown: {
      totalRuns,
      batsmanRuns,
      extraRuns,
      penaltyRuns
    }
  };
};

/**
 * Helper function to format overs display correctly (e.g., 4.5, 5.0).
 */
const calculateOversDisplay = (balls: number): number => {
  const completedOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return parseFloat(`${completedOvers}.${remainingBalls}`);
};
