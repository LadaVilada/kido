// Custom service worker for Kids Activity Scheduler
// This extends the default next-pwa service worker with background sync

const CACHE_NAME = 'kids-activity-scheduler-v1';
const OFFLINE_DATA_CACHE = 'offline-data-v1';

// Background sync for offline data operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-activities') {
    event.waitUntil(syncOfflineData());
  }
});

// Handle offline data synchronization
async function syncOfflineData() {
  try {
    // Get pending offline operations from IndexedDB
    const pendingOperations = await getPendingOperations();
    
    for (const operation of pendingOperations) {
      try {
        // Attempt to sync each operation
        await syncOperation(operation);
        // Remove from pending operations on success
        await removePendingOperation(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Get pending operations from IndexedDB
async function getPendingOperations() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineOperations', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('operations')) {
        const store = db.createObjectStore('operations', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Sync individual operation
async function syncOperation(operation) {
  const { type, data, endpoint } = operation;
  
  const response = await fetch(endpoint, {
    method: type === 'DELETE' ? 'DELETE' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: type !== 'DELETE' ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

// Remove pending operation from IndexedDB
async function removePendingOperation(operationId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineOperations', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const deleteRequest = store.delete(operationId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Handle fetch events for offline functionality
self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Let next-pwa handle other requests
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(OFFLINE_DATA_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(OFFLINE_DATA_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a write operation and we're offline, queue it for background sync
    if (request.method !== 'GET') {
      await queueOfflineOperation(request);
      
      // Return a custom response indicating the operation was queued
      return new Response(
        JSON.stringify({ 
          success: true, 
          queued: true, 
          message: 'Operation queued for when online' 
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return network error for GET requests
    return new Response('Network error', { status: 503 });
  }
}

// Queue offline operation for background sync
async function queueOfflineOperation(request) {
  const operation = {
    id: Date.now() + Math.random(),
    type: request.method,
    endpoint: request.url,
    data: request.method !== 'GET' ? await request.json() : null,
    timestamp: Date.now(),
  };
  
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('OfflineOperations', 1);
    
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const addRequest = store.add(operation);
      
      addRequest.onsuccess = () => {
        // Register background sync
        self.registration.sync.register('background-sync-activities');
        resolve();
      };
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    dbRequest.onerror = () => reject(dbRequest.error);
  });
}

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});