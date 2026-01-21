'use client';

import React, { useState, useMemo } from 'react';
import { ActivityOccurrence, DAYS_OF_WEEK } from '@/types';
import { ActivityBlock } from './ActivityBlock';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayViewProps {
  occurrences: ActivityOccurrence[];
  onActivityClick?: (occurrence: ActivityOccurrence) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
}

export const DayView: React.FC<DayViewProps> = ({
  occurrences,
  onActivityClick,
  currentDate = new Date(),
  onDateChange,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  // Filter occurrences for the selected date
  const dayOccurrences = useMemo(() => {
    const selectedDateString = selectedDate.toDateString();
    return occurrences
      .filter(occurrence => occurrence.date.toDateString() === selectedDateString)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  }, [occurrences, selectedDate]);

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

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
    
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    
    if (onDateChange) {
      onDateChange(today);
    }
  };

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

  const getActivityPosition = (occurrence: ActivityOccurrence) => {
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
  };

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
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {dayName}
            </h2>
            <p className="text-sm text-gray-600">
              {dateString}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-sm"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day content */}
      <div className="flex">
        {/* Time column */}
        <div className="w-20 border-r">
          {timeSlots.map((slot) => (
            <div
              key={`${slot.hour}-${slot.minute}`}
              className={`
                h-8 border-b border-gray-100 flex items-start justify-end pr-3 pt-1
                ${slot.isHour ? 'border-gray-200' : ''}
              `}
            >
              {slot.isHour && (
                <span className="text-xs text-gray-500 font-medium">
                  {slot.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="flex-1 relative">
          <div className="relative" style={{ height: `${timeSlots.length * 32}px` }}>
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
              
              return (
                <div
                  key={`${occurrence.activityId}-${index}`}
                  className="absolute left-2 right-2 z-10"
                  style={{
                    top: position.top,
                    height: position.height,
                    minHeight: '40px',
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
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5"></div>
                <div className="flex-1 h-0.5 bg-red-500"></div>
                <div className="text-xs text-red-500 font-medium ml-2 bg-white px-1">
                  {new Date().toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity summary */}
      {dayOccurrences.length > 0 && (
        <div className="border-t p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Today's Activities ({dayOccurrences.length})
          </h3>
          <div className="space-y-2">
            {dayOccurrences.map((occurrence, index) => (
              <div
                key={`summary-${occurrence.activityId}-${index}`}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onActivityClick?.(occurrence)}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: occurrence.childColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {occurrence.title}
                  </p>
                  <p className="text-xs text-gray-500">
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
                  <div className="text-xs text-gray-400 flex-shrink-0">
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
        <div className="p-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No activities scheduled for this day</p>
        </div>
      )}
    </div>
  );
};