# Firestore Security Rules

## Overview

The Kids Activity Scheduler uses Firestore security rules to protect user data and ensure only authorized family members can access family information.

## Current Rules Structure

### Helper Functions

#### `getUserFamily()`
Retrieves the authenticated user's family ID from their user document.

```javascript
function getUserFamily() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId;
}
```

**Purpose**: Provides a centralized way to look up which family a user belongs to.

#### `isFamilyMember(familyId)`
Checks if the authenticated user is a member of the specified family.

```javascript
function isFamilyMember(familyId) {
  return request.auth != null && getUserFamily() == familyId;
}
```

**Purpose**: Validates that a user has access to family-specific resources.

#### `isInFamilyMembers(family)`
Checks if the user ID exists in the family's members array.

```javascript
function isInFamilyMembers(family) {
  return request.auth.uid in family.data.members.map(m => m.userId);
}
```

**Purpose**: Alternative check for family membership using the members array (currently unused but available for future use).

## Access Rules

### User Documents
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Access**: Users can only read and write their own user document.

### Family Documents
```javascript
match /families/{familyId} {
  allow read: if request.auth != null && (
    resource.data.createdBy == request.auth.uid ||
    getUserFamily() == familyId
  );
  allow create: if request.auth != null && request.resource.data.createdBy == request.auth.uid;
  allow update: if request.auth != null && (
    resource.data.createdBy == request.auth.uid ||
    getUserFamily() == familyId
  );
  allow delete: if request.auth != null && resource.data.createdBy == request.auth.uid;
}
```

**Access**:
- **Read**: Family creator OR any family member
- **Create**: Any authenticated user (becomes creator)
- **Update**: Family creator OR any family member
- **Delete**: Only the family creator

### Children Documents
```javascript
match /children/{childId} {
  allow read, write: if request.auth != null && isFamilyMember(resource.data.familyId);
  allow create: if request.auth != null && isFamilyMember(request.resource.data.familyId);
}
```

**Access**: All family members have full read/write access to children in their family.

### Activities Documents
```javascript
match /activities/{activityId} {
  allow read, write: if request.auth != null && isFamilyMember(resource.data.familyId);
  allow create: if request.auth != null && isFamilyMember(request.resource.data.familyId);
}
```

**Access**: All family members have full read/write access to activities in their family.

## Security Model

### Family-Based Access Control

The security model is built around families:

1. **User Registration**: When a user signs up, a user document is created
2. **Family Creation**: User creates or joins a family
3. **Family ID Storage**: User's `familyId` is stored in their user document
4. **Resource Access**: All children and activities are linked to a `familyId`
5. **Access Validation**: Rules check if user's family matches resource's family

### Data Flow

```
User Authentication
    ↓
User Document (contains familyId)
    ↓
getUserFamily() retrieves familyId
    ↓
isFamilyMember() validates access
    ↓
Access Granted/Denied
```

## Benefits of Current Design

1. **Efficient**: Single document lookup instead of array operations
2. **Scalable**: Works well with large families
3. **Secure**: Clear separation between families
4. **Maintainable**: Centralized helper functions
5. **Flexible**: Easy to add new resource types

## Testing Security Rules

### Using Firebase Emulator

```bash
firebase emulators:start --only firestore
```

### Manual Testing Scenarios

1. **User Isolation**
   - User A cannot access User B's user document
   - User A cannot access User B's family data

2. **Family Access**
   - Family members can read/write children
   - Family members can read/write activities
   - Non-members cannot access family data

3. **Family Management**
   - Only creator can delete family
   - All members can update family details
   - Members can add children and activities

4. **Edge Cases**
   - User without family cannot access any children/activities
   - Removed family member loses access immediately
   - Deleted family makes all resources inaccessible

## Deployment

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

Or on Windows:
```bash
deploy-rules.bat
```

### Verify Deployment

1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Verify the rules match your local `firestore.rules` file
4. Check the deployment timestamp

## Common Issues

### Issue: "Missing or insufficient permissions"

**Cause**: User's `familyId` doesn't match the resource's `familyId`

**Solution**: 
- Verify user document has correct `familyId`
- Ensure resource has correct `familyId`
- Check that user is actually a family member

### Issue: "Function getUserFamily() not found"

**Cause**: Rules not deployed or syntax error

**Solution**:
- Redeploy rules: `firebase deploy --only firestore:rules`
- Check rules syntax in Firebase Console

### Issue: "Cannot read property 'familyId' of undefined"

**Cause**: User document doesn't exist or missing `familyId` field

**Solution**:
- Ensure user document is created on signup
- Initialize `familyId` when user creates/joins family

## Future Enhancements

Potential improvements to security rules:

1. **Role-Based Access**: Different permissions for owners, parents, caregivers
2. **Resource-Level Permissions**: Fine-grained control per child/activity
3. **Audit Logging**: Track who made changes
4. **Rate Limiting**: Prevent abuse
5. **Scheduled Notifications**: Separate rules for notification documents

## Related Documentation

- [Family Groups Feature](./FAMILY_GROUPS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md)

## Version History

- **v1.0** (Initial): Basic user-based access control
- **v2.0** (Current): Family-based access control with helper functions
  - Added `getUserFamily()` helper
  - Added `isFamilyMember()` helper
  - Simplified family access checks
  - Improved performance with single document lookup
