import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Activity, Child, User, ScheduledNotification } from '../types';
import { 
  getOccurrencesInRange, 
  calculateNotificationTime,
  isWithinNext24Hours 
} from '../utils/dateTime';

const db = admin.firestore();

/**
 * Cloud Function triggered when an activity is created or updated
 * Schedules notification reminders for the activity
 */
export const scheduleActivityReminders = functions.firestore
  .document('activities/{activityId}')
  .onWrite(async (change, context) => {
    const activityId = context.params.activityId;
    
    // If activity was deleted, clean up scheduled notifications
    if (!change.after.exists) {
      await cleanupNotifications(activityId);
      return null;
    }
    
    const activity = change.after.data() as Activity;
    activity.id = activityId;
    
    try {
      // Get user notification settings
      const userDoc = await db.collection('users').doc(activity.userId).get();
      if (!userDoc.exists) {
        console.log(`User ${activity.userId} not found`);
        return null;
      }
      
      const user = userDoc.data() as User;
      
      // Get child information
      const childDoc = await db.collection('children').doc(activity.childId).get();
      if (!childDoc.exists) {
        console.log(`Child ${activity.childId} not found`);
        return null;
      }
      
      const child = childDoc.data() as Child;
      
      // Clean up existing notifications for this activity
      await cleanupNotifications(activityId);
      
      // Calculate occurrences for the next 7 days
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const occurrences = getOccurrencesInRange(
        activity.daysOfWeek,
        activity.startTime,
        now,
        sevenDaysFromNow,
        activity.timezone
      );
      
      // Schedule notifications for each occurrence
      const notificationPromises: Promise<any>[] = [];
      
      for (const occurrence of occurrences) {
        // Only schedule notifications within next 24 hours
        if (!isWithinNext24Hours(occurrence)) {
          continue;
        }
        
        // Schedule 1-hour reminder if enabled
        if (user.notificationSettings.oneHour) {
          const oneHourBefore = calculateNotificationTime(occurrence, 60);
          
          if (oneHourBefore > now) {
            const notification: Omit<ScheduledNotification, 'id'> = {
              userId: activity.userId,
              activityId: activity.id,
              childId: activity.childId,
              scheduledTime: admin.firestore.Timestamp.fromDate(oneHourBefore),
              notificationType: 'oneHour',
              activityTitle: activity.title,
              childName: child.name,
              activityStartTime: admin.firestore.Timestamp.fromDate(occurrence),
              location: activity.location,
              sent: false,
              createdAt: admin.firestore.Timestamp.now(),
            };
            
            notificationPromises.push(
              db.collection('scheduledNotifications').add(notification)
            );
          }
        }
        
        // Schedule 30-minute reminder if enabled
        if (user.notificationSettings.thirtyMinutes) {
          const thirtyMinutesBefore = calculateNotificationTime(occurrence, 30);
          
          if (thirtyMinutesBefore > now) {
            const notification: Omit<ScheduledNotification, 'id'> = {
              userId: activity.userId,
              activityId: activity.id,
              childId: activity.childId,
              scheduledTime: admin.firestore.Timestamp.fromDate(thirtyMinutesBefore),
              notificationType: 'thirtyMinutes',
              activityTitle: activity.title,
              childName: child.name,
              activityStartTime: admin.firestore.Timestamp.fromDate(occurrence),
              location: activity.location,
              sent: false,
              createdAt: admin.firestore.Timestamp.now(),
            };
            
            notificationPromises.push(
              db.collection('scheduledNotifications').add(notification)
            );
          }
        }
      }
      
      await Promise.all(notificationPromises);
      
      console.log(`Scheduled ${notificationPromises.length} notifications for activity ${activityId}`);
      return null;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  });

/**
 * Clean up scheduled notifications for a deleted or updated activity
 */
async function cleanupNotifications(activityId: string): Promise<void> {
  const notificationsSnapshot = await db
    .collection('scheduledNotifications')
    .where('activityId', '==', activityId)
    .where('sent', '==', false)
    .get();
  
  const deletePromises = notificationsSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  
  console.log(`Cleaned up ${deletePromises.length} notifications for activity ${activityId}`);
}
