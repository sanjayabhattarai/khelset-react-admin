// src/App.tsx

// Import the custom hook and page components we will create
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  // Use our custom hook to get the current user and loading state
  const { user, loading } = useAuth();

  // While the hook is checking the user's login status, show a loading spinner.
  // This prevents a "flash" of the login screen if the user is already logged in.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // This is the core logic:
  // If the 'user' object exists, show the DashboardPage.
  // If the 'user' object is null, show the LoginPage.
  return user ? <DashboardPage /> : <LoginPage />;
}

export default App;
