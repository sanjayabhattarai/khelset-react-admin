// src/features/events/CreateMatchForm.tsx
// This component has been updated to include a section for setting custom match rules.

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { DEFAULT_INNINGS_STATE } from '../scoring/cricket/constants/defaults'; // Assuming you have this file

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
  
  // ✨ NEW: State for the customizable match rules
  const [totalOvers, setTotalOvers] = useState(20);
  const [playersPerTeam, setPlayersPerTeam] = useState(11);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState(4);
  const [customRulesText, setCustomRulesText] = useState('');

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
      // ✨ NEW: Assemble the rules object from the form state.
      const matchRules = {
        totalOvers,
        playersPerTeam,
        maxOversPerBowler,
        customRulesText,
      };

      // This is the full data structure for a new match document.
      const newMatchData = {
        teamA_id: teamAId,
        teamB_id: teamBId,
        eventId: eventId,
        scheduledTime: new Date(matchTime),
        status: 'Upcoming' as const,
        sportType: 'cricket',
        // Default states for a new match
        currentInnings: 1,
        onStrikeBatsmanId: null,
        nonStrikeBatsmanId: null,
        currentBowlerId: null,
        previousBowlerId: null,
        isFreeHit: false,
        tossWinnerId: null,
        tossDecision: null,
        // ✨ NEW: Add the rules object to the match data.
        rules: matchRules,
        // Initialize both innings with a default empty state.
        innings1: DEFAULT_INNINGS_STATE,
        innings2: DEFAULT_INNINGS_STATE,
        createdAt: serverTimestamp(),
      };

      // Create the new document in the 'matches' collection.
      await addDoc(collection(db, 'matches'), newMatchData);

      setMessage('Match created successfully with custom rules!');
      // Optionally reset form fields here
      setMatchTime('');
      setCustomRulesText('');

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

        {/* ✨ NEW: Match Rules Section */}
        <div className="border-t border-gray-600 pt-4">
            <h5 className="text-md font-bold mb-2 text-white">Match Rules</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="totalOvers" className="block text-sm font-medium text-gray-300">Total Overs</label>
                    <input id="totalOvers" type="number" value={totalOvers} onChange={(e) => setTotalOvers(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md" />
                </div>
                <div>
                    <label htmlFor="playersPerTeam" className="block text-sm font-medium text-gray-300">Players per Team</label>
                    <input id="playersPerTeam" type="number" value={playersPerTeam} onChange={(e) => setPlayersPerTeam(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md" />
                </div>
                <div>
                    <label htmlFor="maxOversPerBowler" className="block text-sm font-medium text-gray-300">Max Overs/Bowler</label>
                    <input id="maxOversPerBowler" type="number" value={maxOversPerBowler} onChange={(e) => setMaxOversPerBowler(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md" />
                </div>
            </div>
            <div className="mt-4">
                <label htmlFor="customRules" className="block text-sm font-medium text-gray-300">Other Rules / Description</label>
                <textarea id="customRules" value={customRulesText} onChange={(e) => setCustomRulesText(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md"></textarea>
            </div>
        </div>

        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500">
          {loading ? 'Creating...' : 'Create Match'}
        </button>
        {message && <p className={`text-center text-sm mt-2 ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
      </form>
    </div>
  );
}
