// src/features/scoring/cricket/logic/undoUtils.ts
// This file contains the "pure" logic for handling the "Undo Last Ball" feature.

import { MatchData } from '../types';

/**
 * Reverts the match state to the previously saved state from the undo stack.
 * @param currentMatchData The current state of the match.
 * @returns The previous MatchData state, or null if there is no history to revert to.
 */
export const revertToPreviousState = (
  currentMatchData: MatchData
): MatchData | null => {
  // Determine which innings is currently active.
  const innings =
    currentMatchData.currentInnings === 1
      ? currentMatchData.innings1
      : currentMatchData.innings2;

  // Safety check: If there is no undo history, return null.
  const history = innings.undoStack;
  if (!history || history.length === 0) {
    console.warn("No deliveries to undo.");
    return null;
  }

  try {
    // Get the last saved state from the history array.
    const lastStateString = history[history.length - 1];
    // Parse the JSON string back into a MatchData object.
    const previousState: MatchData = JSON.parse(lastStateString);
    return previousState;
  } catch (error) {
    console.error("Failed to parse previous state from undo stack:", error);
    // If parsing fails, return null to prevent a crash.
    return null;
  }
};
