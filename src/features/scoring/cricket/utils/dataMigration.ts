// src/features/scoring/cricket/utils/dataMigration.ts
// Utility functions to help migrate from embedded player data to ID-based structure

import { collection, doc, updateDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../api/firebase';

/**
 * Migrates a team from embedded player objects to ID-based player references
 * This function should be run after updating the Flutter app
 */
export const migrateTeamToIdBased = async (teamId: string): Promise<boolean> => {
  try {
    
    
    // Get the team document
    const teamDoc = await getDocs(query(collection(db, 'teams'), where('__name__', '==', teamId)));
    
    if (teamDoc.empty) {
      console.error(`❌ Team ${teamId} not found`);
      return false;
    }
    
    const teamData = teamDoc.docs[0].data();
    
    // Check if team has embedded player objects
    if (!teamData.players || !Array.isArray(teamData.players) || teamData.players.length === 0) {
      
      return true;
    }
    
    // Check if already migrated (players are strings)
    if (typeof teamData.players[0] === 'string') {
      
      return true;
    }
    
    // Migrate embedded player objects to separate documents
    const playerIds: string[] = [];
    
    for (const playerData of teamData.players) {
      // Create or update player document
      const playerDoc = await addDoc(collection(db, 'players'), {
        name: playerData.name || 'Unknown Player',
        role: playerData.role || 'Batsman',
        teamId: teamId,
        ...playerData,
        migratedAt: new Date(),
      });
      
      playerIds.push(playerDoc.id);
      
    }
    
    // Update team document to use player IDs instead of embedded objects
    await updateDoc(doc(db, 'teams', teamId), {
      players: playerIds,
      migratedAt: new Date(),
      originalPlayerData: teamData.players, // Keep backup for safety
    });
    
    
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to migrate team ${teamId}:`, error);
    return false;
  }
};

/**
 * Migrates all teams in an event from embedded to ID-based structure
 */
export const migrateEventTeams = async (eventId: string): Promise<void> => {
  try {
    
    
    const teamsQuery = query(collection(db, 'teams'), where('eventId', '==', eventId));
    const teamsSnapshot = await getDocs(teamsQuery);
    
    let successCount = 0;
    let totalCount = teamsSnapshot.docs.length;
    
    for (const teamDoc of teamsSnapshot.docs) {
      const success = await migrateTeamToIdBased(teamDoc.id);
      if (success) successCount++;
    }
    
    
    
  } catch (error) {
    console.error(`❌ Failed to migrate event teams:`, error);
  }
};

/**
 * Check if a team needs migration
 */
export const checkTeamMigrationStatus = async (teamId: string): Promise<'migrated' | 'needs_migration' | 'no_players' | 'error'> => {
  try {
    const teamDoc = await getDocs(query(collection(db, 'teams'), where('__name__', '==', teamId)));
    
    if (teamDoc.empty) return 'error';
    
    const teamData = teamDoc.docs[0].data();
    
    if (!teamData.players || !Array.isArray(teamData.players) || teamData.players.length === 0) {
      return 'no_players';
    }
    
    if (typeof teamData.players[0] === 'string') {
      return 'migrated';
    } else {
      return 'needs_migration';
    }
    
  } catch (error) {
    console.error('Error checking migration status:', error);
    return 'error';
  }
};
