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
  writeBatch, // Import writeBatch for atomic operations
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../../../../api/firebase'; // Adjust the import path to your firebase config
import { MatchData, Player, Delivery, Team, EventData } from '../types';

// Type conversion utility
const convertToDoubles = (data: any): any => {
  if (typeof data === 'number') {
    return parseFloat(data.toString());
  }
  
  if (Array.isArray(data)) {
    return data.map(convertToDoubles);
  }
  
  if (typeof data === 'object' && data !== null) {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertToDoubles(value);
    }
    return converted;
  }
  
  return data;
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
    return null;
  }
};

/**
 * Updates the main match document in Firestore.
 * Converts all numeric values to doubles for Flutter compatibility.
 */
export const updateMatch = async (matchId: string, data: { [key: string]: any }) => {
  const matchDocRef = doc(db, 'matches', matchId);
  try {
    // Convert all numeric values to doubles to ensure Flutter compatibility
    const convertedData = convertToDoubles(data);
    await updateDoc(matchDocRef, convertedData);
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
 * Creates a new player in the database.
 */
export const createPlayer = async (playerData: { name: string; role: string }, userId: string): Promise<string> => {
  const playersRef = collection(db, 'players');
  const docRef = await addDoc(playersRef, {
    ...playerData,
    teamId: null, // New players start without a team
    createdBy: userId // Associate with current user
  });
  return docRef.id;
};

/**
 * Updates a player's information.
 */
export const updatePlayer = async (playerId: string, updates: { name?: string; role?: string }) => {
  const playerRef = doc(db, 'players', playerId);
  await updateDoc(playerRef, updates);
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
    try {
        // Store undo state directly in the match document for simplicity and reliability
        const matchDocRef = doc(db, 'matches', matchId);
        const currentData = (await getDoc(matchDocRef)).data();
        
        if (currentData) {
            // Store undo states as an array in the main document
            const undoStates = currentData.undoStates || [];
            const newUndoState = {
                innings: inningsNum,
                state: stateToSave,
                timestamp: Date.now()
            };
            undoStates.push(newUndoState);
            
            // Keep only last 5 undo states
            if (undoStates.length > 5) {
                undoStates.splice(0, undoStates.length - 5);
            }
            
            await updateDoc(matchDocRef, { undoStates });
        }
    } catch (error) {
        console.error("❌ Error adding state to undo stack:", error);
        // Don't throw error for undo stack failures - it's not critical for gameplay
    }
};

/**
 * Fetches the most recent state from the undo states stored in the match document.
 */
export const getLatestUndoState = async (matchId: string, inningsNum: number): Promise<{ id: string; data: string } | null> => {
    try {
        const matchDocRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchDocRef);
        
        if (!matchDoc.exists()) {
            return null;
        }
        
        const matchData = matchDoc.data();
        const undoStates = matchData.undoStates || [];
        
        
        
        
        // Find the most recent undo state for this innings
        const inningsUndoStates = undoStates
            .filter((state: any) => state.innings === inningsNum)
            .sort((a: any, b: any) => b.timestamp - a.timestamp);
        
        if (inningsUndoStates.length === 0) {
            return null;
        }
        
        const latestState = inningsUndoStates[0];
        return { 
            id: latestState.timestamp.toString(), 
            data: latestState.state 
        };
    } catch (error) {
        console.error("Error fetching undo state:", error);
        return null;
    }
};

/**
 * Deletes the latest undo state for a specific innings.
 */
export const deleteFromUndoStack = async (matchId: string, inningsNum: number, docId: string) => {
    try {
        const matchDocRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchDocRef);
        
        if (!matchDoc.exists()) {
            return;
        }
        
        const matchData = matchDoc.data();
        const undoStates = matchData.undoStates || [];
        
        // Remove the undo state with the matching timestamp and innings
        const filteredStates = undoStates.filter((state: any) => 
            !(state.innings === inningsNum && state.timestamp.toString() === docId)
        );
        
        await updateDoc(matchDocRef, { undoStates: filteredStates });
    } catch (error) {
        console.error("Error deleting from undo stack:", error);
        // Don't throw error for undo operations
        console.warn("Failed to delete undo state, but continuing with gameplay");
    }
};


// --- Player and Team fetching functions remain the same ---

export const getTeamPlayerIds = async (teamId: string): Promise<string[]> => {
  if (!teamId) return [];
  
  
  const teamDocRef = doc(db, 'teams', teamId);
  const teamDoc = await getDoc(teamDocRef);
  
  if (teamDoc.exists()) {
    const teamData = teamDoc.data();
    
    
    // Get playerIds array (optimized structure)
    if (teamData.playerIds && Array.isArray(teamData.playerIds) && teamData.playerIds.length > 0) {
      
      return teamData.playerIds;
    }
    
    
    return [];
  } else {
    
    return [];
  }
};

export const getPlayerDocs = async (ids: string[]): Promise<Player[]> => {
  if (!ids || ids.length === 0) {
    
    return [];
  }
  
  const playersQuery = query(collection(db, 'players'), where('__name__', 'in', ids));
  const snapshot = await getDocs(playersQuery);
  const players = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
  
  return players;
};

/**
 * Gets all players that belong to a specific team by teamId
 */
export const getPlayersByTeamId = async (teamId: string): Promise<Player[]> => {
  if (!teamId) {
    return [];
  }
  
  const playersQuery = query(collection(db, 'players'), where('teamId', '==', teamId));
  const snapshot = await getDocs(playersQuery);
  const players = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
  
  return players;
};

/**
 * Gets event data from Firestore.
 */
export const getEvent = async (eventId: string): Promise<EventData | null> => {
  if (!eventId) {
    return null;
  }
  
  const eventDocRef = doc(db, 'events', eventId);
  const eventDoc = await getDoc(eventDocRef);
  
  if (!eventDoc.exists()) {
    return null;
  }
  
  return { id: eventDoc.id, ...eventDoc.data() } as EventData;
};
