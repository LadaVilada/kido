# Push Notification Setup Guide

Quick setup guide for enabling push notifications in the Kids Activity Scheduler.

## Prerequisites

- Firebase project with Firestore and Authentication enabled
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Generate VAPID Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click on **Cloud Messaging** tab
5. Scroll to **Web Push certificates**
6. Click **Generate key pair**
7. Copy the generated key

## Step 2: Update Environment Variables

Add the VAPID key to your `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

## Step 3: Configure Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder values:

```javascript
firebase.initializeApp({
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
});
```

Get these values from Firebase Console > Project Settings > General.

## Step 4: Deploy Firestore Indexes

Deploy the required indexes:

```bash
firebase deploy --only firestore:indexes
```

## Step 5: Install and Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## Step 6: Enable Cloud Scheduler

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Search for "Cloud Scheduler API"
4. Click **Enable**

The `sendActivityReminders` function will automatically create a schedule when deployed.

## Step 7: Test Notifications

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in to the app

3. When prompted, click "Enable Notifications"

4. Grant notification permission in your browser

5. Create a test activity with a start time in the near future (e.g., 45 minutes from now)

6. Wait for the notification to arrive

## Troubleshooting

### Notifications not appearing

**Check browser support:**
- Chrome, Firefox, Edge, Safari 16.4+ support push notifications
- Private/Incognito mode may block notifications

**Check permission status:**
- Go to `/settings` in the app
- Verify permission is "granted"
- If blocked, reset in browser settings

**Check FCM token:**
- Open browser DevTools > Console
- Look for "FCM token" logs
- Verify token is saved in Firestore users collection

**Check Cloud Functions:**
```bash
firebase functions:log
```

Look for errors in:
- `scheduleActivityReminders`
- `sendActivityReminders`

**Check Firestore:**
- Verify `scheduledNotifications` collection has documents
- Check `sent` field is `false` for pending notifications
- Verify `scheduledTime` is in the past for overdue notifications

### Cloud Functions not deploying

**Check Node version:**
```bash
node --version  # Should be 18+
```

**Check Firebase CLI:**
```bash
firebase --version  # Should be latest
firebase login
```

**Check project:**
```bash
firebase use --add  # Select your project
```

### Service Worker not registering

**Check HTTPS:**
- Service workers require HTTPS (except localhost)
- Verify your production site uses HTTPS

**Check file location:**
- `firebase-messaging-sw.js` must be in `public/` directory
- Must be accessible at `/firebase-messaging-sw.js`

**Check browser console:**
- Look for service worker registration errors
- Verify no syntax errors in the service worker file

## Production Checklist

- [ ] VAPID key added to environment variables
- [ ] Service worker configured with Firebase credentials
- [ ] Firestore indexes deployed
- [ ] Cloud Functions deployed
- [ ] Cloud Scheduler enabled
- [ ] HTTPS enabled on production domain
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices
- [ ] Monitoring set up for function errors

## Cost Considerations

**Firebase Cloud Messaging:**
- Free for unlimited messages

**Cloud Functions:**
- Free tier: 2M invocations/month
- `scheduleActivityReminders`: Triggered per activity create/update
- `sendActivityReminders`: Runs every minute (43,200 times/month)

**Cloud Scheduler:**
- Free tier: 3 jobs
- Our app uses 1 job

**Firestore:**
- Reads: Each notification check reads scheduled notifications
- Writes: Each notification creates/updates documents
- Monitor usage in Firebase Console

## Support

For issues or questions:
1. Check the [full documentation](./NOTIFICATIONS.md)
2. Review Firebase Console logs
3. Check browser console for errors
4. Verify all setup steps completed
