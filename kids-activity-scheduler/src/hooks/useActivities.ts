'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Child,
  CreateActivityInput, 
  UpdateActivityInput, 
  LoadingState,
  ActivityOccurrence
} from '@/types';
import { ActivitiesService } from '@/services/activitiesService';
import { generateActivityOccurrences } from '@/lib/activityOccurrences';
import { useAuthState } from './useAuthState';

interface UseActivitiesReturn extends LoadingState {
  activities: Activity[];
  createActivity: (input: CreateActivityInput) => Promise<string>;
  updateActivity: (activityId: string, input: UpdateActivityInput) => Promise<void>;
  deleteActivity: (activityId: string) => Promise<void>;
  checkTimeConflicts: (
    input: CreateActivityInput | UpdateActivityInput,
    excludeActivityId?: string
  ) => Promise<Activity[]>;
  getActivitiesWithChildren: () => Promise<(Activity & { child: Child })[]>;
  getActivityStats: () => Promise<{
    totalActivities: number;
    activitiesPerChild: Record<string, number>;
    activitiesPerDay: Record<number, number>;
    totalWeeklyHours: number;
  }>;
  refreshActivities: () => Promise<void>;
}

/**
 * Custom hook for managing activities data
 */
export const useActivities = (): UseActivitiesReturn => {
  const { user } = useAuthState();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.userId) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = ActivitiesService.subscribeToActivities(
      user.userId,
      (updatedActivities) => {
        setActivities(updatedActivities);
        setIsLoading(false);
        setError(null);
      }
    );

    return unsubscribe;
  }, [user?.userId]);

  const createActivity = useCallback(async (input: CreateActivityInput): Promise<string> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      const activityId = await ActivitiesService.createActivity(user.userId, input);
      return activityId;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [user?.userId]);

  const updateActivity = useCallback(async (
    activityId: string, 
    input: UpdateActivityInput
  ): Promise<void> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await ActivitiesService.updateActivity(activityId, user.userId, input);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [user?.userId]);

  const deleteActivity = useCallback(async (activityId: string): Promise<void> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await ActivitiesService.deleteActivity(activityId, user.userId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [user?.userId]);

  const checkTimeConflicts = useCallback(async (
    input: CreateActivityInput | UpdateActivityInput,
    excludeActivityId?: string
  ): Promise<Activity[]> => {
    if (!user?.userId) {
      return [];
    }

    try {
      return await ActivitiesService.checkTimeConflicts(
        user.userId, 
        input, 
        excludeActivityId
      );
    } catch (error: any) {
      console.error('Error checking time conflicts:', error);
      return [];
    }
  }, [user?.userId]);

  const getActivitiesWithChildren = useCallback(async (): Promise<(Activity & { child: Child })[]> => {
    if (!user?.userId) {
      return [];
    }

    try {
      return await ActivitiesService.getActivitiesWithChildren(user.userId);
    } catch (error: any) {
      console.error('Error getting activities with children:', error);
      return [];
    }
  }, [user?.userId]);

  const getActivityStats = useCallback(async () => {
    if (!user?.userId) {
      return {
        totalActivities: 0,
        activitiesPerChild: {},
        activitiesPerDay: {},
        totalWeeklyHours: 0,
      };
    }

    try {
      return await ActivitiesService.getActivityStats(user.userId);
    } catch (error: any) {
      console.error('Error getting activity stats:', error);
      return {
        totalActivities: 0,
        activitiesPerChild: {},
        activitiesPerDay: {},
        totalWeeklyHours: 0,
      };
    }
  }, [user?.userId]);

  const refreshActivities = useCallback(async (): Promise<void> => {
    if (!user?.userId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const updatedActivities = await ActivitiesService.getActivitiesByUser(user.userId);
      setActivities(updatedActivities);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  return {
    activities,
    isLoading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    checkTimeConflicts,
    getActivitiesWithChildren,
    getActivityStats,
    refreshActivities,
  };
};

/**
 * Custom hook for managing activity occurrences
 */
export const useActivityOccurrences = (
  activities: Activity[],
  children: Child[]
) => {
  const [occurrences, setOccurrences] = useState<ActivityOccurrence[]>([]);

  const generateOccurrences = useCallback((
    startDate: Date,
    endDate: Date
  ): ActivityOccurrence[] => {
    return generateActivityOccurrences(activities, children, startDate, endDate);
  }, [activities, children]);

  const getOccurrencesForDateRange = useCallback((
    startDate: Date,
    endDate: Date
  ) => {
    const newOccurrences = generateOccurrences(startDate, endDate);
    setOccurrences(newOccurrences);
    return newOccurrences;
  }, [generateOccurrences]);

  return {
    occurrences,
    generateOccurrences,
    getOccurrencesForDateRange,
  };
};