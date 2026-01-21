'use client';

import { useState, useEffect, useCallback } from 'react';
import { Child, CreateChildInput, UpdateChildInput, LoadingState } from '@/types';
import { ChildrenService } from '@/services/childrenService';
import { useAuthState } from './useAuthState';

interface UseChildrenReturn extends LoadingState {
  children: Child[];
  createChild: (input: CreateChildInput) => Promise<string>;
  updateChild: (childId: string, input: UpdateChildInput) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  getAvailableColors: (excludeChildId?: string) => Promise<string[]>;
  refreshChildren: () => Promise<void>;
}

/**
 * Custom hook for managing children data
 */
export const useChildren = (): UseChildrenReturn => {
  const { user } = useAuthState();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.userId) {
      setChildren([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = ChildrenService.subscribeToChildren(
      user.userId,
      (updatedChildren) => {
        setChildren(updatedChildren);
        setIsLoading(false);
        setError(null);
      }
    );

    return unsubscribe;
  }, [user?.userId]);

  const createChild = useCallback(async (input: CreateChildInput): Promise<string> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      const childId = await ChildrenService.createChild(user.userId, input);
      return childId;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [user?.userId]);

  const updateChild = useCallback(async (
    childId: string, 
    input: UpdateChildInput
  ): Promise<void> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await ChildrenService.updateChild(childId, user.userId, input);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [user?.userId]);

  const deleteChild = useCallback(async (childId: string): Promise<void> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await ChildrenService.deleteChild(childId, user.userId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [user?.userId]);

  const getAvailableColors = useCallback(async (
    excludeChildId?: string
  ): Promise<string[]> => {
    if (!user?.userId) {
      return [];
    }

    try {
      return await ChildrenService.getAvailableColors(user.userId, excludeChildId);
    } catch (error: any) {
      console.error('Error getting available colors:', error);
      return [];
    }
  }, [user?.userId]);

  const refreshChildren = useCallback(async (): Promise<void> => {
    if (!user?.userId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const updatedChildren = await ChildrenService.getChildrenByUser(user.userId);
      setChildren(updatedChildren);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  return {
    children,
    isLoading,
    error,
    createChild,
    updateChild,
    deleteChild,
    getAvailableColors,
    refreshChildren,
  };
};