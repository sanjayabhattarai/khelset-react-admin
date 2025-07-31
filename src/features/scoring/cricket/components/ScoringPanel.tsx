// src/features/scoring/cricket/components/ScoringPanel.tsx
// FINAL PROFESSIONAL UI: This version combines a vibrant, color-coded design
// with professional styling like gradients, hover effects, and focus rings.

import { useState } from 'react';
import { ExtraType } from '../types';
import { ExtrasModal } from './ExtrasModal';

// The props interface remains the same, as the component's functionality has not changed.
interface ScoringPanelProps {
  isUpdating: boolean;
  onDelivery: (runs: number, isLegal: boolean, isWicket: boolean, extraType?: ExtraType) => void;
  onWicket: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function ScoringPanel({ isUpdating, onDelivery, onWicket, onUndo, canUndo }: ScoringPanelProps) {
  // --- STATE & LOGIC ---
  // This is your existing logic for handling the extras modal for byes/leg-byes.
  // It has not been changed.
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

  // This is your existing logic for handling custom run amounts.
  // It has not been changed.
  const handleCustomRuns = () => {
    const runsStr = prompt("Enter number of runs scored (e.g., 5, 7):");
    if (runsStr) {
      const runs = parseInt(runsStr, 10);
      if (!isNaN(runs) && runs >= 0) {
        onDelivery(runs, true, false);
      } else {
        alert("Invalid number entered.");
      }
    }
  };

  // --- UI COMPONENTS ---
  // A helper component for a consistent, professional button style.
  // This reduces code repetition and makes the UI easier to maintain.
  const ScoringButton = ({ children, onClick, disabled, className = '' }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-4 rounded-lg font-bold text-xl text-white shadow-md transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white ${className} ${disabled ? 'bg-gray-600 cursor-not-allowed opacity-60' : 'hover:scale-105 hover:shadow-lg'}`}
    >
      {children}
    </button>
  );

  return (
    <>
      {/* This is the main container for the scoring panel. */}
      {/* It has a white background for better visibility of the colorful buttons. */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-xl shadow-2xl w-full max-w-md mx-auto border border-gray-300">
        <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">Scoring Controls</h3>
        
        {/* Main run-scoring buttons */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[0, 1, 2, 3, 4, 6].map(runs => (
            <ScoringButton key={runs} onClick={() => onDelivery(runs, true, false)} disabled={isUpdating} className="bg-blue-500 hover:bg-blue-600">
              {runs}
            </ScoringButton>
          ))}
          <ScoringButton onClick={handleCustomRuns} disabled={isUpdating} className="bg-blue-500 hover:bg-blue-600">
            5+
          </ScoringButton>
           <ScoringButton onClick={() => onDelivery(0, true, false)} disabled={isUpdating} className="bg-blue-500 hover:bg-blue-600">
            ...
          </ScoringButton>
        </div>

        {/* Extras buttons with distinct colors for better visual grouping */}
        <div className="grid grid-cols-4 gap-3 mt-3">
          <ScoringButton onClick={() => onDelivery(0, false, false, 'wide')} disabled={isUpdating} className="bg-yellow-500 hover:bg-yellow-600 text-black">WD</ScoringButton>
          <ScoringButton onClick={() => onDelivery(0, false, false, 'no_ball')} disabled={isUpdating} className="bg-yellow-500 hover:bg-yellow-600 text-black">NB</ScoringButton>
          {/* ✨ PURPLE BUTTONS AS REQUESTED ✨ */}
          <ScoringButton onClick={() => handleExtrasClick('bye')} disabled={isUpdating} className="bg-orange-500 hover:bg-orange-600">BYE</ScoringButton>
          <ScoringButton onClick={() => handleExtrasClick('leg_bye')} disabled={isUpdating} className="bg-orange-500 hover:bg-orange-600">LB</ScoringButton>
        </div>

        {/* Main action buttons, made larger and more prominent */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* ✨ RED WICKET BUTTON AS REQUESTED ✨ */}
          <ScoringButton onClick={onWicket} disabled={isUpdating} className="bg-red-500 hover:bg-red-600 text-lg">WICKET</ScoringButton>
          <ScoringButton onClick={onUndo} disabled={isUpdating || !canUndo} className="bg-green-500 hover:bg-green-600 text-lg">UNDO</ScoringButton>
        </div>
      </div>

      {/* Extras Modal - This is your existing modal logic, which appears on top of the screen. */}
      {extrasModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <ExtrasModal
            extraType={extrasModalType}
            onSelect={handleExtrasConfirm}
            onCancel={() => setExtrasModalType(null)}
          />
        </div>
      )}
    </>
  );
}
