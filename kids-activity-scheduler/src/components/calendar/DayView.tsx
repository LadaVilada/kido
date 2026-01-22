'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ActivityOccurrence, DAYS_OF_WEEK } from '@/types';
import { ActivityBlock } from './ActivityBlock';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  detectOverlaps, 
  calculateLayout, 
  getActivityLayout,
  getAllOverflowActivities
} from '@/lib/calendarLayout';
import { useDebouncedCallback } from '@/hooks/useDebounce';

/**
 * Props for the DayView component
 * 
 * @property occurrences - Array of activity occurrences to display
 * @property onActivityClick - Optional callback when an activity is clicked
 * @property currentDate - Optional date to display (defaults to today)
 * @property onDateChange - Optional callback when the displayed date changes
 * @property className - Optional additional CSS classes
 */
interface DayViewProps {
  occurrences: ActivityOccurrence[];
  onActivityClick?: (occurrence: ActivityOccurrence) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
}

/**
 * DayView Component
 * 
 * Displays a single-day calendar view with automatic overlap detection and side-by-side
 * layout for concurrent activities. Uses the same layout algorithm as WeekView for
 * consistent behavior.
 * 
 * Features:
 * - Automatic overlap detection for the selected day
 * - Side-by-side layout for up to 4 concurrent activities
 * - "+N more" indicator for overflow activities (more than 4)
 * - Horizontal scroll on mobile for overlapping activities
 * - Current time indicator (red line) when viewing today
 * - Day navigation (previous/next/today)
 * - Responsive design (mobile/tablet/desktop)
 * - Performance optimized with memoization
 * 
 * @example
 * <DayView
 *   occurrences={activities}
 *   onActivityClick={handleActivityClick}
 *   currentDate={new Date()}
 *   onDateChange={handleDateChange}
 * />
 */
export const DayView: React.FC<DayViewProps> = ({
  occurrences,
  onActivityClick,
  currentDate = new Date(),
  onDateChange,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Debounced window resize handler
  const handleResize = useDebouncedCallback(() => {
    setWindowWidth(window.innerWidth);
  }, 150);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Filter occurrences for the selected date
  const dayOccurrences = useMemo(() => {
    const selectedDateString = selectedDate.toDateString();
    return occurrences
      .filter(occurrence => occurrence.date.toDateString() === selectedDateString)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  }, [occurrences, selectedDate]);

  // Calculate layouts for the day
  const dayLayouts = useMemo(() => {
    if (dayOccurrences.length === 0) {
      return [];
    }
    
    // Detect overlaps for this day
    const overlapGroups = detectOverlaps(dayOccurrences);
    
    // Calculate layout with max 4 columns
    return calculateLayout(overlapGroups, 4);
  }, [dayOccurrences]);

  // Time slots for the grid (5 AM to 11 PM with 30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 5; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const totalMinutes = hour * 60 + minute;
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'AM' : 'PM';
        const minuteStr = minute === 0 ? '00' : minute.toString();
        
        slots.push({
          hour,
          minute,
          totalMinutes,
          label: minute === 0 ? `${displayHour} ${period}` : `${displayHour}:${minuteStr} ${period}`,
          isHour: minute === 0,
        });
      }
    }
    return slots;
  }, []);

  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
    
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [selectedDate, onDateChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    
    if (onDateChange) {
      onDateChange(today);
    }
  }, [onDateChange]);

  const formatDate = () => {
    const dayOfWeek = DAYS_OF_WEEK[selectedDate.getDay()];
    return {
      dayName: dayOfWeek.label,
      dateString: selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  };

  const getActivityPosition = useCallback((occurrence: ActivityOccurrence) => {
    const startMinutes = occurrence.startDateTime.getHours() * 60 + occurrence.startDateTime.getMinutes();
    const endMinutes = occurrence.endDateTime.getHours() * 60 + occurrence.endDateTime.getMinutes();
    
    // Grid starts at 5 AM (300 minutes)
    const gridStartMinutes = 5 * 60;
    const gridEndMinutes = 23 * 60 + 30; // 11:30 PM
    const totalGridMinutes = gridEndMinutes - gridStartMinutes;
    
    // Calculate position as percentage
    const top = Math.max(0, ((startMinutes - gridStartMinutes) / totalGridMinutes) * 100);
    const height = Math.min(100 - top, ((endMinutes - startMinutes) / totalGridMinutes) * 100);
    
    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  }, []);

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const getCurrentTimePosition = () => {
    if (!isToday()) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const gridStartMinutes = 5 * 60;
    const gridEndMinutes = 23 * 60 + 30;
    
    if (currentMinutes < gridStartMinutes || currentMinutes > gridEndMinutes) {
      return null;
    }

    const totalGridMinutes = gridEndMinutes - gridStartMinutes;
    const position = ((currentMinutes - gridStartMinutes) / totalGridMinutes) * 100;
    
    return position;
  };

  const { dayName, dateString } = formatDate();
  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className={`bg-white rounded-lg shadow-sm border calendar-mobile-compact ${className}`}>
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 border-b gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
              {dayName}
            </h2>
            <p className="text-[10px] sm:text-sm text-gray-600">
              {dateString}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs sm:text-sm touch-target px-2 sm:px-3"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('prev')}
            className="touch-target"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('next')}
            className="touch-target"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day content */}
      <div className="flex overflow-x-auto smooth-scroll">
        {/* Time column - sticky on scroll */}
        <div className="w-12 sm:w-20 border-r flex-shrink-0 sticky left-0 bg-white z-20">
          {timeSlots.map((slot) => (
            <div
              key={`${slot.hour}-${slot.minute}`}
              className={`
                time-slot h-8 border-b border-gray-100 flex items-start justify-end pr-1 sm:pr-3 pt-1
                ${slot.isHour ? 'border-gray-200' : ''}
              `}
            >
              {slot.isHour && (
                <span className="time-label text-[9px] sm:text-xs text-gray-500 font-medium">
                  {slot.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day column - scrollable on mobile when activities overlap */}
        <div className="calendar-day-column flex-1 relative">
          <div className="relative min-w-full" style={{ height: `${timeSlots.length * 32}px`, width: 'max-content' }}>
            {/* Time slot lines */}
            {timeSlots.map((slot, index) => (
              <div
                key={`${slot.hour}-${slot.minute}`}
                className={`
                  absolute w-full border-b
                  ${slot.isHour ? 'border-gray-200' : 'border-gray-100'}
                `}
                style={{ top: `${index * 32}px`, height: '32px' }}
              />
            ))}

            {/* Activities */}
            {dayOccurrences.map((occurrence, index) => {
              const position = getActivityPosition(occurrence);
              const activityLayout = getActivityLayout(occurrence.activityId, dayLayouts);
              
              // Skip overflow activities (they'll be shown in the "+N more" indicator)
              if (activityLayout?.isOverflow) {
                return null;
              }
              
              return (
                <div
                  key={`${occurrence.activityId}-${index}`}
                  className="absolute left-0.5 right-0.5 sm:left-2 sm:right-2 z-10"
                  style={{
                    top: position.top,
                    height: position.height,
                    minHeight: '40px',
                  }}
                >
                  <ActivityBlock
                    occurrence={occurrence}
                    onClick={onActivityClick}
                    className="activity-block h-full"
                    layout={activityLayout}
                  />
                </div>
              );
            })}

            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full -ml-1 sm:-ml-1.5"></div>
                <div className="flex-1 h-0.5 bg-red-500"></div>
                <div className="text-[9px] sm:text-xs text-red-500 font-medium ml-1 sm:ml-2 bg-white px-1">
                  {new Date().toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Overflow indicator */}
          {(() => {
            const overflowActivities = getAllOverflowActivities(dayLayouts, dayOccurrences);
            return overflowActivities.length > 0 ? (
              <div className="px-0.5 sm:px-2 py-1 sm:py-2 border-t border-gray-200">
                <OverflowIndicator 
                  count={overflowActivities.length}
                  activities={overflowActivities}
                />
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Activity summary */}
      {dayOccurrences.length > 0 && (
        <div className="border-t p-2 sm:p-4">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Today's Activities ({dayOccurrences.length})
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            {dayOccurrences.map((occurrence, index) => (
              <div
                key={`summary-${occurrence.activityId}-${index}`}
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors touch-target"
                onClick={() => onActivityClick?.(occurrence)}
              >
                <div
                  className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: occurrence.childColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {occurrence.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    {occurrence.childName} • {occurrence.startDateTime.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })} - {occurrence.endDateTime.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
                {occurrence.location && (
                  <div className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0">
                    📍 {occurrence.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {dayOccurrences.length === 0 && (
        <div className="p-6 sm:p-8 text-center text-gray-500">
          <svg className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs sm:text-sm">No activities scheduled for this day</p>
        </div>
      )}
    </div>
  );
};

// Overflow indicator component
interface OverflowIndicatorProps {
  count: number;
  activities: ActivityOccurrence[];
  onClick?: () => void;
}

const OverflowIndicator: React.FC<OverflowIndicatorProps> = React.memo(({ count, activities, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (count === 0) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      setShowTooltip(!showTooltip);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="
          overflow-indicator w-full px-1.5 sm:px-2 py-1.5 sm:py-1 text-[10px] sm:text-xs font-medium 
          text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 
          rounded border border-blue-200 transition-colors duration-150 
          touch-target min-h-[44px]
        "
        title={`${count} more ${count === 1 ? 'activity' : 'activities'}`}
      >
        +{count} more
      </button>
      
      {showTooltip && (
        <div 
          className="
            absolute bottom-full left-0 right-0 mb-1 p-2 bg-white rounded shadow-lg 
            border border-gray-200 z-30 max-h-48 overflow-y-auto text-left
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-semibold text-gray-700 mb-1">
            Additional Activities:
          </div>
          {activities.map((activity, index) => (
            <div 
              key={`${activity.activityId}-${index}`}
              className="text-xs text-gray-600 py-1 border-b last:border-b-0"
            >
              <div className="font-medium">{activity.title}</div>
              <div className="text-gray-500">{activity.childName}</div>
            </div>
          ))}
          <button
            onClick={() => setShowTooltip(false)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 touch-target"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if count or activities length changes
  return (
    prevProps.count === nextProps.count &&
    prevProps.activities.length === nextProps.activities.length
  );
});