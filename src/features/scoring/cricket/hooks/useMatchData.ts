// src/features/scoring/cricket/hooks/useMatchData.ts
// This custom hook encapsulates all the logic for fetching and managing match-related data.
// It keeps the main component clean by handling loading states, data fetching, and player lookups.

import { useState, useEffect, useMemo } from 'react';
import { MatchData, Player } from '../types';
import {
  subscribeToMatch,
  getTeamPlayerIds,
  getPlayerDocs,
} from '../services/firestoreService';

/**
 * A custom hook to fetch and manage all data for a given match ID.
 * It handles loading states and provides convenient, memoized data structures
 * for the UI to consume.
 * @param matchId The ID of the match to fetch data for.
 * @returns An object containing the match data, player lists, loading state, and error state.
 */
export const useMatchData = (matchId: string) => {
  // State for the core match data document from Firestore.
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  // State for the full player lists of each team.
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  // Loading and error states.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This effect subscribes to the match document for real-time updates.
  useEffect(() => {
    // The subscribeToMatch function returns an 'unsubscribe' function.
    const unsubscribe = subscribeToMatch(matchId, (data) => {
      setMatchData(data);
      setLoading(false);
    });

    // The cleanup function for this effect is to call unsubscribe.
    // This prevents memory leaks when the component unmounts.
    return () => unsubscribe();
  }, [matchId]); // This effect re-runs only if the matchId changes.

  // This effect fetches the full player documents for both teams.
  // It runs whenever the team IDs in the matchData change.
  useEffect(() => {
    const fetchAllPlayers = async () => {
      if (!matchData) return;
      try {
        // Fetch player IDs and then their full documents for both teams.
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
  }, [matchData?.teamA_id, matchData?.teamB_id]); // Re-runs if team A or B changes.

  // `useMemo` is a performance optimization.
  // This derived data is only recalculated when its dependencies (matchData, players) change.
  const derivedData = useMemo(() => {
    if (!matchData || (teamAPlayers.length === 0 && teamBPlayers.length === 0)) {
      return {
        currentInningsData: null,
        onStrikeBatsman: null,
        nonStrikeBatsman: null,
        currentBowler: null,
        battingTeamPlayers: [],
        bowlingTeamPlayers: [],
        availableBatsmen: [],
      };
    }

    const innings = matchData.currentInnings === 1 ? matchData.innings1 : matchData.innings2;
    const currentBattingTeamId = innings.battingTeamId;

    const battingTeam = matchData.teamA_id === currentBattingTeamId ? teamAPlayers : teamBPlayers;
    const bowlingTeam = matchData.teamA_id === currentBattingTeamId ? teamBPlayers : teamAPlayers;

    // Find batsmen who are not yet in the batting stats (i.e., they haven't batted yet).
    const batsmenInStats = innings.battingStats.map(b => b.id);
    const availableBatsmen = battingTeam.filter(p => !batsmenInStats.includes(p.id));

    return {
      currentInningsData: innings,
      onStrikeBatsman: innings.battingStats.find(p => p.id === matchData.onStrikeBatsmanId),
      nonStrikeBatsman: innings.battingStats.find(p => p.id === matchData.nonStrikeBatsmanId),
      currentBowler: innings.bowlingStats.find(b => b.id === matchData.currentBowlerId),
      battingTeamPlayers: battingTeam,
      bowlingTeamPlayers: bowlingTeam,
      availableBatsmen,
    };
  }, [matchData, teamAPlayers, teamBPlayers]);

  // The hook returns a clean object with all the necessary data and states for the UI.
  return {
    loading,
    error,
    matchData,
    teamAPlayers,
    teamBPlayers,
    ...derivedData,
  };
};
