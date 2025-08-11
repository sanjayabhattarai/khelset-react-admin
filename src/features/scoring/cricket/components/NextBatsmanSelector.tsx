// src/features/scoring/cricket/components/NextBatsmanSelector.tsx
// This component provides the UI for selecting the next batsman after a wicket has fallen.

import { useState } from 'react';
import { Player } from '../types';

// Define the props this component will receive from its parent.
interface NextBatsmanSelectorProps {
  // A list of players from the batting team who have not yet batted or gotten out.
  availableBatsmen: Player[];
  // A callback function to inform the parent component which batsman was selected.
  onSelect: (batsmanId: string) => void;
}

export function NextBatsmanSelector({
  availableBatsmen,
  onSelect,
}: NextBatsmanSelectorProps) {
  // State to manage the selection within this component's dropdown.
  const [selectedId, setSelectedId] = useState('');

  return (
    <div className="bg-yellow-600 p-4 rounded-lg space-y-3 text-white">
      <h4 className="font-bold text-lg text-center">Wicket! Select Next Batsman</h4>
      
      {/* Dropdown menu to display the list of available batsmen. */}
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded"
        aria-label="Select next batsman"
      >
        <option value="">Select batsman...</option>
        {availableBatsmen.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* The confirm button is disabled until a selection is made */}
      <button
        onClick={() => selectedId && onSelect(selectedId)}
        className="w-full p-2 bg-green-600 rounded-md font-bold disabled:bg-gray-500 disabled:cursor-not-allowed"
        disabled={!selectedId}
      >
        Confirm Next Batsman
      </button>
    </div>
  );
}
