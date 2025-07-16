// src/pages/ManageEventPage.tsx

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { LiveScoringPage } from './LiveScoringPage';
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

// Define the props that this page component receives from its parent (DashboardPage).
interface ManageEventPageProps {
  eventId: string;
  onBack: () => void;
}

export function ManageEventPage({ eventId, onBack }: ManageEventPageProps) {
  // State to hold the lists of teams and matches fetched from Firestore.
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // Separate loading states for each list to provide a better user experience.
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // State to manage which view is active: the main management view or the live scoring view.
  const [scoringMatchId, setScoringMatchId] = useState<string | null>(null);

  // This useEffect hook runs once to set up real-time listeners for the data.
  useEffect(() => {
    // Query for teams linked to this specific event.
    const teamsQuery = query(collection(db, 'teams'), where('eventId', '==', eventId));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Team[]);
      setLoadingTeams(false);
    });

    // Query for matches linked to this specific event.
    const matchesQuery = query(collection(db, 'matches'), where('eventId', '==', eventId));
    const unsubscribeMatches = onSnapshot(matchesQuery, (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Match[]);
      setLoadingMatches(false);
    });
    
    // Cleanup the listeners when the component is no longer on screen to prevent memory leaks.
    return () => { 
      unsubscribeTeams(); 
      unsubscribeMatches(); 
    };
  }, [eventId]); // This effect will re-run if the eventId prop ever changes.

  // Function to approve a team by updating its status in Firestore.
  const handleApproveTeam = async (teamId: string) => {
    await updateDoc(doc(db, 'teams', teamId), { status: 'Approved' });
  };
  
  // Filter the teams list to only include approved teams for the "Create Match" form.
  const approvedTeams = teams.filter(team => team.status === 'Approved');

  // --- VIEW ROUTING LOGIC ---
  // If we have selected a match to score, show the LiveScoringPage.
  if (scoringMatchId) {
    return (
      <LiveScoringPage 
        matchId={scoringMatchId} 
        onBack={() => setScoringMatchId(null)} // Pass a function to go back.
      />
    );
  }

  // Otherwise, show the main event management page with its two-column layout.
  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={onBack} className="text-sm text-green-400 hover:underline mb-6">
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
                      <p className="font-semibold text-white">{team.name}</p>
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
                    {/* We now map over the matches and use our reusable MatchListItem component */}
                    {matches.map((match) => (
                      <MatchListItem 
                        key={match.id} 
                        match={match} 
                        onStartScoring={(matchId) => setScoringMatchId(matchId)} 
                      />
                    ))}
                  </ul>
              )}
            </div>
          </div>

          {/* Right Column: Create Match Form */}
          <div>
            <CreateMatchForm eventId={eventId} approvedTeams={approvedTeams} />
          </div>
        </div>
      </div>
    </div>
  );
}
