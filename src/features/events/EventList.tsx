// src/features/events/EventList.tsx
// This component now uses the <Link> component from react-router-dom
// to navigate to the manage event page.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../api/firebase';

interface Event {
  id: string;
  eventName: string;
  status: string;
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Event[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Your Events</h3>
      {loading ? <p>Loading events...</p> : (
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
