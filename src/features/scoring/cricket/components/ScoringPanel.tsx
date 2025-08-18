// src/features/scoring/cricket/components/ScoringPanel.tsx
// Modern cricket scoring UI with dynamic overlays for extras and wickets

import { useState } from 'react';
import { ExtraType } from '../types';
import { WideModal } from './WideModal';
import { EnhancedNoBallModal } from './EnhancedNoBallModal';
import { EnhancedExtrasModal } from './EnhancedExtrasModal';

interface ScoringPanelProps {
  isUpdating: boolean;
  onDelivery: (runs: number, isLegal: boolean, isWicket: boolean, extraType?: ExtraType, wicketType?: any, runType?: 'hit' | 'bye' | 'leg_bye') => void;
  onWicket: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function ScoringPanel({ isUpdating, onDelivery, onWicket, onUndo, canUndo }: ScoringPanelProps) {
  // State management for overlays
  const [overlay, setOverlay] = useState<null | 'wide' | 'no_ball' | 'bye' | 'leg_bye'>(null);

  // Event handlers
  const handleRunClick = (runs: number) => onDelivery(runs, true, false);
  const handleOverlayOpen = (type: typeof overlay) => setOverlay(type);
  const handleUndoClick = () => onUndo();

  // Overlay confirmation handler
  const handleOverlayConfirm = (type: typeof overlay, data: any) => {
    switch (type) {
      case 'wide':
        onDelivery(data.runs, false, false, 'wide');
        if (data.triggerWicket) {
          onWicket();
        }
        break;
      case 'no_ball':
        onDelivery(data.runs, false, false, 'no_ball', undefined, data.runType);
        if (data.triggerWicket) {
          onWicket();
        }
        break;
      case 'bye':
        onDelivery(data.runs, true, false, 'bye');
        break;
      case 'leg_bye':
        onDelivery(data.runs, true, false, 'leg_bye');
        break;
      default:
        break;
    }
    setOverlay(null);
  };

  // Reusable button component
  const ScoringButton = ({ children, onClick, disabled, className = '' }: any) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`p-4 rounded-lg font-bold text-xl text-white shadow-md transform transition-all duration-200 ${disabled ? 'bg-gray-600 cursor-not-allowed opacity-60' : `${className} hover:scale-105 hover:shadow-lg`}`}
    >
      {children}
    </button>
  );

  return (
    <>
      <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-xl shadow-2xl w-full max-w-md mx-auto border border-gray-300">
        <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">Scoring Controls</h3>

        {/* Primary run scoring buttons */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[0, 1, 2, 3, 4, 6].map(runs => (
            <ScoringButton key={runs} onClick={() => handleRunClick(runs)} disabled={isUpdating} className="bg-blue-500 hover:bg-blue-600">
              {runs}
            </ScoringButton>
          ))}
        </div>

        {/* Special scoring buttons for extras */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <ScoringButton onClick={() => handleOverlayOpen('wide')} disabled={isUpdating} className="bg-yellow-500 hover:bg-yellow-600 text-black">WD</ScoringButton>
          <ScoringButton onClick={() => handleOverlayOpen('no_ball')} disabled={isUpdating} className="bg-yellow-500 hover:bg-yellow-600 text-black">NB</ScoringButton>
          <ScoringButton onClick={() => handleOverlayOpen('bye')} disabled={isUpdating} className="bg-orange-500 hover:bg-orange-600">BYE</ScoringButton>
          <ScoringButton onClick={() => handleOverlayOpen('leg_bye')} disabled={isUpdating} className="bg-orange-500 hover:bg-orange-600">LB</ScoringButton>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <ScoringButton onClick={onWicket} disabled={isUpdating} className="bg-red-500 hover:bg-red-600 text-lg">WICKET</ScoringButton>
          <ScoringButton onClick={handleUndoClick} disabled={isUpdating || !canUndo} className="text-lg bg-green-500 hover:bg-green-600">UNDO ↶</ScoringButton>
        </div>
      </div>

      {/* Dynamic modal overlays */}
      {overlay === 'wide' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <WideModal
            onSelect={(runs: number, triggerWicket: boolean) => handleOverlayConfirm('wide', { runs, triggerWicket })}
            onCancel={() => setOverlay(null)}
          />
        </div>
      )}
      {overlay === 'no_ball' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <EnhancedNoBallModal
            onSelect={(runs: number, runType: 'hit' | 'bye' | 'leg_bye', triggerWicket: boolean) => handleOverlayConfirm('no_ball', { runs, runType, triggerWicket })}
            onCancel={() => setOverlay(null)}
          />
        </div>
      )}
      {overlay === 'bye' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <EnhancedExtrasModal
            extraType="bye"
            onSelect={(runs: number) => handleOverlayConfirm('bye', { runs })}
            onCancel={() => setOverlay(null)}
          />
        </div>
      )}
      {overlay === 'leg_bye' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <EnhancedExtrasModal
            extraType="leg_bye"
            onSelect={(runs: number) => handleOverlayConfirm('leg_bye', { runs })}
            onCancel={() => setOverlay(null)}
          />
        </div>
      )}
    </>
  );
}
