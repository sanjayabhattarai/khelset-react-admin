// src/pages/LiveScoringPage.tsx

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../api/firebase';
// Import the specific scoring interface for cricket that we will use
import { CricketScoringInterface } from '../features/scoring/CricketScoringInterface';

// Define the props that this page will receive from its parent (ManageEventPage).
interface LiveScoringPageProps {
  matchId: string;
  onBack: () => void; // A function to go back to the previous screen
}

// Define the shape of the match data we need to fetch from Firestore.
interface Match {
  id: string;
  sportType: string;
  // Add any other general match fields you might need in the future
}

export function LiveScoringPage({ matchId, onBack }: LiveScoringPageProps) {
    console.log("Attempting to score match with ID:", matchId);
  // State to hold the match data once it's fetched
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  // This useEffect hook runs when the component loads.
  // Its job is to fetch the match document from Firestore.
  useEffect(() => {
    const matchDocRef = doc(db, 'matches', matchId);
    
    // onSnapshot listens for real-time changes to the document.
    const unsubscribe = onSnapshot(matchDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        // If the document exists, store its data in our state.
        setMatch({ id: docSnapshot.id, ...docSnapshot.data() } as Match);
      }
      setLoading(false); // Stop loading once we have a result
    });

    // Cleanup the listener when the component is no longer on screen to prevent memory leaks.
    return () => unsubscribe();
  }, [matchId]); // This effect will re-run if the matchId ever changes.

  // This helper function decides which scoring component to render.
  const renderScoringInterface = () => {
    if (!match) {
      return <p className="text-gray-400">Match data not found.</p>;
    }

    // --- THIS IS THE CORE LOGIC ---
    // A switch statement checks the sportType and returns the correct component.
    switch (match.sportType?.toLowerCase()) {
      case 'cricket':
        // If the sport is cricket, show the cricket scoring UI.
        return <CricketScoringInterface matchId={match.id} />;
      
      case 'football':
        // In the future, you will create and return a FootballScoringInterface component here.
        return <p className="text-white">Football Scoring Coming Soon!</p>;
        
      case 'basketball':
        // In the future, you will create and return a BasketballScoringInterface component here.
        return <p className="text-white">Basketball Scoring Coming Soon!</p>;
        
      default:
        return <p className="text-red-500">Error: Unknown sport type "{match.sportType}"</p>;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* A button to navigate back to the event management screen */}
        <button onClick={onBack} className="text-sm text-green-400 hover:underline mb-6">
          &larr; Back to Event Management
        </button>
        
        {/* Show a loading message or render the correct scoring interface */}
        {loading ? (
          <p className="text-center text-gray-400">Loading match...</p>
        ) : (
          renderScoringInterface()
        )}
      </div>
    </div>
  );
}
