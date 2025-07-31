// src/features/scoring/cricket/components/MatchHeader.tsx
// This is a professionally redesigned version of your Match Header.
// It uses Tailwind CSS for a clean, modern, dark-themed layout.

import { Innings, BattingStat, Bowler } from '../types';

interface MatchHeaderProps {
  currentInningsData: Innings;
  onStrikeBatsman: BattingStat | undefined;
  nonStrikeBatsman: BattingStat | undefined;
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
  
  // A helper component for displaying a player's stats in a consistent way.
  const PlayerStat = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div>
      <span className="text-sm text-gray-600">{label}</span>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="bg-white bg-opacity-95 p-4 rounded-lg shadow-lg border border-gray-300 space-y-4">
      
      {/* --- Main Score Display --- */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-900">{currentInningsData.battingTeamName}</h2>
          <p className="text-gray-600">Batting</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-black">
            {currentInningsData.score} / {currentInningsData.wickets}
          </p>
          <p className="text-gray-600">Overs: {currentInningsData.overs.toFixed(1)}</p>
        </div>
      </div>

      {isFreeHit && (
        <div className="bg-yellow-500 text-gray-900 text-center font-bold p-2 rounded-md animate-pulse">
          FREE HIT
        </div>
      )}

      <hr className="border-gray-600" />

      {/* --- Current Players Display --- */}
      <div className="space-y-3">
        {/* Batsmen */}
        <div className="flex justify-between items-center">
          <PlayerStat 
            label="On Strike" 
            value={`${onStrikeBatsman?.name || 'N/A'}*`} 
          />
          <PlayerStat 
            label="Runs (Balls)" 
            value={`${onStrikeBatsman?.runs || 0} (${onStrikeBatsman?.balls || 0})`} 
          />
        </div>
        <div className="flex justify-between items-center">
          <PlayerStat 
            label="Non-Striker" 
            value={nonStrikeBatsman?.name || 'N/A'} 
          />
          <PlayerStat 
            label="Runs (Balls)" 
            value={`${nonStrikeBatsman?.runs || 0} (${nonStrikeBatsman?.balls || 0})`} 
          />
        </div>
        
        <hr className="border-gray-700" />

        {/* Bowler */}
        <div className="flex justify-between items-center">
           <PlayerStat 
            label="Current Bowler" 
            value={currentBowler?.name || 'N/A'} 
          />
          <PlayerStat 
            label="O-R-W" 
            value={`${currentBowler?.overs.toFixed(1) || 0} - ${currentBowler?.runs || 0} - ${currentBowler?.wickets || 0}`} 
          />
        </div>
      </div>
    </div>
  );
}
