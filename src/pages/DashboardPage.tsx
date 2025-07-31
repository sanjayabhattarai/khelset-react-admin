// src/pages/DashboardPage.tsx
// This page is now much simpler. Its only job is to display the main dashboard content.
// The logic for conditionally showing ManageEventPage has been removed.

import { EventList } from '../features/events/EventList';
import { CreateEventForm } from '../features/events/CreateEventForm';

export function DashboardPage() {
  // The state for managing which event is selected is no longer needed here.
  // Navigation is now handled by the router.

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {/* The EventList component now handles navigation via Links */}
            <EventList />
          </div>
          <div>
            <CreateEventForm />
          </div>
        </div>
      </div>
    </div>
  );
}
