'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Child, 
  CreateActivityInput, 
  UpdateActivityInput,
  DAYS_OF_WEEK 
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getTimezoneOptions, getUserTimezone } from '@/lib/dateTimeUtils';
import { getContrastingTextHex, getHoverVariant } from '@/lib/colorUtils';

interface ActivityFormProps {
  children: Child[];
  activity?: Activity;
  onSubmit: (data: CreateActivityInput | UpdateActivityInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormData {
  childId: string;
  title: string;
  location: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
}

interface FormErrors {
  childId?: string;
  title?: string;
  location?: string;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  general?: string;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  children,
  activity,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    childId: activity?.childId || '',
    title: activity?.title || '',
    location: activity?.location || '',
    daysOfWeek: activity?.daysOfWeek || [],
    startTime: activity?.startTime || '',
    endTime: activity?.endTime || '',
    timezone: activity?.timezone || getUserTimezone(),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  // Update form when activity prop changes
  useEffect(() => {
    if (activity) {
      setFormData({
        childId: activity.childId,
        title: activity.title,
        location: activity.location,
        daysOfWeek: activity.daysOfWeek,
        startTime: activity.startTime,
        endTime: activity.endTime,
        timezone: activity.timezone,
      });
    }
  }, [activity]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Child selection validation
    if (!formData.childId) {
      newErrors.childId = 'Please select a child';
    }

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Activity title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Activity title must be at least 2 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Activity title must be less than 100 characters';
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.trim().length < 2) {
      newErrors.location = 'Location must be at least 2 characters';
    } else if (formData.location.trim().length > 200) {
      newErrors.location = 'Location must be less than 200 characters';
    }

    // Days of week validation
    if (formData.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Please select at least one day';
    }

    // Time validation
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Time logic validation
    if (formData.startTime && formData.endTime) {
      const startMinutes = timeToMinutes(formData.startTime);
      const endMinutes = timeToMinutes(formData.endTime);
      
      if (startMinutes >= endMinutes) {
        newErrors.endTime = 'End time must be after start time';
      }
      
      // Check for reasonable duration (at least 15 minutes, max 12 hours)
      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 15) {
        newErrors.endTime = 'Activity must be at least 15 minutes long';
      } else if (durationMinutes > 720) { // 12 hours
        newErrors.endTime = 'Activity cannot be longer than 12 hours';
      }
    }

    // Timezone validation
    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleInputChange = (field: keyof FormData, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDayToggle = (dayValue: number) => {
    const newDays = formData.daysOfWeek.includes(dayValue)
      ? formData.daysOfWeek.filter(day => day !== dayValue)
      : [...formData.daysOfWeek, dayValue].sort();
    
    handleInputChange('daysOfWeek', newDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setErrors({});
      
      const submitData = {
        childId: formData.childId,
        title: formData.title.trim(),
        location: formData.location.trim(),
        daysOfWeek: formData.daysOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        timezone: formData.timezone,
      };

      await onSubmit(submitData);
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to save activity' });
    }
  };

  const getChildDisplayName = (child: Child): string => {
    return child.name;
  };

  const getChildColor = (childId: string): string => {
    const child = children.find(c => c.id === childId);
    return child?.color || '#3b82f6';
  };

  const getButtonStyles = () => {
    if (!formData.childId) return {};
    
    const color = getChildColor(formData.childId);
    const textColor = getContrastingTextHex(color);
    const hoverColor = getHoverVariant(color);
    
    return {
      backgroundColor: color,
      color: textColor,
      borderColor: color,
    };
  };

  const getButtonHoverStyles = () => {
    if (!formData.childId) return {};
    
    const color = getChildColor(formData.childId);
    const hoverColor = getHoverVariant(color);
    const textColor = getContrastingTextHex(hoverColor);
    
    return {
      backgroundColor: hoverColor,
      color: textColor,
    };
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {errors.general && (
        <div className="p-3 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {errors.general}
        </div>
      )}

      {/* Child Selection */}
      <div className="space-y-2">
        <Label htmlFor="childId" className="text-sm sm:text-base">Child *</Label>
        <Select
          value={formData.childId}
          onValueChange={(value) => handleInputChange('childId', value)}
        >
          <SelectTrigger className={`touch-target ${errors.childId ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select a child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: child.color }}
                  />
                  {getChildDisplayName(child)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.childId && (
          <p className="text-xs sm:text-sm text-red-600">{errors.childId}</p>
        )}
      </div>

      {/* Activity Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm sm:text-base">Activity Title *</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Soccer Practice, Piano Lesson"
          className={`touch-target ${errors.title ? 'border-red-500' : ''}`}
          maxLength={100}
        />
        {errors.title && (
          <p className="text-xs sm:text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm sm:text-base">Location *</Label>
        <Input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="e.g., Community Center, 123 Main St"
          className={`touch-target ${errors.location ? 'border-red-500' : ''}`}
          maxLength={200}
        />
        {errors.location && (
          <p className="text-xs sm:text-sm text-red-600">{errors.location}</p>
        )}
      </div>

      {/* Days of Week */}
      <div className="space-y-3">
        <Label className="text-sm sm:text-base">Days of Week *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.value} className="flex items-center space-x-2 touch-target">
              <Checkbox
                id={`day-${day.value}`}
                checked={formData.daysOfWeek.includes(day.value)}
                onCheckedChange={() => handleDayToggle(day.value)}
                className="touch-target"
              />
              <Label 
                htmlFor={`day-${day.value}`}
                className="text-xs sm:text-sm font-normal cursor-pointer"
              >
                {day.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.daysOfWeek && (
          <p className="text-xs sm:text-sm text-red-600">{errors.daysOfWeek}</p>
        )}
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-sm sm:text-base">Start Time *</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
            className={`touch-target ${errors.startTime ? 'border-red-500' : ''}`}
          />
          {errors.startTime && (
            <p className="text-xs sm:text-sm text-red-600">{errors.startTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime" className="text-sm sm:text-base">End Time *</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleInputChange('endTime', e.target.value)}
            className={`touch-target ${errors.endTime ? 'border-red-500' : ''}`}
          />
          {errors.endTime && (
            <p className="text-xs sm:text-sm text-red-600">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-sm sm:text-base">Timezone</Label>
        <Select
          value={formData.timezone}
          onValueChange={(value) => handleInputChange('timezone', value)}
        >
          <SelectTrigger className="touch-target">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getTimezoneOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timezone && (
          <p className="text-xs sm:text-sm text-red-600">{errors.timezone}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 touch-target transition-all"
          style={getButtonStyles()}
          onMouseEnter={(e) => {
            if (formData.childId) {
              const styles = getButtonHoverStyles();
              Object.assign(e.currentTarget.style, styles);
            }
          }}
          onMouseLeave={(e) => {
            if (formData.childId) {
              const styles = getButtonStyles();
              Object.assign(e.currentTarget.style, styles);
            }
          }}
        >
          {isSubmitting ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 touch-target"
        >
          Cancel
        </Button>
      </div>

      {isDirty && (
        <p className="text-xs text-muted-foreground">
          * Required fields
        </p>
      )}
    </form>
  );
};