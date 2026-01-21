'use client';

import React from 'react';
import { Child } from '@/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface ChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (child: Child) => void;
  className?: string;
}

export const ChildCard: React.FC<ChildCardProps> = ({
  child,
  onEdit,
  onDelete,
  className = '',
}) => {
  const handleEdit = () => {
    onEdit(child);
  };

  const handleDelete = () => {
    onDelete(child);
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow
        ${className}
      `}
      style={{ borderColor: child.color }}
    >
      {/* Color indicator */}
      <div
        className="absolute top-2 right-2 w-4 h-4 rounded-full"
        style={{ backgroundColor: child.color }}
        title={`Color: ${child.color}`}
      />

      {/* Child name */}
      <div className="pr-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {child.name}
        </h3>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="flex items-center gap-1"
        >
          <Edit className="w-3 h-3" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </Button>
      </div>
    </div>
  );
};