'use client';

import React, { useState } from 'react';
import { Activity, Child, DAYS_OF_WEEK } from '@/types';
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
import { Trash2, Edit, Search, Filter, AlertTriangle, Clock, MapPin, Calendar } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  children: Child[];
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FilterOptions {
  childId: string;
  searchTerm: string;
  dayOfWeek: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  children,
  onEdit,
  onDelete,
  isLoading = false,
  error = null,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    childId: '',
    searchTerm: '',
    dayOfWeek: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Create a map of children for quick lookup
  const childrenMap = new Map(children.map(child => [child.id, child]));

  // Filter activities based on current filters
  const filteredActivities = activities.filter(activity => {
    const child = childrenMap.get(activity.childId);
    if (!child) return false;

    // Child filter
    if (filters.childId && activity.childId !== filters.childId) {
      return false;
    }

    // Search term filter (title or location)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const titleMatch = activity.title.toLowerCase().includes(searchLower);
      const locationMatch = activity.location.toLowerCase().includes(searchLower);
      const childMatch = child.name.toLowerCase().includes(searchLower);
      
      if (!titleMatch && !locationMatch && !childMatch) {
        return false;
      }
    }

    // Day of week filter
    if (filters.dayOfWeek) {
      const dayValue = parseInt(filters.dayOfWeek);
      if (!activity.daysOfWeek.includes(dayValue)) {
        return false;
      }
    }

    return true;
  });

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      childId: '',
      searchTerm: '',
      dayOfWeek: '',
    });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDays = (daysOfWeek: number[]): string => {
    if (daysOfWeek.length === 7) {
      return 'Every day';
    }
    
    const dayNames = daysOfWeek
      .sort()
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.short || '')
      .filter(Boolean);
    
    return dayNames.join(', ');
  };

  const getActivityDuration = (startTime: string, endTime: string): string => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const hasActiveFilters = filters.childId || filters.searchTerm || filters.dayOfWeek;

  const handleDelete = async (activityId: string) => {
    if (deleteConfirm === activityId) {
      try {
        setIsDeleting(activityId);
        await onDelete(activityId);
        setDeleteConfirm(null);
      } catch (error: unknown) {
        console.error('Error deleting activity:', error);
        // Error handling is managed by parent component
      } finally {
        setIsDeleting(null);
      }
    } else {
      setDeleteConfirm(activityId);
      // Auto-clear confirmation after 5 seconds
      setTimeout(() => {
        setDeleteConfirm(null);
      }, 5000);
    }
  };

  const handleEdit = (activity: Activity) => {
    try {
      onEdit(activity);
    } catch (error: unknown) {
      console.error('Error editing activity:', error);
    }
  };

  const validateActivityData = (activity: Activity): string[] => {
    const issues: string[] = [];
    
    if (!activity.title?.trim()) {
      issues.push('Missing title');
    }
    
    if (!activity.location?.trim()) {
      issues.push('Missing location');
    }
    
    if (!activity.daysOfWeek?.length) {
      issues.push('No days selected');
    }
    
    if (!activity.startTime || !activity.endTime) {
      issues.push('Missing time information');
    }
    
    return issues;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Loading activities...</span>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
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

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activities, locations, or children..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {[filters.childId, filters.dayOfWeek].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filter by Child</Label>
                <Select
                  value={filters.childId}
                  onValueChange={(value) => handleFilterChange('childId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All children" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All children</SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: child.color }}
                          />
                          {child.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filter by Day</Label>
                <Select
                  value={filters.dayOfWeek}
                  onValueChange={(value) => handleFilterChange('dayOfWeek', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All days</SelectItem>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-sm"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {activities.length === 0 ? (
            <div>
              <p className="text-lg font-medium mb-2">No activities yet</p>
              <p>Create your first activity to get started!</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">No activities match your filters</p>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const child = childrenMap.get(activity.childId);
            if (!child) return null;

            const validationIssues = validateActivityData(activity);
            const hasIssues = validationIssues.length > 0;
            const isBeingDeleted = isDeleting === activity.id;
            const showDeleteConfirm = deleteConfirm === activity.id;

            return (
              <div
                key={activity.id}
                className={`p-4 border rounded-lg transition-all ${
                  hasIssues ? 'border-yellow-300 bg-yellow-50' : 'hover:shadow-md'
                } ${isBeingDeleted ? 'opacity-50' : ''}`}
                style={{
                  borderLeftColor: child.color,
                  borderLeftWidth: '4px',
                }}
              >
                {/* Validation Issues Warning */}
                {hasIssues && (
                  <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Activity has issues:</span>
                    </div>
                    <ul className="text-yellow-700 mt-1 ml-6 list-disc">
                      {validationIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: child.color }}
                      />
                      <h3 className="font-semibold text-lg truncate">
                        {activity.title || 'Untitled Activity'}
                      </h3>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium min-w-[60px]">Child:</span>
                        <span>{child.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium min-w-[60px]">Location:</span>
                        <span className="truncate">{activity.location || 'No location specified'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium min-w-[60px]">Schedule:</span>
                        <span>{formatDays(activity.daysOfWeek)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium min-w-[60px]">Time:</span>
                        <span>
                          {activity.startTime && activity.endTime ? (
                            `${formatTime(activity.startTime)} - ${formatTime(activity.endTime)} (${getActivityDuration(activity.startTime, activity.endTime)})`
                          ) : (
                            'Time not specified'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {showDeleteConfirm ? (
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                          disabled={isBeingDeleted}
                          className="flex items-center gap-1"
                        >
                          {isBeingDeleted ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Confirm Delete
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                          disabled={isBeingDeleted}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(activity)}
                          disabled={isBeingDeleted}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                          disabled={isBeingDeleted}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Summary */}
      {activities.length > 0 && (
        <div className="text-sm text-gray-500 text-center pt-4 border-t">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      )}
    </div>
  );
};