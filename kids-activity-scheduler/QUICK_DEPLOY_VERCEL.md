# Quick Deploy to Vercel - Step by Step

This is a simplified guide to get your app live on Vercel quickly.

## Step 1: Prepare Your Code

1. Make sure everything is committed to Git:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   ```

2. Push to GitHub (or GitLab/Bitbucket):
   ```bash
   git push origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Website (Easiest)

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com)

2. **Sign Up/Login**: Use your GitHub account for easiest setup

3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your repository from the list
   - Click "Import"

4. **Configure Project**:
   - **Root Directory**: Select `kids-activity-scheduler`
   - **Framework Preset**: Next.js (auto-detected)
   - Leave other settings as default

5. **Add Environment Variables**:
   Click "Environment Variables" and add these from your `.env.local` file:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_value_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_value_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_value_here
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_value_here
   ```

6. **Deploy**: Click "Deploy" button

7. **Wait**: Vercel will build and deploy (takes 2-5 minutes)

8. **Done!**: You'll get a URL like `your-app.vercel.app`

### Option B: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd kids-activity-scheduler
   vercel
   ```

4. **Follow prompts**:
   - Set up and deploy? Yes
   - Which scope? (select your account)
   - Link to existing project? No
   - Project name? (press enter for default)
   - Directory? `./`
   - Override settings? No

5. **Add environment variables**:
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   # Paste your value when prompted
   # Repeat for all environment variables
   ```

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Step 3: Update Firebase Settings

1. **Go to Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)

2. **Add Authorized Domain**:
   - Go to Authentication → Settings → Authorized domains
   - Click "Add domain"
   - Add your Vercel URL: `your-app.vercel.app`
   - Click "Add"

3. **Test Authentication**:
   - Visit your Vercel URL
   - Try signing in with Google
   - Should work now!

## Step 4: Test Your Deployment

Visit your Vercel URL and test:
- [ ] App loads correctly
- [ ] Can sign in with email/password
- [ ] Can sign in with Google
- [ ] Can create children
- [ ] Can create activities
- [ ] Calendar displays correctly
- [ ] PWA install prompt appears on mobile

## Step 5: Set Up Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Click "Add"
   - Enter your domain (e.g., `myapp.com`)
   - Follow DNS configuration instructions

2. **Update Firebase**:
   - Add your custom domain to Firebase authorized domains
   - Update `manifest.json` with your domain

## Automatic Deployments

Now every time you push to GitHub:
- **Main branch** → Deploys to production
- **Other branches** → Creates preview deployments

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Test locally: `npm run build`

### Authentication Doesn't Work
- Verify environment variables are set in Vercel
- Check Firebase authorized domains includes your Vercel URL
- Look for errors in browser console

### App Shows Blank Page
- Check Vercel deployment logs
- Verify Firebase config is correct
- Check browser console for errors

## Quick Commands

```bash
# View deployments
vercel ls

# View logs
vercel logs

# Rollback to previous deployment
# (Go to Vercel dashboard → Deployments → Click "..." → Promote to Production)

# Redeploy
git push origin main
```

## Cost

- **Vercel Hobby Plan**: FREE
  - Perfect for personal projects
  - Unlimited deployments
  - Automatic HTTPS
  - 100GB bandwidth/month

- **Vercel Pro Plan**: $20/month
  - For production apps
  - More bandwidth
  - Team features

## Next Steps

1. ✅ App is live!
2. Share the URL with family/friends
3. Install as PWA on your phone
4. Monitor usage in Vercel dashboard
5. Check Firebase usage in Firebase console

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

---

**Your app is now live! 🎉**

Share your URL: `https://your-app.vercel.app`
