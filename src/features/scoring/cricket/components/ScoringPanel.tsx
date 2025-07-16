// src/features/scoring/cricket/components/ScoringPanel.tsx
// This component displays the main scoring buttons (runs, extras, wickets).

import { useState } from 'react';
import { ExtrasModal } from './ExtrasModal'; // We will use the modal we created earlier.

// Define the props this component will receive from its parent.
interface ScoringPanelProps {
  isUpdating: boolean; // To disable buttons during an update.
  onDelivery: (
    runs: number,
    isLegal: boolean,
    isWicket: boolean,
    extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye'
  ) => void;
  onWicket: () => void; // A dedicated function to trigger the wicket modal.
  onUndo: () => void; // A function to undo the last delivery.
  canUndo: boolean; // To enable/disable the undo button.
}

export function ScoringPanel({
  isUpdating,
  onDelivery,
  onWicket,
  onUndo,
  canUndo,
}: ScoringPanelProps) {
  // State to control the visibility of the extras modal.
  const [extrasModalType, setExtrasModalType] = useState<'bye' | 'leg_bye' | null>(null);

  // This function handles clicks on the bye/leg_bye buttons, showing the modal.
  const handleExtrasClick = (type: 'bye' | 'leg_bye') => {
    setExtrasModalType(type);
  };

  // This function is called when the extras modal is confirmed.
  const handleExtrasConfirm = (runs: number) => {
    if (extrasModalType) {
      // It calls the main onDelivery function with the selected number of runs.
      onDelivery(runs, true, false, extrasModalType);
    }
    setExtrasModalType(null); // Close the modal.
  };

  return (
    <div>
      {/* The main grid of scoring buttons */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {/* Buttons for standard runs (0 to 6) */}
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            key={run}
            onClick={() => onDelivery(run, true, false)}
            disabled={isUpdating}
            className="p-3 bg-blue-600 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-500"
          >
            {run}
          </button>
        ))}

        {/* Buttons for simple extras (Wide, No Ball) */}
        <button
          onClick={() => onDelivery(0, false, false, 'wide')}
          disabled={isUpdating}
          className="p-3 bg-yellow-500 rounded-md hover:bg-yellow-600 disabled:bg-gray-500"
        >
          Wide
        </button>
        <button
          onClick={() => onDelivery(0, false, false, 'no_ball')}
          disabled={isUpdating}
          className="p-3 bg-yellow-500 rounded-md hover:bg-yellow-600 disabled:bg-gray-500"
        >
          No Ball
        </button>

        {/* Buttons that open the ExtrasModal for byes and leg byes */}
        <button
          onClick={() => handleExtrasClick('bye')}
          disabled={isUpdating}
          className="p-3 bg-purple-500 rounded-md hover:bg-purple-600 disabled:bg-gray-500"
        >
          Bye
        </button>
        <button
          onClick={() => handleExtrasClick('leg_bye')}
          disabled={isUpdating}
          className="p-3 bg-purple-500 rounded-md hover:bg-purple-600 disabled:bg-gray-500"
        >
          Leg Bye
        </button>

        {/* The main Wicket button */}
        <button
          onClick={onWicket}
          disabled={isUpdating}
          className="p-3 col-span-2 bg-red-600 rounded-md font-bold hover:bg-red-700 disabled:bg-gray-500"
        >
          Wicket
        </button>
      </div>

      {/* The Undo button */}
      <button
        onClick={onUndo}
        disabled={isUpdating || !canUndo}
        className="mt-4 w-full p-2 bg-gray-500 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Undo Last Ball
      </button>

      {/* Conditionally render the ExtrasModal when its state is set */}
      {extrasModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <ExtrasModal
            extraType={extrasModalType}
            onSelect={handleExtrasConfirm}
            onCancel={() => setExtrasModalType(null)}
          />
        </div>
      )}
    </div>
  );
}
