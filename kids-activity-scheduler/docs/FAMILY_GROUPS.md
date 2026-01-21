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

### 2. Add Family Members

To add your partner/caregiver:
1. They must create an account first (sign up with their email)
2. Go to Settings > Family tab
3. Enter their email address
4. Click "Add"
5. They're instantly added to your family!

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
  createdAt: Timestamp;
}

interface FamilyMember {
  userId: string;
  email: string;
  role: 'owner' | 'parent' | 'caregiver';
  joinedAt: Timestamp;
}
```

## Security Rules

```javascript
// Children and activities use familyId instead of userId
match /children/{childId} {
  allow read, write: if isFamilyMember(resource.data.familyId);
}

match /activities/{activityId} {
  allow read, write: if isFamilyMember(resource.data.familyId);
}
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

### Scenario 1: Co-Parents
1. Parent A creates account and family
2. Parent A adds children and activities
3. Parent A invites Parent B by email
4. Parent B can now see and manage everything

### Scenario 2: Adding a Caregiver
1. Parents create family with children
2. Caregiver creates account
3. Parent invites caregiver by email
4. Caregiver can view schedules and add activities

### Scenario 3: Removing Access
1. Owner goes to Settings > Family
2. Clicks remove button next to member
3. Member loses access immediately
4. Member's account remains, but they're no longer in the family

## UI Components

### FamilySettings Component
Location: `src/components/family/FamilySettings.tsx`

Features:
- Create family form
- Add member by email
- List all members with roles
- Remove members (owner only)
- Shows owner with crown icon

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

// Add member by email
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
- [ ] Add a member by email
- [ ] Member can see all children
- [ ] Member can see all activities
- [ ] Member can add a child
- [ ] Member can add an activity
- [ ] Changes sync in real-time
- [ ] Remove a member
- [ ] Removed member loses access
- [ ] Owner cannot be removed
- [ ] Only owner can delete family

## Deployment

1. **Update Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Update Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Deploy to Vercel**:
   ```bash
   git push origin main
   ```

## Future Enhancements

- [ ] Invite system with email notifications
- [ ] Pending invitations
- [ ] Multiple families per user
- [ ] Family calendar sharing link
- [ ] Activity assignment (who's taking the kid)
- [ ] Family chat/notes
- [ ] Expense sharing

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
