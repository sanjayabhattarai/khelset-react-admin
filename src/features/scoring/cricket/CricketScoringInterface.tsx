// src/features/scoring/cricket/CricketScoringInterface.tsx
// This is the main orchestrator component, updated to handle the end of an innings
// based on the custom match rules.

import { useState, useEffect, useCallback } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { updateMatch } from './services/firestoreService';
import { useMatchData } from './hooks/useMatchData';
import { processDelivery } from './logic/scoringUtils';
import { processWicket } from './logic/dismissalUtils';
import { processEndOfOver } from './logic/overUtils';

// Import all the UI components.
import { TossSelector } from './components/TossSelector';
import { TeamPlayerSelector } from './components/TeamPlayerSelector';
import { NextBatsmanSelector } from './components/NextBatsmanSelector';
import { NextBowlerSelector } from './components/NextBowlerSelector';
import { WicketModal } from './components/WicketModal';
import { ScoringPanel } from './components/ScoringPanel';
import { MatchHeader } from './components/MatchHeader';
import { InningsBreakScreen } from './components/InningsBreakScreen';
import { MatchSummary } from './components/MatchSummary';
import { WicketType } from './types';

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
    battingTeamPlayers,
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
    const updatePayload: { [key: string]: any } = {
        tossWinnerId, tossDecision,
        'innings1.battingTeamId': battingTeamId, 'innings1.bowlingTeamId': bowlingTeamId,
        'innings2.battingTeamId': bowlingTeamId, 'innings2.bowlingTeamId': battingTeamId,
    };
    await updateMatch(matchId, updatePayload);
    setUiState('selecting_opening_players');
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
    const updatePayload: { [key: string]: any } = { 
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
        setUiState('innings_break');
    } else {
        await updateMatch(matchId, { status: 'Completed' });
        setUiState('match_over');
    }
  }, [matchData, matchId]);

  const handleDelivery = useCallback(async (runs: number, isLegal: boolean, isWicket: boolean, extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye') => {
    if (!matchData || isUpdating) return;
    setIsUpdating(true);

    const { updatedData, isOverComplete, isWicketFallen, isInningsOver } = processDelivery(matchData, { runs, isLegal, isWicket, extraType });
    
    if (isInningsOver) {
        await updateMatch(matchId, updatedData);
        handleInningsEnd();
    } else if (isWicketFallen) {
      setWicketInfo({ batsmanId: matchData.onStrikeBatsmanId! });
      setUiState('selecting_wicket_type');
    } else if (isOverComplete) {
      const finalData = processEndOfOver(updatedData);
      await updateMatch(matchId, finalData);
      setUiState('selecting_next_bowler');
    } else {
      await updateMatch(matchId, updatedData);
    }
    
    setIsUpdating(false);
  }, [matchData, matchId, isUpdating, handleInningsEnd]);

  // ✨ FIX: This function is now correctly called by the ScoringPanel.
  // It captures the ID of the on-strike batsman when the wicket button is pressed.
  const handleWicket = useCallback(() => {
    if (!matchData || !matchData.onStrikeBatsmanId) return;
    setWicketInfo({ batsmanId: matchData.onStrikeBatsmanId });
    setUiState('selecting_wicket_type');
  }, [matchData]);

  const handleWicketConfirm = useCallback(async (type: WicketType, fielderId?: string) => {
    if (!matchData || !wicketInfo) return;
    setIsUpdating(true);
    
    const updatedData = processWicket(matchData, type, wicketInfo.batsmanId, fielderId);
    
    const currentInnings = updatedData.currentInnings === 1 ? updatedData.innings1 : updatedData.innings2;
    if (currentInnings.wickets >= (updatedData.rules.playersPerTeam - 1)) {
        await updateMatch(matchId, updatedData);
        handleInningsEnd();
    } else {
        await updateMatch(matchId, updatedData);
        setUiState('selecting_next_batsman');
    }

    setWicketInfo(null);
    setIsUpdating(false);
  }, [matchData, matchId, wicketInfo, handleInningsEnd]);

  const handleNextBatsmanSelect = useCallback(async (batsmanId: string) => {
    if (!matchData) return;
    const inningsKey = `innings${matchData.currentInnings}` as const;
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const newBatsman = { id: batsmanId, name: allPlayers.find(p => p.id === batsmanId)?.name || 'Unknown', runs: 0, balls: 0, status: 'not_out' as const };
    await updateMatch(matchId, { onStrikeBatsmanId: batsmanId, [`${inningsKey}.battingStats`]: arrayUnion(newBatsman) });
    setUiState('scoring');
  }, [matchId, matchData, teamAPlayers, teamBPlayers]);

  const handleNextBowlerSelect = useCallback(async (bowlerId: string) => {
    if (!matchData) return;
    const inningsKey = `innings${matchData.currentInnings}` as const;
    const innings = matchData[inningsKey];
    const existingBowler = innings.bowlingStats.find(b => b.id === bowlerId);
    if (existingBowler) {
        await updateMatch(matchId, { currentBowlerId: bowlerId });
    } else {
        const allPlayers = [...teamAPlayers, ...teamBPlayers];
        const newBowler = { id: bowlerId, name: allPlayers.find(p => p.id === bowlerId)?.name || 'Unknown', overs: 0, runs: 0, wickets: 0 };
        await updateMatch(matchId, { currentBowlerId: bowlerId, [`${inningsKey}.bowlingStats`]: arrayUnion(newBowler) });
    }
    setUiState('scoring');
  }, [matchId, matchData, teamAPlayers, teamBPlayers]);

  // --- RENDER LOGIC ---
  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!matchData) return <p className="text-center text-red-500">Match data not found.</p>;

  const renderContent = () => {
    switch (uiState) {
      case 'waiting_for_toss':
        return <TossSelector matchData={matchData} onTossComplete={handleTossComplete} />;
      case 'selecting_opening_players':
        return <TeamPlayerSelector matchData={matchData} teamAPlayers={teamAPlayers} teamBPlayers={teamBPlayers} onSelectionComplete={handlePlayerSelectionComplete} />;
      case 'scoring':
        // ✨ FIX: The `onWicket` prop now correctly passes the `handleWicket` function.
        return <ScoringPanel isUpdating={isUpdating} onDelivery={handleDelivery} onWicket={handleWicket} onUndo={() => {}} canUndo={false} />;
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