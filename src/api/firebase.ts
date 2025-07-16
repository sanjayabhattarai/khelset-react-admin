// Import the necessary functions from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's unique Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyABT_iHwUob7fUOVmTFUYP7pJ5pDAJu6EA",
  authDomain: "khelset-new.firebaseapp.com",
  projectId: "khelset-new",
  storageBucket: "khelset-new.firebasestorage.app",
  messagingSenderId: "862681026576",
  appId: "1:862681026576:web:1cbc6638e773d5641cba95",
  measurementId: "G-XRH5NW1EM7"
};

// Initialize the Firebase app with your configuration
const app = initializeApp(firebaseConfig);

// Initialize and export the Firebase services you will use in your app.
// This allows you to import 'auth' or 'db' in any other file.
export const auth = getAuth(app);
export const db = getFirestore(app);
