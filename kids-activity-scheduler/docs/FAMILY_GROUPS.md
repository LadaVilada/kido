# Family Groups Feature

## Overview

The Family Groups feature allows multiple users (co-parents, caregivers) to share access to all children and activities by joining a single family group.

## Key Benefits

✅ **Simple**: Add your partner once, they see everything  
✅ **Automatic**: New kids/activities are automatically shared  
✅ **Intuitive**: Perfect for co-parenting scenarios  
✅ **Secure**: Only family members can access your data  

## How It Works

### 1. Create a Family

When you first use the app:
1. Go to Settings > Family tab
2. Enter your family name (e.g., "The Smith Family")
3. Click "Create Family"
4. You become the family owner

### 2. Invite Family Members

There are two ways to add family members:

#### Option A: Direct Add (User Already Has Account)
1. They must create an account first (sign up with their email)
2. Go to Settings > Family tab
3. Enter their email address
4. Click "Add"
5. They're instantly added to your family!

#### Option B: Email Invitation (Recommended)
1. Go to Settings > Family tab
2. Enter their email address
3. Click "Send Invitation"
4. They receive an email with an invitation link
5. They click the link, create an account (if needed), and join automatically
6. Invitation expires after 7 days

**Pending Invitations**: You can see all pending invitations in the Family Settings. You can resend or cancel invitations at any time.

### 3. Automatic Sharing

Once in the same family:
- ✅ Both see all children
- ✅ Both see all activities
- ✅ Both can add/edit/delete
- ✅ Changes sync in real-time
- ✅ Both get notifications

## User Roles

### Owner
- Created the family
- Can add/remove members
- Can delete the family
- Full access to all data

### Parent
- Added by the owner
- Full access to all data
- Can add/edit children and activities
- Cannot remove other members

### Caregiver
- Added by the owner
- Full access to all data
- Can add/edit children and activities
- Cannot remove other members

## Data Structure

```typescript
interface Family {
  id: string;
  name: string;
  createdBy: string;
  members: FamilyMember[];
  pendingInvitations?: PendingInvitation[]; // Optional array of pending invites
  createdAt: Timestamp;
}

interface FamilyMember {
  userId: string;
  email: string;
  role: 'owner' | 'parent' | 'caregiver';
  joinedAt: Timestamp;
}

interface PendingInvitation {
  email: string;
  invitedBy: string;
  invitedAt: Timestamp;
  role: 'parent' | 'caregiver';
  token: string; // Unique token for the invitation link
}
```

## Security Rules

The Firestore security rules ensure that only family members can access family data:

```javascript
// Helper function to get user's family ID from their user document
function getUserFamily() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId;
}

// Helper function to check if user is a family member
function isFamilyMember(familyId) {
  return request.auth != null && getUserFamily() == familyId;
}

// Family documents - accessible by creator and all members
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

// Children - accessible by all family members
match /children/{childId} {
  allow read, write: if request.auth != null && isFamilyMember(resource.data.familyId);
  allow create: if request.auth != null && isFamilyMember(request.resource.data.familyId);
}

// Activities - accessible by all family members
match /activities/{activityId} {
  allow read, write: if request.auth != null && isFamilyMember(resource.data.familyId);
  allow create: if request.auth != null && isFamilyMember(request.resource.data.familyId);
}
```

### How Security Works

1. **User Document**: Each user has a `familyId` field in their user document
2. **Family Lookup**: The `getUserFamily()` helper retrieves the user's family ID
3. **Access Check**: The `isFamilyMember()` helper verifies the user belongs to the requested family
4. **Efficient**: Uses a single document lookup instead of array operations
5. **Secure**: Only family members can access family data
6. **Invitations**: Pending invitations are stored in the family document with unique tokens for secure acceptance

## Invitation System

### How Invitations Work

1. **Send Invitation**: Family owner enters an email address and role
2. **Generate Token**: System creates a unique, secure token for the invitation
3. **Store Pending**: Invitation is added to `pendingInvitations` array in family document
4. **Send Email**: User receives email with invitation link containing the token
5. **Accept Invitation**: User clicks link, creates account if needed, and token is validated
6. **Join Family**: User's `familyId` is set, and they're added to family members
7. **Clean Up**: Accepted invitation is removed from `pendingInvitations`

### Invitation Data Structure

```typescript
interface PendingInvitation {
  email: string;           // Email address of invitee
  invitedBy: string;       // User ID of person who sent invitation
  invitedAt: Timestamp;    // When invitation was sent
  role: 'parent' | 'caregiver';  // Role they'll have when they join
  token: string;           // Unique secure token for the invitation link
}
```

### Invitation Security

- **Unique Tokens**: Each invitation has a cryptographically secure random token
- **Expiration**: Invitations expire after 7 days (configurable)
- **One-Time Use**: Token is removed after successful acceptance
- **Email Validation**: Only the invited email can accept the invitation
- **Duplicate Prevention**: Cannot send multiple invitations to the same email

### Invitation States

1. **Pending**: Invitation sent, waiting for acceptance
2. **Accepted**: User joined the family, invitation removed
3. **Expired**: More than 7 days old, can be resent
4. **Cancelled**: Owner cancelled the invitation before acceptance

### Email Notification

The invitation email should include:
- Family name
- Who invited them
- Role they'll have
- Invitation link with token
- Expiration date
- Instructions for creating an account if needed

Example invitation link:
```
https://your-app.com/accept-invitation?token=abc123xyz789
```

## Migration from Single User

If you already have children/activities:

### Option 1: Manual Migration
1. Create a family
2. Manually update each child's `userId` to `familyId`
3. Manually update each activity's `userId` to `familyId`

### Option 2: Automatic Migration (Recommended)
Run this migration script once:

```typescript
async function migrateToFamilies(userId: string, familyId: string) {
  // Update all children
  const childrenSnapshot = await getDocs(
    query(collection(db, 'children'), where('userId', '==', userId))
  );
  
  for (const doc of childrenSnapshot.docs) {
    await updateDoc(doc.ref, {
      familyId,
      userId: deleteField(), // Remove old field
    });
  }
  
  // Update all activities
  const activitiesSnapshot = await getDocs(
    query(collection(db, 'activities'), where('userId', '==', userId))
  );
  
  for (const doc of activitiesSnapshot.docs) {
    await updateDoc(doc.ref, {
      familyId,
      userId: deleteField(), // Remove old field
    });
  }
}
```

## Common Scenarios

### Scenario 1: Co-Parents with Email Invitation
1. Parent A creates account and family
2. Parent A adds children and activities
3. Parent A sends invitation to Parent B's email
4. Parent B receives email with invitation link
5. Parent B clicks link, creates account (if needed)
6. Parent B automatically joins family and can see everything

### Scenario 2: Co-Parents with Direct Add
1. Parent A creates account and family
2. Parent B creates their own account first
3. Parent A adds Parent B directly by email
4. Parent B can now see and manage everything

### Scenario 3: Adding a Caregiver
1. Parents create family with children
2. Parent sends invitation to caregiver's email
3. Caregiver clicks link and creates account
4. Caregiver can view schedules and add activities

### Scenario 4: Managing Pending Invitations
1. Owner sends invitation to wrong email
2. Owner cancels the pending invitation
3. Owner sends new invitation to correct email
4. Or owner resends invitation if it wasn't received

### Scenario 5: Removing Access
1. Owner goes to Settings > Family
2. Clicks remove button next to member
3. Member loses access immediately
4. Member's account remains, but they're no longer in the family

## UI Components

### FamilySettings Component
Location: `src/components/family/FamilySettings.tsx`

Features:
- Create family form
- Send invitation by email
- Add member directly by email (if they have an account)
- List all members with roles
- List pending invitations with resend/cancel options
- Remove members (owner only)
- Shows owner with crown icon
- Shows invitation status and expiration

### Settings Page
Location: `src/app/settings/page.tsx`

Features:
- Tabs for Family and Notifications
- Family tab shows FamilySettings component
- Notifications tab shows NotificationSettings component

## API Methods

### FamilyService

```typescript
// Create a new family
createFamily(userId, userEmail, familyName): Promise<string>

// Get family by ID
getFamily(familyId): Promise<Family | null>

// Get user's family
getUserFamily(userId): Promise<Family | null>

// Send invitation by email
sendFamilyInvitation(familyId, email, role, invitedBy): Promise<void>

// Accept invitation by token
acceptInvitation(token, userId): Promise<void>

// Cancel pending invitation
cancelInvitation(familyId, email): Promise<void>

// Resend invitation
resendInvitation(familyId, email): Promise<void>

// Get pending invitations for a family
getPendingInvitations(familyId): Promise<PendingInvitation[]>

// Add member directly by email (if they have an account)
addFamilyMember(familyId, email, role): Promise<void>

// Remove member
removeFamilyMember(familyId, userId): Promise<void>

// Update family name
updateFamilyName(familyId, name): Promise<void>

// Update member role
updateMemberRole(familyId, userId, newRole): Promise<void>

// Leave family (non-owners)
leaveFamily(userId): Promise<void>

// Delete family (owner only)
deleteFamily(familyId, userId): Promise<void>
```

## Testing Checklist

- [ ] Create a family
- [ ] Send invitation by email
- [ ] View pending invitations
- [ ] Accept invitation via link
- [ ] Invitation adds user to family
- [ ] Cancel pending invitation
- [ ] Resend invitation
- [ ] Invitation expires after 7 days
- [ ] Add member directly by email (if account exists)
- [ ] Member can see all children
- [ ] Member can see all activities
- [ ] Member can add a child
- [ ] Member can add an activity
- [ ] Changes sync in real-time
- [ ] Remove a member
- [ ] Removed member loses access
- [ ] Owner cannot be removed
- [ ] Only owner can delete family
- [ ] Invalid invitation token shows error
- [ ] Duplicate invitations are prevented

## Deployment

1. **Update Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```
   
   Or on Windows:
   ```bash
   deploy-rules.bat
   ```

2. **Update Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Deploy to Vercel**:
   ```bash
   git push origin main
   ```

### Security Rules Details

The updated rules use efficient helper functions:
- `getUserFamily()`: Retrieves the user's family ID from their user document
- `isFamilyMember()`: Checks if the user belongs to a specific family
- Family access is verified by comparing the user's family ID with the resource's family ID
- Only family creators can delete families
- All family members have read/write access to children and activities

## Future Enhancements

- [x] Invite system with email notifications
- [x] Pending invitations
- [ ] Multiple families per user
- [ ] Family calendar sharing link
- [ ] Activity assignment (who's taking the kid)
- [ ] Family chat/notes
- [ ] Expense sharing
- [ ] Invitation reminders
- [ ] Custom invitation messages

## Comparison: Family Groups vs Per-Child Sharing

| Feature | Family Groups | Per-Child Sharing |
|---------|--------------|-------------------|
| Setup | One-time | Per child |
| New children | Auto-shared | Must share each |
| New activities | Auto-shared | Must share each |
| Management | Simple | Complex |
| Use case | Co-parents | Selective sharing |
| Recommended | ✅ Yes | For advanced users |

## Conclusion

Family Groups is the recommended approach for most users, especially co-parents. It's simpler, more intuitive, and requires less ongoing management.
