# Deployment Guide

This guide covers deploying the Kids Activity Scheduler to production using Vercel for the frontend and Firebase for backend services.

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Firebase Project**: Production Firebase project set up
3. **Firebase CLI**: Install with `npm install -g firebase-tools`
4. **Git Repository**: Code pushed to GitHub, GitLab, or Bitbucket

## Architecture Overview

```
┌─────────────────┐
│   Vercel        │
│  (Frontend)     │
│  - Next.js App  │
│  - Static Assets│
│  - PWA          │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐  ┌────▼──────────────┐
│  Firebase Auth  │  │  Firestore DB     │
│  - Email/Pass   │  │  - Users          │
│  - Google OAuth │  │  - Children       │
└─────────────────┘  │  - Activities     │
                     └───────────────────┘
                              │
                     ┌────────▼──────────┐
                     │ Cloud Functions   │
                     │ - Notifications   │
                     │ - Reminders       │
                     └───────────────────┘
```

## Part 1: Firebase Setup

### 1.1 Create Production Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing production project
3. Enable Google Analytics (optional but recommended)
4. Complete project creation

### 1.2 Configure Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Google** authentication:
   - Add your production domain to authorized domains
   - Configure OAuth consent screen
   - Add authorized redirect URIs

### 1.3 Set Up Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Choose production mode
3. Select a region close to your users
4. Deploy security rules:

```bash
cd kids-activity-scheduler
firebase deploy --only firestore:rules
```

5. Deploy Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

### 1.4 Deploy Cloud Functions

1. Install dependencies in functions directory:

```bash
cd functions
npm install
cd ..
```

2. Set Firebase configuration:

```bash
firebase use --add
# Select your production project
# Give it an alias like "production"
```

3. Deploy functions:

```bash
firebase deploy --only functions
```

4. Verify functions are deployed:
   - Go to Firebase Console > **Functions**
   - Check that `scheduleReminders` and `sendReminders` are listed

### 1.5 Configure Firebase Hosting (Optional)

If you want to use Firebase Hosting for Cloud Functions:

```bash
firebase deploy --only hosting
```

This hosts the functions at your Firebase domain.

## Part 2: Vercel Deployment

### 2.1 Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** > **"Project"**
3. Import your Git repository
4. Vercel will auto-detect Next.js

### 2.2 Configure Build Settings

Vercel should auto-detect these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Root Directory**: `kids-activity-scheduler`

### 2.3 Set Environment Variables

In Vercel project settings > **Environment Variables**, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important**: 
- Add these for **Production**, **Preview**, and **Development** environments
- Get values from Firebase Console > Project Settings > General
- Never commit these values to Git

### 2.4 Configure Custom Domain (Optional)

1. In Vercel project settings > **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Firebase authorized domains:
   - Firebase Console > **Authentication** > **Settings** > **Authorized domains**
   - Add your custom domain

### 2.5 Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete
3. Vercel will provide a deployment URL

## Part 3: Post-Deployment Configuration

### 3.1 Update Firebase Authorized Domains

1. Go to Firebase Console > **Authentication** > **Settings**
2. Add your Vercel deployment URLs to **Authorized domains**:
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if using custom domain)

### 3.2 Configure PWA Settings

1. Update `public/manifest.json` with production URLs:

```json
{
  "start_url": "https://your-app.vercel.app/",
  "scope": "https://your-app.vercel.app/"
}
```

2. Redeploy to Vercel

### 3.3 Test Push Notifications

1. Open deployed app in browser
2. Grant notification permissions
3. Create a test activity scheduled soon
4. Verify notifications are received

### 3.4 Set Up Monitoring

#### Vercel Analytics
1. Enable in Vercel project settings > **Analytics**
2. Monitor performance metrics

#### Firebase Monitoring
1. Enable **Crashlytics** in Firebase Console
2. Enable **Performance Monitoring**
3. Set up **Cloud Functions logs** monitoring

## Part 4: Continuous Deployment

### 4.1 Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### 4.2 Deployment Workflow

```
1. Developer pushes to feature branch
   ↓
2. Vercel creates preview deployment
   ↓
3. Test preview deployment
   ↓
4. Merge to main branch
   ↓
5. Vercel deploys to production
   ↓
6. Firebase functions remain unchanged (deploy manually)
```

### 4.3 Rolling Back

If issues occur:

1. In Vercel Dashboard > **Deployments**
2. Find previous working deployment
3. Click **"..."** > **"Promote to Production"**

## Part 5: Environment-Specific Configuration

### 5.1 Development Environment

```bash
# .env.local (not committed)
NEXT_PUBLIC_FIREBASE_API_KEY=dev_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dev_project_id
# ... other dev values
```

### 5.2 Staging Environment (Optional)

Create a separate Firebase project for staging:

1. Create new Firebase project
2. Set up separate Vercel project or use preview deployments
3. Use different environment variables

### 5.3 Production Environment

Use production Firebase project and Vercel production deployment.

## Part 6: Security Checklist

Before going live:

- [ ] Firestore security rules deployed and tested
- [ ] Firebase Auth authorized domains configured
- [ ] Environment variables set in Vercel (not in code)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Service Worker properly configured
- [ ] API keys restricted in Firebase Console
- [ ] Cloud Functions have proper error handling
- [ ] Rate limiting configured (if needed)

## Part 7: Performance Optimization

### 7.1 Vercel Configuration

The `vercel.json` file includes:
- Proper caching headers for service worker
- Manifest caching
- Regional deployment settings

### 7.2 Next.js Optimization

Already configured:
- Image optimization
- Code splitting
- Static generation where possible
- Dynamic imports for large components

### 7.3 Firebase Optimization

- Firestore indexes deployed
- Cloud Functions cold start optimization
- Efficient query patterns

## Part 8: Monitoring and Maintenance

### 8.1 Regular Checks

- Monitor Vercel deployment logs
- Check Firebase Cloud Functions logs
- Review Firebase usage and quotas
- Monitor error rates in Vercel Analytics

### 8.2 Updating Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test locally
npm run build
npm run dev

# Deploy
git push origin main
```

### 8.3 Firebase Functions Updates

```bash
cd functions
npm update
cd ..
firebase deploy --only functions
```

## Troubleshooting

### Issue: Build Fails on Vercel

**Solution**:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set
4. Test build locally: `npm run build`

### Issue: Authentication Not Working

**Solution**:
1. Verify Firebase config in environment variables
2. Check authorized domains in Firebase Console
3. Ensure HTTPS is enabled
4. Check browser console for errors

### Issue: Notifications Not Sending

**Solution**:
1. Verify Cloud Functions are deployed
2. Check Cloud Functions logs in Firebase Console
3. Ensure notification permissions granted in browser
4. Verify FCM tokens are being saved

### Issue: PWA Not Installing

**Solution**:
1. Verify `manifest.json` is accessible
2. Check service worker registration
3. Ensure HTTPS is enabled
4. Test with Lighthouse PWA audit

## Cost Estimation

### Vercel
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for production apps
- Includes: Unlimited bandwidth, automatic HTTPS, analytics

### Firebase
- **Spark Plan (Free)**:
  - 50K reads/day, 20K writes/day
  - 1GB storage
  - 10GB bandwidth/month
  
- **Blaze Plan (Pay as you go)**:
  - $0.06 per 100K reads
  - $0.18 per 100K writes
  - $0.18/GB storage
  - Cloud Functions: 2M invocations/month free

**Estimated Monthly Cost** (for small app):
- Vercel: $0-20
- Firebase: $0-10
- **Total**: $0-30/month

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)

## Quick Deploy Commands

```bash
# Deploy everything
npm run build                    # Test build locally
git push origin main             # Deploy frontend to Vercel
firebase deploy                  # Deploy Firebase (functions, rules, indexes)

# Deploy specific Firebase components
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Check deployment status
vercel ls                        # List Vercel deployments
firebase projects:list           # List Firebase projects
```

## Conclusion

Your Kids Activity Scheduler is now deployed and ready for production use! Monitor the application regularly and keep dependencies updated for security and performance.
