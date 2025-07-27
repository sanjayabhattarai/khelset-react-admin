import { MatchData, Bowler } from '../types';
// import { Batsman } from '../types'; // Removed because 'Batsman' is not exported
type Batsman = {
  id: string;
  runs: number;
  // Add other properties as needed
};

// Helper to find the best batsman across both innings
const findBestBatsman = (innings1Stats: Batsman[], innings2Stats: Batsman[]): Batsman | null => {
  const allBattingStats = [...innings1Stats, ...innings2Stats];
  if (allBattingStats.length === 0) return null;

  return allBattingStats.reduce((best, current) => {
    return current.runs > best.runs ? current : best;
  });
};

// Helper to find the best bowler across both innings
const findTopWicketTaker = (innings1Stats: Bowler[], innings2Stats: Bowler[]): Bowler | null => {
  const allBowlingStats = [...innings1Stats, ...innings2Stats];
  if (allBowlingStats.length === 0) return null;
  
  return allBowlingStats.reduce((best, current) => {
    if (current.wickets > best.wickets) {
      return current;
    }
    // If wickets are equal, the one with fewer runs conceded is better
    if (current.wickets === best.wickets && current.runs < best.runs) {
      return current;
    }
    return best;
  });
};

// Helper to find the most economical bowler (must have bowled at least 1 over)
const findMostEconomicalBowler = (innings1Stats: Bowler[], innings2Stats: Bowler[]): Bowler | null => {
  const allBowlingStats = [...innings1Stats, ...innings2Stats]
    .filter(b => b.overs >= 1); // Only consider bowlers who have bowled at least 1 over

  if (allBowlingStats.length === 0) return null;

  return allBowlingStats.reduce((best, current) => {
    const bestEconomy = best.runs / best.overs;
    const currentEconomy = current.runs / current.overs;
    return currentEconomy < bestEconomy ? current : best;
  });
};


export const calculateMatchAwards = (matchData: MatchData) => {
  const { innings1, innings2 } = matchData;
  const battingStats1 = innings1?.battingStats || [];
  const bowlingStats1 = innings1?.bowlingStats || [];
  const battingStats2 = innings2?.battingStats || [];
  const bowlingStats2 = innings2?.bowlingStats || [];

  const bestBatsman = findBestBatsman(battingStats1, battingStats2);
  const topWicketTaker = findTopWicketTaker(bowlingStats1, bowlingStats2);
  const mostEconomical = findMostEconomicalBowler(bowlingStats1, bowlingStats2);

  return {
    bestBatsmanId: bestBatsman?.id || null,
    topWicketTakerId: topWicketTaker?.id || null,
    mostEconomicalBowlerId: mostEconomical?.id || null,
  };
};