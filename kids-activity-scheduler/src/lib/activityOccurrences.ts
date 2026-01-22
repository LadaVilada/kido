import { Activity, Child, ActivityOccurrence } from '@/types';

/**
 * Creates a Date object with the specified time
 * Simplified version that uses local timezone
 */
export const createDateTimeInTimezone = (
  date: Date,
  hour: number,
  minute: number,
  timezone: string
): Date => {
  // Create a new date object with the same date but specified time
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
};

/**
 * Gets the timezone offset in minutes for a specific timezone at a given date
 */
export const getTimezoneOffset = (date: Date, timezone: string): number => {
  try {
    // Create two dates: one in UTC and one in the target timezone
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    // Calculate the offset in minutes
    const offsetMs = utcDate.getTime() - tzDate.getTime();
    return Math.round(offsetMs / (1000 * 60));
  } catch (error) {
    // Fallback to local timezone offset
    return date.getTimezoneOffset();
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
  
  // Debug logging
  console.log(`Activity: ${activity.title}, Start: ${activity.startTime} (${startHour}:${startMinute}), End: ${activity.endTime} (${endHour}:${endMinute})`);
  
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
 * Generates weekly occurrences for an activity over a specified number of weeks
 */
export const generateWeeklyOccurrences = (
  activity: Activity,
  child: Child,
  startWeek: Date,
  numberOfWeeks: number = 4
): ActivityOccurrence[] => {
  const occurrences: ActivityOccurrence[] = [];
  const weekStart = getWeekStartDate(startWeek);
  
  for (let week = 0; week < numberOfWeeks; week++) {
    const currentWeekStart = new Date(weekStart);
    currentWeekStart.setDate(weekStart.getDate() + (week * 7));
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    const weekOccurrences = generateOccurrencesForActivity(
      activity,
      child,
      currentWeekStart,
      currentWeekEnd
    );
    
    occurrences.push(...weekOccurrences);
  }
  
  return occurrences;
};

/**
 * Calculates the next N occurrences for an activity
 */
export const getNextNOccurrences = (
  activity: Activity,
  child: Child,
  count: number = 5,
  fromDate: Date = new Date()
): ActivityOccurrence[] => {
  const occurrences: ActivityOccurrence[] = [];
  const maxWeeksToLook = Math.ceil(count / activity.daysOfWeek.length) + 2;
  
  const weeklyOccurrences = generateWeeklyOccurrences(
    activity,
    child,
    fromDate,
    maxWeeksToLook
  );
  
  // Filter to only future occurrences and take the first N
  const futureOccurrences = weeklyOccurrences
    .filter(occurrence => occurrence.startDateTime > fromDate)
    .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
    .slice(0, count);
  
  return futureOccurrences;
};

/**
 * Converts a date/time from one timezone to another
 */
export const convertTimezone = (
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date => {
  try {
    // Get the date/time string in the source timezone
    const sourceTimeString = date.toLocaleString('en-US', { 
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the components
    const [datePart, timePart] = sourceTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    // Create a new date in the target timezone
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:${second}`;
    const targetDate = new Date(isoString);
    
    // Adjust for timezone difference
    const sourceOffset = getTimezoneOffset(date, fromTimezone);
    const targetOffset = getTimezoneOffset(targetDate, toTimezone);
    const offsetDifference = (sourceOffset - targetOffset) * 60 * 1000;
    
    return new Date(targetDate.getTime() + offsetDifference);
  } catch (error) {
    // Fallback to original date if conversion fails
    return new Date(date);
  }
};

/**
 * Gets the current time in a specific timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  try {
    const now = new Date();
    return convertTimezone(now, getUserTimezone(), timezone);
  } catch (error) {
    return new Date();
  }
};

/**
 * Checks if a timezone observes daylight saving time
 */
export const observesDaylightSaving = (timezone: string): boolean => {
  try {
    const jan = new Date(2024, 0, 1); // January 1st
    const jul = new Date(2024, 6, 1); // July 1st
    
    const janOffset = getTimezoneOffset(jan, timezone);
    const julOffset = getTimezoneOffset(jul, timezone);
    
    return janOffset !== julOffset;
  } catch (error) {
    return false;
  }
};

/**
 * Gets timezone information for display
 */
export const getTimezoneInfo = (timezone: string): {
  name: string;
  abbreviation: string;
  offset: string;
  observesDST: boolean;
} => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const abbreviation = parts.find(part => part.type === 'timeZoneName')?.value || '';
    
    const offset = getTimezoneOffset(now, timezone);
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset <= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
    
    return {
      name: timezone,
      abbreviation,
      offset: offsetString,
      observesDST: observesDaylightSaving(timezone)
    };
  } catch (error) {
    return {
      name: timezone,
      abbreviation: '',
      offset: '+00:00',
      observesDST: false
    };
  }
};

/**
 * Gets the user's current timezone
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
};
/**
 * 
Finds the optimal time slot for a new activity to avoid conflicts
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

/**
 * Calculates activity statistics for a given time period
 */
export const calculateActivityStatistics = (
  activities: Activity[],
  children: Child[],
  startDate: Date,
  endDate: Date
): {
  totalOccurrences: number;
  totalHours: number;
  averagePerDay: number;
  busiest: { day: number; count: number };
  childStats: Record<string, { name: string; count: number; hours: number }>;
} => {
  const occurrences = generateActivityOccurrences(activities, children, startDate, endDate);
  const childrenMap = new Map(children.map(child => [child.id, child]));
  
  const dayCount: Record<number, number> = {};
  const childStats: Record<string, { name: string; count: number; hours: number }> = {};
  let totalHours = 0;
  
  occurrences.forEach(occurrence => {
    const dayOfWeek = occurrence.date.getDay();
    dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    
    const duration = getOccurrenceDuration(occurrence) / 60; // Convert to hours
    totalHours += duration;
    
    // Find the child for this occurrence
    const activity = activities.find(a => a.id === occurrence.activityId);
    if (activity) {
      const child = childrenMap.get(activity.childId);
      if (child) {
        if (!childStats[child.id]) {
          childStats[child.id] = { name: child.name, count: 0, hours: 0 };
        }
        childStats[child.id].count++;
        childStats[child.id].hours += duration;
      }
    }
  });
  
  // Find busiest day
  const busiestDay = Object.entries(dayCount).reduce(
    (max, [day, count]) => count > max.count ? { day: parseInt(day), count } : max,
    { day: 0, count: 0 }
  );
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    totalOccurrences: occurrences.length,
    totalHours,
    averagePerDay: totalDays > 0 ? occurrences.length / totalDays : 0,
    busiest: busiestDay,
    childStats
  };
};

/**
 * Generates a calendar grid with activity occurrences
 */
export const generateCalendarGrid = (
  activities: Activity[],
  children: Child[],
  month: number,
  year: number
): {
  weeks: Array<{
    days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      occurrences: ActivityOccurrence[];
    }>;
  }>;
} => {
  // Get the first day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the start of the calendar grid (Sunday of the first week)
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());
  
  // Get the end of the calendar grid (Saturday of the last week)
  const calendarEnd = new Date(lastDay);
  calendarEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  
  // Generate all occurrences for the calendar period
  const occurrences = generateActivityOccurrences(activities, children, calendarStart, calendarEnd);
  const occurrencesByDate = groupOccurrencesByDate(occurrences);
  
  const weeks: Array<{
    days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      occurrences: ActivityOccurrence[];
    }>;
  }> = [];
  
  const currentDate = new Date(calendarStart);
  const today = new Date();
  
  while (currentDate <= calendarEnd) {
    const week: {
      days: Array<{
        date: Date;
        isCurrentMonth: boolean;
        isToday: boolean;
        occurrences: ActivityOccurrence[];
      }>;
    } = { days: [] };
    
    // Generate 7 days for this week
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      const dateKey = date.toDateString();
      const dayOccurrences = occurrencesByDate.get(dateKey) || [];
      
      week.days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        occurrences: dayOccurrences
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push(week);
  }
  
  return { weeks };
};

/**
 * Finds potential scheduling conflicts across all activities
 */
export const findSchedulingConflicts = (
  activities: Activity[],
  children: Child[],
  lookAheadDays: number = 30
): Array<{
  date: Date;
  conflicts: Array<{
    occurrence1: ActivityOccurrence;
    occurrence2: ActivityOccurrence;
    overlapMinutes: number;
  }>;
}> => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + lookAheadDays);
  
  const occurrences = generateActivityOccurrences(activities, children, new Date(), endDate);
  const conflictsByDate: Record<string, Array<{
    occurrence1: ActivityOccurrence;
    occurrence2: ActivityOccurrence;
    overlapMinutes: number;
  }>> = {};
  
  // Check each occurrence against all others
  for (let i = 0; i < occurrences.length; i++) {
    for (let j = i + 1; j < occurrences.length; j++) {
      const occ1 = occurrences[i];
      const occ2 = occurrences[j];
      
      if (hasTimeConflict(occ1, occ2)) {
        const dateKey = occ1.date.toDateString();
        
        // Calculate overlap duration
        const start1 = occ1.startDateTime.getTime();
        const end1 = occ1.endDateTime.getTime();
        const start2 = occ2.startDateTime.getTime();
        const end2 = occ2.endDateTime.getTime();
        
        const overlapStart = Math.max(start1, start2);
        const overlapEnd = Math.min(end1, end2);
        const overlapMinutes = Math.round((overlapEnd - overlapStart) / (1000 * 60));
        
        if (!conflictsByDate[dateKey]) {
          conflictsByDate[dateKey] = [];
        }
        
        conflictsByDate[dateKey].push({
          occurrence1: occ1,
          occurrence2: occ2,
          overlapMinutes
        });
      }
    }
  }
  
  // Convert to array format
  return Object.entries(conflictsByDate).map(([dateString, conflicts]) => ({
    date: new Date(dateString),
    conflicts
  }));
};

/**
 * Exports activity occurrences to a structured format for external use
 */
export const exportOccurrences = (
  activities: Activity[],
  children: Child[],
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
): string => {
  const occurrences = generateActivityOccurrences(activities, children, startDate, endDate);
  
  if (format === 'csv') {
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Activity',
      'Child',
      'Location',
      'Duration (minutes)'
    ];
    
    const rows = occurrences.map(occ => [
      occ.date.toISOString().split('T')[0],
      occ.startDateTime.toLocaleTimeString([], { hour12: false }),
      occ.endDateTime.toLocaleTimeString([], { hour12: false }),
      occ.title,
      occ.childName,
      occ.location,
      getOccurrenceDuration(occ).toString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  // JSON format
  return JSON.stringify(
    occurrences.map(occ => ({
      date: occ.date.toISOString().split('T')[0],
      startTime: occ.startDateTime.toISOString(),
      endTime: occ.endDateTime.toISOString(),
      activity: occ.title,
      child: occ.childName,
      location: occ.location,
      durationMinutes: getOccurrenceDuration(occ)
    })),
    null,
    2
  );
};