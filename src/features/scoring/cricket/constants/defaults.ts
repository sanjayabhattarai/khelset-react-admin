// src/features/scoring/cricket/constants/defaults.ts
// This file defines the default, empty states for major data structures.
// Using constants for initialization makes the code cleaner and less error-prone.

import { Innings } from "../types"; // Assuming types will be in ../types/index.ts

/**
 * The default state for a brand new innings.
 * All scores and stats are initialized to zero or empty arrays.
 */
export const DEFAULT_INNINGS_STATE: Innings = {
  battingTeamId: null,
  bowlingTeamId: null,
  battingTeamName: "TBD",
  score: 0,
  wickets: 0,
  overs: 0,
  ballsInOver: 0,
  battingStats: [],
  bowlingStats: [],
  deliveryHistory: [],
};