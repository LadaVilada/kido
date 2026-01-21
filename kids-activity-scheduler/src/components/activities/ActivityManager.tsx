'use client';

import React, { useState } from 'react';
import { Activity, Child, CreateActivityInput, UpdateActivityInput } from '@/types';
import { useActivities } from '@/hooks/useActivities';
import { useChildren } from '@/hooks/useChildren';
import { ActivityForm } from './ActivityForm';
import { ActivityList } from './ActivityList';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';

interface ActivityManagerProps {
  className?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export const ActivityManager: React.FC<ActivityManagerProps> = ({
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    activities,
    isLoading: activitiesLoading,
    error: activitiesError,
    createActivity,
    updateActivity,
    deleteActivity,
    checkTimeConflicts,
  } = useActivities();

  const {
    children,
    isLoading: childrenLoading,
    error: childrenError,
  } = useChildren();

  const isLoading = activitiesLoading || childrenLoading;
  const error = activitiesError || childrenError;

  const handleCreateActivity = async (data: CreateActivityInput | UpdateActivityInput) => {
    // Ensure we have all required fields for creation
    const createData = data as CreateActivityInput;
    
    try {
      // Check for time conflicts
      const conflicts = await checkTimeConflicts(createData);
      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(conflict => {
          const child = children.find(c => c.id === conflict.childId);
          return `${conflict.title} (${child?.name}) on the same days`;
        });
        
        const proceed = window.confirm(
          `This activity conflicts with:\n${conflictMessages.join('\n')}\n\nDo you want to create it anyway?`
        );
        
        if (!proceed) {
          return;
        }
      }

      await createActivity(createData);
      setViewMode('list');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create activity');
    }
  };

  const handleUpdateActivity = async (data: CreateActivityInput | UpdateActivityInput) => {
    if (!editingActivity) return;

    // Ensure we have the update data format
    const updateData = data as UpdateActivityInput;

    try {
      // Check for time conflicts (excluding the current activity)
      const conflicts = await checkTimeConflicts(updateData, editingActivity.id);
      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(conflict => {
          const child = children.find(c => c.id === conflict.childId);
          return `${conflict.title} (${child?.name}) on the same days`;
        });
        
        const proceed = window.confirm(
          `This activity conflicts with:\n${conflictMessages.join('\n')}\n\nDo you want to update it anyway?`
        );
        
        if (!proceed) {
          return;
        }
      }

      await updateActivity(editingActivity.id, updateData);
      setEditingActivity(null);
      setViewMode('list');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update activity');
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setViewMode('edit');
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (deleteConfirm === activityId) {
      try {
        await deleteActivity(activityId);
        setDeleteConfirm(null);
      } catch (error: any) {
        alert(error.message || 'Failed to delete activity');
      }
    } else {
      setDeleteConfirm(activityId);
      // Auto-clear confirmation after 5 seconds
      setTimeout(() => {
        setDeleteConfirm(null);
      }, 5000);
    }
  };

  const handleCancel = () => {
    setEditingActivity(null);
    setViewMode('list');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Error loading activities</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Show message if no children exist
  if (children.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No children profiles found
          </h3>
          <p className="text-gray-600 mb-4">
            You need to create at least one child profile before adding activities.
          </p>
          <Button
            onClick={() => window.location.href = '/children'}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Child Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'create' ? 'Create Activity' : 
             viewMode === 'edit' ? 'Edit Activity' : 'Activities'}
          </h2>
          {viewMode === 'list' && (
            <p className="text-gray-600 mt-1">
              Manage your children's activities and schedules
            </p>
          )}
        </div>

        {viewMode === 'list' && (
          <Button
            onClick={() => setViewMode('create')}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        )}
      </div>

      {/* Content */}
      {viewMode === 'create' && (
        <div className="max-w-2xl">
          <ActivityForm
            children={children}
            onSubmit={handleCreateActivity}
            onCancel={handleCancel}
          />
        </div>
      )}

      {viewMode === 'edit' && editingActivity && (
        <div className="max-w-2xl">
          <ActivityForm
            children={children}
            activity={editingActivity}
            onSubmit={handleUpdateActivity}
            onCancel={handleCancel}
          />
        </div>
      )}

      {viewMode === 'list' && (
        <ActivityList
          activities={activities}
          children={children}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => handleDeleteActivity(deleteConfirm)}
                className="flex-1"
              >
                Delete Activity
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};