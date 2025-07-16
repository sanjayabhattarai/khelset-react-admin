// src/features/scoring/cricket/services/firestoreService.ts
// This file centralizes all interactions with the Firestore database for the scoring feature.
// It makes the rest of the code cleaner and separates concerns.

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
  // onSnapshot creates a real-time listener.
  const unsubscribe = onSnapshot(matchDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      // When data is received, call the provided callback function.
      onUpdate(docSnapshot.data() as MatchData);
    } else {
      console.error(`Match with ID ${matchId} not found.`);
    }
  });
  // Return the function that will stop the listener when the component unmounts.
  return unsubscribe;
};

/**
 * Updates a match document in Firestore with the provided data.
 * @param matchId The ID of the match to update.
 * @param data An object containing the fields to update. Can be a partial object.
 */
export const updateMatch = async (matchId: string, data: Partial<MatchData>) => {
  const matchDocRef = doc(db, 'matches', matchId);
  try {
    // updateDoc is used to update specific fields without overwriting the entire document.
    await updateDoc(matchDocRef, data);
  } catch (error) {
    console.error("Error updating match document:", error);
    // Optionally, re-throw the error or handle it as needed in the UI.
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
  // Safely access the 'players' array, returning an empty array if it doesn't exist.
  return teamDoc.exists() ? (teamDoc.data().players as string[]) : [];
};

/**
 * Fetches multiple player documents from Firestore based on an array of IDs.
 * @param ids An array of player document IDs.
 * @returns A promise that resolves to an array of Player objects.
 */
export const getPlayerDocs = async (ids: string[]): Promise<Player[]> => {
  if (!ids || ids.length === 0) return [];
  // Firestore 'in' queries are limited to 30 items. For larger teams, this might need batching.
  const playersQuery = query(collection(db, 'players'), where('__name__', 'in', ids));
  const snapshot = await getDocs(playersQuery);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
};
