// src/features/scoring/cricket/components/ExtrasModal.tsx
// This component provides a UI for handling more complex extras,
// allowing the admin to specify how many runs were scored from byes or leg byes.

import { useState } from 'react';

// Define the props this component will receive from its parent.
interface ExtrasModalProps {
  extraType: 'bye' | 'leg_bye';
  // A callback function to confirm the number of extra runs.
  onSelect: (runs: number) => void;
  // A callback function to cancel the operation.
  onCancel: () => void;
}

export function ExtrasModal({
  extraType,
  onSelect,
  onCancel,
}: ExtrasModalProps) {
  // State to manage the number of runs selected.
  const [runs, setRuns] = useState(1);

  // Capitalize the extra type for display in the title.
  const title = extraType.charAt(0).toUpperCase() + extraType.slice(1).replace('_', ' ');

  return (
    <div className="bg-purple-800 p-4 rounded-lg space-y-4 text-white">
      <h4 className="font-bold text-lg text-center">How many {title}s?</h4>
      
      {/* UI for selecting the number of runs */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setRuns(r => Math.max(1, r - 1))}
          className="bg-gray-600 rounded-full w-10 h-10 text-xl font-bold"
        >
          -
        </button>
        <span className="text-2xl font-bold w-12 text-center">{runs}</span>
        <button
          onClick={() => setRuns(r => Math.min(6, r + 1))}
          className="bg-gray-600 rounded-full w-10 h-10 text-xl font-bold"
        >
          +
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        {/* The confirm button passes the selected number of runs back to the parent. */}
        <button
          onClick={() => onSelect(runs)}
          className="flex-1 p-2 bg-green-600 rounded-md font-bold"
        >
          Confirm {runs} {title}(s)
        </button>
        {/* The cancel button allows the admin to go back. */}
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
