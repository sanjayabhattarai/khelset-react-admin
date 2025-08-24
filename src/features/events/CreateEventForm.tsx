// src/features/events/CreateEventForm.tsx

// We only need useState from 'react' for this component
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../api/firebase'; // Import your Firestore instance and Storage
import { useAuth } from '../../hooks/useAuth'; // Import useAuth hook

interface CreateEventFormProps {
  onEventCreated?: () => void;
}

export function CreateEventForm({ onEventCreated }: CreateEventFormProps) {
  // State for each input field in the form
  const [eventName, setEventName] = useState('');
  const [location, setLocation] = useState('');
  const [sportType, setSportType] = useState('cricket'); // Default value
  const [date, setDate] = useState('');
  const [deadline, setDeadline] = useState('');

  // State for poster upload
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // State for loading and success/error messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get current user
  const { user } = useAuth();

  // Handle poster image selection
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected poster
  const removePoster = () => {
    setPosterImage(null);
    setPosterPreview(null);
  };

  // Upload poster to Firebase Storage
  const uploadPosterImage = async (file: File): Promise<string> => {
    try {
      const imageRef = ref(storage, `event-posters/${user?.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(imageRef, file);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Firebase Storage is not enabled. Please enable it in Firebase Console.');
    }
  };

  // The event handler function
  // We use the specific 'React.FormEvent<HTMLFormElement>' type to fix the error
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the form from reloading the page
    setLoading(true);
    setMessage('');

    // Check if user is logged in
    if (!user) {
      setMessage('You must be logged in to create an event.');
      setLoading(false);
      return;
    }

    // Basic validation to ensure dates are selected
    if (!date || !deadline) {
      setMessage('Please select both an event date and a registration deadline.');
      setLoading(false);
      return;
    }

    try {
      let posterUrl = '';
      
      // Upload poster image if one is selected
      if (posterImage) {
        setUploadingPoster(true);
        try {
          posterUrl = await uploadPosterImage(posterImage);
        } catch (uploadError) {
          console.error('Error uploading poster:', uploadError);
          setMessage('Failed to upload poster image. Please make sure Firebase Storage is enabled and try again.');
          setLoading(false);
          setUploadingPoster(false);
          return;
        }
        setUploadingPoster(false);
      }

      // FIXED: Create a new document with user association
      await addDoc(collection(db, 'events'), {
        eventName: eventName,
        location: location,
        sportType: sportType,
        // Convert the date strings from the input into Firestore Timestamps
        date: new Date(date),
        registrationDeadline: new Date(deadline),
        status: 'upcoming', // Set a default status for new events
        posterUrl: posterUrl, // Add poster URL to the event document
        createdAt: serverTimestamp(), // Add a server-side timestamp
        createdBy: user.uid, // Associate event with current user
        createdByEmail: user.email, // Store user email for reference
      });

      setMessage('Event created successfully!');
      // Clear the form fields after successful creation
      setEventName('');
      setLocation('');
      setSportType('cricket');
      setDate('');
      setDeadline('');
      setPosterImage(null);
      setPosterPreview(null);
      
      // Call the callback if provided
      if (onEventCreated) {
        onEventCreated();
      }

    } catch (err) {
      console.error('Error creating event:', err);
      setMessage('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
      setUploadingPoster(false);
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

        {/* Event Poster Upload */}
        <div>
          <label htmlFor="posterImage" className="block text-sm font-medium text-gray-300 mb-2">
            Event Poster (Optional)
          </label>
          
          {!posterPreview ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
              <input
                id="posterImage"
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
                className="hidden"
              />
              <label
                htmlFor="posterImage"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-gray-300 text-sm">Click to upload event poster</span>
                <span className="text-gray-500 text-xs">PNG, JPG up to 10MB</span>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={posterPreview}
                alt="Poster preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-600"
              />
              <button
                type="button"
                onClick={removePoster}
                title="Remove poster image"
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
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
          disabled={loading || uploadingPoster}
          className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500"
        >
          {uploadingPoster ? 'Uploading poster...' : loading ? 'Creating...' : 'Create Event'}
        </button>

        {/* Message Display */}
        {message && <p className="text-center text-sm mt-4 text-green-400">{message}</p>}
      </form>
    </div>
  );
}
