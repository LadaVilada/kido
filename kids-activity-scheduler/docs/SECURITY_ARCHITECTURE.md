# Security Architecture

## Overview

The Kids Activity Scheduler implements a defense-in-depth security model with clear separation between client-side validation and server-side authorization.

## Architecture Principles

### 1. Server-Side Authorization (Firestore Security Rules)

**Single Source of Truth**: All authorization decisions are made by Firestore security rules.

**What Firestore Rules Enforce**:
- Family membership validation
- Resource ownership verification
- Cross-family access prevention
- Data integrity constraints

**Why This Matters**:
- Cannot be bypassed by modifying client code
- Consistent enforcement across all clients (web, mobile, API)
- Protects against malicious users
- Ensures data isolation between families

### 2. Client-Side Validation (TypeScript Services)

**User Experience Focus**: Client services provide fast feedback and helpful error messages.

**What Client Services Do**:
- ✅ Validate input formats (email, time strings, required fields)
- ✅ Check referenced resources exist (child exists before creating activity)
- ✅ Provide user-friendly error messages
- ✅ Prevent unnecessary network requests
- ❌ **Do NOT enforce authorization** - delegated to Firestore

**Why This Matters**:
- Better user experience with immediate feedback
- Reduced server load by catching errors early
- Simpler client code focused on business logic
- Clear separation of concerns

## Example: Creating an Activity

### Client-Side Flow (ActivitiesService)

```typescript
static async createActivity(userId: string, input: CreateActivityInput): Promise<string> {
  // 1. Validate input format
  const validation = validateCreateActivity(input);
  if (!validation.isValid) {
    throw new Error(validation.errors.map(e => e.message).join(', '));
  }

  // 2. Verify child exists (for better UX)
  const child = await ChildrenService.getChild(input.childId);
  if (!child) {
    throw new Error('Selected child not found');
  }
  // Note: Family membership validation is handled by Firestore security rules

  // 3. Attempt to create activity
  const activityData = { userId, ...input };
  const activityId = await createDocument(COLLECTIONS.ACTIVITIES, activityData);
  return activityId;
}
```

**What's NOT checked client-side**:
- ❌ Does the child belong to the user's family?
- ❌ Does the user have permission to create activities?
- ❌ Is the user a member of any family?

### Server-Side Flow (Firestore Rules)

```javascript
match /activities/{activityId} {
  // Authorization check: user must be in the same family as the child
  allow create: if request.auth != null && 
    isFamilyMember(request.resource.data.familyId);
}

function isFamilyMember(familyId) {
  return request.auth != null && getUserFamily() == familyId;
}

function getUserFamily() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId;
}
```

**What IS checked server-side**:
- ✅ User is authenticated
- ✅ User belongs to a family
- ✅ User's family matches the activity's family
- ✅ Activity data is valid

### Result

If a malicious user modifies the client code to skip the child existence check or tries to create an activity for a child in another family:

1. Client code allows the request to proceed
2. Firestore security rules evaluate the request
3. Rules detect the user is not a member of the target family
4. Request is **rejected** with "Missing or insufficient permissions"
5. No data is written to the database

## Security Layers

### Layer 1: Authentication (Firebase Auth)
- Verifies user identity
- Provides authenticated user ID
- Manages sessions and tokens

### Layer 2: Client Validation (TypeScript)
- Input format validation
- Resource existence checks
- User-friendly error messages
- Prevents unnecessary requests

### Layer 3: Authorization (Firestore Rules)
- **Primary security layer**
- Family membership validation
- Resource ownership verification
- Data integrity enforcement

### Layer 4: Data Validation (Firestore Rules)
- Field type validation
- Required field checks
- Data format validation
- Referential integrity

## Common Patterns

### Pattern 1: Resource Creation

**Client**: Validates input, checks references exist  
**Server**: Validates family membership, enforces ownership

```typescript
// Client
const child = await getChild(childId);
if (!child) throw new Error('Child not found');
await createActivity({ childId, ...data });

// Server (Firestore Rules)
allow create: if isFamilyMember(request.resource.data.familyId);
```

### Pattern 2: Resource Update

**Client**: Validates input, checks resource exists  
**Server**: Validates ownership, enforces family membership

```typescript
// Client
const activity = await getActivity(activityId);
if (!activity) throw new Error('Activity not found');
await updateActivity(activityId, updates);

// Server (Firestore Rules)
allow update: if isFamilyMember(resource.data.familyId);
```

### Pattern 3: Resource Deletion

**Client**: Confirms action, checks resource exists  
**Server**: Validates ownership, enforces permissions

```typescript
// Client
const activity = await getActivity(activityId);
if (!activity) throw new Error('Activity not found');
await deleteActivity(activityId);

// Server (Firestore Rules)
allow delete: if isFamilyMember(resource.data.familyId);
```

## Benefits

### Security Benefits
1. **Defense in Depth**: Multiple layers of protection
2. **Cannot Be Bypassed**: Server rules always enforce authorization
3. **Consistent**: Same rules apply to all clients
4. **Auditable**: Clear separation makes security review easier

### Development Benefits
1. **Simpler Client Code**: Focus on business logic, not authorization
2. **Better UX**: Fast client-side validation with helpful messages
3. **Maintainable**: Authorization logic centralized in Firestore rules
4. **Testable**: Can test client and server logic independently

### Performance Benefits
1. **Reduced Latency**: Client validation catches errors immediately
2. **Fewer Requests**: Invalid requests caught before network call
3. **Efficient Rules**: Single document lookup for family membership
4. **Scalable**: Rules execute efficiently at database level

## Migration Notes

### Before (v1.0): Client-Side Authorization

```typescript
// ❌ Old approach - authorization in client code
const child = await getChild(childId);
if (!child) throw new Error('Child not found');
if (child.userId !== userId) {
  throw new Error('You do not have permission to create activities for this child');
}
```

**Problems**:
- Can be bypassed by modifying client code
- Duplicated logic across services
- Inconsistent with Firestore rules
- False sense of security

### After (v2.0): Server-Side Authorization

```typescript
// ✅ New approach - authorization in Firestore rules
const child = await getChild(childId);
if (!child) throw new Error('Child not found');
// Note: Family membership validation is handled by Firestore security rules
```

**Benefits**:
- Cannot be bypassed
- Single source of truth (Firestore rules)
- Simpler client code
- True security

## Testing Strategy

### Client-Side Tests
- Input validation works correctly
- User-friendly error messages
- Resource existence checks
- Business logic correctness

### Server-Side Tests (Firestore Rules)
- Unauthorized users cannot access data
- Family members can access family data
- Non-members cannot access other families
- Edge cases (no family, deleted family, etc.)

### Integration Tests
- End-to-end flows work correctly
- Client and server work together
- Error messages are appropriate
- Security is enforced

## Best Practices

### DO ✅
- Validate input formats client-side
- Check resource existence for better UX
- Provide helpful error messages
- Document which checks are client vs server
- Trust Firestore rules for authorization

### DON'T ❌
- Enforce authorization in client code
- Duplicate Firestore rule logic in services
- Assume client validation is sufficient
- Skip server-side validation
- Mix validation and authorization concerns

## Related Documentation

- [Firestore Security Rules](./FIRESTORE_RULES.md) - Detailed rules documentation
- [Family Groups](./FAMILY_GROUPS.md) - Family-based access control
- [Deployment Guide](./DEPLOYMENT.md) - Deploying security rules

## Conclusion

The Kids Activity Scheduler's security architecture provides robust protection through server-side authorization while maintaining excellent user experience through client-side validation. This separation of concerns ensures security cannot be compromised while keeping the codebase maintainable and performant.
