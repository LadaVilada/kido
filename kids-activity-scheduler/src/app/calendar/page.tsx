'use client';

import React from 'react';
import { CalendarViewToggle } from '@/components/calendar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ActivityOccurrence } from '@/types';

export default function CalendarPage() {
  const handleActivityClick = (occurrence: ActivityOccurrence) => {
    console.log('Activity clicked:', occurrence);
    // This could navigate to an activity detail page or open a modal
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Family Calendar
            </h1>
            <p className="mt-2 text-gray-600">
              View and manage your children's activities
            </p>
          </div>

          <CalendarViewToggle
            onActivityClick={handleActivityClick}
            className="w-full"
            defaultView="week"
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}