// seed.js
// FINAL VERSION: This script creates a complete and expanded set of test data.
// It creates full 11-player squads and correctly adds a 'teamId' to each player document.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// --- 1. SETUP ---
// Load your service account key from the JSON file.
// Make sure the filename matches yours exactly.
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
  // Creates the necessary user documents for your admin and test user.
  console.log("👤 Preparing user profiles...");
  const adminUID = "1AiQatTrlTT8mOmnejvnjT8Xqlp1"; // sanju@gmail.com
  const adminUserRef = db.collection('users').doc(adminUID);
  batch.set(adminUserRef, {
      email: 'sanju@gmail.com',
      role: 'admin',
      createdAt: FieldValue.serverTimestamp()
  });

  const phoneUserUID = "Tg4GRxdbXzbyNRcTrmjIPct51YL2"; // Phone user
  const phoneUserRef = db.collection('users').doc(phoneUserUID);
  batch.set(phoneUserRef, {
      role: 'user',
      createdAt: FieldValue.serverTimestamp()
  });
  console.log("✔️ User profiles prepared.");

  // --- 3. TEAMS & PLAYERS (NEW EXPANDED LOGIC) ---
  // This section now creates full 11-player squads and correctly links
  // each player to their team by adding a 'teamId' to the player document.
  console.log("🏏 Preparing teams and full 11-player squads...");

  const teamsWithPlayers = [
    {
      name: "Nepal",
      players: [
        { name: "K. Bhurtel", role: "Batsman" }, { name: "A. Sheikh", role: "Wicketkeeper" },
        { name: "R. Paudel", role: "Captain" }, { name: "D.S. Airee", role: "All-rounder" },
        { name: "G. Malla", role: "Batsman" }, { name: "S. Lamichhane", role: "Bowler" },
        { name: "K. Malla", role: "All-rounder" }, { name: "S. Kami", role: "Bowler" },
        { name: "B. Sharki", role: "Batsman" }, { name: "A. Bohara", role: "Bowler" },
        { name: "L. Rajbanshi", role: "Bowler" }
      ]
    },
    {
      name: "India",
      players: [
        { name: "Rohit Sharma", role: "Captain" }, { name: "Virat Kohli", role: "Batsman" },
        { name: "Jasprit Bumrah", role: "Bowler" }, { name: "Rishabh Pant", role: "Wicketkeeper" },
        { name: "S. Gill", role: "Batsman" }, { name: "H. Pandya", role: "All-rounder" },
        { name: "R. Jadeja", role: "All-rounder" }, { name: "M. Siraj", role: "Bowler" },
        { name: "Suryakumar Yadav", role: "Batsman" }, { name: "K. L. Rahul", role: "Batsman" },
        { name: "Kuldeep Yadav", role: "Bowler" }
      ]
    },
    {
      name: "Pakistan",
      players: [
        { name: "Babar Azam", role: "Captain" }, { name: "Mohammad Rizwan", role: "Wicketkeeper" },
        { name: "Shaheen Afridi", role: "Bowler" }, { name: "Fakhar Zaman", role: "Batsman" },
        { name: "Imam-ul-Haq", role: "Batsman" }, { name: "Haris Rauf", role: "Bowler" },
        { name: "Shadab Khan", role: "All-rounder" }, { name: "Iftikhar Ahmed", role: "All-rounder" },
        { name: "Naseem Shah", role: "Bowler" }, { name: "Abdullah Shafique", role: "Batsman" },
        { name: "Mohammad Nawaz", role: "All-rounder" }
      ]
    },
    {
      name: "Netherlands",
      players: [
        { name: "M. O'Dowd", role: "Batsman" }, { name: "S. Edwards", role: "Captain" },
        { name: "B. de Leede", role: "All-rounder" }, { name: "P. van Meekeren", role: "Bowler" },
        { name: "Vikramjit Singh", role: "Batsman" }, { name: "Teja Nidamanuru", role: "Batsman" },
        { name: "Logan van Beek", role: "All-rounder" }, { name: "Tim Pringle", role: "Bowler" },
        { name: "Aryan Dutt", role: "Bowler" }, { name: "Wesley Barresi", role: "Wicketkeeper" },
        { name: "Colin Ackermann", role: "All-rounder" }
      ]
    }
  ];

  const teamRefs = {}; // To store the generated team references

  for (const teamData of teamsWithPlayers) {
    // A. Create the Team document first to get its ID
    const teamRef = db.collection("teams").doc();
    teamRefs[teamData.name] = teamRef; // Save ref for later use in match creation
    const playerIds = [];

    // B. Create each Player document with the teamId
    for (const playerData of teamData.players) {
      const playerRef = db.collection("players").doc();
      playerIds.push(playerRef.id);
      batch.set(playerRef, {
        ...playerData,
        teamId: teamRef.id, // ✨ CRITICAL FIX: Add the team's ID to the player
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // C. Now set the Team document data, including the array of player IDs
    batch.set(teamRef, {
      name: teamData.name,
      sportType: "cricket",
      status: "Approved",
      captainId: playerIds[0], // Assume the first player is the captain for simplicity
      players: playerIds,
      createdAt: FieldValue.serverTimestamp()
    });
  }
  console.log(`✔️ 4 teams with 44 players prepared. 'teamId' has been added to each player.`);

  // --- 4. EVENTS ---
  // Creates two separate events.
  console.log("📅 Preparing events...");
  const event1Ref = db.collection("events").doc();
  batch.set(event1Ref, {
    eventName: "Asia Cup T20",
    sportType: "cricket",
    location: "Colombo",
    status: "upcoming",
    date: new Date('2025-08-10T14:00:00Z'),
    organizerId: adminUID,
    createdAt: FieldValue.serverTimestamp()
  });

  const event2Ref = db.collection("events").doc();
  batch.set(event2Ref, {
    eventName: "Helsinki Premier League",
    sportType: "cricket",
    location: "Helsinki",
    status: "upcoming",
    date: new Date('2025-09-05T10:00:00Z'),
    organizerId: adminUID,
    createdAt: FieldValue.serverTimestamp()
  });
  console.log("✔️ 2 events prepared.");

  // --- 5. REGISTER TEAMS TO AN EVENT ---
  // Update the teams to be part of the first event
  batch.update(teamRefs["Nepal"], { eventId: event1Ref.id });
  batch.update(teamRefs["India"], { eventId: event1Ref.id });
  batch.update(teamRefs["Pakistan"], { eventId: event1Ref.id });
  batch.update(teamRefs["Netherlands"], { eventId: event1Ref.id });
  console.log("✔️ Registered 4 teams to 'Asia Cup T20'.");


  // --- 6. MATCH ---
  // Creates one upcoming match for the first event.
  console.log("🏟️  Preparing an upcoming match (India vs Pakistan)...");
  const matchRef = db.collection("matches").doc();
  batch.set(matchRef, {
    eventId: event1Ref.id,
    teamA_id: teamRefs["India"].id,
    teamB_id: teamRefs["Pakistan"].id,
    sportType: "cricket",
    status: "Upcoming",
    scheduledTime: new Date('2025-08-12T14:00:00Z'),
    createdAt: FieldValue.serverTimestamp(),
    // All scoring data is correctly set to null or empty for a new match
    currentInnings: 1,
    onStrikeBatsmanId: null,
    nonStrikeBatsmanId: null,
    currentBowlerId: null,
    previousBowlerId: null,
    tossWinnerId: null,
    tossDecision: null,
    isFreeHit: false,
    rules: {
        totalOvers: 20,
        playersPerTeam: 11,
        maxOversPerBowler: 4,
        customRulesText: "Standard T20 rules apply."
    },
    // Innings objects are pre-filled but empty.
    innings1: { battingTeamId: null, bowlingTeamId: null, battingTeamName: "TBD", score: 0, wickets: 0, overs: 0, ballsInOver: 0, battingStats: [], bowlingStats: [] },
    innings2: { battingTeamId: null, bowlingTeamId: null, battingTeamName: "TBD", score: 0, wickets: 0, overs: 0, ballsInOver: 0, battingStats: [], bowlingStats: [] },
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