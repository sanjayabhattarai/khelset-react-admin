// src/features/events/EventList.tsx

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../api/firebase';

// Define the shape of our event data
interface Event {
  id: string;
  eventName: string;
  location: string;
}

// Define the props for this component
interface EventListProps {
  onManageEvent: (eventId: string) => void; // A function to handle the click
}

export function EventList({ onManageEvent }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        eventName: doc.data().eventName,
        location: doc.data().location,
      }));
      setEvents(eventsData as Event[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-gray-400">Loading events...</p>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-white">Manage Events</h3>
      {events.length === 0 ? (
        <p className="text-gray-400">No events created yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
              <div>
                <p className="font-semibold text-white">{event.eventName}</p>
                <p className="text-sm text-gray-400">{event.location}</p>
              </div>
              <button 
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-md"
                // When clicked, call the function passed from the parent
                onClick={() => onManageEvent(event.id)}
              >
                Manage
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
