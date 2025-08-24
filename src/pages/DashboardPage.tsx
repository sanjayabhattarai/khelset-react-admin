// src/pages/DashboardPage.tsx
// Enhanced dashboard with hero banner and collapsible create form

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
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              🏏 Khelset Admin
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-6">
              Manage your cricket events with ease
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                {showCreateForm ? 'Cancel' : '+ Create New Event'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Collapsible Create Form */}
          {showCreateForm && (
            <div className="mb-8">
              <CreateEventForm onEventCreated={handleEventCreated} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - Events List */}
            <div className="lg:col-span-3">
              <EventList />
            </div>

            {/* Sidebar - Quick Stats & Actions */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">📊 Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Events:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Teams:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Live Matches:</span>
                    <span className="font-semibold">-</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">⚡ Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                    📝 Manage Players
                  </button>
                  <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                    🏆 View Results
                  </button>
                  <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                    📱 Live Scoring
                  </button>
                </div>
              </div>

              {/* Welcome Message */}
              {user && (
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">👋 Welcome!</h3>
                  <p className="text-gray-400 text-sm">
                    Hello, {user.email}! Ready to manage some cricket?
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
