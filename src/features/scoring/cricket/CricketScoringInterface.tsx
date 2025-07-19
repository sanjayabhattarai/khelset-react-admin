// src/features/scoring/cricket/CricketScoringInterface.tsx
// This is the main orchestrator component for the scoring feature.
// This version contains the final, corrected logic for UI state, wicket logging, and over management.

import { useState, useEffect, useCallback } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Import uuid to generate unique IDs for deliveries

// --- Hooks & Services ---
import { useMatchData } from './hooks/useMatchData';
import { updateMatch } from './services/firestoreService';

// --- Logic Utilities ---
import { processDelivery } from './logic/scoringUtils';
import { processWicket } from './logic/dismissalUtils';
import { processEndOfOver } from './logic/overUtils';
import { revertToPreviousState } from './logic/undoUtils';

// --- UI Components ---
import { TossSelector } from './components/TossSelector';
import { TeamPlayerSelector } from './components/TeamPlayerSelector';
import { NextBatsmanSelector } from './components/NextBatsmanSelector';
import { NextBowlerSelector } from './components/NextBowlerSelector';
import { WicketModal } from './components/WicketModal';
import { ScoringPanel } from './components/ScoringPanel';
import { MatchHeader } from './components/MatchHeader';
import { InningsBreakScreen } from './components/InningsBreakScreen';
import { MatchSummary } from './components/MatchSummary';

// --- Types ---
import { WicketType, Delivery, ExtraType } from './types';

interface CricketScoringProps {
  matchId: string;
}

export function CricketScoringInterface({ matchId }: CricketScoringProps) {
  // --- STATE MANAGEMENT ---
  const {
    loading,
    error,
    matchData,
    teamAPlayers,
    teamBPlayers,
    currentInningsData,
    onStrikeBatsman,
    nonStrikeBatsman,
    currentBowler,
    bowlingTeamPlayers,
    availableBatsmen,
  } = useMatchData(matchId);

  const [uiState, setUiState] = useState<'waiting_for_toss' | 'scoring' | 'selecting_opening_players' | 'selecting_next_batsman' | 'selecting_next_bowler' | 'selecting_wicket_type' | 'innings_break' | 'match_over'>('waiting_for_toss');
  const [isUpdating, setIsUpdating] = useState(false);
  const [wicketInfo, setWicketInfo] = useState<{ batsmanId: string } | null>(null);

  // --- UI STATE LOGIC ---
  useEffect(() => {
    if (loading || !matchData) return;
    const isIdle = uiState === 'scoring' || uiState === 'waiting_for_toss' || uiState === 'innings_break' || uiState === 'match_over';
    if (isIdle) {
        if (matchData.status === 'Completed') setUiState('match_over');
        else if (matchData.status === 'Innings Break') setUiState('innings_break');
        else if (!matchData.tossWinnerId) setUiState('waiting_for_toss');
        else if (!matchData.onStrikeBatsmanId || !matchData.currentBowlerId) setUiState('selecting_opening_players');
        else setUiState('scoring');
    }
  }, [matchData, loading, uiState]);


  // --- CORE LOGIC HANDLERS ---
  const handleTossComplete = useCallback(async (tossWinnerId: string, tossDecision: 'bat' | 'bowl') => {
    if (!matchData) return;
    const tossLoserId = tossWinnerId === matchData.teamA_id ? matchData.teamB_id : matchData.teamA_id;
    const battingTeamId = tossDecision === 'bat' ? tossWinnerId : tossLoserId;
    const bowlingTeamId = tossDecision === 'bowl' ? tossWinnerId : tossLoserId;
    const updatePayload = {
        tossWinnerId, tossDecision,
        'innings1.battingTeamId': battingTeamId, 'innings1.bowlingTeamId': bowlingTeamId,
        'innings2.battingTeamId': bowlingTeamId, 'innings2.bowlingTeamId': battingTeamId,
    };
    await updateMatch(matchId, updatePayload);
  }, [matchData, matchId]);

  const handlePlayerSelectionComplete = useCallback(async (selection: { onStrikeBatsmanId: string; nonStrikeBatsmanId: string; currentBowlerId: string; }) => {
    if (!matchData) return;
    const { onStrikeBatsmanId, nonStrikeBatsmanId, currentBowlerId } = selection;
    const inningsKey = `innings${matchData.currentInnings}` as const;
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const getPlayerName = (id: string) => allPlayers.find(p => p.id === id)?.name || 'Unknown';
    const initialBattingStats = [
        { id: onStrikeBatsmanId, name: getPlayerName(onStrikeBatsmanId), runs: 0, balls: 0, status: 'not_out' as const },
        { id: nonStrikeBatsmanId, name: getPlayerName(nonStrikeBatsmanId), runs: 0, balls: 0, status: 'not_out' as const },
    ];
    const initialBowlingStats = [{ id: currentBowlerId, name: getPlayerName(currentBowlerId), overs: 0, runs: 0, wickets: 0 }];
    const updatePayload = { 
      ...selection, status: 'Live' as const,
      [`${inningsKey}.battingStats`]: initialBattingStats,
      [`${inningsKey}.bowlingStats`]: initialBowlingStats,
    };
    await updateMatch(matchId, updatePayload);
    setUiState('scoring');
  }, [matchId, matchData, teamAPlayers, teamBPlayers]);

  const handleInningsEnd = useCallback(async () => {
    if (!matchData) return;
    if (matchData.currentInnings === 1) {
        await updateMatch(matchId, { status: 'Innings Break', currentInnings: 2, onStrikeBatsmanId: null, nonStrikeBatsmanId: null, currentBowlerId: null, previousBowlerId: null });
    } else {
        await updateMatch(matchId, { status: 'Completed' });
    }
  }, [matchData, matchId]);

  const handleDelivery = useCallback(async (runs: number, isLegal: boolean, isWicket: boolean, extraType?: ExtraType) => {
    if (!matchData || isUpdating || !matchData.onStrikeBatsmanId || !matchData.currentBowlerId) return;
    
    setIsUpdating(true);

    try {
      const { updatedData, isOverComplete, isWicketFallen, isInningsOver } = processDelivery(matchData, { runs, isLegal, isWicket, extraType });
      
      const inningsKey = `innings${matchData.currentInnings}` as const;
      const innings = matchData.currentInnings === 1 ? matchData.innings1 : matchData.innings2;
      
      const batsmanRuns = (isLegal && !extraType) ? runs : 0;
      const extraRuns = (extraType === 'wide' || extraType === 'no_ball') ? 1 + runs : (extraType ? runs : 0);
      
      const deliveryLog: Delivery = {
          ballId: uuidv4(),
          overNumber: Math.floor(innings.overs),
          ballInOver: innings.ballsInOver + 1,
          batsmanId: matchData.onStrikeBatsmanId,
          bowlerId: matchData.currentBowlerId,
          runsScored: { batsman: batsmanRuns, extras: extraRuns, total: batsmanRuns + extraRuns },
          isWicket: isWicketFallen,
          isLegal,
          ...(extraType && { extraType }),
          ...(isWicketFallen && { wicketInfo: null }),
      };

      if (!updatedData[inningsKey].deliveryHistory) updatedData[inningsKey].deliveryHistory = [];
      if (!updatedData[inningsKey].undoStack) updatedData[inningsKey].undoStack = [];

      updatedData[inningsKey].deliveryHistory.push(deliveryLog);
      updatedData[inningsKey].undoStack.push(JSON.stringify(matchData));

      if (isInningsOver) {
          await updateMatch(matchId, updatedData);
          handleInningsEnd();
      } else if (isWicketFallen) {
        setWicketInfo({ batsmanId: matchData.onStrikeBatsmanId! });
        setUiState('selecting_wicket_type');
        await updateMatch(matchId, updatedData);
      } else if (isOverComplete) {
        const finalData = processEndOfOver(updatedData);
        await updateMatch(matchId, finalData);
        setUiState('selecting_next_bowler');
      } else {
        await updateMatch(matchId, updatedData);
      }
    } catch (error) {
        console.error("Error processing delivery:", error);
    } finally {
        setIsUpdating(false);
    }
  }, [matchData, matchId, isUpdating, handleInningsEnd]);

  /**
   * ✨ FIX: This function now correctly handles a wicket delivery.
   * A wicket is treated as a legal, 0-run delivery that also results in a wicket.
   * Calling handleDelivery ensures the ball is counted and logged correctly
   * before the UI switches to ask for the dismissal type.
   */
  const handleWicket = useCallback(() => {
    handleDelivery(0, true, true);
  }, [handleDelivery]);

  const handleWicketConfirm = useCallback(async (type: WicketType, fielderId?: string) => {
    if (!matchData || !wicketInfo) return;
    setIsUpdating(true);
    
    try {
      let updatedData = processWicket(matchData, type, wicketInfo.batsmanId, fielderId);
      
      const inningsKey = `innings${updatedData.currentInnings}` as const;
      const innings = updatedData.currentInnings === 1 ? updatedData.innings1 : updatedData.innings2;
      const history = innings.deliveryHistory;
      
      if (history && history.length > 0) {
          const newWicketInfo = { type, batsmanId: wicketInfo.batsmanId, ...(fielderId && { fielderId }) };
          history[history.length - 1].wicketInfo = newWicketInfo;
      }

      const playersPerTeam = updatedData.rules?.playersPerTeam || 11;
      if (innings.wickets >= playersPerTeam - 1) {
          await updateMatch(matchId, updatedData);
          handleInningsEnd();
      } else {
          await updateMatch(matchId, updatedData);
          setUiState('selecting_next_batsman');
      }
    } catch (error) {
        console.error("Error confirming wicket:", error);
    } finally {
        setWicketInfo(null);
        setIsUpdating(false);
    }
  }, [matchData, matchId, wicketInfo, handleInningsEnd]);

  const handleNextBatsmanSelect = useCallback(async (batsmanId: string) => {
    if (!matchData || !currentInningsData) return;
    const inningsKey = `innings${matchData.currentInnings}` as const;
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const newBatsman = { id: batsmanId, name: allPlayers.find(p => p.id === batsmanId)?.name || 'Unknown', runs: 0, balls: 0, status: 'not_out' as const };
    
    const updatedBattingStats = [...currentInningsData.battingStats, newBatsman];
    await updateMatch(matchId, { onStrikeBatsmanId: batsmanId, [`${inningsKey}.battingStats`]: updatedBattingStats });
    setUiState('scoring');
  }, [matchId, matchData, currentInningsData, teamAPlayers, teamBPlayers]);

  const handleNextBowlerSelect = useCallback(async (bowlerId: string) => {
    if (!matchData || !currentInningsData) return;
    const inningsKey = `innings${matchData.currentInnings}` as const;
    const existingBowler = currentInningsData.bowlingStats.find(b => b.id === bowlerId);
    
    if (existingBowler) {
        await updateMatch(matchId, { currentBowlerId: bowlerId });
    } else {
        const allPlayers = [...teamAPlayers, ...teamBPlayers];
        const newBowler = { id: bowlerId, name: allPlayers.find(p => p.id === bowlerId)?.name || 'Unknown', overs: 0, runs: 0, wickets: 0 };
        const updatedBowlingStats = [...currentInningsData.bowlingStats, newBowler];
        await updateMatch(matchId, { currentBowlerId: bowlerId, [`${inningsKey}.bowlingStats`]: updatedBowlingStats });
    }
    setUiState('scoring');
  }, [matchId, matchData, currentInningsData, teamAPlayers, teamBPlayers]);

  const handleUndo = useCallback(async () => {
      if (!matchData || isUpdating) return;
      
      setIsUpdating(true);
      try {
        const previousState = revertToPreviousState(matchData);
        if (previousState) {
          await updateMatch(matchId, previousState);
          setUiState('scoring');
        } else {
          alert("No deliveries to undo.");
        }
      } catch (error) {
          console.error("Error undoing delivery:", error);
      } finally {
        setIsUpdating(false);
      }
  }, [matchData, matchId, isUpdating]);

  // --- RENDER LOGIC ---
  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!matchData) return <p className="text-center text-red-500">Match data not found.</p>;

  // This function determines which UI component to show based on the current state.
  const renderContent = () => {
    switch (uiState) {
      case 'waiting_for_toss':
        return <TossSelector matchData={matchData} onTossComplete={handleTossComplete} />;
      case 'selecting_opening_players':
        return <TeamPlayerSelector matchData={matchData} teamAPlayers={teamAPlayers} teamBPlayers={teamBPlayers} onSelectionComplete={handlePlayerSelectionComplete} />;
      case 'scoring':
        const canUndo = (currentInningsData?.undoStack?.length || 0) > 0;
        return <ScoringPanel isUpdating={isUpdating} onDelivery={handleDelivery} onWicket={handleWicket} onUndo={handleUndo} canUndo={canUndo} />;
      case 'selecting_wicket_type':
        return <WicketModal fielders={bowlingTeamPlayers} onSelect={handleWicketConfirm} onCancel={() => setUiState('scoring')} />;
      case 'selecting_next_batsman':
        return <NextBatsmanSelector availableBatsmen={availableBatsmen} onSelect={handleNextBatsmanSelect} />;
      case 'selecting_next_bowler':
        const availableBowlers = bowlingTeamPlayers.filter(p => p.id !== matchData.previousBowlerId);
        return <NextBowlerSelector availableBowlers={availableBowlers} onSelect={handleNextBowlerSelect} />;
      case 'innings_break':
        return <InningsBreakScreen firstInningsData={matchData.innings1} onStartSecondInnings={() => setUiState('selecting_opening_players')} />;
      case 'match_over':
        return <MatchSummary matchData={matchData} />;
      default:
        return <p>Invalid State</p>;
    }
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg text-white space-y-6 max-w-2xl mx-auto">
      {currentInningsData && (
        <MatchHeader
            currentInningsData={currentInningsData}
            onStrikeBatsman={onStrikeBatsman}
            nonStrikeBatsman={nonStrikeBatsman}
            currentBowler={currentBowler}
            isFreeHit={matchData.isFreeHit}
        />
      )}
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}
