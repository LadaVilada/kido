import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ScheduledNotification, NotificationPayload } from '../types';
import { formatNotificationTime } from '../utils/dateTime';

const db = admin.firestore();

/**
 * Cloud Function that runs every minute to check for and send due notifications
 * Scheduled via Cloud Scheduler
 */
export const sendActivityReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Query for notifications that are due and haven't been sent
      const dueNotificationsSnapshot = await db
        .collection('scheduledNotifications')
        .where('sent', '==', false)
        .where('scheduledTime', '<=', now)
        .limit(100) // Process in batches
        .get();
      
      if (dueNotificationsSnapshot.empty) {
        console.log('No due notifications found');
        return null;
      }
      
      console.log(`Found ${dueNotificationsSnapshot.size} due notifications`);
      
      // Process each notification
      const sendPromises = dueNotificationsSnapshot.docs.map(async (doc) => {
        const notification = doc.data() as ScheduledNotification;
        notification.id = doc.id;
        
        try {
          await sendNotification(notification);
          
          // Mark notification as sent
          await doc.ref.update({ sent: true });
          
          console.log(`Sent notification ${doc.id}`);
        } catch (error) {
          console.error(`Error sending notification ${doc.id}:`, error);
          // Don't throw - continue processing other notifications
        }
      });
      
      await Promise.all(sendPromises);
      
      return null;
    } catch (error) {
      console.error('Error in sendActivityReminders:', error);
      throw error;
    }
  });

/**
 * Send a notification to the user
 */
async function sendNotification(notification: ScheduledNotification): Promise<void> {
  // Get user's FCM tokens
  const userDoc = await db.collection('users').doc(notification.userId).get();
  
  if (!userDoc.exists) {
    console.log(`User ${notification.userId} not found`);
    return;
  }
  
  const userData = userDoc.data();
  const fcmTokens = userData?.fcmTokens || [];
  
  if (fcmTokens.length === 0) {
    console.log(`No FCM tokens found for user ${notification.userId}`);
    return;
  }
  
  // Generate notification content
  const payload = generateNotificationPayload(notification);
  
  // Send to all user's devices
  const sendPromises = fcmTokens.map(async (token: string) => {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        webpush: {
          notification: {
            icon: payload.icon,
            badge: payload.badge,
            requireInteraction: true,
            tag: `activity-${notification.activityId}`,
          },
          fcmOptions: {
            link: '/calendar',
          },
        },
      });
    } catch (error: any) {
      // If token is invalid, remove it
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        console.log(`Removing invalid token: ${token}`);
        await removeInvalidToken(notification.userId, token);
      } else {
        throw error;
      }
    }
  });
  
  await Promise.all(sendPromises);
}

/**
 * Generate notification content based on notification type
 */
function generateNotificationPayload(notification: ScheduledNotification): NotificationPayload {
  const activityTime = formatNotificationTime(notification.activityStartTime.toDate());
  
  let title: string;
  let body: string;
  
  if (notification.notificationType === 'oneHour') {
    title = '🕐 Activity in 1 hour';
    body = `${notification.childName}'s ${notification.activityTitle} starts at ${activityTime}`;
  } else {
    title = '⏰ Activity in 30 minutes';
    body = `${notification.childName}'s ${notification.activityTitle} starts at ${activityTime}`;
  }
  
  if (notification.location) {
    body += ` at ${notification.location}`;
  }
  
  return {
    title,
    body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      activityId: notification.activityId,
      childId: notification.childId,
      type: notification.notificationType,
      url: '/calendar',
    },
  };
}

/**
 * Remove an invalid FCM token from user's document
 */
async function removeInvalidToken(userId: string, token: string): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  
  await userRef.update({
    fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
  });
}
