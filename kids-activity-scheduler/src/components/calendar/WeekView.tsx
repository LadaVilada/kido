'use client';

import React, { useState, useMemo } from 'react';
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

interface WeekViewProps {
  occurrences: ActivityOccurrence[];
  onActivityClick?: (occurrence: ActivityOccurrence) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
}

export const WeekView: React.FC<WeekViewProps> = ({
  occurrences,
  onActivityClick,
  currentDate = new Date(),
  onDateChange,
  className = '',
}) => {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStartDate(currentDate));

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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
    
    if (onDateChange) {
      onDateChange(newWeek);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedWeek(getWeekStartDate(today));
    
    if (onDateChange) {
      onDateChange(today);
    }
  };

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

  const getActivityPosition = (occurrence: ActivityOccurrence) => {
    const startMinutes = occurrence.startDateTime.getHours() * 60 + occurrence.startDateTime.getMinutes();
    const endMinutes = occurrence.endDateTime.getHours() * 60 + occurrence.endDateTime.getMinutes();
    
    // Grid starts at 6 AM (360 minutes)
    const gridStartMinutes = 6 * 60;
    const gridEndMinutes = 22 * 60; // 10 PM
    const totalGridMinutes = gridEndMinutes - gridStartMinutes;
    
    // Calculate position as percentage
    const top = Math.max(0, ((startMinutes - gridStartMinutes) / totalGridMinutes) * 100);
    const height = Math.min(100 - top, ((endMinutes - startMinutes) / totalGridMinutes) * 100);
    
    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 sm:flex-none">
            {formatWeekRange()}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs sm:text-sm touch-target"
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
          {/* Time column */}
          <div className="w-12 sm:w-16 border-r flex-shrink-0">
            <div className="h-10 sm:h-12 border-b"></div> {/* Header spacer */}
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="h-12 sm:h-16 border-b border-gray-100 flex items-start justify-end pr-1 sm:pr-2 pt-1"
              >
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                  {slot.label}
                </span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          <div className="flex-1 grid grid-cols-7 min-w-[600px] sm:min-w-0">
            {weekDays.map((day, dayIndex) => {
              const dayKey = day.toDateString();
              const dayOccurrences = occurrencesByDate.get(dayKey) || [];
              const dayOfWeek = DAYS_OF_WEEK[day.getDay()];

              return (
                <div key={dayKey} className="border-r last:border-r-0 min-w-[80px] sm:min-w-0">
                  {/* Day header */}
                  <div className={`
                    h-10 sm:h-12 border-b flex flex-col items-center justify-center px-1
                    ${isToday(day) ? 'bg-blue-50' : ''}
                  `}>
                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
                      {dayOfWeek.short}
                    </div>
                    <div className={`
                      text-xs sm:text-sm font-semibold
                      ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Day content */}
                  <div className="relative" style={{ height: `${timeSlots.length * (window.innerWidth < 640 ? 48 : 64)}px` }}>
                    {/* Hour lines */}
                    {timeSlots.map((slot, index) => (
                      <div
                        key={slot.hour}
                        className="absolute w-full border-b border-gray-100"
                        style={{ top: `${index * (window.innerWidth < 640 ? 48 : 64)}px`, height: window.innerWidth < 640 ? '48px' : '64px' }}
                      />
                    ))}

                    {/* Activities */}
                    {dayOccurrences.map((occurrence, index) => {
                      const position = getActivityPosition(occurrence);
                      
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
                            className="h-full"
                          />
                        </div>
                      );
                    })}

                    {/* Current time indicator */}
                    {isToday(day) && (
                      <CurrentTimeIndicator />
                    )}
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
const CurrentTimeIndicator: React.FC = () => {
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
};