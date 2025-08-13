# Quick Reference Guide - Cricket App Data Structures

## 🏏 Essential Data Models (Quick Lookup)

### Core Match State
```typescript
// Main match document structure
MatchData {
  teamA_id, teamB_id: string
  status: 'Upcoming'|'Live'|'Innings Break'|'Completed'
  currentInnings: 1|2
  onStrikeBatsmanId, nonStrikeBatsmanId: string|null
  currentBowlerId, previousBowlerId: string|null
  tossWinnerId: string|null, tossDecision: 'bat'|'bowl'|null
  innings1, innings2: Innings
  rules: MatchRules
}
```

### Cricket Scoring Basics
```typescript
// Each innings contains
Innings {
  score: number         // Total runs
  wickets: number       // Wickets fallen
  overs: number         // Complete overs
  ballsInOver: 0-5      // Current over progress
  battingStats: []      // Individual batting
  bowlingStats: []      // Individual bowling
}

// Individual performance
BattingStat {
  runs, balls, fours, sixes: number
  status: 'not_out'|'out'
  dismissal?: Wicket
}

Bowler {
  overs, runs, wickets: number
  isCurrent?: boolean
}
```

### Delivery Processing
```typescript
// Each ball bowled
Delivery {
  runsScored: { batsman, extras, total: number }
  isWicket, isLegal: boolean
  extraType?: 'wide'|'no_ball'|'bye'|'leg_bye'
  wicketInfo?: { type, batsmanId, fielderId? }
}
```

## 🔧 Common Operations

### Creating New Match
```typescript
const newMatch: MatchData = {
  teamA_id: "team1", teamB_id: "team2",
  status: 'Upcoming', currentInnings: 1,
  onStrikeBatsmanId: null, nonStrikeBatsmanId: null,
  currentBowlerId: null, tossWinnerId: null,
  innings1: DEFAULT_INNINGS_STATE,
  innings2: DEFAULT_INNINGS_STATE,
  rules: { totalOvers: 20, playersPerTeam: 11, maxOversPerBowler: 4 }
}
```

### Processing Regular Delivery
```typescript
// Add runs to batsman and team
const delivery = processEnhancedDelivery(matchData, {
  runs: 4,          // Runs scored
  isLegal: true,    // Legal delivery
  isWicket: false   // No wicket
});
```

### Processing Wicket
```typescript
// Handle wicket with run-out runs
const wicketDelivery = processEnhancedDelivery(matchData, {
  runs: 1,               // Completed runs (for run-outs)
  isLegal: true,
  isWicket: true,
  wicketType: 'run_out'
});
```

### Processing Extras
```typescript
// Wide ball (illegal delivery)
const wideDelivery = processEnhancedDelivery(matchData, {
  runs: 1,          // Wide run
  isLegal: false,   // Illegal delivery
  extraType: 'wide'
});
```

## 📊 Firebase Collections Quick Reference

```
firestore/
├── users/{uid}           → { email, role }
├── events/{eventId}      → { eventName, status, createdBy }
├── teams/{teamId}        → { name, eventId, players[], createdBy }
├── players/{playerId}    → { name, role, createdBy }
└── matches/{matchId}/
    ├── [MatchData]
    ├── deliveries/{id}   → [Delivery data]
    └── undoStack/{id}    → [Match snapshots]
```

## 🎯 UI State Management

```typescript
type UiState = 
  | 'waiting_for_toss'         // Pre-match
  | 'selecting_opening_players' // Setup
  | 'scoring'                  // Active play
  | 'selecting_next_batsman'   // Post-wicket
  | 'selecting_next_bowler'    // Bowling change
  | 'innings_break'            // Between innings
  | 'match_over'               // Completed
```

## 🛡️ Security Rules Pattern

```javascript
// All collections follow this pattern
match /collection/{docId} {
  allow read, write: if request.auth != null 
    && resource.data.createdBy == request.auth.uid;
}
```

## ⚡ Key Functions Quick Access

### useMatchData Hook
```typescript
const {
  matchData,              // Current match state
  handleDelivery,         // Process ball
  handleWicketConfirm,    // Process wicket
  handleSetNextBatsman,   // Replace batsman
  handleUndo              // Undo last action
} = useMatchData(matchId);
```

### Scoring Utilities
```typescript
import { 
  processEnhancedDelivery,  // Main scoring logic
  processWicket,            // Wicket processing  
  processExtras,            // Extra runs
  calculateAwards           // Match awards
} from './logic/scoringUtils';
```

## 🏃‍♂️ Common Scenarios

### Scenario 1: Regular Scoring
1. User clicks runs (1,2,3,4,6)
2. `handleDelivery()` called
3. `processEnhancedDelivery()` updates scores
4. UI auto-updates via Firebase listener

### Scenario 2: Wicket Handling  
1. User clicks "Wicket"
2. WicketModal appears
3. User selects wicket type + fielder
4. `handleWicketConfirm()` processes wicket
5. NextBatsmanSelector appears

### Scenario 3: Run-out with Completed Runs
1. User clicks "Wicket" 
2. Selects "Run Out" + enters completed runs
3. `handleWicketConfirm()` passes runs to scoring
4. Both runs AND wicket are processed

### Scenario 4: Extras
1. User clicks "Wide" or "No Ball"
2. ExtrasModal appears  
3. User enters additional runs
4. `processEnhancedDelivery()` handles illegal delivery

---

**💡 Pro Tips:**
- Always check `isLegal` flag for ball counting
- Run-outs process runs during wicket confirmation
- Other wickets process runs in original delivery
- Undo stack maintains last 10 states automatically
- All changes are real-time synced across devices

**🚀 File Locations:**
- Types: `src/features/scoring/cricket/types/`
- Logic: `src/features/scoring/cricket/logic/`
- Hooks: `src/features/scoring/cricket/hooks/`
- Components: `src/features/scoring/cricket/components/`
