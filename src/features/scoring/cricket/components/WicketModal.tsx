// src/features/scoring/cricket/components/WicketModal.tsx
// This component provides a UI for selecting the specific type of dismissal
// and any fielders who were involved in the wicket.

import { useState } from 'react';
import { Player, WicketType } from '../types';

// Define the props this component will receive from its parent.
interface WicketModalProps {
  // A list of players from the fielding team.
  fielders: Player[];
  // A callback function to confirm the wicket details.
  onSelect: (type: WicketType, fielderId?: string) => void;
  // A callback function to cancel the wicket operation.
  onCancel: () => void;
}

export function WicketModal({
  fielders,
  onSelect,
  onCancel,
}: WicketModalProps) {
  // State to manage the selections within this component.
  const [wicketType, setWicketType] = useState<WicketType>('bowled');
  const [fielderId, setFielderId] = useState<string>('');

  // Some dismissal types, like 'caught' or 'stumped', require a fielder to be selected.
  const needsFielder = ['caught', 'run_out', 'stumped'].includes(wicketType);

  return (
    <div className="bg-red-800 p-4 rounded-lg space-y-3 text-white">
      <h4 className="font-bold text-lg text-center">How was the batsman out?</h4>
      
      {/* Dropdown to select the type of dismissal */}
      <select
        value={wicketType}
        onChange={(e) => setWicketType(e.target.value as WicketType)}
        className="w-full bg-gray-700 p-2 rounded"
      >
        <option value="bowled">Bowled</option>
        <option value="caught">Caught</option>
        <option value="lbw">LBW</option>
        <option value="run_out">Run Out</option>
        <option value="stumped">Stumped</option>
        <option value="hit_wicket">Hit Wicket</option>
        <option value="retired_hurt">Retired Hurt</option>
      </select>

      {/* Conditionally show the fielder selection dropdown if needed */}
      {needsFielder && (
        <select
          value={fielderId}
          onChange={(e) => setFielderId(e.target.value)}
          className="w-full bg-gray-700 p-2 rounded mt-2"
        >
          <option value="">Select Fielder...</option>
          {fielders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-2 pt-2">
        {/* The confirm button is disabled if a required fielder has not been selected. */}
        <button
          onClick={() => onSelect(wicketType, fielderId)}
          className="flex-1 p-2 bg-green-600 rounded-md font-bold disabled:bg-gray-500 disabled:cursor-not-allowed"
          disabled={needsFielder && !fielderId}
        >
          Confirm Wicket
        </button>
        {/* The cancel button allows the admin to go back without confirming the wicket. */}
        <button
          onClick={onCancel}
          className="flex-1 p-2 bg-gray-600 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
