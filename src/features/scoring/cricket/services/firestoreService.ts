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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../../../../api/firebase'; // Adjust the import path to your firebase config
import { MatchData, Player, Delivery } from '../types';

// Define Team type locally if not exported from '../types'
type Team = {
  id: string;
  name: string;
  // Add other properties as needed
};

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
 * Fetches a single team document by its ID.
 * @param teamId The ID of the team to fetch.
 * @returns A Team object or null if not found.
 */
export const getTeam = async (teamId: string): Promise<Team | null> => {
  if (!teamId) return null;
  const teamDocRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamDocRef);

  if (teamSnap.exists()) {
    // Assumes your Team type has an 'id' and 'name' property
    return { id: teamSnap.id, ...teamSnap.data() } as Team;
  } else {
    console.warn(`Team with ID ${teamId} not found.`);
    return null;
  }
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
 * Updates the last delivery in the delivery history subcollection.
 * This function assumes that the last delivery is the most recent one based on 'ballId'.
 */
export const updateLastDelivery = async (matchId: string, inningsNum: number, data: object) => {
  const historyRef = collection(db, 'matches', matchId, `innings${inningsNum}_deliveryHistory`);
  // Query for the most recent delivery
  const q = query(historyRef, orderBy('ballId', 'desc'), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const lastDeliveryDoc = snapshot.docs[0];
    await updateDoc(lastDeliveryDoc.ref, data);
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
 * Adds a player to a team's roster.
 * This is an atomic operation that updates both the team and player documents.
 */
export const addPlayerToTeam = async (teamId: string, playerId: string) => {
  const batch = writeBatch(db);

  // 1. Add the player's ID to the team's 'players' array
  const teamDocRef = doc(db, 'teams', teamId);
  batch.update(teamDocRef, {
    players: arrayUnion(playerId)
  });

  // 2. Set the 'teamId' on the player's document
  const playerDocRef = doc(db, 'players', playerId);
  batch.update(playerDocRef, { teamId: teamId });

  await batch.commit();
};

/**
 * Removes a player from a team's roster.
 * This is an atomic operation that updates both the team and player documents.
 */
export const removePlayerFromTeam = async (teamId: string, playerId: string) => {
  const batch = writeBatch(db);

  // 1. Remove the player's ID from the team's 'players' array
  const teamDocRef = doc(db, 'teams', teamId);
  batch.update(teamDocRef, {
    players: arrayRemove(playerId)
  });

  // 2. Set the 'teamId' on the player's document back to null
  const playerDocRef = doc(db, 'players', playerId);
  batch.update(playerDocRef, { teamId: null });

  await batch.commit();
};


/**
 * Fetches all players who are not currently assigned to any team.
 */
export const getAvailablePlayers = async (): Promise<Player[]> => {
    const playersQuery = query(collection(db, 'players'), where('teamId', '==', null));
    const snapshot = await getDocs(playersQuery);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
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
  console.log('🔍 Fetching team player IDs for teamId:', teamId);
  
  const teamDocRef = doc(db, 'teams', teamId);
  const teamDoc = await getDoc(teamDocRef);
  
  if (teamDoc.exists()) {
    const teamData = teamDoc.data();
    console.log('📄 Team data structure:', teamData);
    
    // Get playerIds array (optimized structure)
    if (teamData.playerIds && Array.isArray(teamData.playerIds) && teamData.playerIds.length > 0) {
      console.log('✅ Found player IDs:', teamData.playerIds);
      return teamData.playerIds;
    }
    
    console.log('❌ No playerIds found in team');
    return [];
  } else {
    console.log('❌ Team document does not exist for teamId:', teamId);
    return [];
  }
};

export const getPlayerDocs = async (ids: string[]): Promise<Player[]> => {
  if (!ids || ids.length === 0) {
    console.log('No player IDs provided');
    return [];
  }
  console.log('Fetching player documents for IDs:', ids);
  const playersQuery = query(collection(db, 'players'), where('__name__', 'in', ids));
  const snapshot = await getDocs(playersQuery);
  const players = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
  console.log('Players found:', players);
  return players;
};
