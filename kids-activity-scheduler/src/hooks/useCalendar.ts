'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ActivityOccurrence } from '@/types';
import { useActivities } from './useActivities';
import { useChildren } from './useChildren';
import { 
  getWeekStartDate, 
  getWeekEndDate, 
  getOccurrencesForWeek,
  getOccurrencesForDate,
  generateActivityOccurrences
} from '@/lib/activityOccurrences';

interface UseCalendarOptions {
  initialDate?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseCalendarReturn {
  // Current state
  currentDate: Date;
  weekStart: Date;
  weekEnd: Date;
  
  // Data
  occurrences: ActivityOccurrence[];
  weekOccurrences: ActivityOccurrence[];
  dayOccurrences: ActivityOccurrence[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Navigation
  setCurrentDate: (date: Date) => void;
  navigateToToday: () => void;
  navigateWeek: (direction: 'prev' | 'next') => void;
  navigateDay: (direction: 'prev' | 'next') => void;
  
  // Data refresh
  refreshData: () => Promise<void>;
  
  // Utilities
  getOccurrencesForDateRange: (startDate: Date, endDate: Date) => ActivityOccurrence[];
}

export const useCalendar = (options: UseCalendarOptions = {}): UseCalendarReturn => {
  const {
    initialDate = new Date(),
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [currentDate, setCurrentDate] = useState(initialDate);
  
  // Fetch activities and children data
  const { 
    activities, 
    isLoading: activitiesLoading, 
    error: activitiesError,
    refreshActivities
  } = useActivities();
  
  const { 
    children, 
    isLoading: childrenLoading, 
    error: childrenError,
    refreshChildren
  } = useChildren();

  // Calculate date ranges
  const weekStart = useMemo(() => getWeekStartDate(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEndDate(currentDate), [currentDate]);

  // Generate occurrences
  const occurrences = useMemo(() => {
    if (activities.length === 0 || children.length === 0) {
      return [];
    }
    
    // Generate occurrences for a wider range to support navigation
    const rangeStart = new Date(weekStart);
    rangeStart.setDate(rangeStart.getDate() - 14); // 2 weeks before
    
    const rangeEnd = new Date(weekEnd);
    rangeEnd.setDate(rangeEnd.getDate() + 14); // 2 weeks after
    
    return generateActivityOccurrences(activities, children, rangeStart, rangeEnd);
  }, [activities, children, weekStart, weekEnd]);

  // Filter occurrences for current week
  const weekOccurrences = useMemo(() => {
    return occurrences.filter(occurrence => {
      const occurrenceDate = occurrence.date;
      return occurrenceDate >= weekStart && occurrenceDate <= weekEnd;
    });
  }, [occurrences, weekStart, weekEnd]);

  // Filter occurrences for current day
  const dayOccurrences = useMemo(() => {
    const currentDateString = currentDate.toDateString();
    return occurrences.filter(occurrence => 
      occurrence.date.toDateString() === currentDateString
    );
  }, [occurrences, currentDate]);

  // Loading and error states
  const isLoading = activitiesLoading || childrenLoading;
  const error = activitiesError || childrenError;

  // Navigation functions
  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  }, []);

  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, []);

  // Data refresh function
  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        refreshActivities(),
        refreshChildren()
      ]);
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
    }
  }, [refreshActivities, refreshChildren]);

  // Utility function to get occurrences for any date range
  const getOccurrencesForDateRange = useCallback((
    startDate: Date, 
    endDate: Date
  ): ActivityOccurrence[] => {
    if (activities.length === 0 || children.length === 0) {
      return [];
    }
    
    return generateActivityOccurrences(activities, children, startDate, endDate);
  }, [activities, children]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if we're not currently loading
      if (!isLoading) {
        refreshData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isLoading, refreshData]);

  // Update current date when initialDate changes (only if it's actually different)
  useEffect(() => {
    // Only update if the date is actually different (compare timestamps)
    if (initialDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(initialDate);
    }
  }, [initialDate.getTime()]); // Use timestamp to avoid infinite loop

  return {
    // Current state
    currentDate,
    weekStart,
    weekEnd,
    
    // Data
    occurrences,
    weekOccurrences,
    dayOccurrences,
    
    // Loading states
    isLoading,
    error,
    
    // Navigation
    setCurrentDate,
    navigateToToday,
    navigateWeek,
    navigateDay,
    
    // Data refresh
    refreshData,
    
    // Utilities
    getOccurrencesForDateRange,
  };
};