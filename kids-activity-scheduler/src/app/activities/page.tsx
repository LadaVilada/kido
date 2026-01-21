'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ActivityManager } from '@/components/activities';

export default function ActivitiesPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <ActivityManager />
      </div>
    </ProtectedRoute>
  );
}