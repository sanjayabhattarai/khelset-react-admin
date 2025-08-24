// src/pages/DashboardPage.tsx
// Professional minimal dashboard

import { useState } from 'react';
import { EventList } from '../features/events/EventList';
import { CreateEventForm } from '../features/events/CreateEventForm';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();

  const handleEventCreated = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-white">
                Khelset Admin
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                Cricket Management
              </span>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">Welcome, {user.email}</span>
                <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Event Section */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Event Management</h2>
                <p className="text-sm text-gray-300 mt-1">Create and manage cricket events</p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {showCreateForm ? 'Cancel' : 'Create New Event'}
              </button>
            </div>
            
            {showCreateForm && (
              <div className="border-t border-gray-700 pt-4">
                <CreateEventForm onEventCreated={handleEventCreated} />
              </div>
            )}
          </div>
        </div>

        {/* Events List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Events</h2>
            <p className="text-sm text-gray-300 mt-1">Manage your cricket events and tournaments</p>
          </div>
          <div className="p-6">
            <EventList />
          </div>
        </div>
      </div>
    </div>
  );
}
