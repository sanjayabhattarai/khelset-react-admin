// src/features/events/EventList.tsx
// This component now uses user-specific filtering to show only the current user's events

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth hook

interface Event {
  id: string;
  eventName: string;
  status: string;
  createdBy: string; // Add user association
  posterUrl?: string; // Add poster URL field
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Get current user

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // FIXED: Only fetch events created by the current user
    const eventsQuery = query(
      collection(db, 'events'),
      where('createdBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(eventsQuery, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Event[]);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]); // Re-run when user changes

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">🏏 Your Events</h3>
        <div className="text-sm text-gray-400">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {!user ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-400 text-lg">Please log in to see your events.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg">Loading your events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏏</div>
          <p className="text-gray-400 text-lg mb-4">You haven't created any events yet.</p>
          <p className="text-gray-500">Create your first cricket event to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div key={event.id} className="group">
              <Link 
                to={`/manage-event/${event.id}`} 
                className="block bg-gradient-to-r from-gray-700 to-gray-600 hover:from-blue-700 hover:to-purple-600 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl border border-gray-600 hover:border-blue-500 overflow-hidden"
              >
                {/* Poster Image Section */}
                {event.posterUrl ? (
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={event.posterUrl} 
                      alt={`${event.eventName} poster`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-6xl">🏏</div>
                  </div>
                )}
                
                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-xl mb-2 group-hover:text-white transition-colors">
                        {event.eventName}
                      </h4>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          event.status === 'upcoming' 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : event.status === 'active'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                        <span className="text-gray-400 text-sm">🏏 Cricket Event</span>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
