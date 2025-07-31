// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ManageEventPage } from './pages/ManageEventPage';
import { ManageTeamPage } from './pages/ManageTeamPage';
import { LiveScoringPage } from './pages/LiveScoringPage';
// import { ColorTest } from './components/ColorTest';

function App() {
  const { user, loading } = useAuth();

  // Temporary: Show color test for debugging
  // return <ColorTest />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
      <Route path="/manage-event/:eventId" element={user ? <ManageEventPage /> : <Navigate to="/login" />} />
      <Route path="/manage-team/:teamId" element={user ? <ManageTeamPage /> : <Navigate to="/login" />} />
      <Route path="/live-scoring/:matchId" element={user ? <LiveScoringPage /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
