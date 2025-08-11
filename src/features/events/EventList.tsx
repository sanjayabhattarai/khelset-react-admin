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
      <h3 className="text-xl font-bold mb-4">Your Events</h3>
      {!user ? (
        <p className="text-gray-400">Please log in to see your events.</p>
      ) : loading ? (
        <p>Loading your events...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-400">You haven't created any events yet. Create your first event!</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="bg-gray-700 p-4 rounded-md">
              {/* ✨ FIX: The event name is now a Link to the manage page */}
              <Link to={`/manage-event/${event.id}`} className="font-semibold hover:text-green-400">
                {event.eventName}
              </Link>
              <p className="text-sm text-gray-400">{event.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
