// src/features/events/CreateEventForm.tsx

// We only need useState from 'react' for this component
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebase'; // Import your Firestore instance

export function CreateEventForm() {
  // State for each input field in the form
  const [eventName, setEventName] = useState('');
  const [location, setLocation] = useState('');
  const [sportType, setSportType] = useState('cricket'); // Default value
  const [date, setDate] = useState('');
  const [deadline, setDeadline] = useState('');

  // State for loading and success/error messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // The event handler function
  // We use the specific 'React.FormEvent<HTMLFormElement>' type to fix the error
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the form from reloading the page
    setLoading(true);
    setMessage('');

    // Basic validation to ensure dates are selected
    if (!date || !deadline) {
      setMessage('Please select both an event date and a registration deadline.');
      setLoading(false);
      return;
    }

    try {
      // Create a new document in the top-level 'events' collection
      await addDoc(collection(db, 'events'), {
        eventName: eventName,
        location: location,
        sportType: sportType,
        // Convert the date strings from the input into Firestore Timestamps
        date: new Date(date),
        registrationDeadline: new Date(deadline),
        status: 'upcoming', // Set a default status for new events
        createdAt: serverTimestamp(), // Add a server-side timestamp
      });

      setMessage('Event created successfully!');
      // Clear the form fields after successful creation
      setEventName('');
      setLocation('');
      setSportType('cricket');
      setDate('');
      setDeadline('');

    } catch (err) {
      setMessage('Failed to create event. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 text-white">Create New Event</h3>
      <form onSubmit={handleCreateEvent} className="space-y-4">
        {/* Event Name Input */}
        <div>
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-300">Event Name</label>
          <input
            id="eventName"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
          />
        </div>

        {/* Location Input */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
          />
        </div>

        {/* Sport Type Dropdown */}
        <div>
          <label htmlFor="sportType" className="block text-sm font-medium text-gray-300">Sport Type</label>
          <select
            id="sportType"
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
          >
            <option value="cricket">Cricket</option>
            <option value="football">Football</option>
            <option value="futsal">Futsal</option>
            <option value="basketball">Basketball</option>
          </select>
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300">Event Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-300">Registration Deadline</label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>

        {/* Message Display */}
        {message && <p className="text-center text-sm mt-4 text-green-400">{message}</p>}
      </form>
    </div>
  );
}
