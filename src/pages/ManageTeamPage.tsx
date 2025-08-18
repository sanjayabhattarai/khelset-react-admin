// src/pages/ManageTeamPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Team, Player } from '../features/scoring/cricket/types';
import { useAuth } from '../hooks/useAuth';
// Make sure you have these functions in your firestoreService file
import { 
  getTeam, 
  getPlayerDocs as getPlayersByIds,
  getAvailablePlayers, 
  addPlayerToTeam, 
  removePlayerFromTeam,
  createPlayer,
  updatePlayer
} from '../features/scoring/cricket/services/firestoreService';

export function ManageTeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create player form state
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Edit player state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  // Cricket player roles
  const playerRoles = [
    'Batsman',
    'Bowler', 
    'All-rounder',
    'Wicket-keeper',
    'Captain',
    'Vice-captain'
  ];

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

  // Handler for creating a new player
  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerRole || !user) return;
    setCreating(true);
    try {
      await createPlayer({ name: newPlayerName.trim(), role: newPlayerRole }, user.uid);
      setNewPlayerName('');
      setNewPlayerRole('');
      setShowCreatePlayer(false);
      fetchData(); // Refresh to show new player in available list
    } catch (error) {
      console.error("Error creating player:", error);
    } finally {
      setCreating(false);
    }
  };

  // Handler for editing player info
  const startEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditRole(player.role);
  };

  const saveEditPlayer = async () => {
    if (!editingPlayer || !editName.trim() || !editRole) return;
    try {
      await updatePlayer(editingPlayer.id, { name: editName.trim(), role: editRole });
      setEditingPlayer(null);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error("Error updating player:", error);
    }
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setEditName('');
    setEditRole('');
  };

  // Filter available players based on search
  const filteredAvailablePlayers = availablePlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-white text-center p-8">Loading team...</div>;
  if (!team) return <div className="text-white text-center p-8">Team not found.</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button onClick={() => navigate('/dashboard')} className="text-sm text-green-400 hover:underline mb-6">
          &larr; Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-8">Manage Team: {team.name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Current Roster */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Current Roster ({roster.length} players)</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {roster.map(player => (
                <div key={player.id} className="bg-gray-700 p-4 rounded-md">
                  {editingPlayer?.id === player.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-gray-600 p-2 rounded border border-gray-500"
                        placeholder="Player name"
                      />
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full bg-gray-600 p-2 rounded border border-gray-500"
                        aria-label="Select player role"
                      >
                        <option value="">Select role...</option>
                        {playerRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditPlayer}
                          className="px-3 py-1 bg-green-600 text-sm rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-600 text-sm rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-gray-400 text-sm">{player.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditPlayer(player)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-red-500 hover:text-red-400 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {roster.length === 0 && (
                <p className="text-gray-400 text-center py-8">No players on this team yet.</p>
              )}
            </div>
          </div>

          {/* Right Column: Add Players */}
          <div className="space-y-6">
            {/* Create New Player Section */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create New Player</h2>
                <button
                  onClick={() => setShowCreatePlayer(!showCreatePlayer)}
                  className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                >
                  {showCreatePlayer ? 'Cancel' : 'New Player'}
                </button>
              </div>
              
              {showCreatePlayer && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600"
                    placeholder="Player name"
                  />
                  <select
                    value={newPlayerRole}
                    onChange={(e) => setNewPlayerRole(e.target.value)}
                    className="w-full bg-gray-700 p-3 rounded border border-gray-600"
                    aria-label="Select new player role"
                  >
                    <option value="">Select role...</option>
                    {playerRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreatePlayer}
                    disabled={!newPlayerName.trim() || !newPlayerRole || creating}
                    className="w-full p-3 bg-green-600 rounded font-bold hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Player'}
                  </button>
                </div>
              )}
            </div>

            {/* Add Existing Player Section */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Add Existing Player</h2>
              
              {/* Search box */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 p-3 rounded border border-gray-600 mb-4"
                placeholder="Search available players..."
              />

              <div className="space-y-4">
                <select 
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600"
                  aria-label="Select available player to add"
                >
                  <option value="">Select an available player...</option>
                  {filteredAvailablePlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={handleAddPlayer} 
                  disabled={!selectedPlayerId} 
                  className="w-full p-3 bg-green-600 rounded font-bold hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  Add Player to Team
                </button>
              </div>

              {filteredAvailablePlayers.length === 0 && (
                <p className="text-gray-400 mt-4 text-sm">
                  {searchTerm ? 'No players found matching your search.' : 'No available players found. Create new players above.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}