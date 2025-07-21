// src/features/scoring/cricket/services/firestoreService.ts
// This file has been updated to handle writing to subcollections for delivery history and undo states.

import {
  doc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  query,
  where,
  addDoc,
  orderBy,
  limit,
  deleteDoc,
  writeBatch, // Import writeBatch for atomic operations
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../../api/firebase'; // Adjust the import path to your firebase config
import { MatchData, Player, Delivery } from '../types';

/**
 * Subscribes to real-time updates for the main match document.
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
 * Updates the main match document in Firestore.
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
 * Adds a detailed delivery object as a new document in a subcollection.
 */
export const addDeliveryToHistory = async (matchId: string, inningsNum: number, deliveryData: Delivery) => {
    // Construct the path to the correct subcollection.
    const historyCollectionRef = collection(db, 'matches', matchId, `innings${inningsNum}_deliveryHistory`);
    try {
        // addDoc creates a new document with an auto-generated ID.
        await addDoc(historyCollectionRef, deliveryData);
    } catch (error) {
        console.error("Error adding delivery to history:", error);
        throw error;
    }
};

/**
 * Saves the entire match state as a new document in the undoStack subcollection
 * and ensures that only the last 2 states are kept.
 * @param matchId The ID of the parent match.
 * @param inningsNum The current innings number (1 or 2).
 * @param stateToSave The full MatchData object, stringified.
 */
export const addStateToUndoStack = async (matchId: string, inningsNum: number, stateToSave: string) => {
    const undoCollectionRef = collection(db, 'matches', matchId, `innings${inningsNum}_undoStack`);
    try {
        // First, add the new state. We use the current timestamp as the document ID
        // to ensure they are naturally ordered chronologically.
        const newUndoDocRef = doc(undoCollectionRef, Date.now().toString());
        await setDoc(newUndoDocRef, { state: stateToSave });

        // ✨ NEW LOGIC: After adding, check if the collection is too large.
        const q = query(undoCollectionRef, orderBy('__name__', 'desc'));
        const snapshot = await getDocs(q);

        // If we have more than 2 undo states, delete the oldest ones.
        if (snapshot.docs.length > 2) {
            const batch = writeBatch(db);
            // Get all documents except the 2 most recent ones.
            const docsToDelete = snapshot.docs.slice(2);
            docsToDelete.forEach(doc => {
                batch.delete(doc.ref);
            });
            // Commit all the deletions in a single atomic operation.
            await batch.commit();
        }
    } catch (error) {
        console.error("Error adding state to undo stack:", error);
        throw error;
    }
};

/**
 * Fetches the most recent state from the undoStack subcollection.
 */
export const getLatestUndoState = async (matchId: string, inningsNum: number): Promise<{ id: string; data: string } | null> => {
    const undoCollectionRef = collection(db, 'matches', matchId, `innings${inningsNum}_undoStack`);
    const q = query(undoCollectionRef, orderBy('__name__', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const lastDoc = snapshot.docs[0];
    return { id: lastDoc.id, data: lastDoc.data().state };
};

/**
 * Deletes a document from a subcollection, used by the undo feature.
 */
export const deleteFromUndoStack = async (matchId: string, inningsNum: number, docId: string) => {
    const docRef = doc(db, 'matches', matchId, `innings${inningsNum}_undoStack`, docId);
    try {
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting from undo stack:", error);
        throw error;
    }
};


// --- Player and Team fetching functions remain the same ---

export const getTeamPlayerIds = async (teamId: string): Promise<string[]> => {
  if (!teamId) return [];
  const teamDocRef = doc(db, 'teams', teamId);
  const teamDoc = await getDoc(teamDocRef);
  return teamDoc.exists() ? (teamDoc.data().players as string[]) : [];
};

export const getPlayerDocs = async (ids: string[]): Promise<Player[]> => {
  if (!ids || ids.length === 0) return [];
  const playersQuery = query(collection(db, 'players'), where('__name__', 'in', ids));
  const snapshot = await getDocs(playersQuery);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
};
