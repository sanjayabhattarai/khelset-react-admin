// src/features/scoring/cricket/types/index.ts

/**
 * Represents a single player's basic information.
 */
export interface Player {
  id: string;
  name: string;
  role: string;
  teamId?: string | null; // ID of the team this player belongs to (null if unassigned)
  createdBy?: string; // ID of the user who created this player
}

/**
 * Defines all possible ways a batsman can be dismissed.
 */
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'retired_hurt';

/**
 * Defines all possible types of extra deliveries.
 */
export type ExtraType = 'wide' | 'no_ball' | 'bye' | 'leg_bye';

// ✨ ADDED: A dedicated type for dismissal information. This replaces the old inline object.
export interface Wicket {
  type: WicketType;
  fielderId?: string;
  bowlerId: string;
}

// ✨ RENAMED: from 'Batsman' for clarity and added more fields.
/**
 * Represents a player's batting statistics within an innings.
 */
export interface BattingStat {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  status: 'not_out' | 'out';
  dismissal?: Wicket; // Uses the new Wicket type
}

// ✨ UPDATED: The 'isCurrent' flag has been added.
/**
 * Represents a bowler's statistics within an innings.
 */
export interface Bowler {
  id: string;
  name: string;
  overs: number;
  runs: number;
  wickets: number;
  isCurrent?: boolean; // This flag identifies the active bowler
}

/**
 * A detailed model for a single delivery.
 */
export interface Delivery {
  ballId: string;
  overNumber: number;
  ballInOver: number;
  batsmanId: string;
  bowlerId: string;
  batsmanName: string;
  bowlerName: string;
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
  commentary?: string;
}

/**
 * Represents the complete state of a single innings.
 */
export interface Innings {
  battingTeamId: string | null;
  bowlingTeamId: string | null;
  battingTeamName: string;
  score: number;
  wickets: number;
  overs: number;
  ballsInOver: number; // Track balls in current over (0-5)
  battingStats: BattingStat[]; // ✨ UPDATED: Now uses BattingStat
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

// ✨ ADDED: A dedicated type for match awards.
export interface MatchAwards {
  bestBatsmanId: string | null;
  topWicketTakerId: string | null;
}

/**
 * Represents the entire state of the main match document in Firestore.
 */
export interface MatchData {
  eventId: string;
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
  awards?: MatchAwards; // ✨ ADDED: Awards object
}

export interface Team {
  id: string;
  name: string;
  status: string;
  eventId: string;
  captainId: string;
  players: string[]; // This is an array of player document IDs
}


/**
 * Defines all the possible states our UI can be in.
 */
export type UiState = 'waiting_for_toss' | 'selecting_opening_players' | 'scoring' | 'selecting_next_batsman' | 'selecting_next_bowler' | 'selecting_wicket_type' | 'innings_break' | 'match_over';

/**
 * Represents event data with match rules configuration.
 */
export interface EventData {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  scheduledTime?: any;
  status: string;
  rules?: {
    totalOvers: number;
    playersPerTeam: number;
    maxOversPerBowler: number;
    customRulesText: string;
  };
  createdBy: string;
  createdAt?: any;
}