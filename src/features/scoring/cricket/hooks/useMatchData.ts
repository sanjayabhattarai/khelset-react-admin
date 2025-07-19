// src/features/scoring/cricket/hooks/useMatchData.ts
// This custom hook has been updated to be more resilient against inconsistent data.

import { useState, useEffect, useMemo } from 'react';
import { MatchData, Player, Innings } from '../types';
import {
  subscribeToMatch,
  getTeamPlayerIds,
  getPlayerDocs,
} from '../services/firestoreService';

/**
 * A custom hook to fetch and manage all data for a given match ID.
 */
export const useMatchData = (matchId: string) => {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, (data) => {
      setMatchData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [matchId]);

  useEffect(() => {
    const fetchAllPlayers = async () => {
      if (!matchData) return;
      try {
        const teamAIds = await getTeamPlayerIds(matchData.teamA_id);
        setTeamAPlayers(await getPlayerDocs(teamAIds));
        const teamBIds = await getTeamPlayerIds(matchData.teamB_id);
        setTeamBPlayers(await getPlayerDocs(teamBIds));
      } catch (e) {
        console.error("Failed to fetch team players:", e);
        setError("Could not load player data.");
      }
    };
    fetchAllPlayers();
  }, [matchData?.teamA_id, matchData?.teamB_id]);

  const derivedData = useMemo(() => {
    if (!matchData) {
      return {
        currentInningsData: null, onStrikeBatsman: null, nonStrikeBatsman: null,
        currentBowler: null, battingTeamPlayers: [], bowlingTeamPlayers: [], availableBatsmen: [],
      };
    }

    const innings: Innings | undefined = matchData.currentInnings === 1 ? matchData.innings1 : matchData.innings2;
    
    // ✨ FIX: This is a crucial safety check. It ensures that battingStats and bowlingStats
    // are ALWAYS treated as arrays, even if they are missing or malformed in the Firestore data.
    // This prevents the ".map is not a function" crash.
    const battingStats = Array.isArray(innings?.battingStats) ? innings.battingStats : [];
    const bowlingStats = Array.isArray(innings?.bowlingStats) ? innings.bowlingStats : [];
    
    const currentBattingTeamId = innings?.battingTeamId;
    const battingTeam = matchData.teamA_id === currentBattingTeamId ? teamAPlayers : teamBPlayers;
    const bowlingTeam = matchData.teamA_id === currentBattingTeamId ? teamBPlayers : teamAPlayers;

    const batsmenInStats = battingStats.map(b => b.id);
    const availableBatsmen = battingTeam.filter(p => !batsmenInStats.includes(p.id));

    return {
      currentInningsData: innings,
      onStrikeBatsman: battingStats.find(p => p.id === matchData.onStrikeBatsmanId),
      nonStrikeBatsman: battingStats.find(p => p.id === matchData.nonStrikeBatsmanId),
      currentBowler: bowlingStats.find(b => b.id === matchData.currentBowlerId),
      battingTeamPlayers: battingTeam,
      bowlingTeamPlayers: bowlingTeam,
      availableBatsmen,
    };
  }, [matchData, teamAPlayers, teamBPlayers]);

  return { loading, error, matchData, teamAPlayers, teamBPlayers, ...derivedData };
};
