// src/pages/LiveScoringPage.tsx
// This page has been rewritten to work with react-router-dom.
// It no longer accepts props like 'matchId' or 'onBack'.

import { useParams, useNavigate } from 'react-router-dom';
import { CricketScoringInterface } from '../features/scoring/cricket/CricketScoringInterface';

export function LiveScoringPage() {
  // 1. Get URL parameters using the 'useParams' hook.
  // The 'matchId' here corresponds to the ':matchId' in your App.tsx route.
  const { matchId } = useParams<{ matchId: string }>();

  // 2. Get the navigation function using the 'useNavigate' hook.
  // This is the modern way to handle navigation, replacing the 'onBack' prop.
  const navigate = useNavigate();

  // Handle the case where the matchId is somehow missing from the URL.
  if (!matchId) {
    return (
      <div className="text-center text-red-500 p-8">
        Error: Match ID is missing from the URL.
      </div>
    );
  }

  // This function will be used for the back button.
  const handleGoBack = () => {
    // navigate(-1) is equivalent to clicking the browser's back button.
    navigate(-1); 
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* 3. The back button now uses the navigate function. */}
        <button onClick={handleGoBack} className="text-sm text-green-400 hover:underline mb-6">
          &larr; Back to Previous Page
        </button>
        
        {/* 4. The CricketScoringInterface now receives the matchId from useParams. */}
        <CricketScoringInterface matchId={matchId} />
      </div>
    </div>
  );
}
