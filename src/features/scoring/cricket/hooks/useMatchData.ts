// src/features/scoring/cricket/hooks/useMatchData.ts
// This custom hook is the "brain" of the scoring interface.
// It is responsible for ALL data fetching and ALL data modification logic.

import { useState, useEffect, useMemo, useCallback, } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Services ---
// It uses the firestoreService to communicate with the database.
import {
  subscribeToMatch,
  getTeamPlayerIds,
  getPlayerDocs,
  getTeam,
  updateMatch,
  addDeliveryToHistory
} from '../services/firestoreService';

// --- Logic Utilities ---
// It uses pure utility functions for complex rule calculations.
import { processEnhancedDelivery } from '../logic/enhancedScoringUtils';
import { processWicket } from '../logic/dismissalUtils';
import { calculateMatchAwards } from '../logic/awardsUtils';
import { processEndOfOver } from '../logic/overUtils';

// --- Types ---
import { MatchData, Player, Bowler, BattingStat, ExtraType, WicketType, Delivery } from '../types';

/**
 * A custom hook to fetch and manage all data and actions for a given match ID.
 */
export const useMatchData = (matchId: string) => {
  // --- STATE MANAGEMENT ---
  // These state variables hold the raw data fetched from Firestore.
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [teamAName, setTeamAName] = useState<string>('');
  const [teamBName, setTeamBName] = useState<string>('');
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Undo functionality state - simple last delivery undo
  const [lastDeliveryState, setLastDeliveryState] = useState<MatchData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- DATA FETCHING EFFECTS ---

  // Subscribes to the main match document for real-time updates.
  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, (data) => {
      setMatchData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [matchId]);

  // Fetches related static data (players, team names) whenever the match data changes.
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!matchData) return;
      try {
        // Get team documents and names
        const [teamADoc, teamBDoc] = await Promise.all([
          getTeam(matchData.teamA_id),
          getTeam(matchData.teamB_id),
        ]);
        
        setTeamAName(teamADoc?.name || 'Team A');
        setTeamBName(teamBDoc?.name || 'Team B');
        
        // Get player IDs and fetch players from players collection
        const [teamAIds, teamBIds] = await Promise.all([
          getTeamPlayerIds(matchData.teamA_id),
          getTeamPlayerIds(matchData.teamB_id),
        ]);
        
        // Fetch players from players collection using IDs
        const [fetchedTeamAPlayers, fetchedTeamBPlayers] = await Promise.all([
          getPlayerDocs(teamAIds),
          getPlayerDocs(teamBIds),
        ]);

        setTeamAPlayers(fetchedTeamAPlayers);
        setTeamBPlayers(fetchedTeamBPlayers);
        
        // Check if we have players for both teams
        if (fetchedTeamAPlayers.length === 0 || fetchedTeamBPlayers.length === 0) {
          setError("Some teams have no players. Please check team setup.");
        } else {
          setError(null); // Clear any previous errors
        }
        
      } catch (e) {
        console.error("Failed to fetch related match data:", e);
        setError("Could not load team or player data.");
      }
    };
    fetchRelatedData();
  }, [matchData?.teamA_id, matchData?.teamB_id]);


  // --- DATA UPDATE HANDLERS ---
  // All functions that modify the database state now live inside this hook.
  // They are wrapped in useCallback for performance optimization.

  const handleTossComplete = useCallback(async (tossWinnerId: string, tossDecision: 'bat' | 'bowl') => {
    if (!matchData) return;
    const tossLoserId = tossWinnerId === matchData.teamA_id ? matchData.teamB_id : matchData.teamA_id;
    const battingTeam1Id = tossDecision === 'bat' ? tossWinnerId : tossLoserId;
    const bowlingTeam1Id = tossDecision === 'bowl' ? tossWinnerId : tossLoserId;
    const battingTeam1Name = battingTeam1Id === matchData.teamA_id ? teamAName : teamBName;
    const bowlingTeam1Name = bowlingTeam1Id === matchData.teamA_id ? teamAName : teamBName;

    await updateMatch(matchId, {
      tossWinnerId, tossDecision,
      'innings1.battingTeamId': battingTeam1Id, 'innings1.bowlingTeamId': bowlingTeam1Id, 'innings1.battingTeamName': battingTeam1Name,
      'innings2.battingTeamId': bowlingTeam1Id, 'innings2.bowlingTeamId': battingTeam1Id, 'innings2.battingTeamName': bowlingTeam1Name,
    });
  }, [matchData, matchId, teamAName, teamBName]);

  const handlePlayerSelectionComplete = useCallback(async (selection: { onStrikeBatsmanId: string; nonStrikeBatsmanId: string; currentBowlerId: string; }) => {
    if (!matchData) return;
    const { onStrikeBatsmanId, nonStrikeBatsmanId, currentBowlerId } = selection;
    const inningsKey = `innings${matchData.currentInnings}` as const;
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const getPlayerName = (id: string) => allPlayers.find(p => p.id === id)?.name || 'Unknown';
    
    const initialBattingStats: BattingStat[] = [
        { id: onStrikeBatsmanId, name: getPlayerName(onStrikeBatsmanId), runs: 0, balls: 0, fours: 0, sixes: 0, status: 'not_out' },
        { id: nonStrikeBatsmanId, name: getPlayerName(nonStrikeBatsmanId), runs: 0, balls: 0, fours: 0, sixes: 0, status: 'not_out' },
    ];
    const initialBowlingStats: Bowler[] = [{ id: currentBowlerId, name: getPlayerName(currentBowlerId), overs: 0, runs: 0, wickets: 0, isCurrent: true }];
    
    await updateMatch(matchId, {
      ...selection, status: 'Live',
      [`${inningsKey}.battingStats`]: initialBattingStats,
      [`${inningsKey}.bowlingStats`]: initialBowlingStats,
    });
  }, [matchId, matchData, teamAPlayers, teamBPlayers]);

  const handleInningsEnd = useCallback(async () => {
    if (!matchData) return;
    if (matchData.currentInnings === 1) {
      await updateMatch(matchId, { status: 'Innings Break', currentInnings: 2, onStrikeBatsmanId: null, nonStrikeBatsmanId: null, currentBowlerId: null, previousBowlerId: null });
    } else {
      const awards = calculateMatchAwards(matchData);
      await updateMatch(matchId, { status: 'Completed', awards });
    }
  }, [matchData, matchId]);

  // In useMatchData.ts

const handleDelivery = useCallback(async (runs: number, isLegal: boolean, isWicket: boolean, extraType?: ExtraType, wicketType?: WicketType, runType?: 'hit' | 'bye' | 'leg_bye') => {
  if (!matchData) throw new Error("Match data not available");

  // SIMPLE UNDO: Save current state before making changes
  setLastDeliveryState(JSON.parse(JSON.stringify(matchData))); // Deep copy

  // Use enhanced delivery processing for better cricket rules handling
  let result = processEnhancedDelivery(matchData, { runs, isLegal, isWicket, extraType, wicketType, runType });
  let dataToSave = result.updatedData;

  if (result.isOverComplete && !result.isInningsOver) {
    // Process end of over normally (rotate strike, set next bowler to null)
    dataToSave = processEndOfOver(result.updatedData);
  } else if (result.isInningsOver) {
    // FIXED: When innings ends, ensure currentBowlerId is null so UI doesn't ask for next bowler
    dataToSave.currentBowlerId = null;
    dataToSave.previousBowlerId = matchData.currentBowlerId;
  }

  // CRITICAL FIX: Save the delivery data immediately, even if there's a wicket
  // This ensures that over completion state is persisted before wicket confirmation
  await updateMatch(matchId, dataToSave);

  // Use the enhanced result's run breakdown for accurate delivery logging
  const runsBreakdown = result.runsBreakdown || {
    batsmanRuns: (isLegal && !extraType) ? runs : 0,
    extraRuns: (extraType === 'wide' || extraType === 'no_ball') ? 1 + runs : (extraType ? runs : 0),
    totalRuns: runs,
    penaltyRuns: 0
  };

  const updatedInnings = dataToSave.currentInnings === 1 ? dataToSave.innings1 : dataToSave.innings2;
  const updatedBowler = updatedInnings.bowlingStats.find((b: any) => b.isCurrent === true);
  const overNumber = updatedBowler ? Math.floor(updatedBowler.overs) : 0;
  const ballInOver = updatedBowler ? Math.round((updatedBowler.overs - overNumber) * 10) : 0;

  // Build wicket info conditionally to avoid undefined values
  const wicketInfo = result.isWicketFallen && wicketType ? {
    type: wicketType,
    batsmanId: matchData.onStrikeBatsmanId!,
    // Only include fielderId if it has a valid value (not for run-outs from wide/no-ball extras)
    // fielderId will be added by WicketModal for actual fielder-involved dismissals
  } : null;

  const deliveryLog: Delivery = {
      ballId: uuidv4(),
      overNumber,
      ballInOver,
      batsmanId: matchData.onStrikeBatsmanId!,
      bowlerId: matchData.currentBowlerId!,
      runsScored: { 
        batsman: runsBreakdown.batsmanRuns, 
        extras: runsBreakdown.extraRuns, 
        total: runsBreakdown.totalRuns 
      },
      isWicket: result.isWicketFallen,
      isLegal,
      ...(extraType && { extraType }),
      ...(wicketInfo && { wicketInfo }),
  };
  
  await addDeliveryToHistory(matchId, matchData.currentInnings, deliveryLog);
  // NOTE: Match data was already saved above immediately after processing

  if (result.isInningsOver) {
    await handleInningsEnd();
  }
  
  return result;
}, [matchData, matchId, handleInningsEnd]);
  

// FIXED: Process wicket properly - delivery already processed in onWicket, just handle dismissal
const handleWicketConfirm = useCallback(async (type: WicketType, batsmanId: string, fielderId?: string) => {
    if (!matchData) return;

    // SIMPLE UNDO: Save current state before wicket confirmation
    setLastDeliveryState(JSON.parse(JSON.stringify(matchData))); // Deep copy

    // The delivery was already processed in onWicket (ball counted, over completion handled)
    // We only need to process the wicket dismissal
    
    let finalData = matchData;
    
    // CRITICAL FIX: Don't double-process runs for run-outs
    // The runs were already processed in the original handleDelivery call
    // We only need to handle the dismissal logic here
    
    // Process the wicket dismissal (batsman positioning and stats)
    finalData = processWicket(finalData, type, batsmanId, fielderId);
    
    // Get current innings for checking end conditions
    const currentInnings = finalData.currentInnings === 1 ? finalData.innings1 : finalData.innings2;

    // Save the final result to Firestore
    await updateMatch(matchId, finalData);

    // Check if innings is over
    if (currentInnings.wickets >= (finalData.rules.playersPerTeam - 1)) {
        await handleInningsEnd();
    }
}, [matchData, matchId, handleInningsEnd]);
  
  const handleSetNextBatsman = useCallback(async (batsmanId: string) => {
    if (!matchData) return;
    const inningsKey = `innings${matchData.currentInnings}` as const;
    const currentInnings = matchData.currentInnings === 1 ? matchData.innings1 : matchData.innings2;
    if (!currentInnings) return;

    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const newBatsman: BattingStat = { id: batsmanId, name: allPlayers.find(p => p.id === batsmanId)?.name || 'Unknown', runs: 0, balls: 0, fours: 0, sixes: 0, status: 'not_out' };
    
    const updatedBattingStats = [...currentInnings.battingStats, newBatsman];
    
    // FIXED: Determine which position (strike/non-strike) needs to be filled
    const updateData: any = { [`${inningsKey}.battingStats`]: updatedBattingStats };
    
    if (matchData.onStrikeBatsmanId === null) {
      // On-strike position is vacant, place new batsman there
      updateData.onStrikeBatsmanId = batsmanId;
    } else if (matchData.nonStrikeBatsmanId === null) {
      // Non-strike position is vacant, place new batsman there
      updateData.nonStrikeBatsmanId = batsmanId;
    } else {
      // Fallback: if somehow both positions are filled, replace on-strike
      updateData.onStrikeBatsmanId = batsmanId;
    }
    
    await updateMatch(matchId, updateData);
  }, [matchId, matchData, teamAPlayers, teamBPlayers]);
  
  const handleSetNextBowler = useCallback(async (newBowlerId: string) => {
    if (!matchData) return;
    const currentInningsData = matchData.currentInnings === 1 ? matchData.innings1 : matchData.innings2;
    if (!currentInningsData) return;
    
    const inningsKey = `innings${matchData.currentInnings}`;
    let currentBowlingStats = currentInningsData.bowlingStats || [];
    const bowlingTeamPlayers = matchData.teamA_id === currentInningsData.bowlingTeamId ? teamAPlayers : teamBPlayers;
    const newBowlerData = bowlingTeamPlayers.find(p => p.id === newBowlerId);
    if (!newBowlerData) return;

    const bowlerExists = currentBowlingStats.some(b => b.id === newBowlerId);
    let updatedBowlingStats;

    if (bowlerExists) {
      updatedBowlingStats = currentBowlingStats.map((bowler: Bowler) => ({ ...bowler, isCurrent: bowler.id === newBowlerId }));
    } else {
      const statsWithOldBowlerDeselected = currentBowlingStats.map(b => ({ ...b, isCurrent: false }));
      const newBowlerRecord: Bowler = { id: newBowlerId, name: newBowlerData.name, overs: 0, runs: 0, wickets: 0, isCurrent: true };
      updatedBowlingStats = [...statsWithOldBowlerDeselected, newBowlerRecord];
    }
    
    await updateMatch(matchId, {
      [`${inningsKey}.bowlingStats`]: updatedBowlingStats,
      currentBowlerId: newBowlerId,
      previousBowlerId: matchData.currentBowlerId,
    });
  }, [matchData, matchId, teamAPlayers, teamBPlayers]);

  const handleUndo = useCallback(async () => {
    if (!lastDeliveryState) {
      console.log('❌ No last delivery state available for undo');
      alert("No delivery to undo.");
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Simply restore the last saved state
      await updateMatch(matchId, lastDeliveryState);
      
      // Clear the undo state since it's been used
      setLastDeliveryState(null);
      
    } catch (error) {
      console.error('❌ Undo failed:', error);
      alert("Failed to undo. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [lastDeliveryState, matchId]);


  // --- DERIVED DATA ---
  // useMemo calculates derived values from the raw state, optimizing performance.
  const derivedData = useMemo(() => {
    if (!matchData) return {};
    const innings = matchData.currentInnings === 1 ? matchData.innings1 : matchData.innings2;
    const battingStats = Array.isArray(innings?.battingStats) ? innings.battingStats : [];
    const bowlingStats = Array.isArray(innings?.bowlingStats) ? innings.bowlingStats : [];
    const battingTeamId = innings?.battingTeamId;
    const battingTeam = matchData.teamA_id === battingTeamId ? teamAPlayers : teamBPlayers;
    const availableBatsmen = battingTeam.filter(p => !battingStats.some(b => b.id === p.id));
    
    // Current batsmen who can be run out (both on-strike and non-strike)
    const currentBatsmen = [
      battingStats.find(p => p.id === matchData.onStrikeBatsmanId),
      battingStats.find(p => p.id === matchData.nonStrikeBatsmanId)
    ].filter(Boolean).map(stat => {
      const player = battingTeam.find(p => p.id === stat!.id);
      return { 
        id: stat!.id, 
        name: player?.name || stat!.name,
        role: player?.role || 'Batsman' // Default role if not found
      };
    });

    return {
      currentInningsData: innings,
      onStrikeBatsman: battingStats.find(p => p.id === matchData.onStrikeBatsmanId),
      nonStrikeBatsman: battingStats.find(p => p.id === matchData.nonStrikeBatsmanId),
      currentBowler: bowlingStats.find(b => b.isCurrent === true), // Use the reliable 'isCurrent' flag
      battingTeamPlayers: battingTeam,
      bowlingTeamPlayers: matchData.teamA_id === battingTeamId ? teamBPlayers : teamAPlayers,
      availableBatsmen,
      currentBatsmen, // NEW: Both batsmen currently at the crease who can be run out
    };
  }, [matchData, teamAPlayers, teamBPlayers]);


  return {
    loading, error, matchData, isUpdating,
    teamAPlayers, teamBPlayers, teamAName, teamBName,
    ...derivedData,
    handleTossComplete,
    handlePlayerSelectionComplete,
    handleDelivery,
    handleWicketConfirm,
    handleSetNextBatsman,
    handleSetNextBowler,
    handleUndo,
    canUndo: !!lastDeliveryState, // Simple: can undo if we have a saved state
  };
};