// src/features/scoring/cricket/components/ScoringPanel.tsx
import { useState } from 'react';
import { ExtrasModal } from './ExtrasModal';

interface ScoringPanelProps {
  isUpdating: boolean;
  onDelivery: (
    runs: number,
    isLegal: boolean,
    isWicket: boolean,
    extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye'
  ) => void;
  onWicket: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function ScoringPanel({
  isUpdating,
  onDelivery,
  onWicket,
  onUndo,
  canUndo,
}: ScoringPanelProps) {
  const [extrasModalType, setExtrasModalType] = useState<'bye' | 'leg_bye' | null>(null);

  const handleExtrasClick = (type: 'bye' | 'leg_bye') => {
    setExtrasModalType(type);
  };

  const handleExtrasConfirm = (runs: number) => {
    if (extrasModalType) {
      onDelivery(runs, true, false, extrasModalType);
    }
    setExtrasModalType(null);
  };

  return (
    <div>
      {/* Run buttons */}
      <div className="grid grid-cols-4 gap-2 text-center">
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

        {/* Extras: Wide and No Ball */}
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

        {/* Extras: Bye and Leg Bye (open modal) */}
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

        {/* Wicket button - only calls onWicket callback */}
        <button
          onClick={onWicket}
          disabled={isUpdating}
          className="p-3 col-span-2 bg-red-600 rounded-md font-bold hover:bg-red-700 disabled:bg-gray-500"
        >
          Wicket
        </button>
      </div>

      {/* Undo button */}
      <button
        onClick={onUndo}
        disabled={isUpdating || !canUndo}
        className="mt-4 w-full p-2 bg-gray-500 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Undo Last Ball
      </button>

      {/* Extras Modal */}
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
