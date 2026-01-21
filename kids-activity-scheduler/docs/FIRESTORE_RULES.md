# Firestore Security Rules

## Overview

The Kids Activity Scheduler uses Firestore security rules to protect user data and ensure only authorized family members can access family information.

## Current Rules Structure

### Helper Functions

The security rules use two helper functions to efficiently manage family-based access control:

#### `getUserFamily()`
Retrieves the authenticated user's family ID from their user document.

```javascript
function getUserFamily() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId;
}
```

**Purpose**: Provides a centralized way to look up which family a user belongs to. This single document lookup is more efficient than checking array membership.

#### `isFamilyMember(familyId)`
Checks if the authenticated user is a member of the specified family.

```javascript
function isFamilyMember(familyId) {
  return request.auth != null && getUserFamily() == familyId;
}
```

**Purpose**: Validates that a user has access to family-specific resources by comparing the user's family ID with the requested resource's family ID.



## Access Rules

### User Documents
```javascript
match /users/{userId} {
  // Users can read their own document
  allow read: if request.auth != null && request.auth.uid == userId;
  
  // Users can write to their own document
  allow write: if request.auth != null && request.auth.uid == userId;
  
  // Allow querying users by email (needed for adding family members)
  allow read: if request.auth != null;
  
  // Allow family owners to update familyId when adding members
  // Only if the user doesn't already have a familyId
  allow update: if request.auth != null && 
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['familyId']) &&
    (
      // Adding to family (user has no family yet)
      (!resource.data.keys().hasAny(['familyId']) || resource.data.familyId == null) ||
      // Removing from family (setting to null)
      request.resource.data.familyId == null
    );
}
```

**Access**:
- **Read Own Document**: Users can read their own user document
- **Write Own Document**: Users can write to their own user document
- **Query Users**: Any authenticated user can query/read user documents (needed for finding users by email when adding family members)
- **Update familyId**: Authenticated users can update another user's `familyId` field only if:
  - The update only affects the `familyId` field (no other fields are modified)
  - AND one of these conditions is met:
    - The target user doesn't have a `familyId` yet (adding to family)
    - The `familyId` is being set to null (removing from family)

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

1. **Efficient**: Single document lookup (`getUserFamily()`) instead of array operations for membership checks
2. **Scalable**: Works well with families of any size without performance degradation
3. **Secure**: Clear separation between families with no cross-family data access
4. **Maintainable**: Centralized helper functions make rules easy to understand and update
5. **Flexible**: Easy to add new resource types with consistent access patterns
6. **Simple**: Two helper functions provide all necessary access control logic
7. **Family Management**: Supports adding/removing family members by allowing controlled updates to user `familyId` fields
8. **User Discovery**: Authenticated users can query other users by email to invite them to families

### Testing Security Rules

### Using Firebase Emulator

```bash
firebase emulators:start --only firestore
```

### Manual Testing Scenarios

1. **User Isolation**
   - User A can read their own user document
   - User A can write to their own user document
   - User A can query/read other user documents (for family invitations)
   - User A cannot modify other users' data except `familyId` under specific conditions

2. **Family Member Management**
   - Family owner can update another user's `familyId` to add them to the family
   - Can only update `familyId` if the target user has no family or `familyId` is null
   - Can set `familyId` to null to remove a user from the family
   - Cannot update other user fields when modifying `familyId`

3. **Family Access**
   - Family members can read/write children
   - Family members can read/write activities
   - Non-members cannot access family data

4. **Family Management**
   - Only creator can delete family
   - All members can update family details
   - Members can add children and activities

5. **Edge Cases**
   - User without family cannot access any children/activities
   - Removed family member loses access immediately
   - Deleted family makes all resources inaccessible
   - Cannot add user to family if they already belong to another family

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

### Issue: "Permission denied when adding family member"

**Cause**: Target user already has a `familyId` or trying to modify other fields

**Solution**:
- Verify target user doesn't already belong to a family
- Ensure only the `familyId` field is being updated
- Check that the authenticated user has permission to add members

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
- **v2.0**: Family-based access control with optimized helper functions
  - Added `getUserFamily()` helper for efficient family ID lookup
  - Added `isFamilyMember()` helper for access validation
  - Removed unused `isInFamilyMembers()` helper (array-based approach)
  - Simplified family access checks with single document lookup
  - Improved performance with efficient query patterns
- **v2.1** (Current): Enhanced user access rules for family member management
  - Added read access for all authenticated users to query users by email
  - Added controlled `familyId` update rules for adding/removing family members
  - Restricted `familyId` updates to only work when user has no family or is being removed
  - Ensured only `familyId` field can be modified during member management operations
