// src/features/scoring/cricket/components/MatchHeader.tsx
// This is a presentational component responsible for displaying the main match scoreboard.
// It receives all the necessary data as props and does not contain any logic itself.

import { Innings, Batsman, Bowler } from '../types';

// Define the props this component will receive from its parent.
interface MatchHeaderProps {
  currentInningsData: Innings | null;
  onStrikeBatsman: Batsman | undefined;
  nonStrikeBatsman: Batsman | undefined;
  currentBowler: Bowler | undefined;
  isFreeHit: boolean;
}

export function MatchHeader({
  currentInningsData,
  onStrikeBatsman,
  nonStrikeBatsman,
  currentBowler,
  isFreeHit,
}: MatchHeaderProps) {

  // If there's no innings data yet, show a placeholder.
  if (!currentInningsData) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
        Waiting for match to start...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Display a prominent "FREE HIT" indicator when active */}
      {isFreeHit && (
        <div className="text-center font-bold text-lg bg-green-500 p-2 rounded-md animate-pulse">
          FREE HIT
        </div>
      )}

      {/* Main score display */}
      <div className="text-center bg-gray-800 p-4 rounded-lg">
        <p className="text-lg font-semibold text-green-400">
          {currentInningsData.battingTeamName || 'Batting Team'}
        </p>
        <p className="text-5xl font-bold my-2">
          {currentInningsData.score} / {currentInningsData.wickets}
        </p>
        <p className="text-gray-400">
          Overs: {currentInningsData.overs.toFixed(1)}
        </p>
      </div>

      {/* Display for current batsmen and bowler */}
      <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
        {/* On-strike batsman's details */}
        <p>
          <span className="font-bold">{onStrikeBatsman?.name || 'N/A'}*</span>: {onStrikeBatsman?.runs ?? 0} ({onStrikeBatsman?.balls ?? 0})
        </p>
        {/* Non-strike batsman's details */}
        <p>
          <span className="font-bold">{nonStrikeBatsman?.name || 'N/A'}</span>: {nonStrikeBatsman?.runs ?? 0} ({nonStrikeBatsman?.balls ?? 0})
        </p>
        <hr className="border-gray-600 my-2" />
        {/* Current bowler's details */}
        <p>
          <span className="font-bold">Bowler: {currentBowler?.name || 'N/A'}</span> - {currentBowler?.overs.toFixed(1) ?? 0} overs, {currentBowler?.runs ?? 0} runs, {currentBowler?.wickets ?? 0} wickets
        </p>
      </div>
    </div>
  );
}
