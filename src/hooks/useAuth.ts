// src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
// Import the 'User' type correctly for TypeScript
import { onAuthStateChanged, type User } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase'; // Import your initialized Firebase services

// Define a TypeScript interface for your user profile data in Firestore.
// This helps prevent typos and ensures your data is consistent.
interface UserProfile {
  email: string;
  role: 'user' | 'admin'; // The role can only be one of these two strings
}

/**
 * A custom React hook to get the current authentication state and user profile.
 * Any component that uses this hook will automatically re-render when the user
 * logs in or out.
 */
export function useAuth() {
  // State to hold the Firebase authentication user object
  const [user, setUser] = useState<User | null>(null);
  
  // New state to hold the user's custom profile data from Firestore
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // State to track whether the initial authentication check is complete
  const [loading, setLoading] = useState(true);

  // This useEffect hook runs once when the app starts
  useEffect(() => {
    // onAuthStateChanged sets up a listener that runs whenever the user's
    // login state changes. It returns an `unsubscribe` function.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If a user is logged in, fetch their profile from the 'users' collection
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          // If the document exists, store its data in the profile state
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Handle the rare case where a user exists in Auth but not in Firestore
          setProfile(null); 
        }
      } else {
        // If no user is logged in, clear the profile state
        setProfile(null);
      }
      
      // We are done loading once we have checked the auth state
      setLoading(false);
    });

    // The cleanup function for useEffect:
    // This will run when the component unmounts, preventing memory leaks.
    return () => unsubscribe();
  }, []); // The empty dependency array [] means this effect runs only once.

  // Return the user, their profile, and the loading state for components to use
  return { user, profile, loading };
}
