'use client';

import React, { useState, useEffect } from 'react';
import { ActivityOccurrence } from '@/types';
import { WeekView } from './WeekView';
import { useCalendar } from '@/hooks/useCalendar';

interface CalendarViewProps {
  onActivityClick?: (occurrence: ActivityOccurrence) => void;
  className?: string;
  initialDate?: Date;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onActivityClick,
  className = '',
  initialDate,
}) => {
  const [selectedOccurrence, setSelectedOccurrence] = useState<ActivityOccurrence | null>(null);

  // Use the calendar hook for data management
  const {
    currentDate,
    weekOccurrences,
    isLoading,
    error,
    setCurrentDate,
    refreshData,
  } = useCalendar({
    initialDate,
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
  });

  const handleActivityClick = (occurrence: ActivityOccurrence) => {
    setSelectedOccurrence(occurrence);
    if (onActivityClick) {
      onActivityClick(occurrence);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <div className="text-red-600 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Unable to Load Calendar</h3>
          <p className="text-gray-600">{error}</p>
        </div>
        <button
          onClick={refreshData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className={className}>
      <WeekView
        occurrences={weekOccurrences}
        onActivityClick={handleActivityClick}
        currentDate={currentDate}
        onDateChange={handleDateChange}
      />
      
      {/* Activity details modal */}
      {selectedOccurrence && (
        <ActivityDetailsModal
          occurrence={selectedOccurrence}
          onClose={() => setSelectedOccurrence(null)}
        />
      )}
    </div>
  );
};

// Loading skeleton component
const CalendarSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-200 rounded w-8"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="flex">
        {/* Time column */}
        <div className="w-16 border-r">
          <div className="h-12 border-b"></div>
          {Array.from({ length: 17 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="flex-1 grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, dayIndex) => (
            <div key={dayIndex} className="border-r last:border-r-0">
              {/* Day header */}
              <div className="h-12 border-b flex flex-col items-center justify-center space-y-1">
                <div className="h-3 bg-gray-200 rounded w-6"></div>
                <div className="h-4 bg-gray-200 rounded w-4"></div>
              </div>

              {/* Day content with random activity blocks */}
              <div className="relative" style={{ height: `${17 * 64}px` }}>
                {Array.from({ length: 17 }).map((_, index) => (
                  <div
                    key={index}
                    className="absolute w-full border-b border-gray-100"
                    style={{ top: `${index * 64}px`, height: '64px' }}
                  />
                ))}
                
                {/* Random skeleton activity blocks */}
                {dayIndex < 5 && Math.random() > 0.3 && (
                  <div
                    className="absolute left-1 right-1 z-10"
                    style={{
                      top: `${Math.floor(Math.random() * 10) * 64 + 8}px`,
                      height: `${(Math.floor(Math.random() * 3) + 1) * 64 - 16}px`,
                    }}
                  >
                    <div className="h-full bg-gray-200 rounded-md p-2">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Activity details modal component
interface ActivityDetailsModalProps {
  occurrence: ActivityOccurrence;
  onClose: () => void;
}

const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({
  occurrence,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Activity Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity
            </label>
            <p className="text-gray-900">{occurrence.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Child
            </label>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: occurrence.childColor }}
              ></div>
              <p className="text-gray-900">{occurrence.childName}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time
            </label>
            <p className="text-gray-900">
              {occurrence.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-gray-600 text-sm">
              {occurrence.startDateTime.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })} - {occurrence.endDateTime.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>

          {occurrence.location && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <p className="text-gray-900">{occurrence.location}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};