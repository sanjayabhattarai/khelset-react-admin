import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getTeam, 
  getPlayersByTeamId,
  addPlayerToTeam, 
  removePlayerFromTeam,
  updatePlayer,
  createPlayer
} from '../features/scoring/cricket/services/firestoreService';
import { Player, Team } from '../features/scoring/cricket/types';
import { useAuth } from '../hooks/useAuth';

export function ManageTeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // States
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  // New player creation states
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('');
  const [creating, setCreating] = useState(false);

  // Cricket player roles
  const playerRoles = [
    'Batsman',
    'Bowler',
    'All-rounder',
    'Wicket-keeper',
    'Captain',
    'Vice-captain'
  ];

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const teamData = await getTeam(teamId);
      setTeam(teamData);

      // Get players by teamId (from Flutter app data structure)
      setRoster(await getPlayersByTeamId(teamId));

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
    if (!teamId || !window.confirm("Are you sure you want to remove this player from the team?")) return;
    try {
      await removePlayerFromTeam(teamId, playerId);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error("Error removing player:", error);
    }
  };

  // Handler for creating a new player and adding to team
  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerRole || !user || !teamId) return;
    setCreating(true);
    try {
      // Create the player
      const playerId = await createPlayer({ name: newPlayerName.trim(), role: newPlayerRole }, user.uid);
      // Add the newly created player to the team
      await addPlayerToTeam(teamId, playerId);
      // Reset form
      setNewPlayerName('');
      setNewPlayerRole('');
      setShowCreatePlayer(false);
      fetchData(); // Refresh to show new player in team roster
    } catch (error) {
      console.error("Error creating and adding player:", error);
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

  if (loading) return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-white text-xl">Loading team data...</p>
      </div>
    </div>
  );
  
  if (!team) return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-white text-xl">Team not found</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="inline-flex items-center text-sm text-green-400 hover:text-green-300 transition-colors mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                {team.name}
              </h1>
              <p className="text-gray-400 mt-2">Team Management Dashboard</p>
            </div>
            
            {/* Team Statistics */}
            <div className="mt-4 md:mt-0">
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">Total Players</div>
                <div className="text-2xl font-bold text-green-400">{roster.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Roster - Takes 2 columns on lg screens */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Team Roster
                </h2>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                  {roster.length} Players
                </span>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {roster.map((player, index) => (
                  <div key={player.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-colors">
                    {editingPlayer?.id === player.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-gray-600 p-2 rounded border border-gray-500 focus:border-blue-400 outline-none"
                          placeholder="Player name"
                        />
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full bg-gray-600 p-2 rounded border border-gray-500 focus:border-blue-400 outline-none"
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
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                              {player.role}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditPlayer(player)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded transition-colors"
                            title="Edit player"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemovePlayer(player.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                            title="Remove player from team"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {roster.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-400">No players on this team yet</p>
                    <p className="text-gray-500 text-sm mt-1">Add players using the form on the right</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add New Player */}
          <div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Player
                </h2>
                <button
                  onClick={() => setShowCreatePlayer(!showCreatePlayer)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    showCreatePlayer 
                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                      : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                  }`}
                >
                  {showCreatePlayer ? 'Cancel' : 'Add Player'}
                </button>
              </div>
              
              {showCreatePlayer && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Player Name</label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="w-full bg-gray-700 p-2 rounded border border-gray-600 focus:border-blue-400 outline-none"
                      placeholder="Enter player name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Player Role</label>
                    <select
                      value={newPlayerRole}
                      onChange={(e) => setNewPlayerRole(e.target.value)}
                      className="w-full bg-gray-700 p-2 rounded border border-gray-600 focus:border-blue-400 outline-none"
                      aria-label="Select player role"
                    >
                      <option value="">Select role...</option>
                      {playerRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleCreatePlayer}
                    disabled={!newPlayerName.trim() || !newPlayerRole || creating}
                    className="w-full p-2 bg-green-600 rounded font-medium hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {creating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create & Add to Team'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}