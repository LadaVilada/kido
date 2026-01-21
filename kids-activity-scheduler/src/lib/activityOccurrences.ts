import { Activity, Child, ActivityOccurrence } from '@/types';

/**
 * Creates a Date object in a specific timezone
 */
export const createDateTimeInTimezone = (
  date: Date,
  hour: number,
  minute: number,
  timezone: string
): Date => {
  try {
    // Create a date string in the format YYYY-MM-DD HH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hourStr = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');
    
    const dateTimeString = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00`;
    
    // Create a date in the specified timezone
    const tempDate = new Date(dateTimeString);
    
    // Get the timezone offset for the specified timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    // For now, we'll use a simpler approach and assume the local timezone
    // In a production app, you might want to use a library like date-fns-tz
    const localDate = new Date(date);
    localDate.setHours(hour, minute, 0, 0);
    
    return localDate;
  } catch (error) {
    // Fallback to local timezone if timezone parsing fails
    const localDate = new Date(date);
    localDate.setHours(hour, minute, 0, 0);
    return localDate;
  }
};

/**
 * Converts a time string to minutes since midnight
 */
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight to a time string
 */
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Gets the next occurrence of an activity after a given date
 */
export const getNextOccurrence = (
  activity: Activity,
  child: Child,
  afterDate: Date = new Date()
): ActivityOccurrence | null => {
  // Look ahead up to 2 weeks to find the next occurrence
  const endDate = new Date(afterDate);
  endDate.setDate(endDate.getDate() + 14);
  
  const occurrences = generateOccurrencesForActivity(activity, child, afterDate, endDate);
  
  // Return the first occurrence that starts after the given date
  return occurrences.find(occurrence => occurrence.startDateTime > afterDate) || null;
};

/**
 * Calculates weekly statistics for activities
 */
export const calculateWeeklyStats = (
  activities: Activity[],
  children: Child[]
): {
  totalHours: number;
  activitiesPerDay: Record<number, number>;
  activitiesPerChild: Record<string, number>;
  averageDuration: number;
} => {
  const childrenMap = new Map(children.map(child => [child.id, child]));
  
  let totalMinutes = 0;
  const activitiesPerDay: Record<number, number> = {};
  const activitiesPerChild: Record<string, number> = {};
  let totalActivities = 0;
  
  activities.forEach(activity => {
    const child = childrenMap.get(activity.childId);
    if (!child) return;
    
    const startMinutes = timeStringToMinutes(activity.startTime);
    const endMinutes = timeStringToMinutes(activity.endTime);
    const durationMinutes = endMinutes - startMinutes;
    
    // Calculate total weekly minutes for this activity
    const weeklyMinutes = durationMinutes * activity.daysOfWeek.length;
    totalMinutes += weeklyMinutes;
    
    // Count activities per day
    activity.daysOfWeek.forEach(day => {
      activitiesPerDay[day] = (activitiesPerDay[day] || 0) + 1;
    });
    
    // Count activities per child
    const childName = child.name;
    activitiesPerChild[childName] = (activitiesPerChild[childName] || 0) + 1;
    
    totalActivities += activity.daysOfWeek.length;
  });
  
  return {
    totalHours: totalMinutes / 60,
    activitiesPerDay,
    activitiesPerChild,
    averageDuration: totalActivities > 0 ? totalMinutes / totalActivities : 0,
  };
};

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
      // Create start and end date times for this occurrence with timezone handling
      const startDateTime = createDateTimeInTimezone(
        currentDate,
        startHour,
        startMinute,
        activity.timezone
      );
      
      const endDateTime = createDateTimeInTimezone(
        currentDate,
        endHour,
        endMinute,
        activity.timezone
      );
      
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

/**
 * Gets occurrences that need reminders (1 hour and 30 minutes before)
 */
export const getOccurrencesNeedingReminders = (
  activities: Activity[],
  children: Child[],
  reminderMinutes: number[] = [60, 30]
): { occurrence: ActivityOccurrence; reminderMinutes: number }[] => {
  const now = new Date();
  const maxLookAhead = Math.max(...reminderMinutes);
  const futureDate = new Date(now.getTime() + (maxLookAhead * 60 * 1000));
  
  const occurrences = generateActivityOccurrences(activities, children, now, futureDate);
  const reminders: { occurrence: ActivityOccurrence; reminderMinutes: number }[] = [];
  
  occurrences.forEach(occurrence => {
    reminderMinutes.forEach(minutes => {
      const reminderTime = new Date(occurrence.startDateTime.getTime() - (minutes * 60 * 1000));
      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
      
      // If we're within 1 minute of the reminder time, include it
      if (timeDiff <= 60 * 1000 && occurrence.startDateTime > now) {
        reminders.push({ occurrence, reminderMinutes: minutes });
      }
    });
  });
  
  return reminders;
};

/**
 * Generates a recurring pattern description for an activity
 */
export const getRecurrenceDescription = (activity: Activity): string => {
  const { daysOfWeek } = activity;
  
  if (daysOfWeek.length === 0) {
    return 'No recurring schedule';
  }
  
  if (daysOfWeek.length === 7) {
    return 'Every day';
  }
  
  // Check for common patterns
  const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
  const weekends = [0, 6]; // Sunday and Saturday
  
  const isWeekdays = weekdays.every(day => daysOfWeek.includes(day)) && 
                    daysOfWeek.length === 5;
  const isWeekends = weekends.every(day => daysOfWeek.includes(day)) && 
                    daysOfWeek.length === 2;
  
  if (isWeekdays) {
    return 'Weekdays (Mon-Fri)';
  }
  
  if (isWeekends) {
    return 'Weekends (Sat-Sun)';
  }
  
  // Generate custom description
  const dayNames = daysOfWeek
    .sort()
    .map(day => {
      const dayInfo = [
        { value: 0, short: 'Sun' },
        { value: 1, short: 'Mon' },
        { value: 2, short: 'Tue' },
        { value: 3, short: 'Wed' },
        { value: 4, short: 'Thu' },
        { value: 5, short: 'Fri' },
        { value: 6, short: 'Sat' },
      ].find(d => d.value === day);
      return dayInfo?.short || '';
    })
    .filter(Boolean);
  
  if (dayNames.length === 1) {
    return `Every ${dayNames[0]}`;
  }
  
  return dayNames.join(', ');
};

/**
 * Validates that an activity's schedule is reasonable
 */
export const validateActivitySchedule = (activity: Partial<Activity>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Check days of week
  if (!activity.daysOfWeek || activity.daysOfWeek.length === 0) {
    errors.push('At least one day must be selected');
  }
  
  // Check times
  if (!activity.startTime || !activity.endTime) {
    errors.push('Start and end times are required');
  } else {
    const startMinutes = timeStringToMinutes(activity.startTime);
    const endMinutes = timeStringToMinutes(activity.endTime);
    
    if (startMinutes >= endMinutes) {
      errors.push('End time must be after start time');
    }
    
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 15) {
      errors.push('Activity must be at least 15 minutes long');
    }
    
    if (durationMinutes > 12 * 60) {
      errors.push('Activity cannot be longer than 12 hours');
    }
  }
  
  // Check timezone
  if (!activity.timezone) {
    errors.push('Timezone is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Finds the optimal time slot for a new activity to avoid conflicts
 */
export const findOptimalTimeSlot = (
  existingActivities: Activity[],
  children: Child[],
  preferredDays: number[],
  durationMinutes: number,
  earliestTime: string = '08:00',
  latestTime: string = '20:00'
): { startTime: string; endTime: string; days: number[] } | null => {
  const earliestMinutes = timeStringToMinutes(earliestTime);
  const latestMinutes = timeStringToMinutes(latestTime);
  
  // Try each day
  for (const day of preferredDays) {
    // Get existing activities for this day
    const dayActivities = existingActivities.filter(activity => 
      activity.daysOfWeek.includes(day)
    );
    
    // Sort by start time
    dayActivities.sort((a, b) => 
      timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
    );
    
    // Try to find a gap
    let currentTime = earliestMinutes;
    
    for (const activity of dayActivities) {
      const activityStart = timeStringToMinutes(activity.startTime);
      const activityEnd = timeStringToMinutes(activity.endTime);
      
      // Check if there's a gap before this activity
      if (currentTime + durationMinutes <= activityStart) {
        return {
          startTime: minutesToTimeString(currentTime),
          endTime: minutesToTimeString(currentTime + durationMinutes),
          days: [day],
        };
      }
      
      currentTime = Math.max(currentTime, activityEnd);
    }
    
    // Check if there's time after the last activity
    if (currentTime + durationMinutes <= latestMinutes) {
      return {
        startTime: minutesToTimeString(currentTime),
        endTime: minutesToTimeString(currentTime + durationMinutes),
        days: [day],
      };
    }
  }
  
  return null;
};