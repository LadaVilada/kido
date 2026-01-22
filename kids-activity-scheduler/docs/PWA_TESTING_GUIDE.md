# PWA Testing Guide

This guide helps you verify that the Kids Activity Scheduler is a fully compliant Progressive Web App (PWA).

## Quick Check Methods

### Method 1: Chrome DevTools (Recommended)

1. **Open Chrome DevTools**
   - Press `F12` or right-click and select "Inspect"
   - Go to the **Lighthouse** tab

2. **Run Lighthouse Audit**
   - Select "Progressive Web App" category
   - Click "Analyze page load"
   - Review the PWA score (should be 90+)

3. **Check Application Tab**
   - Go to **Application** tab in DevTools
   - Verify:
     - ✅ Manifest is present and valid
     - ✅ Service Worker is registered and active
     - ✅ Cache Storage contains cached resources
     - ✅ Icons are properly configured

### Method 2: Manual Browser Testing

#### Desktop (Chrome/Edge)
1. Visit your app URL
2. Look for **install icon** (⊕) in the address bar
3. Click to install the app
4. Verify app opens in standalone window

#### Android
1. Open app in Chrome
2. Tap the **three-dot menu**
3. Select "Add to Home screen" or "Install app"
4. Verify app icon appears on home screen
5. Open app and verify standalone mode

#### iOS (Safari)
1. Open app in Safari
2. Tap the **Share button** (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Verify app icon appears on home screen
5. Open app and verify standalone mode

## Detailed PWA Checklist

### ✅ Core Requirements

- [ ] **HTTPS**: App is served over HTTPS (or localhost for development)
- [ ] **Manifest**: Valid `manifest.json` with required fields
- [ ] **Service Worker**: Registered and active service worker
- [ ] **Icons**: At least 192x192 and 512x512 icons
- [ ] **Offline**: App works offline or shows offline page
- [ ] **Responsive**: Works on mobile, tablet, and desktop
- [ ] **Fast Load**: Loads in < 3 seconds on 3G

### 📱 Manifest Requirements

Check `/manifest.json` contains:

```json
{
  "name": "Kids Activity Scheduler",
  "short_name": "Activity Scheduler",
  "description": "...",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### 🔧 Service Worker Verification

**Check in Chrome DevTools > Application > Service Workers:**

- Status: **Activated and running**
- Source: `/sw.js`
- Scope: `/`
- Update on reload: Optional

**Test Offline Functionality:**

1. Open DevTools > Network tab
2. Check "Offline" checkbox
3. Refresh the page
4. Verify app still loads (from cache)

### 💾 Cache Storage Verification

**Check in Chrome DevTools > Application > Cache Storage:**

Expected caches:
- `google-fonts` - Font files
- `google-fonts-static` - Static font resources
- `static-assets` - JS, CSS, images
- `firebase-data` - Firebase API responses
- `firestore-data` - Firestore data
- `offline-data-v1` - Offline operations

### 🎨 Icon Verification

**Required icon sizes:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**Check icons:**
1. DevTools > Application > Manifest
2. Verify all icons load correctly
3. Check "purpose" includes "maskable" for Android

### 📊 Performance Testing

#### Using Lighthouse

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select categories:
   - ✅ Performance
   - ✅ Progressive Web App
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
4. Click "Analyze page load"

**Target Scores:**
- Performance: 90+
- PWA: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

#### Key Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.8s

### 🌐 Cross-Browser Testing

Test installation on:

- [ ] **Chrome** (Desktop & Android)
- [ ] **Edge** (Desktop)
- [ ] **Safari** (iOS)
- [ ] **Firefox** (Desktop)
- [ ] **Samsung Internet** (Android)

### 📱 Platform-Specific Testing

#### Android Testing

1. **Install Prompt**
   - Verify "Add to Home screen" banner appears
   - Test installation flow
   - Verify app opens in standalone mode

2. **Splash Screen**
   - Check splash screen shows during launch
   - Verify theme color matches manifest

3. **Status Bar**
   - Verify status bar color matches theme

#### iOS Testing

1. **Manual Installation**
   - Test Safari share menu installation
   - Verify app icon on home screen
   - Check standalone mode works

2. **Status Bar**
   - Verify status bar appearance
   - Check safe area handling

3. **Splash Screen**
   - Verify launch screen displays correctly

### 🔍 Testing Commands

Run automated tests:

```bash
# Run all PWA tests
npm test -- pwa

# Run specific test files
npm test -- src/lib/__tests__/pwa.test.ts
npm test -- src/lib/__tests__/pwaInstallation.test.ts
npm test -- src/lib/__tests__/performance.test.ts
npm test -- src/lib/__tests__/offlineSync.test.ts

# Run tests in watch mode
npm run test:watch
```

### 🐛 Common Issues and Solutions

#### Issue: Service Worker Not Registering

**Solution:**
- Check HTTPS is enabled (or using localhost)
- Verify `/sw.js` file exists in public folder
- Check browser console for errors
- Clear browser cache and reload

#### Issue: Install Prompt Not Showing

**Solution:**
- Verify manifest.json is valid
- Check service worker is active
- Ensure HTTPS is enabled
- Try in incognito mode (clears previous dismissals)

#### Issue: App Not Working Offline

**Solution:**
- Check service worker caching strategy
- Verify cache storage contains resources
- Test with DevTools offline mode
- Check network requests in DevTools

#### Issue: Icons Not Displaying

**Solution:**
- Verify icon files exist in `/public/icons/`
- Check manifest.json icon paths
- Ensure icon sizes are correct
- Clear cache and reload

### 📈 Monitoring PWA in Production

**Tools to use:**

1. **Google Analytics**
   - Track installation events
   - Monitor standalone mode usage
   - Measure engagement metrics

2. **Firebase Performance Monitoring**
   - Track load times
   - Monitor API response times
   - Identify performance bottlenecks

3. **Sentry or Error Tracking**
   - Monitor service worker errors
   - Track offline sync failures
   - Capture installation issues

### 🎯 PWA Best Practices

1. **Always test on real devices** - Emulators don't fully replicate PWA behavior
2. **Test on slow networks** - Use DevTools throttling (Slow 3G)
3. **Test offline scenarios** - Verify graceful degradation
4. **Monitor cache sizes** - Keep caches under 50MB
5. **Update service worker** - Implement update notifications
6. **Test across browsers** - PWA support varies by browser

## Automated Testing

The project includes comprehensive PWA tests:

- **pwa.test.ts** - Service worker and caching tests
- **pwaInstallation.test.ts** - Installation and compliance tests
- **performance.test.ts** - Performance and optimization tests
- **offlineSync.test.ts** - Offline synchronization tests

Run these tests regularly to ensure PWA compliance.

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse PWA Audits](https://web.dev/lighthouse-pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox (Service Worker Library)](https://developers.google.com/web/tools/workbox)
