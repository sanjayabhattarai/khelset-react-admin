// src/features/events/CreateMatchForm.tsx
// This component has been updated to correctly initialize innings data,
// fixing the "invalid nested entity" bug at its source.

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { Innings } from '../scoring/cricket/types';

// Define the shape of the props this component will receive
interface CreateMatchFormProps {
  eventId: string;
  approvedTeams: { id: string; name: string }[];
}

export function CreateMatchForm({ eventId, approvedTeams }: CreateMatchFormProps) {
  // State for the basic match details
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [matchTime, setMatchTime] = useState('');

  // State for form handling
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // This effect resets the team selection when the list of approved teams changes.
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
      // Define a function to generate a fresh, default innings object.
      // This ensures that innings1 and innings2 are two completely separate objects
      // and that the history arrays are correctly initialized as empty.
      const createDefaultInnings = (): Innings => ({
        battingTeamId: null,
        bowlingTeamId: null,
        battingTeamName: "TBD",
        score: 0,
        wickets: 0,
        overs: 0,
        ballsInOver: 0,
        battingStats: [],
        bowlingStats: [],
        deliveryHistory: [], // Correctly initialized as empty array
        // ✨ FIX: The undoStack is no longer part of the main document, so it is removed from here.
      });

      // This is the full data structure for a new match document.
      const newMatchData = {
        teamA_id: teamAId,
        teamB_id: teamBId,
        eventId: eventId,
        scheduledTime: new Date(matchTime),
        status: 'Upcoming' as const,
        sportType: 'cricket',
        currentInnings: 1,
        onStrikeBatsmanId: null,
        nonStrikeBatsmanId: null,
        currentBowlerId: null,
        previousBowlerId: null,
        isFreeHit: false,
        tossWinnerId: null,
        tossDecision: null,
        // Call the function to create two independent innings objects.
        innings1: createDefaultInnings(),
        innings2: createDefaultInnings(),
        createdAt: serverTimestamp(),
      };

      // Create the new document in the 'matches' collection.
      await addDoc(collection(db, 'matches'), newMatchData);

      setMessage('Match created successfully!');
      setMatchTime('');

    } catch (err) {
      setMessage('Failed to create match.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Don't render the form if there aren't at least two approved teams.
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
        {/* Team Selection Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="teamA" className="block text-sm font-medium text-gray-300">Team A</label>
                <select id="teamA" value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md">
                    {approvedTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="teamB" className="block text-sm font-medium text-gray-300">Team B</label>
                <select id="teamB" value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md">
                    {approvedTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
            </div>
        </div>
        
        {/* Match Time Input */}
        <div>
          <label htmlFor="matchTime" className="block text-sm font-medium text-gray-300">Match Time</label>
          <input id="matchTime" type="datetime-local" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} required className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md" />
        </div>

        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500">
          {loading ? 'Creating...' : 'Create Match'}
        </button>
        {message && <p className={`text-center text-sm mt-2 ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
      </form>
    </div>
  );
}
