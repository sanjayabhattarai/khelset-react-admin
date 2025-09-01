// src/features/scoring/cricket/logic/undoUtils.ts
// This file contains the "pure" logic for handling the "Undo Last Ball" feature.

import { MatchData } from '../types';

/**
 * This function is deprecated. Undo functionality now works through Firebase
 * using the firestoreService functions: getLatestUndoState and deleteFromUndoStack.
 * 
 * @deprecated Use firestoreService.getLatestUndoState() instead
 */
export const revertToPreviousState = (
  _currentMatchData: MatchData
): MatchData | null => {
  console.warn("revertToPreviousState is deprecated. Use firestoreService.getLatestUndoState() instead.");
  return null;
};
