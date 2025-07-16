// src/features/events/CreateMatchForm.tsx

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebase';

// --- 1. Define the Default Match Structure ---
// This object contains the full, detailed data structure for a new cricket match.
// It mirrors the structure from your seed.js script, with default "zeroed-out" values.
const defaultCricketMatchData = {
  status: 'Upcoming',
  sportType: 'cricket',
  result: '', // No result yet
  currentInnings: 1,
  onStrikeBatsmanId: null,
  nonStrikeBatsmanId: null,
  currentBowlerId: null,
  innings1: {
    battingTeamId: null,
    bowlingTeamId: null,
    score: 0,
    wickets: 0,
    overs: 0,
    ballsInOver: 0,
    battingStats: [], // Start with empty arrays
    bowlingStats: [],
    fallOfWickets: [],
  },
  innings2: {
    battingTeamId: null,
    bowlingTeamId: null,
    score: 0,
    wickets: 0,
    overs: 0,
    ballsInOver: 0,
    battingStats: [],
    bowlingStats: [],
    fallOfWickets: [],
  },
};


// Define the shape of the props this component will receive
interface CreateMatchFormProps {
  eventId: string;
  approvedTeams: { id: string; name: string }[];
}

export function CreateMatchForm({ eventId, approvedTeams }: CreateMatchFormProps) {
  const [teamAId, setTeamAId] = useState<string>(approvedTeams.length > 0 ? approvedTeams[0].id : '');
  const [teamBId, setTeamBId] = useState<string>(approvedTeams.length > 1 ? approvedTeams[1].id : '');
  const [matchTime, setMatchTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTeamAId(approvedTeams.length > 0 ? approvedTeams[0].id : '');
    setTeamBId(approvedTeams.length > 1 ? approvedTeams[1].id : '');
  }, [approvedTeams]);

  const handleCreateMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamAId || !teamBId || !matchTime || teamAId === teamBId) {
      setMessage('Please select two different teams and a match time.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      // --- 2. Merge Form Data with the Default Structure ---
      const basicMatchInfo = {
        eventId: eventId,
        teamA_id: teamAId,
        teamB_id: teamBId,
        scheduledTime: new Date(matchTime),
      };

      // The spread syntax (...) combines the objects.
      // The basic info (like team IDs) will overwrite the null values in the default structure.
      const fullNewMatchData = {
        ...defaultCricketMatchData,
        ...basicMatchInfo,
        // We also update the innings objects with the correct team IDs
        "innings1.battingTeamId": teamAId, // Assuming Team A bats first
        "innings1.bowlingTeamId": teamBId,
        "innings2.battingTeamId": teamBId,
        "innings2.bowlingTeamId": teamAId,
        createdAt: serverTimestamp(), // Add a creation timestamp
      };

      // Create the new document with the complete data structure
      await addDoc(collection(db, 'matches'), fullNewMatchData);

      setMessage('Match created successfully with full scoring data!');
      // Optionally reset form fields here
      setMatchTime('');

    } catch (err) {
      setMessage('Failed to create match.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (approvedTeams.length < 2) {
    return (
      <div className="bg-gray-700 p-6 rounded-lg">
        <h4 className="text-lg font-bold mb-4 text-white">Create New Match</h4>
        <p className="text-gray-400">You need at least two approved teams to create a match.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-6 rounded-lg">
      <h4 className="text-lg font-bold mb-4 text-white">Create New Match</h4>
      <form onSubmit={handleCreateMatch} className="space-y-4">
        {/* Team A Dropdown */}
        <div>
          <label htmlFor="teamA" className="block text-sm font-medium text-gray-300">Team A (Bats First)</label>
          <select
            id="teamA"
            value={teamAId}
            onChange={(e) => setTeamAId(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md"
          >
            {approvedTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </div>

        {/* Team B Dropdown */}
        <div>
          <label htmlFor="teamB" className="block text-sm font-medium text-gray-300">Team B</label>
          <select
            id="teamB"
            value={teamBId}
            onChange={(e) => setTeamBId(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md"
          >
            {approvedTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </div>

        {/* Match Time Input */}
        <div>
          <label htmlFor="matchTime" className="block text-sm font-medium text-gray-300">Match Time</label>
          <input
            id="matchTime"
            type="datetime-local"
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500"
        >
          {loading ? 'Creating...' : 'Create Match'}
        </button>
        {message && <p className={`text-center text-sm mt-2 ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
      </form>
    </div>
  );
}
