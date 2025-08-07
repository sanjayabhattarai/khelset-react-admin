// src/features/scoring/cricket/components/NoBallModal.tsx
// Enhanced modal for handling no-balls with different run types

import { useState } from 'react';

interface NoBallModalProps {
  onSelect: (additionalRuns: number, runType: 'hit' | 'bye' | 'leg_bye', triggerWicket: boolean) => void;
  onCancel: () => void;
}

export function NoBallModal({
  onSelect,
  onCancel,
}: NoBallModalProps) {
  const [additionalRuns, setAdditionalRuns] = useState(0);
  const [runType, setRunType] = useState<'hit' | 'bye' | 'leg_bye'>('hit');
  const [triggerWicket, setTriggerWicket] = useState(false);

  const baseRun = 1; // No-ball always gives 1 extra run

  const handleConfirm = () => {
    onSelect(additionalRuns, runType, triggerWicket);
  };

  const getRunTypeDescription = () => {
    switch (runType) {
      case 'hit':
        return 'Batsman hit the ball - runs go to batsman\'s account';
      case 'bye':
        return 'Bye runs - ball missed wicket, runs go to extras';
      case 'leg_bye':
        return 'Leg bye - ball hit batsman\'s body, runs go to extras';
      default:
        return '';
    }
  };

  const getWicketOptions = () => {
    if (runType === 'hit') {
      return 'Run out possible (if attempting runs)';
    }
    return 'Run out or Stumped possible';
  };

  return (
    <div className="bg-red-600 p-6 rounded-lg space-y-4 text-white max-w-md mx-auto">
      <h4 className="font-bold text-xl text-center">No Ball</h4>
      
      <div className="bg-red-100 p-3 rounded text-center text-black">
        <p className="text-sm font-medium">Base: {baseRun} run (penalty)</p>
        <p className="text-sm">+ Additional runs by batsmen</p>
        <p className="text-xs mt-1 font-bold">Next ball will be FREE HIT</p>
      </div>

      {/* Run type selector */}
      <div className="space-y-2">
        <label className="block font-semibold">How were the runs scored?</label>
        <div className="space-y-2">
          {[
            { value: 'hit', label: 'Batsman Hit', desc: 'Ball was hit by batsman' },
            { value: 'bye', label: 'Bye', desc: 'Ball missed everything' },
            { value: 'leg_bye', label: 'Leg Bye', desc: 'Ball hit batsman\'s body' }
          ].map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="runType"
                value={option.value}
                checked={runType === option.value}
                onChange={(e) => setRunType(e.target.value as 'hit' | 'bye' | 'leg_bye')}
                className="w-4 h-4"
              />
              <div>
                <span className="font-medium">{option.label}</span>
                <p className="text-xs text-gray-200">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Run type explanation */}
      <div className="bg-blue-100 p-2 rounded text-xs text-black">
        <p><strong>Effect:</strong> {getRunTypeDescription()}</p>
      </div>

      {/* Additional runs selector */}
      <div className="space-y-2">
        <label className="block font-semibold">Additional runs taken:</label>
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
      <div className="grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4, 6].map(runs => (
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

      {/* Wicket option */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={triggerWicket}
            onChange={(e) => setTriggerWicket(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="font-semibold">Wicket occurred</span>
        </label>
        
        {triggerWicket && (
          <div className="ml-6 mt-2 text-sm text-gray-200 bg-red-700 p-2 rounded">
            <p>After confirming, you'll be asked for wicket details:</p>
            <p className="mt-1">• {getWicketOptions()}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-100 p-3 rounded text-black">
        <p className="font-bold">Total: {baseRun + additionalRuns} runs</p>
        <p className="text-sm">
          {baseRun} (penalty) + {additionalRuns} ({runType === 'hit' ? 'to batsman' : 'to extras'})
          {triggerWicket && ' + Wicket (details will be asked)'}
        </p>
        <p className="text-xs mt-1 font-bold text-red-600">FREE HIT NEXT BALL</p>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleConfirm}
          className="flex-1 p-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700"
        >
          Confirm No Ball
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
