import { MatchData } from '../types';

// Define the props this component expects
interface MatchSummaryProps {
  matchData: MatchData;
  teamAName: string;
  teamBName: string;
}

export function MatchSummary({ matchData, teamAName, teamBName }: MatchSummaryProps) {
  
  // This logic determines the winner and the margin of victory.
  const getResult = () => {
    const { innings1, innings2, teamA_id } = matchData;

    if (!innings1 || !innings2) {
      return { winnerName: "TBD", margin: "Match Incomplete" };
    }
    
    const score1 = innings1.score || 0;
    const score2 = innings2.score || 0;
    
    let winnerId: string | null = null;
    let margin: string = "";

    if (score2 > score1) {
      // Team batting second won
      winnerId = innings2.battingTeamId;
      const wicketsInHand = (matchData.rules.playersPerTeam - 1) - (innings2.wickets || 0);
      margin = `${wicketsInHand} wicket${wicketsInHand !== 1 ? 's' : ''}`;
    } else if (score1 > score2) {
      // Team batting first won
      winnerId = innings1.battingTeamId;
      const runDifference = score1 - score2;
      margin = `${runDifference} run${runDifference !== 1 ? 's' : ''}`;
    } else {
      // Scores are tied
      return { winnerName: "Match Tied", margin: "" };
    }

    // Now, use the team names passed in via props to find the winner's name
    const winnerName = winnerId === teamA_id ? teamAName : teamBName;
    
    return { winnerName, margin };
  };

  const { winnerName, margin } = getResult();

  return (
    <div className="text-center bg-gray-800 p-8 rounded-lg shadow-xl animate-fade-in">
      <h2 className="text-3xl font-bold text-green-400 mb-2">Match Finished</h2>
      <p className="text-xl text-white">
        {winnerName}
        {margin && <span className="font-bold"> won by {margin}</span>}
      </p>
      
      {/* You can add more summary details here if you like */}
      <div className="mt-6 flex justify-around text-lg">
        <div className="p-4 bg-gray-700 rounded-md">
          <p className="text-gray-400 font-semibold">{teamAName}</p>
          <p className="text-2xl font-bold">{matchData.innings1.battingTeamId === matchData.teamA_id ? matchData.innings1.score : matchData.innings2.score}/{matchData.innings1.battingTeamId === matchData.teamA_id ? matchData.innings1.wickets : matchData.innings2.wickets}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-md">
          <p className="text-gray-400 font-semibold">{teamBName}</p>
          <p className="text-2xl font-bold">{matchData.innings1.battingTeamId === matchData.teamB_id ? matchData.innings1.score : matchData.innings2.score}/{matchData.innings1.battingTeamId === matchData.teamB_id ? matchData.innings1.wickets : matchData.innings2.wickets}</p>
        </div>
      </div>
    </div>
  );
}