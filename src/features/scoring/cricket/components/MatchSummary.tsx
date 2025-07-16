// src/features/scoring/cricket/components/MatchSummary.tsx
// This component is displayed when the match is completed.
// It shows the final result and a summary of both innings.

import { MatchData } from '../types';

// Define the props this component will receive.
interface MatchSummaryProps {
  matchData: MatchData;
}

/**
 * A helper component to display the summary of a single innings.
 */
const InningsSummary = ({ innings, teamName }: { innings: any, teamName: string }) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <p className="text-lg font-semibold">
      {teamName}:{' '}
      <span className="font-bold text-green-400">
        {innings.score} / {innings.wickets}
      </span>
      <span className="text-sm text-gray-400"> ({innings.overs.toFixed(1)} Overs)</span>
    </p>
  </div>
);

export function MatchSummary({ matchData }: MatchSummaryProps) {
  // Determine the winning team and the margin of victory.
  const innings1 = matchData.innings1;
  const innings2 = matchData.innings2;
  let resultMessage = "Match Tied"; // Default result

  if (innings1.score > innings2.score) {
    const margin = innings1.score - innings2.score;
    resultMessage = `${innings1.battingTeamName} won by ${margin} run(s)`;
  } else if (innings2.score > innings1.score) {
    const wicketsLeft = 10 - innings2.wickets;
    resultMessage = `${innings2.battingTeamName} won by ${wicketsLeft} wicket(s)`;
  }

  return (
    <div className="bg-green-900 bg-opacity-50 p-6 rounded-lg text-white text-center space-y-4">
      <h3 className="text-2xl font-bold">Match Completed</h3>
      
      <p className="text-xl font-bold text-yellow-400">{resultMessage}</p>

      <div className="space-y-3 pt-2">
        <InningsSummary innings={innings1} teamName={innings1.battingTeamName} />
        <InningsSummary innings={innings2} teamName={innings2.battingTeamName} />
      </div>

    </div>
  );
}
