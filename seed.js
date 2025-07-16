// seed.js
// FINAL VERSION: This script creates a complete and expanded set of test data.
// It uses the correct data models and adds more events and teams for thorough testing.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// --- 1. SETUP ---
// Load the service account key from the JSON file in the same directory.
const serviceAccount = JSON.parse(
  readFileSync('./khelset-new-firebase-adminsdk.json', 'utf8')
);

// Initialize the Firebase Admin SDK.
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedDatabase() {
  console.log("🌱 Starting comprehensive database seeding...");
  const batch = db.batch();

  // --- 2. USER PROFILES ---
  // Creates the necessary user documents in Firestore for your existing auth users.
  console.log("👤 Preparing user profiles...");
  const adminUID = "1AiQatTrlTT8mOmnejvnjT8Xqlp1"; // The UID for sanju@gmail.com
  const adminUserRef = db.collection('users').doc(adminUID);
  batch.set(adminUserRef, {
      email: 'sanju@gmail.com',
      role: 'admin',
      createdAt: FieldValue.serverTimestamp()
  });

  // The UID for your phone number user account.
  const phoneUserUID = "Tg4GRxdbXzbyNRcTrmjIPct51YL2"; 
  const phoneUserRef = db.collection('users').doc(phoneUserUID);
  batch.set(phoneUserRef, {
      role: 'user',
      createdAt: FieldValue.serverTimestamp()
  });
  console.log("✔️ User profiles prepared.");

  // --- 3. PLAYERS ---
  // Creates a large pool of players for all teams.
  console.log("🧍 Preparing players...");
  const playersData = [
    // Nepal
    { name: "K. Bhurtel", role: "Batsman" }, { name: "A. Sheikh", role: "Wicketkeeper" },
    { name: "R. Paudel", role: "Captain" }, { name: "D.S. Airee", role: "All-rounder" },
    // Netherlands
    { name: "M. O'Dowd", role: "Batsman" }, { name: "S. Edwards", role: "Captain" },
    { name: "B. de Leede", role: "All-rounder" }, { name: "P. van Meekeren", role: "Bowler" },
    // India
    { name: "Rohit Sharma", role: "Captain" }, { name: "Virat Kohli", role: "Batsman" },
    { name: "Jasprit Bumrah", role: "Bowler" }, { name: "Rishabh Pant", role: "Wicketkeeper" },
    // Pakistan
    { name: "Babar Azam", role: "Captain" }, { name: "Mohammad Rizwan", role: "Wicketkeeper" },
    { name: "Shaheen Afridi", role: "Bowler" }, { name: "Fakhar Zaman", role: "Batsman" },
  ];

  const playerDocs = [];
  for (const playerData of playersData) {
    const playerRef = db.collection("players").doc();
    batch.set(playerRef, { ...playerData, createdAt: FieldValue.serverTimestamp() });
    playerDocs.push({ id: playerRef.id, ...playerData });
  }
  console.log(`✔️ ${playerDocs.length} players prepared.`);

  // --- 4. EVENTS ---
  // Creates two separate events, both with status 'upcoming'.
  console.log("📅 Preparing events...");
  
  // Event 1
  const event1Ref = db.collection("events").doc();
  batch.set(event1Ref, {
    eventName: "Asia Cup T20",
    sportType: "cricket",
    location: "Colombo",
    status: "upcoming", // This will make it appear in the Flutter app
    date: new Date('2025-08-10T14:00:00Z'),
    registrationDeadline: new Date('2025-08-01T23:59:59Z'),
    organizerId: adminUID,
    createdAt: FieldValue.serverTimestamp()
  });
  console.log(`✔️ Event 1 prepared: ${event1Ref.id}`);

  // Event 2
  const event2Ref = db.collection("events").doc();
  batch.set(event2Ref, {
    eventName: "Helsinki Premier League",
    sportType: "cricket",
    location: "Helsinki",
    status: "upcoming", // This will also appear
    date: new Date('2025-09-05T10:00:00Z'),
    registrationDeadline: new Date('2025-08-25T23:59:59Z'),
    organizerId: adminUID,
    createdAt: FieldValue.serverTimestamp()
  });
  console.log(`✔️ Event 2 prepared: ${event2Ref.id}`);

  // --- 5. TEAMS ---
  // Creates four teams and registers them for the first event.
  console.log("🏏 Preparing teams for 'Asia Cup T20'...");
  // FIXED: Removed TypeScript type annotations for compatibility with Node.js
  const createTeam = (name, captainIndex, playerIndices) => {
      const teamRef = db.collection("teams").doc();
      batch.set(teamRef, {
          name: name,
          eventId: event1Ref.id, // All teams are in the first event
          sportType: "cricket",
          status: "Approved",
          captainId: playerDocs[captainIndex].id,
          players: playerIndices.map(i => playerDocs[i].id),
          createdAt: FieldValue.serverTimestamp()
      });
      return teamRef;
  };

  const teamNepalRef = createTeam("Nepal", 2, [0, 1, 2, 3]);
  const teamNetherlandsRef = createTeam("Netherlands", 5, [4, 5, 6, 7]);
  const teamIndiaRef = createTeam("India", 8, [8, 9, 10, 11]);
  const teamPakistanRef = createTeam("Pakistan", 12, [12, 13, 14, 15]);
  console.log("✔️ 4 teams prepared.");

  // --- 6. MATCH ---
  // Creates one upcoming match for the first event.
  console.log("🏟️  Preparing an upcoming match...");
  const matchRef = db.collection("matches").doc();
  batch.set(matchRef, {
    eventId: event1Ref.id,
    teamA_id: teamIndiaRef.id,
    teamB_id: teamPakistanRef.id,
    sportType: "cricket",
    status: "Upcoming", // Correct status
    scheduledTime: new Date('2025-08-12T14:00:00Z'),
    createdAt: FieldValue.serverTimestamp(),
    // All scoring data is correctly set to null or empty for a new match
    currentInnings: 1,
    onStrikeBatsmanId: null,
    nonStrikeBatsmanId: null,
    currentBowlerId: null,
    result: "",
    innings1: { battingTeamId: teamIndiaRef.id, bowlingTeamId: teamPakistanRef.id, score: 0, wickets: 0, overs: 0, battingStats: [], bowlingStats: [] },
    innings2: { battingTeamId: teamPakistanRef.id, bowlingTeamId: teamIndiaRef.id, score: 0, wickets: 0, overs: 0, battingStats: [], bowlingStats: [] },
  });
  console.log("✔️ 1 upcoming match prepared.");

  // --- 7. COMMIT ---
  // Commits all the prepared operations to the database in one go.
  try {
    await batch.commit();
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error committing batch:", error);
  }
}

seedDatabase().then(() => {
    console.log("Script finished.");
    process.exit(0);
});
