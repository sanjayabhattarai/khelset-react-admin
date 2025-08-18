// src/features/scoring/cricket/components/WideModal.tsx
// Modal for handling wide balls with specific run options

interface WideModalProps {
  onSelect: (additionalRuns: number, triggerWicket: boolean) => void;
  onCancel: () => void;
}

export function WideModal({ onSelect, onCancel }: WideModalProps) {
  const handleRunSelect = (runs: number) => {
    onSelect(runs, false); // No wicket for now, can be enhanced later
  };

  return (
    <div className="bg-yellow-600 p-6 rounded-lg space-y-4 text-black max-w-sm mx-auto">
      <h4 className="font-bold text-xl text-center">Wide Ball</h4>
      
      <div className="bg-yellow-100 p-3 rounded text-center">
        <p className="text-sm font-medium">Select runs scored on Wide Ball</p>
        <p className="text-xs">(1 penalty run + additional runs)</p>
      </div>

      {/* Wide ball run options */}
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map(runs => (
          <button
            key={runs}
            onClick={() => handleRunSelect(runs)}
            className="p-3 rounded-lg font-bold text-lg bg-yellow-500 hover:bg-yellow-400 text-black shadow-md transform transition-all duration-200 hover:scale-105"
          >
            WD+{runs}
          </button>
        ))}
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
