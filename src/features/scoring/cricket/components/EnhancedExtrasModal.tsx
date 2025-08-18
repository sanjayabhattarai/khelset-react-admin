// src/features/scoring/cricket/components/EnhancedExtrasModal.tsx
// Modal for handling bye and leg bye with specific run options

interface EnhancedExtrasModalProps {
  extraType: 'bye' | 'leg_bye';
  onSelect: (runs: number) => void;
  onCancel: () => void;
}

export function EnhancedExtrasModal({ extraType, onSelect, onCancel }: EnhancedExtrasModalProps) {
  const title = extraType === 'bye' ? 'Bye' : 'Leg Bye';
  
  return (
    <div className="bg-orange-600 p-6 rounded-lg space-y-4 text-white max-w-sm mx-auto">
      <h4 className="font-bold text-xl text-center">{title}</h4>
      
      <div className="bg-orange-100 p-3 rounded text-center text-black">
        <p className="text-sm font-medium">Select runs scored from {title.toLowerCase()}</p>
      </div>

      {/* Run options */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map(runs => (
          <button
            key={runs}
            onClick={() => onSelect(runs)}
            className="p-3 rounded-lg font-bold text-lg bg-orange-500 hover:bg-orange-400 text-white shadow-md transform transition-all duration-200 hover:scale-105"
          >
            {runs}
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
