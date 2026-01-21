'use client';

import React, { useState } from 'react';
import { Child, CreateChildInput, UpdateChildInput } from '@/types';
import { useChildren } from '@/hooks/useChildren';
import { ChildCard } from './ChildCard';
import { ChildForm } from './ChildForm';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Children ({children.length})
          </h2>
        </div>
        <Button onClick={handleAddChild} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Child
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Children grid */}
      {children.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No children added yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first child to start managing their activities
          </p>
          <Button onClick={handleAddChild} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Child
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Child</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this child? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDelete(deleteConfirm)}
                className="flex-1"
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