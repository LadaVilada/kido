'use client';

import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { FamilySettings } from '@/components/family';
import { useAuthState } from '@/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user, loading } = useAuthState();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'family' | 'notifications'>('family');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your family and notification preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('family')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'family'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Family
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Notifications
        </button>
      </div>

      {/* Content */}
      {activeTab === 'family' && <FamilySettings />}
      {activeTab === 'notifications' && <NotificationSettings />}
    </div>
  );
}
