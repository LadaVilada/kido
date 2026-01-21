// Offline synchronization utilities for PWA functionality

// Type definitions for Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

export interface OfflineOperation {
  id: number;
  type: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  timestamp: number;
}

class OfflineSyncManager {
  private dbName = 'OfflineOperations';
  private dbVersion = 1;
  private storeName = 'operations';

  // Initialize IndexedDB
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Queue an operation for offline sync
  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp'>): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const fullOperation: OfflineOperation = {
      ...operation,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(fullOperation);
      request.onsuccess = () => {
        // Register background sync if service worker is available
        if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then(registration => {
            return (registration as any).sync.register('background-sync-activities');
          }).catch(console.error);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending operations
  async getPendingOperations(): Promise<OfflineOperation[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all pending operations (useful after successful sync)
  async clearPendingOperations(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Check if we're currently online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Listen for online/offline events
  onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();

// Hook for React components to use offline sync
export function useOfflineSync() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = React.useState<OfflineOperation[]>([]);

  React.useEffect(() => {
    // Set up connection change listener
    const cleanup = offlineSyncManager.onConnectionChange(setIsOnline);
    
    // Load pending operations
    offlineSyncManager.getPendingOperations().then(setPendingOperations);
    
    return cleanup;
  }, []);

  const queueOperation = React.useCallback(async (operation: Omit<OfflineOperation, 'id' | 'timestamp'>) => {
    await offlineSyncManager.queueOperation(operation);
    const updated = await offlineSyncManager.getPendingOperations();
    setPendingOperations(updated);
  }, []);

  return {
    isOnline,
    pendingOperations,
    queueOperation,
    syncManager: offlineSyncManager,
  };
}

// Import React for the hook
import React from 'react';