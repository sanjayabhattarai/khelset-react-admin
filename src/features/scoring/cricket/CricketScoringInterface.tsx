// src/features/scoring/cricket/CricketScoringInterface.tsx
// This is the "face" of the scoring feature. It is a "dumb" component.
// Its only job is to manage UI state and display components.
// All complex data logic is handled by the useMatchData hook.

import { useState, useEffect, useCallback } from 'react';

// --- Hooks ---
import { useMatchData } from './hooks/useMatchData';

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
import { WicketType, ExtraType } from './types';

interface CricketScoringProps {
  matchId: string;
}

export function CricketScoringInterface({ matchId }: CricketScoringProps) {
  // --- DATA & LOGIC FROM HOOK ---
  // Get ALL data and ALL logic functions from our central hook.
  const {
    loading, error, matchData, teamAPlayers, teamBPlayers, teamAName, teamBName,
    currentInningsData, onStrikeBatsman, nonStrikeBatsman, currentBowler,
    bowlingTeamPlayers, availableBatsmen, currentBatsmen,
    handleTossComplete,
    handlePlayerSelectionComplete,
    handleDelivery,
    handleWicketConfirm,
    handleSetNextBatsman,
    handleSetNextBowler,
    handleUndo,
    canUndo,
  } = useMatchData(matchId);

  // --- UI-ONLY STATE ---
  // This state is only for controlling what the user sees (e.g., modals).
  const [uiState, setUiState] = useState<'waiting_for_toss' | 'scoring' | 'selecting_opening_players' | 'selecting_next_batsman' | 'selecting_next_bowler' | 'selecting_wicket_type' | 'innings_break' | 'match_over'>('waiting_for_toss');
  const [isUpdating, setIsUpdating] = useState(false);
  const [wicketInfo, setWicketInfo] = useState<{ batsmanId: string } | null>(null);

  // This effect synchronizes the UI state with the match data status from Firestore.
  useEffect(() => {
    if (loading || !matchData) return;
    
    // Only update UI state if it's in a resting state, to avoid interrupting user flows.
    const isIdle = ['scoring', 'waiting_for_toss', 'innings_break', 'match_over'].includes(uiState);
    if (!isIdle) return;

    switch (matchData.status) {
      case 'Completed': setUiState('match_over'); break;
      case 'Innings Break': setUiState('innings_break'); break;
      case 'Upcoming':
        if (!matchData.tossWinnerId) setUiState('waiting_for_toss');
        else if (!matchData.onStrikeBatsmanId || !matchData.currentBowlerId) setUiState('selecting_opening_players');
        else setUiState('scoring');
        break;
      case 'Live': setUiState('scoring'); break;
      default: setUiState('waiting_for_toss');
    }
  }, [matchData, loading, uiState]);

  // --- UI WRAPPER HANDLERS ---
  // These functions call the logic from the hook and then update the local UI state.
  
  // This function is now just a simple wrapper.
const onDelivery = useCallback(async (runs: number, isLegal: boolean, isWicket: boolean, extraType?: ExtraType, wicketType?: WicketType, runType?: 'hit' | 'bye' | 'leg_bye') => {
  if (isUpdating) return;
  setIsUpdating(true);
  try {
    // 1. Call the powerful handleDelivery function from the hook
    const result = await handleDelivery(runs, isLegal, isWicket, extraType, wicketType, runType);

    // 2. Update the local UI state based on the result
    if (result?.isWicketFallen) {
      setWicketInfo({ batsmanId: matchData!.onStrikeBatsmanId! });
      setUiState('selecting_wicket_type');
    } else if (result?.isOverComplete && !result?.isInningsOver) {
      // FIXED: Only ask for next bowler if over is complete but innings is NOT over
      setUiState('selecting_next_bowler');
    }
    // If the innings is over, the useEffect will handle the state change automatically
    
  } catch (e) { 
    console.error("Failed to process delivery:", e);
  } finally {
    setIsUpdating(false);
  }
}, [handleDelivery, isUpdating, matchData]);

  const onWicket = useCallback(() => {
    // FIXED: Just trigger wicket selection without processing delivery
    // This avoids double wicket counting
    setWicketInfo({ batsmanId: matchData?.onStrikeBatsmanId || '' });
    setUiState('selecting_wicket_type');
  }, [matchData]);

 // Handle wicket confirmation with runs for run-outs
const onWicketConfirm = useCallback(async (type: WicketType, fielderId: string | undefined, runsScored: number, batsmanId?: string) => {
  if (!wicketInfo) return;
  setIsUpdating(true);
  try {
    // For run-outs, use the selected batsman ID, otherwise use the original wicketInfo batsmanId
    const finalBatsmanId = (type === 'run_out' && batsmanId) ? batsmanId : wicketInfo.batsmanId;
    // Pass runsScored for run-outs to add completed runs to the score
    await handleWicketConfirm(type, finalBatsmanId, fielderId, runsScored);
    setUiState('selecting_next_batsman');
  } catch (e) { console.error("Failed to confirm wicket:", e); }
  finally {
    setWicketInfo(null);
    setIsUpdating(false);
  }
}, [handleWicketConfirm, wicketInfo]);

  const onNextBatsmanSelect = useCallback(async (batsmanId: string) => {
    await handleSetNextBatsman(batsmanId);
    setUiState('scoring');
  }, [handleSetNextBatsman]);

  const onNextBowlerSelect = useCallback(async (bowlerId: string) => {
    await handleSetNextBowler(bowlerId);
    setUiState('scoring');
  }, [handleSetNextBowler]);

  const onPlayerSelectionComplete = useCallback(async (selection: { onStrikeBatsmanId: string; nonStrikeBatsmanId: string; currentBowlerId: string; }) => {
    await handlePlayerSelectionComplete(selection);
    setUiState('scoring');
  }, [handlePlayerSelectionComplete]);


  // --- RENDER LOGIC ---
  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!matchData) return <p className="text-center text-red-500">Match data not found.</p>;

  // This function decides which UI component to show based on the current UI state.
  const renderContent = () => {
    switch (uiState) {
      case 'waiting_for_toss':
        return <TossSelector teamAId={matchData.teamA_id} teamBId={matchData.teamB_id} teamAName={teamAName} teamBName={teamBName} onTossComplete={handleTossComplete} />;
      case 'selecting_opening_players':
        return <TeamPlayerSelector matchData={matchData} teamAPlayers={teamAPlayers} teamBPlayers={teamBPlayers} onSelectionComplete={onPlayerSelectionComplete} />;
      case 'scoring':
        return <ScoringPanel isUpdating={isUpdating} onDelivery={onDelivery} onWicket={onWicket} onUndo={handleUndo} canUndo={canUndo} />;
      case 'selecting_wicket_type':
        return <WicketModal fielders={bowlingTeamPlayers ?? []} currentBatsmen={currentBatsmen ?? []} onSelect={onWicketConfirm} onCancel={() => setUiState('scoring')} />;
      case 'selecting_next_batsman':
        return <NextBatsmanSelector availableBatsmen={availableBatsmen ?? []} onSelect={onNextBatsmanSelect} />;
      case 'selecting_next_bowler':
        const availableBowlers = (bowlingTeamPlayers ?? []).filter(p => p.id !== matchData.previousBowlerId);
        return <NextBowlerSelector availableBowlers={availableBowlers} onSelect={onNextBowlerSelect} />;
      case 'innings_break':
        return <InningsBreakScreen firstInningsData={matchData.innings1} onStartSecondInnings={() => setUiState('selecting_opening_players')} />;
      case 'match_over':
        return <MatchSummary matchData={matchData} teamAName={teamAName} teamBName={teamBName} />;
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
      <div className="mt-4">{renderContent()}</div>
    </div>
  );
}