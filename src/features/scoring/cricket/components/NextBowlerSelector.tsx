// src/features/scoring/cricket/components/NextBowlerSelector.tsx
// This component provides the UI for selecting the next bowler after an over is complete.

import { useState } from 'react';
import { Player } from '../types';

// Define the props this component will receive from its parent.
interface NextBowlerSelectorProps {
  // A list of players from the bowling team who are eligible to bowl the next over.
  availableBowlers: Player[];
  // A callback function to inform the parent component which bowler was selected.
  onSelect: (bowlerId: string) => void;
}

export function NextBowlerSelector({
  availableBowlers,
  onSelect,
}: NextBowlerSelectorProps) {
  // State to manage the selection within this component's dropdown.
  const [selectedId, setSelectedId] = useState('');

  return (
    <div className="bg-blue-800 p-4 rounded-lg space-y-3 text-white">
      <h4 className="font-bold text-lg text-center">Over Complete! Select Next Bowler</h4>
      
      {/* Dropdown menu to display the list of available bowlers. */}
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full bg-gray-700 p-2 rounded"
      >
        <option value="">Select bowler...</option>
        {availableBowlers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* The confirm button is disabled until a selection is made. */}
      <button
        onClick={() => selectedId && onSelect(selectedId)}
        className="w-full p-2 bg-green-600 rounded-md font-bold disabled:bg-gray-500 disabled:cursor-not-allowed"
        disabled={!selectedId}
      >
        Start Next Over
      </button>
    </div>
  );
}
