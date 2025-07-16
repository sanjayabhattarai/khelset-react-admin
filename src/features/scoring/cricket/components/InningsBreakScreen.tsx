// src/features/scoring/cricket/components/InningsBreakScreen.tsx
// This component is displayed between the two innings of a match.

import { Innings } from '../types';

// Define the props this component will receive.
interface InningsBreakScreenProps {
  // The data for the first innings, which has just been completed.
  firstInningsData: Innings;
  // A callback function to start the second innings.
  onStartSecondInnings: () => void;
}

export function InningsBreakScreen({
  firstInningsData,
  onStartSecondInnings,
}: InningsBreakScreenProps) {
  // Calculate the target score for the team batting second.
  const targetScore = firstInningsData.score + 1;

  return (
    <div className="bg-blue-900 p-6 rounded-lg text-white text-center space-y-4">
      <h3 className="text-2xl font-bold">Innings Break</h3>
      
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-lg">
          {firstInningsData.battingTeamName} scored{' '}
          <span className="font-bold text-green-400">
            {firstInningsData.score} / {firstInningsData.wickets}
          </span>
        </p>
        <p className="text-xl font-bold mt-2">
          Target: {targetScore}
        </p>
      </div>

      <button
        onClick={onStartSecondInnings}
        className="w-full p-3 bg-green-600 rounded-md font-bold hover:bg-green-700"
      >
        Start 2nd Innings
      </button>
    </div>
  );
}
