# Multi-User Sharing Feature

This document explains how to enable sharing of children and activities between multiple users (e.g., co-parents, caregivers).

## Overview

The sharing feature allows:
- **Primary Owner**: The user who created the child/activity
- **Shared Users**: Other users who have been granted access
- Both can view and edit shared children and activities
- Only the owner can delete or change sharing permissions

## Implementation Status

✅ **Completed**:
- Data model updated with `sharedWith` array
- Firestore security rules updated to support shared access
- ShareChildDialog component created

⏳ **To Do**:
- Add sharing UI to ChildCard component
- Implement service methods for sharing
- Add user lookup by email
- Sync sharing between children and their activities
- Add notifications when something is shared with you

## How It Works

### Data Structure

```typescript
interface Child {
  id: string;
  userId: string;          // Primary owner
  sharedWith?: string[];   // Array of user IDs with access
  name: string;
  color: string;
  createdAt: Timestamp;
}
```

### Security Rules

The updated Firestore rules allow:
1. **Read**: Owner OR anyone in `sharedWith` array
2. **Update/Delete**: Owner OR anyone in `sharedWith` array
3. **Create**: Only authenticated users (they become the owner)

### Sharing Flow

1. User A creates a child
2. User A clicks "Share" button
3. User A enters User B's email
4. System looks up User B's ID by email
5. User B's ID is added to `sharedWith` array
6. User B can now see and edit the child

## Implementation Steps

### Step 1: Add Service Methods

Add these methods to `ChildrenService`:

```typescript
/**
 * Share a child with another user by email
 */
static async shareChild(
  childId: string,
  ownerUserId: string,
  shareWithEmail: string
): Promise<void> {
  // 1. Look up user by email
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', shareWithEmail));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error('User not found with that email');
  }
  
  const shareWithUserId = snapshot.docs[0].id;
  
  if (shareWithUserId === ownerUserId) {
    throw new Error('Cannot share with yourself');
  }
  
  // 2. Add to sharedWith array
  const childRef = doc(db, 'children', childId);
  await updateDoc(childRef, {
    sharedWith: arrayUnion(shareWithUserId)
  });
}

/**
 * Remove sharing access from a user
 */
static async unshareChild(
  childId: string,
  userId: string
): Promise<void> {
  const childRef = doc(db, 'children', childId);
  await updateDoc(childRef, {
    sharedWith: arrayRemove(userId)
  });
}

/**
 * Get users a child is shared with
 */
static async getSharedUsers(childId: string): Promise<Array<{userId: string, email: string}>> {
  const child = await this.getChild(childId);
  if (!child || !child.sharedWith || child.sharedWith.length === 0) {
    return [];
  }
  
  const users = await Promise.all(
    child.sharedWith.map(async (userId) => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return {
        userId,
        email: userDoc.data()?.email || 'Unknown'
      };
    })
  );
  
  return users;
}
```

### Step 2: Update ChildCard Component

Add a "Share" button to the ChildCard:

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => onShare(child)}
>
  <UserPlus className="w-4 h-4 mr-2" />
  Share
</Button>
```

### Step 3: Update ChildList Component

Add sharing state and handlers:

```typescript
const [sharingChild, setSharingChild] = useState<Child | null>(null);
const [sharedUsers, setSharedUsers] = useState<Array<{userId: string, email: string}>>([]);

const handleShareChild = async (child: Child) => {
  const users = await ChildrenService.getSharedUsers(child.id);
  setSharedUsers(users);
  setSharingChild(child);
};

const handleShare = async (childId: string, email: string) => {
  await ChildrenService.shareChild(childId, user!.uid, email);
  // Refresh shared users list
  const users = await ChildrenService.getSharedUsers(childId);
  setSharedUsers(users);
};

const handleUnshare = async (childId: string, userId: string) => {
  await ChildrenService.unshareChild(childId, userId);
  // Refresh shared users list
  const users = await ChildrenService.getSharedUsers(childId);
  setSharedUsers(users);
};
```

### Step 4: Update Queries

Update the Firestore queries to include shared items:

```typescript
// Current query (only owner's items)
const q = query(
  collection(db, 'children'),
  where('userId', '==', userId)
);

// New query (owner's items + shared items)
const q1 = query(
  collection(db, 'children'),
  where('userId', '==', userId)
);

const q2 = query(
  collection(db, 'children'),
  where('sharedWith', 'array-contains', userId)
);

// Combine results from both queries
```

### Step 5: Sync Activities

When sharing a child, optionally share all their activities too:

```typescript
static async shareChildWithActivities(
  childId: string,
  ownerUserId: string,
  shareWithEmail: string
): Promise<void> {
  // Share the child
  await this.shareChild(childId, ownerUserId, shareWithEmail);
  
  // Get the shared user's ID
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', shareWithEmail));
  const snapshot = await getDocs(q);
  const shareWithUserId = snapshot.docs[0].id;
  
  // Share all activities for this child
  const activities = await ActivitiesService.getActivitiesByChild(childId);
  await Promise.all(
    activities.map(activity =>
      ActivitiesService.shareActivity(activity.id, shareWithUserId)
    )
  );
}
```

## UI/UX Considerations

### Indicators
- Show a "Shared" badge on shared children
- Show who the owner is
- Show how many people it's shared with

### Permissions
- Only owner can delete
- Only owner can change sharing
- Both can edit details

### Notifications
- Notify users when something is shared with them
- Notify when sharing is removed
- Notify when shared items are updated

## Security Considerations

1. **Email Verification**: Only share with verified email addresses
2. **Limit Sharing**: Consider limiting to 5-10 shared users per child
3. **Audit Log**: Track who made changes to shared items
4. **Revoke Access**: Owner can revoke access anytime

## Testing

Test these scenarios:
1. Share child with another user
2. Shared user can view and edit
3. Shared user cannot delete
4. Owner can revoke access
5. Activities sync with child sharing
6. Real-time updates work for both users

## Alternative: Family Groups

Instead of per-child sharing, you could implement family groups:

```typescript
interface Family {
  id: string;
  name: string;
  members: Array<{
    userId: string;
    role: 'owner' | 'parent' | 'caregiver';
    email: string;
  }>;
  createdAt: Timestamp;
}

interface Child {
  id: string;
  familyId: string;  // Instead of userId
  name: string;
  color: string;
  createdAt: Timestamp;
}
```

This approach:
- ✅ Simpler to manage
- ✅ All family members see all children
- ✅ Better for co-parenting scenarios
- ❌ Less flexible for selective sharing

## Next Steps

1. Decide: Per-child sharing OR family groups?
2. Implement service methods
3. Add UI components
4. Update queries to include shared items
5. Test thoroughly
6. Deploy updated security rules

## Deployment

After implementing, deploy the new security rules:

```bash
firebase deploy --only firestore:rules
```

Or via Firebase Console:
https://console.firebase.google.com/project/kiro-4ff97/firestore/rules
