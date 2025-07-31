// src/pages/ManageTeamPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // ✨ FIX: Import useNavigate
import { Team, Player } from '../features/scoring/cricket/types';
// Make sure you have these functions in your firestoreService file
import { 
  getTeam, 
  getPlayerDocs as getPlayersByIds,
  getAvailablePlayers, 
  addPlayerToTeam, 
  removePlayerFromTeam 
} from '../features/scoring/cricket/services/firestoreService';

export function ManageTeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate(); // ✨ FIX: Get the navigate function
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loading, setLoading] = useState(true);

  // A function to fetch all necessary data, which we can call to refresh
  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const teamData = await getTeam(teamId);
      setTeam(teamData);

      if (teamData?.players) {
        setRoster(await getPlayersByIds(teamData.players));
      } else {
        setRoster([]);
      }
      setAvailablePlayers(await getAvailablePlayers());

    } catch (error) {
      console.error("Error fetching team data:", error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler for removing a player from the team
  const handleRemovePlayer = async (playerId: string) => {
    if (!teamId || !window.confirm("Are you sure you want to remove this player?")) return;
    await removePlayerFromTeam(teamId, playerId);
    fetchData(); // Refresh the data
  };

  // Handler for adding a selected player to the team
  const handleAddPlayer = async () => {
    if (!teamId || !selectedPlayerId) return;
    await addPlayerToTeam(teamId, selectedPlayerId);
    setSelectedPlayerId(''); // Reset dropdown
    fetchData(); // Refresh the data
  };

  if (loading) return <div className="text-white text-center p-8">Loading team...</div>;
  if (!team) return <div className="text-white text-center p-8">Team not found.</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* ✨ FIX: Use a button with an onClick handler for navigation */}
        <button onClick={() => navigate('/dashboard')} className="text-sm text-green-400 hover:underline mb-6">
          &larr; Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-8">Manage Team: {team.name}</h1>

        {/* Section for the current roster */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Current Roster ({roster.length} players)</h2>
          <ul className="space-y-3">
            {roster.map(player => (
              <li key={player.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                <p>{player.name} <span className="text-gray-400 text-sm">({player.role})</span></p>
                <button onClick={() => handleRemovePlayer(player.id)} className="text-red-500 hover:text-red-400 font-semibold">
                  Remove
                </button>
              </li>
            ))}
             {roster.length === 0 && <p className="text-gray-400">No players on this team yet.</p>}
          </ul>
        </div>

        {/* Section to add a new player */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Add Player to Team</h2>
          <div className="flex items-center gap-4">
            <select 
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="flex-grow bg-gray-700 p-3 rounded-md border border-gray-600"
            >
              <option value="">Select an available player...</option>
              {availablePlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
            <button 
              onClick={handleAddPlayer} 
              disabled={!selectedPlayerId} 
              className="p-3 bg-green-600 rounded-md font-bold hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Add Player
            </button>
          </div>
           {availablePlayers.length === 0 && <p className="text-gray-400 mt-4">No available players found. Create new players in the main dashboard.</p>}
        </div>
      </div>
    </div>
  );
}
