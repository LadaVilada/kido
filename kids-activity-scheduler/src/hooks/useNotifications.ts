import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '@/services/notificationService';
import { useAuthState } from './useAuthState';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useNotifications() {
  const { user } = useAuthState();
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: 'default',
    isInitialized: false,
    isLoading: false,
    error: null,
  });

  // Check support and permission on mount
  useEffect(() => {
    const isSupported = NotificationService.isSupported();
    const permission = NotificationService.getPermissionStatus();

    setState((prev) => ({
      ...prev,
      isSupported,
      permission,
    }));
  }, []);

  // Initialize notifications when user is available
  useEffect(() => {
    if (!user || !state.isSupported) return;

    const initializeNotifications = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const initialized = await NotificationService.initialize(user.userId);
        setState((prev) => ({
          ...prev,
          isInitialized: initialized,
          isLoading: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    };

    initializeNotifications();
  }, [user, state.isSupported]);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const granted = await NotificationService.requestAndInitialize(user.userId);

      setState((prev) => ({
        ...prev,
        permission: NotificationService.getPermissionStatus(),
        isInitialized: granted,
        isLoading: false,
      }));

      return granted;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
      return false;
    }
  }, [user]);

  // Set up foreground message listener
  useEffect(() => {
    if (!state.isInitialized) return;

    const unsubscribe = NotificationService.onForegroundMessage((payload) => {
      // Show notification when app is in foreground
      const { notification } = payload;
      if (notification) {
        NotificationService.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: payload.data?.activityId,
          requireInteraction: true,
          data: payload.data,
        });
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [state.isInitialized]);

  return {
    ...state,
    requestPermission,
  };
}
