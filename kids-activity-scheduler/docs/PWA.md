# PWA Features Documentation

## Overview

The Kids Activity Scheduler is a Progressive Web App (PWA) that provides offline functionality, installability, and optimized performance across all devices.

## Features

### 1. Service Worker & Caching

The app uses a custom service worker with intelligent caching strategies:

- **Static Assets**: Cached with StaleWhileRevalidate strategy
- **Google Fonts**: Cached for 365 days
- **Firebase Data**: Network-first with 1-hour cache fallback
- **API Requests**: Network-first with offline fallback

### 2. Offline Functionality

- Activities and schedules are cached for offline viewing
- Offline operations are queued and synced when connection is restored
- Background sync automatically syncs data when the device comes online
- Visual indicators show connection status

### 3. Installation

#### Desktop & Android
- Automatic install prompt appears after 3 seconds
- Users can dismiss and will be prompted again after 7 days
- "Add to Home Screen" functionality

#### iOS
- Custom instructions guide users through Safari installation
- Optimized for iOS standalone mode

### 4. Performance Optimizations

- Code splitting for faster initial load
- Lazy loading of non-critical components
- Optimized bundle sizes with separate chunks for:
  - React/React-DOM
  - Firebase
  - Vendor libraries
  - Common shared code
- Image optimization with AVIF and WebP formats
- Compression enabled for all assets

## Usage

### Installing the App

**Desktop (Chrome, Edge):**
1. Click the install icon in the address bar
2. Or use the in-app install prompt

**Android:**
1. Tap the menu (three dots)
2. Select "Add to Home Screen"
3. Or use the in-app install prompt

**iOS (Safari):**
1. Tap the Share button
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"

### Offline Mode

The app automatically detects when you're offline and:
- Shows cached activities and schedules
- Queues any changes you make
- Syncs automatically when you're back online
- Displays a connection status indicator

### Managing Offline Data

```typescript
import { offlineSyncManager } from '@/lib/offlineSync';

// Check if online
const isOnline = offlineSyncManager.isOnline();

// Queue an operation for offline sync
await offlineSyncManager.queueOperation({
  type: 'POST',
  endpoint: '/api/activities',
  data: { name: 'Soccer Practice', ... }
});

// Get pending operations
const pending = await offlineSyncManager.getPendingOperations();
```

### Using the Offline Sync Hook

```typescript
import { useOfflineSync } from '@/lib/offlineSync';

function MyComponent() {
  const { isOnline, pendingOperations, queueOperation } = useOfflineSync();
  
  return (
    <div>
      {!isOnline && <p>You're offline. Changes will sync when online.</p>}
      {pendingOperations.length > 0 && (
        <p>{pendingOperations.length} operations pending sync</p>
      )}
    </div>
  );
}
```

## Configuration

### Manifest Configuration

The app manifest is located at `public/manifest.json` and includes:
- App name and description
- Theme colors
- Display mode (standalone)
- Icons for all sizes
- Start URL

### Service Worker Configuration

Service worker settings are in `next.config.ts`:
- Caching strategies
- Cache expiration times
- Network timeout settings

### Performance Settings

Performance optimizations in `next.config.ts`:
- Code splitting configuration
- Image optimization settings
- Compression settings
- Webpack optimizations

## Testing

### Testing PWA Features

1. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

2. **Test offline mode:**
   - Open DevTools > Network tab
   - Select "Offline" from the throttling dropdown
   - Verify app still works

3. **Test installation:**
   - Open in Chrome/Edge
   - Look for install prompt
   - Install and verify standalone mode

4. **Test service worker:**
   - Open DevTools > Application tab
   - Check Service Workers section
   - Verify caching in Cache Storage

### Lighthouse Audit

Run a Lighthouse audit to check PWA compliance:
1. Open DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"

Target scores:
- Performance: 90+
- PWA: 100
- Accessibility: 90+
- Best Practices: 90+

## Troubleshooting

### Service Worker Not Updating

1. Unregister the service worker:
   - DevTools > Application > Service Workers
   - Click "Unregister"
2. Clear cache storage
3. Hard refresh (Ctrl+Shift+R)

### Install Prompt Not Showing

- Ensure you're using HTTPS (or localhost)
- Check that manifest.json is valid
- Verify service worker is registered
- Check browser console for errors

### Offline Sync Not Working

1. Check IndexedDB in DevTools > Application
2. Verify service worker is active
3. Check browser console for sync errors
4. Ensure background sync is supported

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support (except background sync)
- Safari: Partial support (manual installation only)
- iOS Safari: Requires manual installation

## Future Enhancements

- Push notifications for activity reminders
- Periodic background sync for automatic updates
- Advanced caching strategies for images
- Offline-first architecture improvements