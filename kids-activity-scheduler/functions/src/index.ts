import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import notification functions
export { scheduleActivityReminders } from './notifications/scheduleReminders';
export { sendActivityReminders } from './notifications/sendReminders';
