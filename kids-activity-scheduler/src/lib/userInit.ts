import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types';

/**
 * Initialize or update user document with default notification settings
 */
export async function initializeUserDocument(
  userId: string,
  email: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user document with default settings
      const newUser = {
        email,
        createdAt: new Date() as any,
        notificationSettings: {
          oneHour: true,
          thirtyMinutes: true,
        },
        fcmTokens: [],
      };

      await setDoc(userRef, newUser);
      console.log('User document created:', userId);
    } else {
      // Check if notification settings exist, add if missing
      const userData = userDoc.data() as User;
      
      if (!userData.notificationSettings) {
        await updateDoc(userRef, {
          notificationSettings: {
            oneHour: true,
            thirtyMinutes: true,
          },
        });
        console.log('Notification settings added to user:', userId);
      }

      // Ensure fcmTokens array exists
      if (!userData.fcmTokens) {
        await updateDoc(userRef, {
          fcmTokens: [],
        });
      }
    }
  } catch (error) {
    console.error('Error initializing user document:', error);
    throw error;
  }
}

/**
 * Check if user document exists and has required fields
 */
export async function ensureUserDocument(
  userId: string,
  email: string
): Promise<boolean> {
  try {
    await initializeUserDocument(userId, email);
    return true;
  } catch (error) {
    console.error('Error ensuring user document:', error);
    return false;
  }
}
