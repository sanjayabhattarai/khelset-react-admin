# Cricket Scoring App - Data Structure Documentation

This document provides a comprehensive overview of all data structures used in the Khelset Cricket Scoring Application. This serves as a reference for future development and maintenance.

## Table of Contents
1. [Firebase Collections Structure](#firebase-collections-structure)
2. [Core Cricket Types](#core-cricket-types)
3. [Match Data Structure](#match-data-structure)
4. [Player and Team Models](#player-and-team-models)
5. [Authentication Models](#authentication-models)
6. [UI State Management](#ui-state-management)
7. [Constants and Defaults](#constants-and-defaults)

## Firebase Collections Structure

### Database Organization
```
firestore/
├── users/                          # User profiles and authentication data
│   └── {userId}/
│       ├── email: string
│       └── role: 'user' | 'admin'
├── events/                         # Cricket events/tournaments
│   └── {eventId}/
│       ├── eventName: string
│       ├── status: string
│       └── createdBy: string       # User ID who created the event
├── teams/                          # Team information
│   └── {teamId}/
│       ├── name: string
│       ├── status: string
│       ├── eventId: string
│       ├── captainId: string
│       ├── createdBy: string       # User ID who created the team
│       └── players: string[]       # Array of player document IDs
├── players/                        # Individual player information
│   └── {playerId}/
│       ├── name: string
│       ├── role: string
│       └── createdBy: string       # User ID who created the player
└── matches/                        # Live match data
    └── {matchId}/
        ├── [Match Data Structure - see below]
        ├── deliveries/             # Subcollection for delivery history
        │   └── {deliveryId}/
        │       └── [Delivery Data]
        └── undoStack/              # Subcollection for undo functionality
            └── {undoId}/
                └── [Match State Snapshot]
```

## Core Cricket Types

### 1. Player Model
```typescript
interface Player {
  id: string;           // Unique identifier
  name: string;         // Player's display name
  role: string;         // Role (batsman, bowler, all-rounder, wicket-keeper)
}
```

### 2. Wicket Types
```typescript
type WicketType = 
  | 'bowled'         // Ball hits the stumps
  | 'caught'         // Ball caught by fielder
  | 'lbw'           // Leg Before Wicket
  | 'run_out'       // Run out while running
  | 'stumped'       // Wicket-keeper removes bails
  | 'hit_wicket'    // Batsman hits own wickets
  | 'retired_hurt'; // Batsman retires due to injury
```

### 3. Extra Types
```typescript
type ExtraType = 
  | 'wide'          // Ball too wide
  | 'no_ball'       // Illegal delivery
  | 'bye'           // Runs without touching bat
  | 'leg_bye';      // Runs off batsman's body
```

### 4. Wicket Details
```typescript
interface Wicket {
  type: WicketType;
  fielderId?: string;   // ID of fielder involved (for catches)
  bowlerId: string;     // ID of bowler
}
```

## Match Data Structure

### 1. Complete Match Data
```typescript
interface MatchData {
  // Team Information
  teamA_id: string;
  teamB_id: string;
  
  // Match Status
  status: 'Upcoming' | 'Live' | 'Innings Break' | 'Completed';
  currentInnings: number;           // 1 or 2
  
  // Current Players
  onStrikeBatsmanId: string | null;    // Batsman facing the ball
  nonStrikeBatsmanId: string | null;   // Batsman at non-striker end
  currentBowlerId: string | null;      // Current bowler
  previousBowlerId: string | null;     // Previous bowler (for change restrictions)
  
  // Game State
  isFreeHit: boolean;              // Next ball is a free hit
  tossWinnerId: string | null;     // Team that won the toss
  tossDecision: 'bat' | 'bowl' | null;  // Toss winner's decision
  
  // Match Configuration
  rules: MatchRules;
  
  // Innings Data
  innings1: Innings;
  innings2: Innings;
  
  // Post-Match Awards
  awards?: MatchAwards;
}
```

### 2. Match Rules Configuration
```typescript
interface MatchRules {
  totalOvers: number;          // Total overs per innings
  playersPerTeam: number;      // Number of players per team
  maxOversPerBowler: number;   // Maximum overs a bowler can bowl
  customRulesText: string;     // Additional custom rules
}
```

### 3. Innings Structure
```typescript
interface Innings {
  // Team Information
  battingTeamId: string | null;
  bowlingTeamId: string | null;
  battingTeamName: string;
  
  // Scoring Summary
  score: number;               // Total runs scored
  wickets: number;             // Total wickets fallen
  overs: number;               // Complete overs bowled
  ballsInOver: number;         // Balls in current over (0-5)
  
  // Detailed Statistics
  battingStats: BattingStat[]; // Individual batting performances
  bowlingStats: Bowler[];      // Individual bowling figures
}
```

### 4. Batting Statistics
```typescript
interface BattingStat {
  id: string;                  // Player ID
  name: string;                // Player name
  runs: number;                // Runs scored
  balls: number;               // Balls faced
  fours: number;               // Number of fours
  sixes: number;               // Number of sixes
  status: 'not_out' | 'out';   // Current status
  dismissal?: Wicket;          // How they got out (if applicable)
}
```

### 5. Bowling Statistics
```typescript
interface Bowler {
  id: string;                  // Player ID
  name: string;                // Player name
  overs: number;               // Overs bowled (e.g., 3.4 = 3 overs 4 balls)
  runs: number;                // Runs conceded
  wickets: number;             // Wickets taken
  isCurrent?: boolean;         // Is currently bowling
}
```

### 6. Delivery Details
```typescript
interface Delivery {
  ballId: string;              // Unique delivery identifier
  overNumber: number;          // Which over (1, 2, 3...)
  ballInOver: number;          // Ball in over (1-6)
  batsmanId: string;           // Batsman who faced the ball
  bowlerId: string;            // Bowler who bowled
  
  // Scoring Information
  runsScored: {
    batsman: number;           // Runs credited to batsman
    extras: number;            // Extra runs
    total: number;             // Total runs off this ball
  };
  
  // Ball Type
  extraType?: ExtraType;       // Type of extra (if any)
  isWicket: boolean;           // Was a wicket taken
  isLegal: boolean;            // Was it a legal delivery
  
  // Wicket Information
  wicketInfo?: {
    type: WicketType;
    batsmanId: string;         // Batsman who got out
    fielderId?: string;        // Fielder involved (if any)
  } | null;
}
```

## Player and Team Models

### 1. Team Structure
```typescript
interface Team {
  id: string;                  // Unique team identifier
  name: string;                // Team name
  status: string;              // Team status
  eventId: string;             // Associated event ID
  captainId: string;           // Captain's player ID
  players: string[];           // Array of player IDs
  createdBy: string;           // User who created the team
}
```

### 2. Event Structure
```typescript
interface Event {
  id: string;                  // Unique event identifier
  eventName: string;           // Event/tournament name
  status: string;              // Event status
  createdBy: string;           // User who created the event
}
```

## Authentication Models

### 1. User Profile
```typescript
interface UserProfile {
  email: string;               // User's email address
  role: 'user' | 'admin';      // User's permission level
}
```

### 2. Authentication Hook Return
```typescript
// useAuth() hook returns:
{
  user: User | null;           // Firebase auth user object
  profile: UserProfile | null; // Custom user profile from Firestore
  loading: boolean;            // Is authentication check in progress
}
```

## UI State Management

### 1. UI States
```typescript
type UiState = 
  | 'waiting_for_toss'         // Before toss is completed
  | 'selecting_opening_players' // Selecting opening batsmen and bowler
  | 'scoring'                  // Active scoring in progress
  | 'selecting_next_batsman'   // After wicket, selecting replacement
  | 'selecting_next_bowler'    // Changing bowler
  | 'selecting_wicket_type'    // Choosing how batsman got out
  | 'innings_break'            // Between innings
  | 'match_over';              // Match completed
```

### 2. Match Awards
```typescript
interface MatchAwards {
  bestBatsmanId: string | null;    // Player with highest score
  topWicketTakerId: string | null; // Player with most wickets
}
```

## Constants and Defaults

### 1. Default Innings State
```typescript
const DEFAULT_INNINGS_STATE: Innings = {
  battingTeamId: null,
  bowlingTeamId: null,
  battingTeamName: "TBD",
  score: 0,
  wickets: 0,
  overs: 0,
  ballsInOver: 0,
  battingStats: [],
  bowlingStats: [],
};
```

### 2. Common Cricket Rules
```typescript
// Standard T20 Configuration
const T20_RULES: MatchRules = {
  totalOvers: 20,
  playersPerTeam: 11,
  maxOversPerBowler: 4,
  customRulesText: "Standard T20 format"
};

// Standard T10 Configuration  
const T10_RULES: MatchRules = {
  totalOvers: 10,
  playersPerTeam: 11,
  maxOversPerBowler: 2,
  customRulesText: "Standard T10 format"
};
```

## Data Flow Summary

1. **User Authentication**: Users sign in and their profile is stored in `users` collection
2. **Event Creation**: Users create events stored in `events` collection
3. **Team Management**: Teams are created under events in `teams` collection
4. **Player Registration**: Individual players stored in `players` collection
5. **Match Creation**: Live matches use the `MatchData` structure in `matches` collection
6. **Real-time Scoring**: 
   - Main match state updated in match document
   - Individual deliveries stored in `deliveries` subcollection
   - Undo states stored in `undoStack` subcollection

## Security Model

- **User Isolation**: All data is filtered by `createdBy` field matching current user ID
- **Firebase Rules**: Enforce read/write permissions based on user authentication
- **Data Validation**: TypeScript interfaces ensure data consistency
- **Audit Trail**: All changes tracked through delivery history and undo stack

---

**Last Updated**: August 11, 2025  
**Version**: 1.0  
**Maintained By**: Khelset Development Team

This documentation should be updated whenever data structures are modified to maintain accuracy for future development.
