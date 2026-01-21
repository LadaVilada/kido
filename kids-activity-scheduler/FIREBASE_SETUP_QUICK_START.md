# Firebase Setup Quick Start

## Current Error: `auth/configuration-not-found`

This error means Firebase Authentication is not enabled in your Firebase project.

## Quick Fix Steps

### 1. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kiro-4ff97**
3. Click **Authentication** in the left sidebar
4. Click **Get started** (if you see this button)

### 2. Enable Email/Password Authentication

1. Go to the **Sign-in method** tab
2. Find **Email/Password** in the list
3. Click on it
4. Toggle **Enable** to ON
5. Click **Save**

### 3. Enable Google Authentication (Optional)

1. In the **Sign-in method** tab
2. Find **Google** in the list
3. Click on it
4. Toggle **Enable** to ON
5. Select a **Project support email** from the dropdown
6. Click **Save**

### 4. Verify Authorized Domains

1. In the **Sign-in method** tab
2. Scroll down to **Authorized domains**
3. Verify these domains are listed:
   - `localhost` (for development)
   - `kiro-4ff97.firebaseapp.com` (your Firebase domain)

### 5. Set Up Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode** (we have security rules)
4. Select a location (choose closest to your users)
5. Click **Enable**

### 6. Deploy Firestore Security Rules

After creating the database, deploy the security rules:

```bash
cd kids-activity-scheduler
firebase login
firebase use kiro-4ff97
firebase deploy --only firestore:rules
```

### 7. Restart Your Development Server

After enabling authentication:

1. Stop the current dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```
3. Try creating an account again

## Verification Checklist

- [ ] Firebase Authentication enabled
- [ ] Email/Password sign-in method enabled
- [ ] Google sign-in method enabled (optional)
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] localhost in authorized domains
- [ ] Development server restarted

## Testing

After setup, test these features:

1. **Sign Up**: Create a new account with email/password
2. **Sign In**: Log in with the created account
3. **Google Sign-In**: Try signing in with Google (if enabled)
4. **Sign Out**: Log out successfully

## Common Issues

### Issue: Still getting auth/configuration-not-found
**Solution**: 
- Clear browser cache and cookies
- Hard refresh the page (Ctrl+Shift+R)
- Restart the dev server
- Wait 1-2 minutes for Firebase changes to propagate

### Issue: Google Sign-in not working
**Solution**:
- Make sure you selected a support email
- Add your domain to authorized domains
- Enable Google OAuth in Google Cloud Console

### Issue: Can't create Firestore database
**Solution**:
- Make sure billing is enabled (Spark plan is free)
- Check that you have owner/editor permissions on the project

## Need Help?

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify all environment variables in `.env.local`
3. Make sure Firebase project ID matches: `kiro-4ff97`
4. Check Firebase Console for any error messages

## Next Steps

Once authentication is working:

1. Create a test account
2. Add some children profiles
3. Create activities
4. Test the calendar view
5. Enable push notifications
