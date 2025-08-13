# Cricket App Data Flow Diagram

## High-Level Data Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE DATABASE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    users    │    │   events    │    │    teams    │         │
│  │ collection  │    │ collection  │    │ collection  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │              │
│         │                   │                   │              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   players   │    │   matches   │    │             │         │
│  │ collection  │    │ collection  │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                             │                                  │
│                      ┌─────────────┐                          │
│                      │ deliveries  │                          │
│                      │subcollection│                          │
│                      └─────────────┘                          │
│                             │                                  │
│                      ┌─────────────┐                          │
│                      │ undoStack   │                          │
│                      │subcollection│                          │
│                      └─────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Match Data Structure Flow

```
MatchData
├── Team Information
│   ├── teamA_id (string)
│   └── teamB_id (string)
│
├── Current State
│   ├── status: Upcoming|Live|Innings Break|Completed
│   ├── currentInnings: 1|2
│   ├── onStrikeBatsmanId (string|null)
│   ├── nonStrikeBatsmanId (string|null)
│   ├── currentBowlerId (string|null)
│   └── previousBowlerId (string|null)
│
├── Game Rules
│   ├── totalOvers (number)
│   ├── playersPerTeam (number)
│   ├── maxOversPerBowler (number)
│   └── customRulesText (string)
│
├── Innings 1
│   ├── battingTeamId (string)
│   ├── score (number)
│   ├── wickets (number)
│   ├── overs (number)
│   ├── battingStats[]
│   │   ├── Player 1: {runs, balls, fours, sixes, status}
│   │   ├── Player 2: {runs, balls, fours, sixes, status}
│   │   └── ...
│   └── bowlingStats[]
│       ├── Bowler 1: {overs, runs, wickets}
│       ├── Bowler 2: {overs, runs, wickets}
│       └── ...
│
├── Innings 2
│   └── [Same structure as Innings 1]
│
└── Match Awards
    ├── bestBatsmanId (string|null)
    └── topWicketTakerId (string|null)
```

## User Data Isolation Model

```
User Authentication
        │
        ▼
┌─────────────────┐
│   User Signs In  │
│  (Firebase Auth) │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Profile Loaded │
│   (Firestore)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Data Filtering  │
│ createdBy: uid  │
└─────────────────┘
        │
        ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ Events  │    │ Teams   │    │ Players │
    │ (User)  │    │ (User)  │    │ (User)  │
    └─────────┘    └─────────┘    └─────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
                ┌─────────────┐
                │   Matches   │
                │   (User)    │
                └─────────────┘
```

## Cricket Scoring Flow

```
Ball Bowled
    │
    ▼
┌─────────────────┐
│ Process Delivery │
│  - Legal/Illegal │
│  - Runs Scored  │
│  - Wicket?      │
└─────────────────┘
    │
    ▼
┌─────────────────┐     No     ┌─────────────────┐
│   Is Wicket?    │ ─────────► │  Update Scores  │
└─────────────────┘            │  Continue Play  │
    │ Yes                      └─────────────────┘
    ▼
┌─────────────────┐
│ Wicket Modal    │
│ - Type?         │
│ - Fielder?      │
│ - Runs? (runout)│
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Process Wicket  │
│ - Update Stats  │
│ - Remove Batsman│
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Innings Over?   │
│ (10 wickets or  │
│  overs complete)│
└─────────────────┘
    │
    ▼
┌─────────────────┐     No     ┌─────────────────┐
│   Match Over?   │ ─────────► │ Select Next     │
│ (both innings)  │            │ Batsman/Bowler  │
└─────────────────┘            └─────────────────┘
    │ Yes
    ▼
┌─────────────────┐
│ Calculate Awards│
│ Complete Match  │
└─────────────────┘
```

## Real-time Data Synchronization

```
React Component
    │ (useMatchData hook)
    ▼
Firebase Listener
    │ (onSnapshot)
    ▼
Firestore Database
    │ (matches/{matchId})
    ▼
Auto-update UI
    │ (React state)
    ▼
User Sees Changes
```

## Key Data Relationships

1. **User → Events**: One user can create multiple events
2. **Event → Teams**: One event can have multiple teams  
3. **Team → Players**: One team has multiple players
4. **Match → Teams**: One match involves exactly 2 teams
5. **Match → Deliveries**: One match has many deliveries (subcollection)
6. **Match → Undo States**: One match has many undo snapshots (subcollection)
7. **Delivery → Players**: Each delivery links to batsman and bowler
8. **Wicket → Players**: Each wicket links to batsman, bowler, and optionally fielder

This visual representation helps understand how data flows through the application and how different entities relate to each other.
