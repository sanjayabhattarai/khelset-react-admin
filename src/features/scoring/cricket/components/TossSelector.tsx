// src/features/scoring/cricket/components/TossSelector.tsx
// This component provides the UI for the admin to input the result of the pre-match coin toss.

import { useState } from 'react';
import { MatchData } from '../types';

// Define the props this component will receive from its parent.
interface TossSelectorProps {
  matchData: MatchData;
  onTossComplete: (tossWinnerId: string, tossDecision: 'bat' | 'bowl') => void;
}

export function TossSelector({ matchData, onTossComplete }: TossSelectorProps) {
  // State to manage the user's selections within this component's form.
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This function is called when the admin submits the toss result.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation to ensure a team has been selected.
    if (!tossWinnerId) {
      alert("Please select the team that won the toss.");
      return;
    }
    setIsSubmitting(true);
    // Call the onTossComplete function passed down from the parent component
    // to update the match data in Firestore.
    onTossComplete(tossWinnerId, tossDecision);
  };

  // Note: We'll need to fetch team names in the parent component and pass them down.
  // For now, we'll use team IDs as placeholders.
  const teamAName = `Team A (${matchData.teamA_id.substring(0, 5)}...)`;
  const teamBName = `Team B (${matchData.teamB_id.substring(0, 5)}...)`;

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4 text-center">Match Toss</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown to select which team won the toss */}
        <div>
          <label className="block mb-1 font-semibold">Toss Won By:</label>
          <select 
            value={tossWinnerId} 
            onChange={e => setTossWinnerId(e.target.value)} 
            className="w-full mt-1 bg-gray-700 p-2 rounded"
          >
            <option value="">Select Team...</option>
            <option value={matchData.teamA_id}>{teamAName}</option>
            <option value={matchData.teamB_id}>{teamBName}</option>
          </select>
        </div>

        {/* Radio buttons to select the winner's decision */}
        <div>
          <label className="block mb-1 font-semibold">Decision:</label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                value="bat" 
                checked={tossDecision === 'bat'} 
                onChange={() => setTossDecision('bat')}
                className="mr-2 h-4 w-4"
              />
              Bat
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                value="bowl" 
                checked={tossDecision === 'bowl'} 
                onChange={() => setTossDecision('bowl')}
                className="mr-2 h-4 w-4"
              />
              Bowl
            </label>
          </div>
        </div>

        {/* Submit button to confirm the toss result */}
        <button 
          type="submit" 
          disabled={isSubmitting || !tossWinnerId} 
          className="w-full p-3 bg-green-600 rounded-md font-bold hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Confirm Toss & Proceed"}
        </button>
      </form>
    </div>
  );
}
