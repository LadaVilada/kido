import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Service class for managing push notifications
 */
export class NotificationService {
  /**
   * Request notification permission from the user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Get FCM token and save it to user's document
   */
  static async getFCMToken(userId: string): Promise<string | null> {
    if (!messaging) {
      console.warn('Firebase Messaging not supported');
      return null;
    }

    try {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        // Save token to user's document
        await this.saveFCMToken(userId, token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      throw error;
    }
  }

  /**
   * Save FCM token to user's Firestore document
   */
  static async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw error;
    }
  }

  /**
   * Set up foreground message listener
   */
  static onForegroundMessage(
    callback: (payload: any) => void
  ): (() => void) | null {
    if (!messaging) {
      console.warn('Firebase Messaging not supported');
      return null;
    }

    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  }

  /**
   * Show a local notification
   */
  static async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported');
    }

    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Use service worker to show notification if available
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      // Fallback to regular notification
      new Notification(title, options);
    }
  }

  /**
   * Initialize notifications for a user
   */
  static async initialize(userId: string): Promise<boolean> {
    try {
      // Check if supported
      if (!this.isSupported()) {
        console.warn('Notifications not supported');
        return false;
      }

      // Check current permission
      const permission = this.getPermissionStatus();

      if (permission === 'granted') {
        // Get and save FCM token
        await this.getFCMToken(userId);
        return true;
      } else if (permission === 'default') {
        // Permission not yet requested
        return false;
      } else {
        // Permission denied
        return false;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Request permission and initialize notifications
   */
  static async requestAndInitialize(userId: string): Promise<boolean> {
    try {
      const permission = await this.requestPermission();

      if (permission === 'granted') {
        await this.getFCMToken(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
}
