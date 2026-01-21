'use client';

import React, { useState } from 'react';
import { Child, CreateChildInput, UpdateChildInput } from '@/types';
import { useChildren } from '@/hooks/useChildren';
import { ChildCard } from './ChildCard';
import { ChildForm } from './ChildForm';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage, EmptyState } from '@/components/common/ErrorMessage';

interface ChildListProps {
  className?: string;
}

export const ChildList: React.FC<ChildListProps> = ({ className = '' }) => {
  const {
    children,
    isLoading,
    error,
    createChild,
    updateChild,
    deleteChild,
    getAvailableColors,
  } = useChildren();

  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load available colors when form is opened
  const handleAddChild = async () => {
    try {
      const colors = await getAvailableColors();
      setAvailableColors(colors);
      setEditingChild(null);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading available colors:', error);
    }
  };

  const handleEditChild = async (child: Child) => {
    try {
      const colors = await getAvailableColors(child.id);
      setAvailableColors(colors);
      setEditingChild(child);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading available colors:', error);
    }
  };

  const handleDeleteChild = (child: Child) => {
    setDeleteConfirm(child.id);
  };

  const confirmDelete = async (childId: string) => {
    try {
      await deleteChild(childId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting child:', error);
      // Error is handled by the hook and displayed in the error state
    }
  };

  const handleFormSubmit = async (data: CreateChildInput | UpdateChildInput) => {
    setIsSubmitting(true);
    try {
      if (editingChild) {
        await updateChild(editingChild.id, data as UpdateChildInput);
      } else {
        await createChild(data as CreateChildInput);
      }
      setShowForm(false);
      setEditingChild(null);
    } catch (error) {
      // Error will be thrown and handled by the form
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingChild(null);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" text="Loading children..." />
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Children ({children.length})
          </h2>
        </div>
        <Button onClick={handleAddChild} className="flex items-center gap-2 w-full sm:w-auto touch-target">
          <Plus className="w-4 h-4" />
          Add Child
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <ErrorMessage
          type="error"
          title="Error loading children"
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Children grid */}
      {children.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />}
          title="No children added yet"
          description="Add your first child to start managing their activities"
          action={{
            label: 'Add Your First Child',
            onClick: handleAddChild,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onEdit={handleEditChild}
              onDelete={handleDeleteChild}
            />
          ))}
        </div>
      )}

      {/* Child form modal */}
      {showForm && (
        <ChildForm
          child={editingChild || undefined}
          availableColors={availableColors}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Delete Child</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to delete this child? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 touch-target"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDelete(deleteConfirm)}
                className="flex-1 touch-target"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};