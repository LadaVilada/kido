# Push Notifications System

This document describes the push notification system for the Kids Activity Scheduler app.

## Overview

The notification system sends timely reminders to parents about upcoming activities. It consists of:

1. **Firebase Cloud Functions** - Backend logic for scheduling and sending notifications
2. **Client-side notification handling** - Permission requests and foreground message handling
3. **Service Worker** - Background message handling when app is not active

## Architecture

```
Activity Created/Updated
    ↓
Cloud Function: scheduleActivityReminders
    ↓
Create scheduledNotifications documents
    ↓
Cloud Scheduler (every minute)
    ↓
Cloud Function: sendActivityReminders
    ↓
Firebase Cloud Messaging (FCM)
    ↓
User's Device (Push Notification)
```

## Features

### Notification Timing
- **1 hour before** - Advance notice for preparation
- **30 minutes before** - Final reminder before departure
- Users can enable/disable each timing independently

### Notification Filtering
- Only activities within the next 24 hours receive notifications
- Prevents notification spam for far-future activities
- Automatically cleans up notifications when activities are deleted

### User Preferences
- Configurable notification settings per user
- Stored in Firestore `users` collection
- Settings page at `/settings`

## Setup Instructions

### 1. Firebase Configuration

Add the VAPID key to your `.env.local`:
```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

Generate a VAPID key in Firebase Console:
1. Go to Project Settings > Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the key to your environment variables

### 2. Update Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder values with your Firebase config:
```javascript
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
});
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
npm run deploy
```

### 4. Enable Cloud Scheduler

Cloud Scheduler must be enabled in your Google Cloud project for the `sendActivityReminders` function to work.

1. Go to Google Cloud Console
2. Enable Cloud Scheduler API
3. The function will automatically create a schedule when deployed

## User Flow

### First-time Setup
1. User logs in to the app
2. User document is created with default notification settings (both enabled)
3. NotificationPrompt appears after 3 seconds
4. User clicks "Enable Notifications"
5. Browser requests notification permission
6. If granted, FCM token is generated and saved to user document

### Ongoing Usage
1. User creates or updates an activity
2. Cloud Function automatically schedules notifications
3. At the scheduled time, notification is sent to all user's devices
4. User clicks notification to open the calendar view

## Components

### Client-side Components

#### NotificationSettings
- Full settings page component
- Located at `/settings`
- Allows users to configure notification timing preferences
- Shows permission status and request button

#### NotificationPrompt
- Lightweight prompt that appears after login
- Can be dismissed (stores preference in localStorage)
- Encourages users to enable notifications

### Hooks

#### useNotifications
- Manages notification state and permissions
- Handles FCM token generation
- Sets up foreground message listener
- Returns permission status and request function

### Services

#### NotificationService
- Core notification logic
- Permission management
- FCM token handling
- Foreground message handling
- Local notification display

## Cloud Functions

### scheduleActivityReminders
**Trigger:** Firestore `activities/{activityId}` onCreate/onUpdate/onDelete

**Logic:**
1. Get user notification settings
2. Get child information for the activity
3. Calculate activity occurrences for next 7 days
4. Filter to only next 24 hours
5. Create scheduledNotification documents for each enabled timing
6. Clean up old notifications if activity was updated/deleted

### sendActivityReminders
**Trigger:** Cloud Scheduler (every 1 minute)

**Logic:**
1. Query for notifications where `sent == false` and `scheduledTime <= now`
2. For each notification:
   - Get user's FCM tokens
   - Generate notification content
   - Send via FCM to all tokens
   - Mark as sent
   - Remove invalid tokens

## Data Models

### User Document
```typescript
{
  userId: string;
  email: string;
  notificationSettings: {
    oneHour: boolean;
    thirtyMinutes: boolean;
  };
  fcmTokens: string[];
  createdAt: Timestamp;
}
```

### Scheduled Notification Document
```typescript
{
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
```

## Notification Content

### 1 Hour Before
```
Title: 🕐 Activity in 1 hour
Body: [Child Name]'s [Activity Title] starts at [Time] at [Location]
```

### 30 Minutes Before
```
Title: ⏰ Activity in 30 minutes
Body: [Child Name]'s [Activity Title] starts at [Time] at [Location]
```

## Browser Support

Push notifications are supported in:
- Chrome (Desktop & Android)
- Firefox (Desktop & Android)
- Edge (Desktop)
- Safari (Desktop & iOS 16.4+)
- Opera (Desktop & Android)

The app gracefully handles unsupported browsers by hiding notification UI.

## Testing

### Local Testing
1. Use Firebase Emulator Suite for local function testing
2. Test notification permissions in different browsers
3. Test foreground and background message handling

### Production Testing
1. Deploy functions to Firebase
2. Create test activities with near-future times
3. Verify notifications arrive at correct times
4. Test on multiple devices and browsers

## Troubleshooting

### Notifications Not Received
1. Check notification permission status
2. Verify FCM token is saved in user document
3. Check Cloud Function logs for errors
4. Verify Cloud Scheduler is enabled and running
5. Check browser notification settings

### Invalid Token Errors
- Tokens are automatically cleaned up when invalid
- User may need to re-enable notifications after clearing browser data

### Notifications Not Scheduling
1. Check that user document has notification settings
2. Verify activity is within next 24 hours
3. Check Cloud Function logs for errors
4. Verify Firestore indexes are deployed

## Security

- FCM tokens are stored securely in Firestore
- Firestore security rules ensure users can only access their own data
- Cloud Functions validate user ownership before sending notifications
- Invalid tokens are automatically removed

## Performance

- Notifications are batched and processed efficiently
- Cloud Scheduler runs every minute (configurable)
- Firestore queries use indexes for optimal performance
- FCM handles delivery to offline devices automatically

## Future Enhancements

Potential improvements:
- Custom notification sounds
- Notification grouping for multiple activities
- Snooze functionality
- Location-based reminders
- Weather alerts for outdoor activities
