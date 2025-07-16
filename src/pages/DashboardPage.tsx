// src/pages/DashboardPage.tsx

import { useState } from 'react'; // Import useState
import { signOut } from 'firebase/auth';
import { auth } from '../api/firebase';
import { useAuth } from '../hooks/useAuth';
import { CreateEventForm } from '../features/events/CreateEventForm';
import { EventList } from '../features/events/EventList';
import { ManageEventPage } from './ManageEventPage'; // <-- Import the new page

export function DashboardPage() {
  const { user } = useAuth();
  // State to keep track of which event is being managed
  const [managingEventId, setManagingEventId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  // --- VIEW ROUTING LOGIC ---
  // If we are managing an event, show the ManageEventPage
  if (managingEventId) {
    return (
      <ManageEventPage 
        eventId={managingEventId} 
        onBack={() => setManagingEventId(null)} // Pass a function to go back
      />
    );
  }

  // Otherwise, show the main dashboard view
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-500">Khelset Admin</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold"
          >
            Sign Out
          </button>
        </header>
        <main>
          <p className="text-lg">
            Welcome, <span className="font-bold">{user?.email}</span>!
          </p>
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CreateEventForm />
              {/* Pass the function to handle the manage click */}
              <EventList onManageEvent={(eventId) => setManagingEventId(eventId)} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
