// src/features/scoring/cricket/types/index.ts
// This file has been updated for the subcollection refactor.
// The `undoStack` has been removed from the Innings interface.

/**
 * Represents a single player's basic information.
 */
export interface Player {
  id: string;
  name: string;
  role: string;
}

/**
 * Defines all possible ways a batsman can be dismissed.
 */
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'retired_hurt';

/**
 * Defines all possible types of extra deliveries.
 */
export type ExtraType = 'wide' | 'no_ball' | 'bye' | 'leg_bye';

/**
 * Represents a batsman's statistics within an innings.
 */
export interface Batsman {
  id: string;
  name: string;
  runs: number;
  balls: number;
  status: 'not_out' | 'out';
  dismissal?: {
    type: WicketType;
    fielderId?: string;
    bowlerId: string;
  };
}

/**
 * Represents a bowler's statistics within an innings.
 */
export interface Bowler {
  id: string;
  name: string;
  overs: number;
  runs: number;
  wickets: number;
}

/**
 * A detailed model for a single delivery. This will now be its own document
 * in the `deliveryHistory` subcollection.
 */
export interface Delivery {
  ballId: string;
  overNumber: number;
  ballInOver: number;
  batsmanId: string;
  bowlerId: string;
  runsScored: {
    batsman: number;
    extras: number;
    total: number;
  };
  extraType?: ExtraType;
  isWicket: boolean;
  isLegal: boolean;
  wicketInfo?: {
    type: WicketType;
    batsmanId: string;
    fielderId?: string;
  } | null;
}

/**
 * Represents the complete state of a single innings.
 * ✨ CHANGE: `undoStack` has been removed as it will now be a subcollection.
 */
export interface Innings {
  battingTeamId: string | null;
  bowlingTeamId: string | null;
  battingTeamName: string;
  score: number;
  wickets: number;
  overs: number;
  ballsInOver: number;
  battingStats: Batsman[];
  bowlingStats: Bowler[];
  deliveryHistory: Delivery[];
}

/**
 * Defines the structure for customizable match rules.
 */
export interface MatchRules {
    totalOvers: number;
    playersPerTeam: number;
    maxOversPerBowler: number;
    customRulesText: string;
}

/**
 * Represents the entire state of the main match document in Firestore.
 */
export interface MatchData {
  teamA_id: string;
  teamB_id: string;
  status: 'Upcoming' | 'Live' | 'Innings Break' | 'Completed';
  currentInnings: number;
  onStrikeBatsmanId: string | null;
  nonStrikeBatsmanId: string | null;
  currentBowlerId: string | null;
  previousBowlerId: string | null;
  isFreeHit: boolean;
  tossWinnerId: string | null;
  tossDecision: 'bat' | 'bowl' | null;
  rules: MatchRules;
  innings1: Innings;
  innings2: Innings;
}

/**
 * Defines all the possible states our UI can be in.
 */
export type UiState = 'waiting_for_toss' | 'selecting_opening_players' | 'scoring' | 'selecting_next_batsman' | 'selecting_next_bowler' | 'selecting_wicket_type' | 'innings_break' | 'match_over';
