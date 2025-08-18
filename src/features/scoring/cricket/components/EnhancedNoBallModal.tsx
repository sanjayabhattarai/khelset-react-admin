// src/features/scoring/cricket/components/EnhancedNoBallModal.tsx
// Modal for handling no balls with runs from bat and extras options

import { useState } from 'react';

interface EnhancedNoBallModalProps {
  onSelect: (additionalRuns: number, runType: 'hit' | 'bye' | 'leg_bye', triggerWicket: boolean) => void;
  onCancel: () => void;
}

export function EnhancedNoBallModal({ onSelect, onCancel }: EnhancedNoBallModalProps) {
  const [showRunTypeOptions, setShowRunTypeOptions] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState(0);
  const [selectedRunType, setSelectedRunType] = useState<'hit' | 'bye' | 'leg_bye'>('hit');

  const handleMainRunSelect = (runs: number) => {
    if (runs === 0) {
      // For NB+0, no additional runs means no need to ask about run type
      onSelect(runs, 'hit', false); // Default to 'hit' but it doesn't matter since runs = 0
    } else {
      // For NB+1 and above, ask how the runs were scored
      setSelectedRuns(runs);
      setShowRunTypeOptions(true);
    }
  };

  const handleFinalSelect = () => {
    onSelect(selectedRuns, selectedRunType, false);
  };

  const handlePlusButtonClick = () => {
    setShowRunTypeOptions(true);
  };

  if (showRunTypeOptions) {
    return (
      <div className="bg-yellow-600 p-6 rounded-lg space-y-4 text-black max-w-sm mx-auto">
        <h4 className="font-bold text-xl text-center">No Ball - NB+{selectedRuns}</h4>
        
        <div className="bg-yellow-100 p-3 rounded text-center">
          <p className="text-sm font-medium">Select how the runs were scored</p>
          <p className="text-xs">(1 penalty run + {selectedRuns} additional runs)</p>
        </div>

        {/* Run type selection with radio buttons */}
        <div className="space-y-3">
          <h5 className="font-semibold text-center">Runs scored from:</h5>
          <div className="space-y-2">
            {[
              { value: 'hit', label: 'From Bat', description: 'Batsman hit the ball' },
              { value: 'bye', label: 'Bye', description: 'Ball missed wicket and batsman' },
              { value: 'leg_bye', label: 'Leg Bye', description: 'Ball hit batsman\'s body' }
            ].map(option => (
              <label
                key={option.value}
                className={`flex items-center p-3 rounded cursor-pointer transition-all ${
                  selectedRunType === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="runType"
                  value={option.value}
                  checked={selectedRunType === option.value}
                  onChange={() => setSelectedRunType(option.value as 'hit' | 'bye' | 'leg_bye')}
                  className="mr-3"
                />
                <div>
                  <div className="font-bold">{option.label}</div>
                  <div className="text-xs opacity-75">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setShowRunTypeOptions(false)}
            className="flex-1 p-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back
          </button>
          <button
            onClick={handleFinalSelect}
            className="flex-1 p-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-600 p-6 rounded-lg space-y-4 text-black max-w-sm mx-auto">
      <h4 className="font-bold text-xl text-center">No Ball</h4>
      
      <div className="bg-yellow-100 p-3 rounded text-center">
        <p className="text-sm font-medium">Select runs scored on No Ball</p>
        <p className="text-xs">(1 penalty run + additional runs)</p>
      </div>

      {/* Main no ball run options */}
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map(runs => (
          <button
            key={runs}
            onClick={() => handleMainRunSelect(runs)}
            className="p-3 rounded-lg font-bold text-lg bg-yellow-500 hover:bg-yellow-400 text-black shadow-md transform transition-all duration-200 hover:scale-105"
          >
            NB+{runs}
          </button>
        ))}
      </div>

      {/* Plus button for extras options */}
      <div className="border-t border-yellow-500 pt-3">
        <button
          onClick={handlePlusButtonClick}
          className="w-full p-3 rounded-lg font-bold text-lg bg-orange-500 hover:bg-orange-400 text-white shadow-md transform transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-2xl">+</span>
          <span>More Options</span>
        </button>
      </div>

      <div className="flex gap-2 pt-2">
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
