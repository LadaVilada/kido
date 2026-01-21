# End-to-End Integration Test Guide

This document provides a comprehensive guide for testing the complete user workflow from authentication through activity management.

## Prerequisites

- Firebase project configured with Auth and Firestore
- Environment variables set in `.env.local`
- Application running locally or deployed

## Test Scenarios

### 1. Authentication Flow

#### 1.1 Email/Password Sign Up
**Steps:**
1. Navigate to the home page (/)
2. Click "Sign Up" tab
3. Enter email and password
4. Click "Sign Up" button

**Expected Results:**
- User is created in Firebase Auth
- User document is created in Firestore with notification settings
- User is redirected to dashboard
- Navigation bar appears with user email

#### 1.2 Email/Password Sign In
**Steps:**
1. Navigate to the home page (/)
2. Enter existing email and password
3. Click "Sign In" button

**Expected Results:**
- User is authenticated
- User is redirected to dashboard
- Previous data (children, activities) is loaded

#### 1.3 Google OAuth Sign In
**Steps:**
1. Navigate to the home page (/)
2. Click "Sign in with Google" button
3. Complete Google OAuth flow

**Expected Results:**
- User is authenticated via Google
- User document is created/updated in Firestore
- User is redirected to dashboard

#### 1.4 Session Persistence
**Steps:**
1. Sign in to the application
2. Refresh the page
3. Close and reopen the browser

**Expected Results:**
- User remains authenticated after refresh
- User remains authenticated after browser restart (if PWA installed)

#### 1.5 Sign Out
**Steps:**
1. While signed in, click "Sign Out" button in navigation

**Expected Results:**
- User is signed out
- Redirected to login page
- Navigation bar disappears

### 2. Child Profile Management

#### 2.1 Add First Child
**Steps:**
1. Sign in to the application
2. Navigate to /children or click "Manage Children" from dashboard
3. Click "Add Child" button
4. Enter child name
5. Select a color
6. Click "Save" or "Add Child"

**Expected Results:**
- Child is created in Firestore with userId reference
- Child appears in the list with selected color
- Dashboard updates to show 1 child

#### 2.2 Add Multiple Children
**Steps:**
1. From children page, add 2-3 more children with different colors

**Expected Results:**
- All children appear in the list
- Each child has unique color coding
- Dashboard shows correct count

#### 2.3 Edit Child Profile
**Steps:**
1. Click edit button on a child card
2. Change name and/or color
3. Save changes

**Expected Results:**
- Child information is updated in Firestore
- Changes reflect immediately in the UI
- Activities associated with this child show new color

#### 2.4 Delete Child
**Steps:**
1. Click delete button on a child card
2. Confirm deletion (if confirmation dialog exists)

**Expected Results:**
- Child is removed from Firestore
- Child disappears from the list
- Activities associated with this child are handled appropriately

### 3. Activity Management

#### 3.1 Add Activity
**Steps:**
1. Navigate to /activities or click "Manage Activities" from dashboard
2. Click "Add Activity" button
3. Fill in the form:
   - Select a child
   - Enter activity name (e.g., "Soccer Practice")
   - Enter location (e.g., "Community Park")
   - Select days of week (e.g., Monday, Wednesday)
   - Set start time (e.g., 4:00 PM)
   - Set end time (e.g., 5:30 PM)
4. Click "Save" or "Add Activity"

**Expected Results:**
- Activity is created in Firestore
- Activity appears in the list
- Activity shows child's color
- Dashboard shows updated activity count

#### 3.2 Add Multiple Activities
**Steps:**
1. Add 3-5 activities for different children
2. Use different days and times
3. Include overlapping and non-overlapping schedules

**Expected Results:**
- All activities are saved correctly
- Each activity displays with correct child color
- Activities list shows all activities

#### 3.3 Edit Activity
**Steps:**
1. Click edit button on an activity
2. Modify any field (time, location, days, etc.)
3. Save changes

**Expected Results:**
- Activity is updated in Firestore
- Changes reflect in activity list
- Calendar view updates automatically
- Notification schedules are updated

#### 3.4 Delete Activity
**Steps:**
1. Click delete button on an activity
2. Confirm deletion

**Expected Results:**
- Activity is removed from Firestore
- Activity disappears from list
- Calendar view updates
- Scheduled notifications are cancelled

### 4. Calendar Views

#### 4.1 Week View Display
**Steps:**
1. Navigate to /calendar
2. Observe the current week view

**Expected Results:**
- 7 days are displayed (current week)
- Activities appear on correct days
- Activities are positioned by time
- Each activity shows child's color
- Activity blocks show name, time, and location

#### 4.2 Week Navigation
**Steps:**
1. Click "Next Week" button
2. Click "Previous Week" button
3. Click "Today" button (if available)

**Expected Results:**
- Calendar updates to show correct week
- Activities for that week are displayed
- Navigation is smooth without errors

#### 4.3 Day View Display
**Steps:**
1. Toggle to Day View
2. Navigate between days

**Expected Results:**
- Single day is displayed with hourly breakdown
- Activities appear at correct times
- Day navigation works correctly

#### 4.4 Real-time Updates
**Steps:**
1. Open calendar in one browser tab
2. Open activities page in another tab
3. Add/edit/delete an activity
4. Switch back to calendar tab

**Expected Results:**
- Calendar updates automatically without refresh
- Changes appear within 1-2 seconds
- No errors in console

### 5. Push Notifications

#### 5.1 Request Notification Permission
**Steps:**
1. Sign in to the application
2. Observe notification permission prompt
3. Click "Allow" or "Enable Notifications"

**Expected Results:**
- Browser requests notification permission
- Permission status is saved
- Notification settings page reflects permission status

#### 5.2 Configure Notification Settings
**Steps:**
1. Navigate to /settings
2. Toggle notification preferences:
   - 1 hour before
   - 30 minutes before
3. Save settings

**Expected Results:**
- Settings are saved to Firestore user document
- Cloud Functions use these preferences for scheduling

#### 5.3 Receive Notifications (Manual Test)
**Steps:**
1. Create an activity scheduled for 1 hour from now
2. Wait for notification time
3. Observe browser notification

**Expected Results:**
- Notification appears 1 hour before (if enabled)
- Notification appears 30 minutes before (if enabled)
- Notification includes activity name, child name, and time
- Clicking notification opens the app

#### 5.4 Notification for Multiple Activities
**Steps:**
1. Create multiple activities at different times
2. Observe notifications throughout the day

**Expected Results:**
- Each activity triggers its own notifications
- Notifications are timely and accurate
- No duplicate notifications

### 6. PWA Features

#### 6.1 Install PWA (Mobile)
**Steps:**
1. Open app in mobile browser (iOS Safari or Chrome Android)
2. Observe install prompt
3. Click "Add to Home Screen" or "Install"
4. Follow device-specific installation steps

**Expected Results:**
- Install prompt appears
- App installs successfully
- App icon appears on home screen
- App opens in standalone mode

#### 6.2 Install PWA (Desktop)
**Steps:**
1. Open app in Chrome/Edge desktop
2. Click install button in address bar or use prompt
3. Install the app

**Expected Results:**
- Install prompt appears
- App installs as desktop app
- App opens in standalone window

#### 6.3 Offline Functionality
**Steps:**
1. Load the app while online
2. Navigate to calendar and activities
3. Turn off network connection (airplane mode or disable WiFi)
4. Navigate through the app

**Expected Results:**
- Previously loaded data is accessible
- Calendar shows cached activities
- UI indicates offline status
- No crashes or blank screens

#### 6.4 Background Sync
**Steps:**
1. While offline, attempt to add/edit an activity
2. Reconnect to network

**Expected Results:**
- Changes are queued while offline
- Changes sync automatically when online
- User is notified of sync status

### 7. Responsive Design

#### 7.1 Mobile View (320px - 768px)
**Steps:**
1. Open app on mobile device or resize browser
2. Test all pages and features

**Expected Results:**
- All content is readable and accessible
- Navigation is touch-friendly
- Forms are easy to fill out
- Calendar is usable on small screens
- No horizontal scrolling

#### 7.2 Tablet View (768px - 1024px)
**Steps:**
1. Test on tablet or resize browser
2. Navigate through all features

**Expected Results:**
- Layout adapts appropriately
- Touch targets are adequate
- Content uses available space well

#### 7.3 Desktop View (1024px+)
**Steps:**
1. Test on desktop browser
2. Test at various window sizes

**Expected Results:**
- Layout is optimized for larger screens
- Navigation is clear and accessible
- Content is well-organized

### 8. Error Handling

#### 8.1 Network Errors
**Steps:**
1. Disconnect network during various operations
2. Attempt to sign in, add activities, etc.

**Expected Results:**
- Appropriate error messages are shown
- App doesn't crash
- Operations retry when connection restored

#### 8.2 Invalid Data
**Steps:**
1. Try to submit forms with invalid data
2. Test edge cases (empty fields, invalid times, etc.)

**Expected Results:**
- Validation errors are shown
- Forms don't submit with invalid data
- Error messages are clear and helpful

#### 8.3 Authentication Errors
**Steps:**
1. Try to sign in with wrong password
2. Try to sign up with existing email
3. Test session expiration

**Expected Results:**
- Clear error messages
- User is prompted to re-authenticate
- No data loss

### 9. Performance

#### 9.1 Initial Load Time
**Steps:**
1. Clear cache and reload app
2. Measure time to interactive

**Expected Results:**
- App loads in under 3 seconds on 3G
- First contentful paint under 1.5 seconds
- Time to interactive under 3.5 seconds

#### 9.2 Navigation Performance
**Steps:**
1. Navigate between pages
2. Measure transition times

**Expected Results:**
- Page transitions are smooth
- No noticeable lag
- Data loads quickly

#### 9.3 Real-time Update Performance
**Steps:**
1. Have multiple activities and children
2. Make changes and observe update speed

**Expected Results:**
- Updates appear within 1-2 seconds
- No performance degradation with more data
- UI remains responsive

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Staging [ ] Production
Browser/Device: ___________

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| 1.1 Email Sign Up | [ ] Pass [ ] Fail | |
| 1.2 Email Sign In | [ ] Pass [ ] Fail | |
| 1.3 Google OAuth | [ ] Pass [ ] Fail | |
| 1.4 Session Persistence | [ ] Pass [ ] Fail | |
| 1.5 Sign Out | [ ] Pass [ ] Fail | |
| 2.1 Add First Child | [ ] Pass [ ] Fail | |
| 2.2 Add Multiple Children | [ ] Pass [ ] Fail | |
| 2.3 Edit Child | [ ] Pass [ ] Fail | |
| 2.4 Delete Child | [ ] Pass [ ] Fail | |
| 3.1 Add Activity | [ ] Pass [ ] Fail | |
| 3.2 Add Multiple Activities | [ ] Pass [ ] Fail | |
| 3.3 Edit Activity | [ ] Pass [ ] Fail | |
| 3.4 Delete Activity | [ ] Pass [ ] Fail | |
| 4.1 Week View | [ ] Pass [ ] Fail | |
| 4.2 Week Navigation | [ ] Pass [ ] Fail | |
| 4.3 Day View | [ ] Pass [ ] Fail | |
| 4.4 Real-time Updates | [ ] Pass [ ] Fail | |
| 5.1 Notification Permission | [ ] Pass [ ] Fail | |
| 5.2 Notification Settings | [ ] Pass [ ] Fail | |
| 5.3 Receive Notifications | [ ] Pass [ ] Fail | |
| 5.4 Multiple Notifications | [ ] Pass [ ] Fail | |
| 6.1 Install PWA Mobile | [ ] Pass [ ] Fail | |
| 6.2 Install PWA Desktop | [ ] Pass [ ] Fail | |
| 6.3 Offline Functionality | [ ] Pass [ ] Fail | |
| 6.4 Background Sync | [ ] Pass [ ] Fail | |
| 7.1 Mobile View | [ ] Pass [ ] Fail | |
| 7.2 Tablet View | [ ] Pass [ ] Fail | |
| 7.3 Desktop View | [ ] Pass [ ] Fail | |
| 8.1 Network Errors | [ ] Pass [ ] Fail | |
| 8.2 Invalid Data | [ ] Pass [ ] Fail | |
| 8.3 Auth Errors | [ ] Pass [ ] Fail | |
| 9.1 Initial Load | [ ] Pass [ ] Fail | |
| 9.2 Navigation Performance | [ ] Pass [ ] Fail | |
| 9.3 Real-time Performance | [ ] Pass [ ] Fail | |
```

## Critical Issues

Document any critical issues found during testing:

1. Issue: ___________
   - Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
   - Steps to Reproduce: ___________
   - Expected: ___________
   - Actual: ___________

## Sign-off

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Ready for deployment

Tester Signature: ___________ Date: ___________
