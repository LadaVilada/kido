'use client';

import React, { useState, useEffect } from 'react';
import { Child, CreateChildInput, UpdateChildInput, CHILD_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface ChildFormProps {
  child?: Child; // If provided, form is in edit mode
  availableColors: string[];
  onSubmit: (data: CreateChildInput | UpdateChildInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ChildForm: React.FC<ChildFormProps> = ({
  child,
  availableColors,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [name, setName] = useState(child?.name || '');
  const [selectedColor, setSelectedColor] = useState(child?.color || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!child;

  // Reset form when child changes
  useEffect(() => {
    setName(child?.name || '');
    setSelectedColor(child?.color || '');
    setErrors({});
  }, [child]);

  // Include current child's color in available colors for edit mode
  const colorOptions = isEditMode && child?.color
    ? [...availableColors, child.color]
    : availableColors;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Child name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Child name must be at least 2 characters';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Child name must be less than 50 characters';
    }

    if (!selectedColor) {
      newErrors.color = 'Please select a color';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const formData = {
        name: name.trim(),
        color: selectedColor,
      };

      await onSubmit(formData);
    } catch (error: any) {
      setErrors({ submit: error.message });
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (errors.color) {
      setErrors(prev => ({ ...prev, color: '' }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit Child' : 'Add New Child'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="child-name">Child Name</Label>
            <Input
              id="child-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter child's name"
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Color selection */}
          <div className="space-y-3">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  disabled={isSubmitting}
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all
                    ${selectedColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                    }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color}</p>
            )}
            {colorOptions.length === 0 && (
              <p className="text-sm text-amber-600">
                All colors are currently in use. You may need to delete a child first.
              </p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || colorOptions.length === 0}
              className="flex-1"
            >
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Adding...') 
                : (isEditMode ? 'Update Child' : 'Add Child')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};