// src/features/scoring/cricket/components/WideNoBallModal.tsx
// Enhanced modal for handling wides and no-balls with additional runs and wickets

import { useState } from 'react';

interface WideNoBallModalProps {
  extraType: 'wide' | 'no_ball';
  onSelect: (additionalRuns: number, triggerWicket: boolean) => void;
  onCancel: () => void;
}

export function WideNoBallModal({
  extraType,
  onSelect,
  onCancel,
}: WideNoBallModalProps) {
  const [additionalRuns, setAdditionalRuns] = useState(0);
  const [triggerWicket, setTriggerWicket] = useState(false);

  const title = extraType === 'wide' ? 'Wide Ball' : 'No Ball';
  const baseRun = 1; // Wides and no-balls always give 1 extra run

  const handleConfirm = () => {
    onSelect(additionalRuns, triggerWicket);
  };

  return (
    <div className="bg-yellow-600 p-6 rounded-lg space-y-4 text-black max-w-sm mx-auto">
      <h4 className="font-bold text-xl text-center">{title}</h4>
      
      <div className="bg-yellow-100 p-3 rounded text-center">
        <p className="text-sm font-medium">Base: {baseRun} run (penalty)</p>
        <p className="text-sm">+ Additional runs by batsmen</p>
      </div>

      {/* Additional runs selector */}
      <div className="space-y-2">
        <label className="block font-semibold">Additional runs scored:</label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setAdditionalRuns(Math.max(0, additionalRuns - 1))}
            className="bg-gray-700 text-white rounded-full w-10 h-10 text-xl font-bold hover:bg-gray-600"
          >
            -
          </button>
          <span className="text-2xl font-bold w-12 text-center">{additionalRuns}</span>
          <button
            onClick={() => setAdditionalRuns(Math.min(6, additionalRuns + 1))}
            className="bg-gray-700 text-white rounded-full w-10 h-10 text-xl font-bold hover:bg-gray-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Quick run buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4].map(runs => (
          <button
            key={runs}
            onClick={() => setAdditionalRuns(runs)}
            className={`p-2 rounded font-bold ${
              additionalRuns === runs 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {runs}
          </button>
        ))}
      </div>

      {/* Wicket option - simplified to just trigger wicket handling */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={triggerWicket}
            onChange={(e) => setTriggerWicket(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="font-semibold">
            {extraType === 'wide' ? 'Wicket occurred (will ask for details)' : 'Wicket occurred (will ask for details)'}
          </span>
        </label>
        
        {triggerWicket && (
          <div className="ml-6 mt-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
            <p>After confirming, you'll be asked for wicket details:</p>
            <ul className="list-disc list-inside mt-1">
              {extraType === 'wide' ? (
                <li>Run out only (with runs completed)</li>
              ) : (
                <li>Run out (with runs completed) or Stumped</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-100 p-3 rounded">
        <p className="font-bold">Total: {baseRun + additionalRuns} runs</p>
        <p className="text-sm">
          {baseRun} (penalty) + {additionalRuns} (batsmen runs)
          {triggerWicket && ' + Wicket (details will be asked)'}
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleConfirm}
          className="flex-1 p-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700"
        >
          Confirm {title}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 p-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
