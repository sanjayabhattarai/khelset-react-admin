// src/features/scoring/cricket/components/TossSelector.tsx

import { useState } from 'react';

/**
 * Defines the properties required by the TossSelector component.
 * It now accepts team names and IDs directly, making it more reusable.
 */
interface TossSelectorProps {
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  onTossComplete: (tossWinnerId: string, tossDecision: 'bat' | 'bowl') => void;
}

/**
 * A UI component for the admin to input the result of the pre-match coin toss.
 * It captures which team won and what they decided to do (bat or bowl).
 */
export function TossSelector({ 
  teamAId, 
  teamBId, 
  teamAName, 
  teamBName, 
  onTossComplete 
}: TossSelectorProps) {
  // State to manage the form's inputs and submission status.
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null); // For displaying inline validation errors.

  /**
   * Handles the form submission, validates input, and calls the parent callback.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors on a new submission attempt.

    // Validate that a toss winner has been selected.
    if (!tossWinnerId) {
      setError("Please select the team that won the toss.");
      return;
    }

    setIsSubmitting(true);
    // Propagate the result to the parent component to update the database.
    onTossComplete(tossWinnerId, tossDecision);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white animate-fade-in">
      <h3 className="text-2xl font-bold mb-6 text-center text-green-400">Match Toss</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dropdown to select which team won the toss */}
        <div>
          <label htmlFor="toss-winner-select" className="block mb-2 font-semibold text-gray-300">
            Toss Won By:
          </label>
          <select 
            id="toss-winner-select"
            value={tossWinnerId} 
            onChange={e => setTossWinnerId(e.target.value)} 
            className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            required
          >
            <option value="" disabled>Select a team...</option>
            <option value={teamAId}>{teamAName}</option>
            <option value={teamBId}>{teamBName}</option>
          </select>
        </div>

        {/* Radio buttons to select the winner's decision */}
        <fieldset>
          <legend className="block mb-2 font-semibold text-gray-300">Decision:</legend>
          <div className="flex gap-x-6 mt-2">
            <label className="flex items-center cursor-pointer text-lg">
              <input 
                type="radio" 
                name="tossDecision"
                value="bat" 
                checked={tossDecision === 'bat'} 
                onChange={() => setTossDecision('bat')}
                className="mr-3 h-5 w-5 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500"
              />
              Bat
            </label>
            <label className="flex items-center cursor-pointer text-lg">
              <input 
                type="radio" 
                name="tossDecision"
                value="bowl" 
                checked={tossDecision === 'bowl'} 
                onChange={() => setTossDecision('bowl')}
                className="mr-3 h-5 w-5 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500"
              />
              Bowl
            </label>
          </div>
        </fieldset>

        {/* Display validation error message inline */}
        {error && (
          <p className="text-red-400 text-center text-sm animate-shake">{error}</p>
        )}

        {/* Submit button to confirm the toss result */}
        <button 
          type="submit" 
          disabled={isSubmitting || !tossWinnerId} 
          className="w-full p-3 bg-green-600 rounded-md font-bold text-white uppercase tracking-wider hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Start Match"}
        </button>
      </form>
    </div>
  );
}