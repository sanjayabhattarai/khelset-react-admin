// src/utils/debugFirestore.ts
// Debugging utility to check team and player data

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';

export const debugTeamPlayers = async (teamId: string) => {
  console.log(`🔍 Debugging team: ${teamId}`);
  
  try {
    // Get team document
    const teamQuery = query(collection(db, 'teams'), where('__name__', '==', teamId));
    const teamSnapshot = await getDocs(teamQuery);
    
    if (teamSnapshot.empty) {
      console.log('❌ Team not found');
      return;
    }
    
    const teamData = teamSnapshot.docs[0].data();
    console.log('📄 Team data:', teamData);
    
    // Check for players with this teamId
    const playersQuery = query(collection(db, 'players'), where('teamId', '==', teamId));
    const playersSnapshot = await getDocs(playersQuery);
    
    console.log(`👥 Players found in players collection: ${playersSnapshot.size}`);
    playersSnapshot.docs.forEach((doc, index) => {
      console.log(`  Player ${index + 1}:`, { id: doc.id, ...doc.data() });
    });
    
    // Show what should be in playerIds array
    const playerIds = playersSnapshot.docs.map(doc => doc.id);
    console.log('🔧 playerIds should be:', playerIds);
    
    return {
      teamData,
      players: playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      suggestedPlayerIds: playerIds
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// Function to fix empty playerIds (call this manually)
export const fixEmptyPlayerIds = async (teamId: string) => {
  const debugInfo = await debugTeamPlayers(teamId);
  
  if (!debugInfo || debugInfo.suggestedPlayerIds.length === 0) {
    console.log('❌ No players found to fix');
    return;
  }
  
  console.log(`🔧 Would update team ${teamId} with playerIds:`, debugInfo.suggestedPlayerIds);
  console.log('📝 Manual fix: Copy this array to Firebase Console');
  console.log('Array to copy:', JSON.stringify(debugInfo.suggestedPlayerIds));
};
