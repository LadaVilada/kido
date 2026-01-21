import { Timestamp } from 'firebase-admin/firestore';

export interface Activity {
  id: string;
  userId: string;
  childId: string;
  title: string;
  location: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  createdAt: Timestamp;
}

export interface Child {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Timestamp;
}

export interface User {
  userId: string;
  email: string;
  createdAt: Timestamp;
  notificationSettings: {
    oneHour: boolean;
    thirtyMinutes: boolean;
  };
}

export interface ScheduledNotification {
  id?: string;
  userId: string;
  activityId: string;
  childId: string;
  scheduledTime: Timestamp;
  notificationType: 'oneHour' | 'thirtyMinutes';
  activityTitle: string;
  childName: string;
  activityStartTime: Timestamp;
  location: string;
  sent: boolean;
  createdAt: Timestamp;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
}
