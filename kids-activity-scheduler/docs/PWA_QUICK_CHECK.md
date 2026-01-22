# PWA Quick Check Guide

## How to Check if Your App is a PWA

### ✅ Method 1: Chrome DevTools Lighthouse (Easiest)

1. Open your app in **Chrome**
2. Press **F12** to open DevTools
3. Click the **Lighthouse** tab
4. Select **Progressive Web App** checkbox
5. Click **Analyze page load**
6. **Result**: Score should be **90+** for PWA compliance

### ✅ Method 2: Chrome Application Tab

1. Open your app in **Chrome**
2. Press **F12** to open DevTools
3. Go to **Application** tab
4. Check the following:

#### Manifest
- Click **Manifest** in left sidebar
- Verify all fields are populated
- Check icons load correctly

#### Service Workers
- Click **Service Workers** in left sidebar
- Status should show: **activated and is running**
- Source: `/sw.js`

#### Cache Storage
- Click **Cache Storage** in left sidebar
- Should see multiple caches:
  - `google-fonts`
  - `static-assets`
  - `firebase-data`
  - `offline-data-v1`

### ✅ Method 3: Install Button Test

#### Desktop (Chrome/Edge)
- Look for **install icon** (⊕) in address bar
- If visible → PWA is installable ✓

#### Android
- Open app in Chrome
- Tap **three-dot menu**
- Look for **"Add to Home screen"** or **"Install app"**
- If visible → PWA is installable ✓

#### iOS (Safari)
- Open app in Safari
- Tap **Share button** (square with arrow)
- Look for **"Add to Home Screen"**
- If visible → PWA is installable ✓

### ✅ Method 4: Offline Test

1. Open your app
2. Open DevTools (**F12**)
3. Go to **Network** tab
4. Check **Offline** checkbox
5. Refresh the page
6. **Result**: App should still load (from cache) ✓

### ✅ Method 5: Run Automated Tests

```bash
cd kids-activity-scheduler

# Run all PWA tests
npm test src/lib/__tests__/pwa.test.ts
npm test src/lib/__tests__/pwaInstallation.test.ts
npm test src/lib/__tests__/performance.test.ts
npm test src/lib/__tests__/offlineSync.test.ts

# Or run all at once
npm test -- pwa
```

## PWA Checklist

Use this quick checklist to verify PWA compliance:

- [ ] **HTTPS**: App runs on HTTPS (or localhost)
- [ ] **Manifest**: `/manifest.json` exists and is valid
- [ ] **Service Worker**: `/sw.js` is registered and active
- [ ] **Icons**: Has 192x192 and 512x512 icons
- [ ] **Installable**: Shows install prompt on supported browsers
- [ ] **Offline**: Works offline or shows offline page
- [ ] **Responsive**: Works on mobile, tablet, desktop
- [ ] **Fast**: Loads in < 3 seconds
- [ ] **Lighthouse Score**: 90+ on PWA audit

## Common Issues

### ❌ No Install Button

**Causes:**
- Not using HTTPS
- Manifest is invalid
- Service worker not registered
- Already installed

**Fix:**
- Check console for errors
- Verify manifest.json is accessible
- Check service worker status in DevTools

### ❌ Not Working Offline

**Causes:**
- Service worker not caching resources
- Cache strategy misconfigured

**Fix:**
- Check Cache Storage in DevTools
- Verify service worker is active
- Check network requests in offline mode

### ❌ Low Lighthouse Score

**Causes:**
- Missing manifest fields
- Icons not optimized
- Slow load time
- Not responsive

**Fix:**
- Run Lighthouse audit
- Review failed audits
- Fix issues one by one
- Re-run audit

## Quick Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run specific PWA tests
npm test -- pwa

# Lint code
npm run lint
```

## Resources

- Full guide: [PWA_TESTING_GUIDE.md](./PWA_TESTING_GUIDE.md)
- [web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
