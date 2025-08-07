# Cricket Scoring Logic Implementation Guide

## Overview
This guide explains how to properly handle wide balls and no-balls in cricket scoring, including additional runs, wickets, and strike changes.

## Current Issues in Your System

### 1. Strike Rotation Logic
**Problem**: The current logic rotates strike based on total runs, but it should be based on runs completed by batsmen running.

**Fix**: Use the `runs` parameter (batsmen runs) for strike rotation, not the total runs including penalties.

### 2. Run Attribution
**Problem**: All runs are currently attributed the same way regardless of extra type.

**Fix**: Implement proper run distribution:
- **Wide**: 1 penalty + batsmen runs → all to extras
- **No-ball**: 1 penalty + batsmen runs → penalty to extras, batsmen runs to batsman if hit
- **Bye/Leg-bye**: batsmen runs → all to extras

### 3. Ball Counting
**Problem**: Inconsistent ball counting for different extras.

**Fix**: 
- Wide: No ball count for batsman
- No-ball: No ball count for batsman (free hit)
- Bye/Leg-bye: Count as ball faced

## Implementation Strategy

### Phase 1: Update Modal Components

1. **Enhanced WideNoBallModal**: ✅ DONE
   - Added wicket type selection
   - Proper parameter passing
   - Clear UI for different scenarios

### Phase 2: Update Scoring Logic

1. **Use Enhanced Scoring Function**: 
   ```typescript
   // Replace current processDelivery with processEnhancedDelivery
   import { processEnhancedDelivery } from './logic/enhancedScoringUtils';
   ```

2. **Update useMatchData Hook**:
   ```typescript
   const handleDelivery = useCallback(async (
     runs: number, 
     isLegal: boolean, 
     isWicket: boolean, 
     extraType?: ExtraType,
     wicketType?: WicketType
   ) => {
     // Use enhanced delivery processing
     let result = processEnhancedDelivery(matchData, { 
       runs, 
       isLegal, 
       isWicket, 
       extraType,
       wicketType 
     });
     // ... rest of the logic
   }, []);
   ```

### Phase 3: Update Component Interfaces

1. **ScoringPanel**: ✅ DONE
   - Updated to handle wicket type from modal

2. **Update onDelivery prop signature**:
   ```typescript
   interface ScoringPanelProps {
     onDelivery: (
       runs: number, 
       isLegal: boolean, 
       isWicket: boolean, 
       extraType?: ExtraType,
       wicketType?: WicketType
     ) => void;
     // ... other props
   }
   ```

## Specific Scenarios Handled

### Wide Ball Scenarios
1. **Wide + 0 runs**: 1 run to extras, no strike change
2. **Wide + runs**: 1 penalty + runs to extras, strike changes if odd runs
3. **Wide + run out**: 1 penalty + runs to extras, wicket recorded, strike changes based on completed runs

### No-Ball Scenarios
1. **No-ball + 0 runs**: 1 run to extras, no strike change, free hit next
2. **No-ball + batsman hits**: 1 penalty to extras + runs to batsman, strike changes if odd runs
3. **No-ball + bye runs**: 1 penalty + runs to extras, strike changes if odd runs
4. **No-ball + run out/stumped**: Wicket valid, proper run attribution

### Strike Change Logic
```typescript
// Strike changes when batsmen complete odd runs (not including penalties)
if (runs > 0 && runs % 2 === 1) {
  // Swap strike
  [onStrike, nonStrike] = [nonStrike, onStrike];
}
```

## Testing Scenarios

Test these specific cases:

1. **Wide + 3 runs + run out**
   - Expected: 4 runs to extras, strike changes, wicket recorded

2. **No-ball + batsman hits 4**
   - Expected: 1 to extras, 4 to batsman, no strike change, free hit next

3. **No-ball + 2 bye runs**
   - Expected: 3 runs to extras, strike changes, free hit next

4. **Wide + 1 run**
   - Expected: 2 runs to extras, strike changes

## Files Modified/Created

1. ✅ `WideNoBallModal.tsx` - Enhanced with wicket type selection
2. ✅ `ScoringPanel.tsx` - Updated modal handling
3. ✅ `enhancedScoringUtils.ts` - New comprehensive scoring logic
4. 🟡 `useMatchData.ts` - Needs update to use enhanced logic
5. 🟡 Component interfaces - Need signature updates

## Next Steps

1. **Update useMatchData.ts** to use the enhanced scoring logic
2. **Update component prop signatures** throughout the app
3. **Test all scenarios** thoroughly
4. **Update existing processDelivery calls** to use the new function

## Migration Path

1. Keep existing logic as fallback
2. Gradually replace calls to `processDelivery` with `processEnhancedDelivery`
3. Test each scenario individually
4. Remove old logic once everything is working

This approach ensures cricket scoring rules are properly implemented with correct run attribution, strike rotation, and wicket handling.
