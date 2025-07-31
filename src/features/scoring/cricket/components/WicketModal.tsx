// src/features/scoring/cricket/components/WicketModal.tsx
// This component provides a UI for selecting the dismissal type.
// It has been updated to handle runs scored on a run-out dismissal.

import { useState } from 'react';
import { Player, WicketType } from '../types';

// ✨ UPDATED: The onSelect function now includes a 'runsScored' parameter.
interface WicketModalProps {
  fielders: Player[];
  onSelect: (type: WicketType, fielderId: string | undefined, runsScored: number) => void;
  onCancel: () => void;
}

export function WicketModal({
  fielders,
  onSelect,
  onCancel,
}: WicketModalProps) {
  // --- STATE MANAGEMENT ---
  const [wicketType, setWicketType] = useState<WicketType>('bowled');
  const [fielderId, setFielderId] = useState<string>('');
  // ✨ NEW: State to track runs completed on a run-out.
  const [runsScored, setRunsScored] = useState(0);

  // Determine if a fielder is required for the selected dismissal type.
  const needsFielder = ['caught', 'run_out', 'stumped'].includes(wicketType);

  // --- HANDLERS ---
  const handleConfirm = () => {
    // Pass all three pieces of information back to the parent.
    onSelect(wicketType, fielderId || undefined, runsScored);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4 text-white animate-fade-in shadow-lg">
      <h4 className="font-bold text-xl text-center">How was the batsman out?</h4>
      
      {/* Dropdown to select the type of dismissal */}
      <div>
        <label htmlFor="wicket-type-select" className="block mb-1 font-semibold">Dismissal Type:</label>
        <select
          id="wicket-type-select"
          value={wicketType}
          onChange={(e) => setWicketType(e.target.value as WicketType)}
          className="w-full bg-gray-700 p-2 rounded border border-gray-600"
        >
          <option value="bowled">Bowled</option>
          <option value="caught">Caught</option>
          <option value="lbw">LBW</option>
          <option value="run_out">Run Out</option>
          <option value="stumped">Stumped</option>
          <option value="hit_wicket">Hit Wicket</option>
          <option value="retired_hurt">Retired Hurt</option>
        </select>
      </div>

      {/* ✨ NEW: Conditionally show the runs input ONLY for run outs ✨ */}
      {wicketType === 'run_out' && (
        <div className="animate-fade-in">
          <label htmlFor="runs-scored-input" className="block mb-1 font-semibold">Runs Completed:</label>
          <input
            id="runs-scored-input"
            type="number"
            value={runsScored}
            // Ensure the value is a number and reset to 0 if input is cleared.
            onChange={(e) => setRunsScored(parseInt(e.target.value, 10) || 0)}
            min="0"
            className="w-full bg-gray-700 p-2 rounded border border-gray-600"
          />
        </div>
      )}

      {/* Conditionally show the fielder selection dropdown */}
      {needsFielder && (
        <div className="animate-fade-in">
          <label htmlFor="fielder-select" className="block mb-1 font-semibold">Fielder:</label>
          <select
            id="fielder-select"
            value={fielderId}
            onChange={(e) => setFielderId(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded border border-gray-600"
          >
            <option value="">Select Fielder...</option>
            {fielders.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4 pt-2">
        <button
          onClick={handleConfirm}
          className="flex-1 p-3 bg-green-600 rounded-md font-bold hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          disabled={needsFielder && !fielderId}
        >
          Confirm Wicket
        </button>
        <button
          onClick={onCancel}
          className="flex-1 p-3 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}