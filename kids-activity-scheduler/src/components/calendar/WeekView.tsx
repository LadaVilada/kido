'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ActivityOccurrence, DAYS_OF_WEEK } from '@/types';
import { 
  getWeekStartDate, 
  getWeekEndDate, 
  groupOccurrencesByDate,
  timeStringToMinutes 
} from '@/lib/activityOccurrences';
import { ActivityBlock } from './ActivityBlock';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  detectOverlaps, 
  calculateLayout, 
  getActivityLayout,
  getAllOverflowActivities,
  ActivityLayout 
} from '@/lib/calendarLayout';
import { useDebouncedCallback } from '@/hooks/useDebounce';

/**
 * Props for the WeekView component
 * 
 * @property occurrences - Array of activity occurrences to display in the week
 * @property onActivityClick - Optional callback when an activity is clicked
 * @property currentDate - Optional date to determine which week to display (defaults to today)
 * @property onDateChange - Optional callback when the displayed week changes
 * @property className - Optional additional CSS classes
 */
interface WeekViewProps {
  occurrences: ActivityOccurrence[];
  onActivityClick?: (occurrence: ActivityOccurrence) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
}

/**
 * WeekView Component
 * 
 * Displays a weekly calendar view with automatic overlap detection and side-by-side layout
 * for concurrent activities.
 * 
 * Features:
 * - Automatic overlap detection per day
 * - Side-by-side layout for up to 4 concurrent activities
 * - "+N more" indicator for overflow activities (more than 4)
 * - Horizontal scroll on mobile for overlapping activities
 * - Current time indicator (red line)
 * - Week navigation (previous/next/today)
 * - Responsive design (mobile/tablet/desktop)
 * - Performance optimized with memoization
 * 
 * @example
 * <WeekView
 *   occurrences={activities}
 *   onActivityClick={handleActivityClick}
 *   currentDate={new Date()}
 *   onDateChange={handleDateChange}
 * />
 */
export const WeekView: React.FC<WeekViewProps> = ({
  occurrences,
  onActivityClick,
  currentDate = new Date(),
  onDateChange,
  className = '',
}) => {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStartDate(currentDate));
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

  // Calculate week dates
  const weekStart = useMemo(() => getWeekStartDate(selectedWeek), [selectedWeek]);
  const weekEnd = useMemo(() => getWeekEndDate(selectedWeek), [selectedWeek]);

  // Generate days for the week
  const weekDays = useMemo(() => {
    const days = [];
    const currentDay = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  }, [weekStart]);

  // Group occurrences by date
  const occurrencesByDate = useMemo(() => {
    return groupOccurrencesByDate(occurrences);
  }, [occurrences]);

  // Calculate layouts for each day
  const layoutsByDate = useMemo(() => {
    const layouts = new Map<string, ActivityLayout[]>();
    
    occurrencesByDate.forEach((dayOccurrences, dateKey) => {
      if (dayOccurrences.length === 0) {
        layouts.set(dateKey, []);
        return;
      }
      
      // Detect overlaps for this day
      const overlapGroups = detectOverlaps(dayOccurrences);
      
      // Calculate layout with max 4 columns
      const dayLayouts = calculateLayout(overlapGroups, 4);
      
      layouts.set(dateKey, dayLayouts);
    });
    
    return layouts;
  }, [occurrencesByDate]);

  // Time slots for the grid (6 AM to 10 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push({
        hour,
        label: hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
        minutes: hour * 60,
      });
    }
    return slots;
  }, []);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
    
    if (onDateChange) {
      onDateChange(newWeek);
    }
  }, [selectedWeek, onDateChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedWeek(getWeekStartDate(today));
    
    if (onDateChange) {
      onDateChange(today);
    }
  }, [onDateChange]);

  const formatWeekRange = () => {
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const endDay = weekEnd.getDate();
    const year = weekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  const getActivityPosition = useCallback((occurrence: ActivityOccurrence) => {
    const startMinutes = occurrence.startDateTime.getHours() * 60 + occurrence.startDateTime.getMinutes();
    const endMinutes = occurrence.endDateTime.getHours() * 60 + occurrence.endDateTime.getMinutes();
    
    // Grid starts at 6 AM (360 minutes)
    const gridStartMinutes = 6 * 60;
    const gridEndMinutes = 22 * 60; // 10 PM
    const totalGridMinutes = gridEndMinutes - gridStartMinutes;
    
    // Calculate the slot height based on window width
    const slotHeight = windowWidth < 640 ? 48 : 64;
    const totalSlots = 17; // 6 AM to 10 PM = 17 hours
    const totalHeight = totalSlots * slotHeight;
    
    // Calculate position in pixels
    const minutesFromStart = startMinutes - gridStartMinutes;
    const durationMinutes = endMinutes - startMinutes;
    
    const topPx = Math.max(0, (minutesFromStart / totalGridMinutes) * totalHeight);
    const heightPx = Math.max(28, (durationMinutes / totalGridMinutes) * totalHeight);
    
    // Debug logging
    console.log(`Position for ${occurrence.title}: startMinutes=${startMinutes}, top=${topPx}px, height=${heightPx}px`);
    
    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
  }, [windowWidth]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border calendar-mobile-compact ${className}`}>
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 border-b gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 flex-1 sm:flex-none">
            {formatWeekRange()}
          </h2>
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
            onClick={() => navigateWeek('prev')}
            className="touch-target"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="touch-target"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid - horizontal scroll on mobile */}
      <div className="overflow-x-auto smooth-scroll">
        <div className="flex min-w-max sm:min-w-0">
          {/* Time column - sticky on scroll */}
          <div className="w-10 sm:w-16 border-r flex-shrink-0 sticky left-0 bg-white z-20">
            <div className="h-8 sm:h-12 border-b"></div> {/* Header spacer */}
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="time-slot h-12 sm:h-16 border-b border-gray-100 flex items-start justify-end pr-0.5 sm:pr-2 pt-1"
              >
                <span className="time-label text-[9px] sm:text-xs text-gray-500 font-medium">
                  {slot.label}
                </span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          <div className="flex-1 grid grid-cols-7 min-w-[560px] sm:min-w-0">
            {weekDays.map((day, dayIndex) => {
              const dayKey = day.toDateString();
              const dayOccurrences = occurrencesByDate.get(dayKey) || [];
              const dayOfWeek = DAYS_OF_WEEK[day.getDay()];

              return (
                <div key={dayKey} className="border-r last:border-r-0 min-w-[70px] sm:min-w-0">
                  {/* Day header */}
                  <div className={`
                    day-header h-8 sm:h-12 border-b flex flex-col items-center justify-center px-0.5 sm:px-1
                    ${isToday(day) ? 'bg-blue-50' : ''}
                  `}>
                    <div className="text-[9px] sm:text-xs text-gray-500 font-medium">
                      {dayOfWeek.short}
                    </div>
                    <div className={`
                      text-xs sm:text-sm font-semibold
                      ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Day content - scrollable on mobile when activities overlap */}
                  <div className="calendar-day-column relative overflow-x-auto smooth-scroll" style={{ height: `${timeSlots.length * (windowWidth < 640 ? 48 : 64)}px` }}>
                    <div className="relative min-w-full" style={{ width: 'max-content' }}>
                      {/* Hour lines */}
                      {timeSlots.map((slot, index) => (
                        <div
                          key={slot.hour}
                          className="absolute w-full border-b border-gray-100"
                          style={{ top: `${index * (windowWidth < 640 ? 48 : 64)}px`, height: windowWidth < 640 ? '48px' : '64px' }}
                        />
                      ))}

                      {/* Activities */}
                      {dayOccurrences.map((occurrence, index) => {
                        const position = getActivityPosition(occurrence);
                        const dayLayouts = layoutsByDate.get(dayKey) || [];
                        const activityLayout = getActivityLayout(occurrence.activityId, dayLayouts);
                        
                        // Skip overflow activities (they'll be shown in the "+N more" indicator)
                        if (activityLayout?.isOverflow) {
                          return null;
                        }
                        
                        return (
                          <div
                            key={`${occurrence.activityId}-${index}`}
                            className="absolute left-0.5 right-0.5 sm:left-1 sm:right-1 z-10"
                            style={{
                              top: position.top,
                              height: position.height,
                              minHeight: '28px',
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
                      {isToday(day) && (
                        <CurrentTimeIndicator />
                      )}
                    </div>
                    
                    {/* Overflow indicator at bottom of day column */}
                    {(() => {
                      const dayLayouts = layoutsByDate.get(dayKey) || [];
                      const overflowActivities = getAllOverflowActivities(dayLayouts, dayOccurrences);
                      return overflowActivities.length > 0 ? (
                        <div className="px-0.5 sm:px-1 py-1 border-t border-gray-200">
                          <OverflowIndicator 
                            count={overflowActivities.length}
                            activities={overflowActivities}
                          />
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Current time indicator component
const CurrentTimeIndicator: React.FC = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const gridStartMinutes = 6 * 60; // 6 AM
  const gridEndMinutes = 22 * 60; // 10 PM
  
  // Only show if current time is within the grid range
  if (currentMinutes < gridStartMinutes || currentMinutes > gridEndMinutes) {
    return null;
  }

  const totalGridMinutes = gridEndMinutes - gridStartMinutes;
  const position = ((currentMinutes - gridStartMinutes) / totalGridMinutes) * 100;

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center"
      style={{ top: `${position}%` }}
    >
      <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
      <div className="flex-1 h-0.5 bg-red-500"></div>
    </div>
  );
});

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