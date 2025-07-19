// src/features/scoring/cricket/services/firestoreService.ts
// This file centralizes all interactions with the Firestore database for the scoring feature.

import {
  doc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../../api/firebase'; // Adjust the import path to your firebase config
import { MatchData, Player } from '../types';

/**
 * Subscribes to real-time updates for a specific match document.
 * @param matchId The ID of the match to listen to.
 * @param onUpdate A callback function that is called every time the match data changes.
 * @returns An unsubscribe function to stop listening to updates.
 */
export const subscribeToMatch = (
  matchId: string,
  onUpdate: (data: MatchData) => void
) => {
  const matchDocRef = doc(db, 'matches', matchId);
  const unsubscribe = onSnapshot(matchDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      onUpdate(docSnapshot.data() as MatchData);
    } else {
      console.error(`Match with ID ${matchId} not found.`);
    }
  });
  return unsubscribe;
};

/**
 * Updates a match document in Firestore with the provided data.
 * @param matchId The ID of the match to update.
 * @param data An object containing the fields to update.
 */
export const updateMatch = async (matchId: string, data: { [key: string]: any }) => {
  const matchDocRef = doc(db, 'matches', matchId);
  try {
    await updateDoc(matchDocRef, data);
  } catch (error) {
    console.error("Error updating match document:", error);
    throw error;
  }
};

/**
 * Fetches the array of player IDs for a specific team.
 * @param teamId The ID of the team.
 * @returns A promise that resolves to an array of player IDs.
 */
export const getTeamPlayerIds = async (teamId: string): Promise<string[]> => {
  if (!teamId) return [];
  const teamDocRef = doc(db, 'teams', teamId);
  const teamDoc = await getDoc(teamDocRef);
  return teamDoc.exists() ? (teamDoc.data().players as string[]) : [];
};

/**
 * Fetches multiple player documents from Firestore based on an array of IDs.
 * @param ids An array of player document IDs.
 * @returns A promise that resolves to an array of Player objects.
 */
export const getPlayerDocs = async (ids: string[]): Promise<Player[]> => {
  if (!ids || ids.length === 0) return [];
  const playersQuery = query(collection(db, 'players'), where('__name__', 'in', ids));
  const snapshot = await getDocs(playersQuery);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
};
