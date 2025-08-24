// src/features/auth/LoginForm.tsx

import { useState, FormEvent } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../api/firebase'; // Note the new path

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and signup
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email'); // Toggle between email and phone
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Create new account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'admin', // Default role for new users
          createdAt: new Date(),
          displayName: user.displayName || email.split('@')[0]
        });
      } else {
        // Sign in with existing account
        await signInWithEmailAndPassword(auth, email, password);
      }
      // The auth state listener in useAuth will handle the redirect
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(isSignUp ? 'Failed to create account. Please try again.' : 'Failed to sign in. Please check your credentials.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    }
    return recaptchaVerifier;
  };

  const handlePhoneAuth = async () => {
    setError('');
    setLoading(true);

    try {
      const verifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error during phone authentication:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please enter a valid phone number with country code.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    setError('');
    setLoading(true);

    try {
      if (!confirmationResult) {
        setError('Please request OTP first.');
        setLoading(false);
        return;
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Check if user profile exists, if not create one
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user profile for phone sign-in users
        await setDoc(userDocRef, {
          phoneNumber: user.phoneNumber,
          role: 'admin',
          createdAt: new Date(),
          displayName: user.phoneNumber || 'User'
        });
      }
      
      // The auth state listener in useAuth will handle the redirect
    } catch (err: any) {
      console.error('Error during OTP verification:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check the code and try again.');
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-white">
        {isSignUp ? 'Create Admin Account' : 'Admin Login'}
      </h2>
      
      {/* Authentication Method Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setAuthMethod('email')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            authMethod === 'email'
              ? 'bg-green-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          📧 Email
        </button>
        <button
          onClick={() => setAuthMethod('phone')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            authMethod === 'phone'
              ? 'bg-green-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          📱 Phone
        </button>
      </div>

      {/* Email/Password Form */}
      {authMethod === 'email' && (
        <form onSubmit={handleEmailAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password {isSignUp && <span className="text-gray-500">(min. 6 characters)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
          >
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      )}

      {/* Phone Authentication Form */}
      {authMethod === 'phone' && (
        <div className="space-y-6">
          {!confirmationResult ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  required
                  className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Include country code (e.g., +1 for US)</p>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                onClick={handlePhoneAuth}
                disabled={loading || !phoneNumber}
                className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Enter the 6-digit code sent to {phoneNumber}</p>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <div className="flex space-x-3">
                <button
                  onClick={handleOtpVerification}
                  disabled={loading || !otp}
                  className="flex-1 px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  onClick={() => {
                    setConfirmationResult(null);
                    setOtp('');
                    setError('');
                  }}
                  className="px-4 py-2 font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ReCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Toggle between Login and Signup (only for email auth) */}
      {authMethod === 'email' && (
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setEmail('');
              setPassword('');
            }}
            className="text-sm text-green-400 hover:text-green-300 underline"
          >
            {isSignUp 
              ? 'Already have an account? Sign in instead' 
              : "Don't have an account? Create one here"
            }
          </button>
        </div>
      )}
    </div>
  );
}
