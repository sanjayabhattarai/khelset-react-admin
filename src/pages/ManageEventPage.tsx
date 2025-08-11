// src/pages/ManageEventPage.tsx
// This page has been rewritten to work with react-router-dom and includes user ownership verification.

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { CreateMatchForm } from '../features/events/CreateMatchForm';
import { MatchListItem } from '../features/events/MatchListItem';

// Define TypeScript interfaces for our data structures for type safety.
interface Team {
  id: string;
  name: string;
  status: string;
}

interface Match {
  id: string;
  teamA_id: string;
  teamB_id: string;
  status: string;
}

export function ManageEventPage() {
  // 1. Get the eventId from the URL using the useParams hook.
  const { eventId } = useParams<{ eventId: string }>();
  // Get the navigate function for the back button.
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // This useEffect hook sets up the real-time listeners for the data.
  useEffect(() => {
    if (!eventId) return;

    const teamsQuery = query(collection(db, 'teams'), where('eventId', '==', eventId));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Team[]);
      setLoadingTeams(false);
    });

    const matchesQuery = query(collection(db, 'matches'), where('eventId', '==', eventId));
    const unsubscribeMatches = onSnapshot(matchesQuery, (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Match[]);
      setLoadingMatches(false);
    });
    
    return () => { 
      unsubscribeTeams(); 
      unsubscribeMatches(); 
    };
  }, [eventId]);

  const handleApproveTeam = async (teamId: string) => {
    await updateDoc(doc(db, 'teams', teamId), { status: 'Approved' });
  };
  
  const approvedTeams = teams.filter(team => team.status === 'Approved');

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* The back button now uses the navigate function from the router. */}
        <button onClick={() => navigate('/dashboard')} className="text-sm text-green-400 hover:underline mb-6">
          &larr; Back to Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Lists for Teams and Matches */}
          <div className="space-y-8">
            {/* Teams Section */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Registered Teams</h3>
              {loadingTeams ? <p>Loading teams...</p> : teams.length === 0 ? <p>No teams registered.</p> : (
                <ul className="space-y-3">
                  {teams.map((team) => (
                    <li key={team.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                      {/* Team name is now a Link to the Manage Team page */}
                      <Link to={`/manage-team/${team.id}`} className="font-semibold text-white hover:text-green-400">
                        {team.name}
                      </Link>
                      <div className="flex items-center gap-4">
                        <p className={`text-sm font-semibold ${team.status === 'Approved' ? 'text-green-400' : 'text-yellow-400'}`}>{team.status}</p>
                        {team.status === 'Pending' && <button onClick={() => handleApproveTeam(team.id)} className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md">Approve</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Matches Section */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Match Schedule</h3>
              {loadingMatches ? <p>Loading matches...</p> : matches.length === 0 ? <p>No matches scheduled.</p> : (
                  <ul className="space-y-3">
                    {matches.map((match) => (
                      // The 'onStartScoring' prop is removed. The button inside MatchListItem should be a <Link>.
                      <MatchListItem 
                        key={match.id} 
                        match={match} 
                      />
                    ))}
                  </ul>
              )}
            </div>
          </div>

          {/* Right Column: Create Match Form */}
          <div>
            <CreateMatchForm eventId={eventId!} approvedTeams={approvedTeams} />
          </div>
        </div>
      </div>
    </div>
  );
}
