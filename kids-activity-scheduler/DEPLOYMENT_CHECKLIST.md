# Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Code Quality
- [ ] All tests pass locally
- [ ] Build completes without errors (`npm run build`)
- [ ] No console errors in development
- [ ] Code reviewed and approved
- [ ] All features tested manually

### Firebase Setup
- [ ] Production Firebase project created
- [ ] Firebase Authentication enabled (Email/Password + Google)
- [ ] Firestore database created in production mode
- [ ] Firestore security rules deployed
- [ ] Firestore indexes deployed
- [ ] Cloud Functions deployed
- [ ] Firebase authorized domains configured

### Environment Configuration
- [ ] `.env.production` created with production values
- [ ] Environment variables added to Vercel
- [ ] API keys restricted in Firebase Console
- [ ] No sensitive data in code or Git

### PWA Configuration
- [ ] `manifest.json` updated with production URLs
- [ ] Service worker configured correctly
- [ ] Icons generated for all sizes
- [ ] PWA tested on mobile devices

## Vercel Deployment

### Initial Setup
- [ ] Repository connected to Vercel
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Deployment
- [ ] Code pushed to main branch
- [ ] Vercel build successful
- [ ] Deployment URL accessible
- [ ] No build warnings or errors

## Post-Deployment Testing

### Authentication
- [ ] Email/password sign up works
- [ ] Email/password sign in works
- [ ] Google OAuth sign in works
- [ ] Sign out works
- [ ] Session persistence works
- [ ] Password reset works (if implemented)

### Core Features
- [ ] Can create child profiles
- [ ] Can edit child profiles
- [ ] Can delete child profiles
- [ ] Can create activities
- [ ] Can edit activities
- [ ] Can delete activities
- [ ] Calendar displays correctly
- [ ] Week navigation works
- [ ] Day view works (if implemented)

### Real-time Updates
- [ ] Changes sync across tabs
- [ ] Firestore subscriptions working
- [ ] No data loss on refresh

### Push Notifications
- [ ] Notification permission prompt appears
- [ ] Can enable/disable notifications
- [ ] Notifications sent at correct times
- [ ] Notification content is accurate
- [ ] Clicking notification opens app

### PWA Features
- [ ] Install prompt appears on mobile
- [ ] App installs successfully
- [ ] App opens in standalone mode
- [ ] Offline mode works
- [ ] Service worker caches correctly
- [ ] App icon displays correctly

### Performance
- [ ] Initial load time < 3 seconds
- [ ] Lighthouse PWA score > 90
- [ ] Lighthouse Performance score > 80
- [ ] No memory leaks
- [ ] Smooth animations and transitions

### Responsive Design
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Touch interactions work
- [ ] No horizontal scrolling

### Browser Compatibility
- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Edge (desktop)

## Monitoring Setup

### Vercel
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Deployment notifications set up

### Firebase
- [ ] Cloud Functions logs accessible
- [ ] Firestore usage monitoring enabled
- [ ] Authentication logs reviewed
- [ ] Performance monitoring enabled (optional)
- [ ] Crashlytics enabled (optional)

## Documentation

- [ ] README updated with production info
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Known issues documented
- [ ] User guide created (if needed)

## Security

- [ ] Firestore security rules tested
- [ ] API keys restricted by domain/app
- [ ] No sensitive data exposed in client
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting considered

## Backup and Recovery

- [ ] Firestore backup strategy defined
- [ ] Rollback procedure documented
- [ ] Previous deployment accessible in Vercel
- [ ] Database export tested

## Communication

- [ ] Stakeholders notified of deployment
- [ ] Users informed of new features
- [ ] Support team briefed
- [ ] Maintenance window communicated (if needed)

## Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rates
- [ ] Check Cloud Functions execution
- [ ] Review user feedback
- [ ] Monitor performance metrics
- [ ] Check notification delivery
- [ ] Verify data integrity

## Week 1 Review

- [ ] Review analytics data
- [ ] Check for any reported issues
- [ ] Monitor Firebase usage and costs
- [ ] Gather user feedback
- [ ] Plan improvements

## Sign-off

**Deployed by**: _______________  
**Date**: _______________  
**Deployment URL**: _______________  
**Firebase Project**: _______________  

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

**Issues Found**:
_______________________________________________
_______________________________________________
_______________________________________________

**Follow-up Actions**:
_______________________________________________
_______________________________________________
_______________________________________________
