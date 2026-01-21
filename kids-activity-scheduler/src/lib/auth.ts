import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User as UserType } from '@/types';

/**
 * Creates or updates user document in Firestore when user signs up or signs in
 */
export const createUserDocument = async (user: User): Promise<void> => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // Only create document if it doesn't exist
  if (!userSnap.exists()) {
    const userData: Omit<UserType, 'userId'> = {
      email: user.email || '',
      createdAt: serverTimestamp() as any,
      notificationSettings: {
        oneHour: true,
        thirtyMinutes: true,
      },
    };

    try {
      await setDoc(userRef, userData);
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }
};

/**
 * Gets user data from Firestore
 */
export const getUserData = async (userId: string): Promise<UserType | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        userId,
        ...userSnap.data(),
      } as UserType;
    }

    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

/**
 * Updates user notification settings
 */
export const updateNotificationSettings = async (
  userId: string,
  settings: { oneHour: boolean; thirtyMinutes: boolean }
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { notificationSettings: settings }, { merge: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
};

/**
 * Gets user-friendly error message from Firebase Auth error
 */
export const getAuthErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups and try again.';
    default:
      return error.message || 'An error occurred during authentication.';
  }
};