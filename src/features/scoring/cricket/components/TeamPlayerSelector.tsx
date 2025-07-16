// src/features/scoring/cricket/components/TeamPlayerSelector.tsx
// This component provides the UI for selecting the two opening batsmen and the opening bowler.

import { useState, useMemo } from 'react';
import { MatchData, Player } from '../types';

// Define the props this component will receive from its parent.
interface TeamPlayerSelectorProps {
  matchData: MatchData;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  onSelectionComplete: (selection: {
    onStrikeBatsmanId: string;
    nonStrikeBatsmanId: string;
    currentBowlerId: string;
  }) => void;
}

export function TeamPlayerSelector({
  matchData,
  teamAPlayers,
  teamBPlayers,
  onSelectionComplete,
}: TeamPlayerSelectorProps) {
  // State to manage the selections within this component.
  const [onStrikeBatsmanId, setOnStrikeBatsmanId] = useState('');
  const [nonStrikeBatsmanId, setNonStrikeBatsmanId] = useState('');
  const [currentBowlerId, setCurrentBowlerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // `useMemo` is a performance optimization. This logic only re-runs when its dependencies change.
  const { battingTeamPlayers, bowlingTeamPlayers } = useMemo(() => {
    // Determine which team is batting and which is bowling based on the toss result.
    const innings = matchData.currentInnings === 1 ? matchData.innings1 : matchData.innings2;
    const battingTeam = matchData.teamA_id === innings.battingTeamId ? teamAPlayers : teamBPlayers;
    const bowlingTeam = matchData.teamA_id === innings.bowlingTeamId ? teamAPlayers : teamBPlayers;
    return { battingTeamPlayers: battingTeam, bowlingTeamPlayers: bowlingTeam };
  }, [matchData, teamAPlayers, teamBPlayers]);

  // This function is called when the admin confirms the selections.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate that two different batsmen and a bowler have been selected.
    if (!onStrikeBatsmanId || !nonStrikeBatsmanId || !currentBowlerId) {
      alert("Please select two batsmen and a bowler.");
      return;
    }
    if (onStrikeBatsmanId === nonStrikeBatsmanId) {
      alert("The on-strike and non-strike batsmen must be different players.");
      return;
    }
    setIsSubmitting(true);
    // Call the function passed from the parent to update the match state.
    onSelectionComplete({
      onStrikeBatsmanId,
      nonStrikeBatsmanId,
      currentBowlerId,
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4 text-center">Select Opening Players</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown for the on-strike batsman */}
        <div>
          <label className="block mb-1 font-semibold">On-Strike Batsman:</label>
          <select
            value={onStrikeBatsmanId}
            onChange={(e) => setOnStrikeBatsmanId(e.target.value)}
            className="w-full mt-1 bg-gray-700 p-2 rounded"
          >
            <option value="">Select Batsman...</option>
            {battingTeamPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Dropdown for the non-strike batsman */}
        <div>
          <label className="block mb-1 font-semibold">Non-Strike Batsman:</label>
          <select
            value={nonStrikeBatsmanId}
            onChange={(e) => setNonStrikeBatsmanId(e.target.value)}
            className="w-full mt-1 bg-gray-700 p-2 rounded"
          >
            <option value="">Select Batsman...</option>
            {battingTeamPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Dropdown for the opening bowler */}
        <div>
          <label className="block mb-1 font-semibold">Opening Bowler:</label>
          <select
            value={currentBowlerId}
            onChange={(e) => setCurrentBowlerId(e.target.value)}
            className="w-full mt-1 bg-gray-700 p-2 rounded"
          >
            <option value="">Select Bowler...</option>
            {bowlingTeamPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-3 bg-green-600 rounded-md font-bold hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Starting Match..." : "Start Scoring"}
        </button>
      </form>
    </div>
  );
}
