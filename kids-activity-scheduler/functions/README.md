# Firebase Cloud Functions

This directory contains Firebase Cloud Functions for the Kids Activity Scheduler app.

## Functions

### scheduleActivityReminders
Triggered automatically when activities are created or updated in Firestore. This function:
- Schedules notification reminders for activities occurring within the next 24 hours
- Creates 1-hour and 30-minute reminders based on user preferences
- Cleans up old notifications when activities are deleted or updated

### sendActivityReminders
Runs every minute via Cloud Scheduler to:
- Check for due notifications
- Send push notifications to users via FCM
- Mark notifications as sent
- Clean up invalid FCM tokens

## Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Build the functions:
```bash
npm run build
```

3. Deploy to Firebase:
```bash
npm run deploy
```

## Local Development

To test functions locally using the Firebase Emulator:

```bash
npm run serve
```

## Environment Variables

The functions use Firebase Admin SDK which automatically uses the project configuration. No additional environment variables are needed.

## Firestore Collections

The functions interact with these Firestore collections:

- `users` - User documents with notification settings and FCM tokens
- `children` - Child profiles
- `activities` - Activity documents (triggers the scheduleActivityReminders function)
- `scheduledNotifications` - Pending notifications to be sent

## Indexes

Required Firestore indexes are defined in `firestore.indexes.json` at the project root.

## Cloud Scheduler

The `sendActivityReminders` function requires Cloud Scheduler to be enabled in your Firebase project. It will automatically create a schedule when deployed.

## Monitoring

View function logs in the Firebase Console:
```bash
npm run logs
```

Or use the Firebase Console at: https://console.firebase.google.com
