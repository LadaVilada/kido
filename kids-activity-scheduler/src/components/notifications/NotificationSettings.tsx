'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { useNotifications } from '@/hooks/useNotifications';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';

export function NotificationSettings() {
  const { user } = useAuthState();
  const { isSupported, permission, requestPermission, isLoading } = useNotifications();
  const [settings, setSettings] = useState({
    oneHour: true,
    thirtyMinutes: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load user's notification settings
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          if (userData.notificationSettings) {
            setSettings(userData.notificationSettings);
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [user]);

  // Save notification settings
  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.userId), {
        notificationSettings: settings,
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle permission request
  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      alert('Notification permission was denied. Please enable notifications in your browser settings.');
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <BellOff className="h-5 w-5" />
          <p>Push notifications are not supported in this browser.</p>
        </div>
      </div>
    );
  }

  if (loadingSettings) {
    return (
      <div className="rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div className="rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-sm text-gray-600">
                {permission === 'granted' && 'Notifications are enabled'}
                {permission === 'denied' && 'Notifications are blocked'}
                {permission === 'default' && 'Notifications are not enabled'}
              </p>
            </div>
          </div>
          {permission !== 'granted' && (
            <Button
              onClick={handleRequestPermission}
              disabled={isLoading || permission === 'denied'}
              variant="outline"
            >
              {permission === 'denied' ? 'Blocked' : 'Enable'}
            </Button>
          )}
        </div>

        {permission === 'denied' && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
            Notifications are blocked. To enable them, please update your browser settings.
          </div>
        )}
      </div>

      {/* Notification Timing Settings */}
      {permission === 'granted' && (
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="mb-4 font-medium">Reminder Timing</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="oneHour" className="cursor-pointer">
                <div>
                  <div className="font-medium">1 hour before</div>
                  <div className="text-sm text-gray-600">
                    Get notified 1 hour before activities start
                  </div>
                </div>
              </Label>
              <input
                type="checkbox"
                id="oneHour"
                checked={settings.oneHour}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, oneHour: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="thirtyMinutes" className="cursor-pointer">
                <div>
                  <div className="font-medium">30 minutes before</div>
                  <div className="text-sm text-gray-600">
                    Get notified 30 minutes before activities start
                  </div>
                </div>
              </Label>
              <input
                type="checkbox"
                id="thirtyMinutes"
                checked={settings.thirtyMinutes}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    thirtyMinutes: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">About Notifications</p>
        <p className="mt-1">
          You'll receive reminders for activities happening within the next 24 hours.
          Notifications will only be sent for the times you've enabled above.
        </p>
      </div>
    </div>
  );
}
