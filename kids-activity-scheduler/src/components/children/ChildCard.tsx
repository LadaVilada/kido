'use client';

import React from 'react';
import { Child } from '@/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { getBackgroundVariant, getBorderVariant } from '@/lib/colorUtils';

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

  const backgroundColor = getBackgroundVariant(child.color);
  const borderColor = getBorderVariant(child.color);

  return (
    <div
      className={`
        relative p-3 sm:p-4 rounded-lg border-2 shadow-sm hover:shadow-md transition-all
        ${className}
      `}
      style={{ 
        backgroundColor,
        borderColor: child.color,
      }}
    >
      {/* Color indicator badge */}
      <div
        className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-sm border-2 border-white"
        style={{ backgroundColor: child.color }}
        title={`Color: ${child.color}`}
      />

      {/* Child name */}
      <div className="pr-8 sm:pr-10">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 break-words">
          {child.name}
        </h3>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-2 sm:mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="flex items-center gap-1 flex-1 touch-target text-xs sm:text-sm bg-white hover:bg-gray-50"
        >
          <Edit className="w-3 h-3" />
          <span className="hidden xs:inline">Edit</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="flex items-center gap-1 flex-1 touch-target text-xs sm:text-sm"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden xs:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
};