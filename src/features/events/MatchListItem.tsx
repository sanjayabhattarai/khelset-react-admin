// src/features/events/MatchListItem.tsx

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';

interface MatchListItemProps {
  match: { // This component receives the match data as a prop
    id: string;
    teamA_id: string;
    teamB_id: string;
  };
  onStartScoring: (matchId: string) => void; // Function to handle the button click
}

export function MatchListItem({ match, onStartScoring }: MatchListItemProps) {
  // State to hold the fetched team names
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [loading, setLoading] = useState(true);

  // This effect runs once to fetch the names of the two teams
  useEffect(() => {
    const fetchTeamNames = async () => {
      try {
        const teamADoc = await getDoc(doc(db, 'teams', match.teamA_id));
        const teamBDoc = await getDoc(doc(db, 'teams', match.teamB_id));
        
        if (teamADoc.exists()) setTeamAName(teamADoc.data().name);
        if (teamBDoc.exists()) setTeamBName(teamBDoc.data().name);

      } catch (err) {
        console.error("Failed to fetch team names:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamNames();
  }, [match.teamA_id, match.teamB_id]);

  return (
    <li className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
      {loading ? (
        <p className="text-sm text-gray-400">Loading match details...</p>
      ) : (
        <p className="font-semibold text-white">{teamAName} vs {teamBName}</p>
      )}
      <button
        className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-md"
        onClick={() => onStartScoring(match.id)}
      >
        Start Scoring
      </button>
    </li>
  );
}
