import { Activity, Child, ActivityOccurrence } from '@/types';

/**
 * Generates activity occurrences for a given date range
 */
export const generateActivityOccurrences = (
  activities: Activity[],
  children: Child[],
  startDate: Date,
  endDate: Date
): ActivityOccurrence[] => {
  const occurrences: ActivityOccurrence[] = [];
  
  // Create a map of children for quick lookup
  const childrenMap = new Map(children.map(child => [child.id, child]));
  
  activities.forEach(activity => {
    const child = childrenMap.get(activity.childId);
    if (!child) return; // Skip if child not found
    
    const activityOccurrences = generateOccurrencesForActivity(
      activity,
      child,
      startDate,
      endDate
    );
    
    occurrences.push(...activityOccurrences);
  });
  
  // Sort occurrences by start time
  return occurrences.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
};

/**
 * Generates occurrences for a single activity within the date range
 */
export const generateOccurrencesForActivity = (
  activity: Activity,
  child: Child,
  startDate: Date,
  endDate: Date
): ActivityOccurrence[] => {
  const occurrences: ActivityOccurrence[] = [];
  
  // Parse start and end times
  const [startHour, startMinute] = activity.startTime.split(':').map(Number);
  const [endHour, endMinute] = activity.endTime.split(':').map(Number);
  
  // Iterate through each day in the range
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const rangeEndDate = new Date(endDate);
  rangeEndDate.setHours(23, 59, 59, 999);
  
  while (currentDate <= rangeEndDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if this activity occurs on this day of the week
    if (activity.daysOfWeek.includes(dayOfWeek)) {
      // Create start and end date times for this occurrence
      const startDateTime = new Date(currentDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(currentDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      // Handle timezone conversion if needed
      // For now, we'll assume local timezone
      
      const occurrence: ActivityOccurrence = {
        activityId: activity.id,
        date: new Date(currentDate),
        startDateTime,
        endDateTime,
        title: activity.title,
        location: activity.location,
        childName: child.name,
        childColor: child.color,
      };
      
      occurrences.push(occurrence);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return occurrences;
};

/**
 * Gets occurrences for a specific date
 */
export const getOccurrencesForDate = (
  activities: Activity[],
  children: Child[],
  date: Date
): ActivityOccurrence[] => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return generateActivityOccurrences(activities, children, startOfDay, endOfDay);
};

/**
 * Gets occurrences for a specific week
 */
export const getOccurrencesForWeek = (
  activities: Activity[],
  children: Child[],
  weekStartDate: Date
): ActivityOccurrence[] => {
  const startOfWeek = new Date(weekStartDate);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(weekStartDate);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return generateActivityOccurrences(activities, children, startOfWeek, endOfWeek);
};

/**
 * Gets the start of the week for a given date (Sunday)
 */
export const getWeekStartDate = (date: Date): Date => {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

/**
 * Gets the end of the week for a given date (Saturday)
 */
export const getWeekEndDate = (date: Date): Date => {
  const endOfWeek = new Date(date);
  const dayOfWeek = endOfWeek.getDay();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - dayOfWeek));
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

/**
 * Checks if an occurrence conflicts with another occurrence
 */
export const hasTimeConflict = (
  occurrence1: ActivityOccurrence,
  occurrence2: ActivityOccurrence
): boolean => {
  // Check if they're on the same date
  if (occurrence1.date.toDateString() !== occurrence2.date.toDateString()) {
    return false;
  }
  
  // Check for time overlap
  const start1 = occurrence1.startDateTime.getTime();
  const end1 = occurrence1.endDateTime.getTime();
  const start2 = occurrence2.startDateTime.getTime();
  const end2 = occurrence2.endDateTime.getTime();
  
  return (start1 < end2) && (start2 < end1);
};

/**
 * Finds conflicting occurrences for a given occurrence
 */
export const findConflictingOccurrences = (
  targetOccurrence: ActivityOccurrence,
  allOccurrences: ActivityOccurrence[]
): ActivityOccurrence[] => {
  return allOccurrences.filter(occurrence => 
    occurrence.activityId !== targetOccurrence.activityId &&
    hasTimeConflict(targetOccurrence, occurrence)
  );
};

/**
 * Groups occurrences by date
 */
export const groupOccurrencesByDate = (
  occurrences: ActivityOccurrence[]
): Map<string, ActivityOccurrence[]> => {
  const grouped = new Map<string, ActivityOccurrence[]>();
  
  occurrences.forEach(occurrence => {
    const dateKey = occurrence.date.toDateString();
    const existing = grouped.get(dateKey) || [];
    existing.push(occurrence);
    grouped.set(dateKey, existing);
  });
  
  // Sort occurrences within each date by start time
  grouped.forEach(dayOccurrences => {
    dayOccurrences.sort((a, b) => 
      a.startDateTime.getTime() - b.startDateTime.getTime()
    );
  });
  
  return grouped;
};

/**
 * Gets upcoming occurrences within the next specified hours
 */
export const getUpcomingOccurrences = (
  activities: Activity[],
  children: Child[],
  hoursAhead: number = 24
): ActivityOccurrence[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
  
  const occurrences = generateActivityOccurrences(activities, children, now, futureDate);
  
  // Filter to only include future occurrences
  return occurrences.filter(occurrence => occurrence.startDateTime > now);
};

/**
 * Formats occurrence time range for display
 */
export const formatOccurrenceTimeRange = (occurrence: ActivityOccurrence): string => {
  const startTime = occurrence.startDateTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const endTime = occurrence.endDateTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${startTime} - ${endTime}`;
};

/**
 * Gets the duration of an occurrence in minutes
 */
export const getOccurrenceDuration = (occurrence: ActivityOccurrence): number => {
  return Math.round(
    (occurrence.endDateTime.getTime() - occurrence.startDateTime.getTime()) / (1000 * 60)
  );
};

/**
 * Checks if an occurrence is happening now
 */
export const isOccurrenceActive = (occurrence: ActivityOccurrence): boolean => {
  const now = new Date();
  return now >= occurrence.startDateTime && now <= occurrence.endDateTime;
};

/**
 * Checks if an occurrence is in the past
 */
export const isOccurrencePast = (occurrence: ActivityOccurrence): boolean => {
  const now = new Date();
  return occurrence.endDateTime < now;
};

/**
 * Checks if an occurrence is upcoming (starts within the next hour)
 */
export const isOccurrenceUpcoming = (occurrence: ActivityOccurrence): boolean => {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
  return occurrence.startDateTime > now && occurrence.startDateTime <= oneHourFromNow;
};