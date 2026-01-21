/**
 * Date and time utility functions for activity scheduling
 */

/**
 * Gets the current user's timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Formats a date for display
 */
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
};

/**
 * Formats a time for display
 */
export const formatTime = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  return date.toLocaleTimeString(undefined, { ...defaultOptions, ...options });
};

/**
 * Formats a date and time for display
 */
export const formatDateTime = (date: Date): string => {
  return `${formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })} at ${formatTime(date)}`;
};

/**
 * Gets the relative time description (e.g., "in 2 hours", "30 minutes ago")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  if (Math.abs(diffMinutes) < 1) {
    return 'now';
  }
  
  if (diffMinutes > 0) {
    // Future
    if (diffMinutes < 60) {
      return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
    } else if (diffMinutes < 24 * 60) {
      const hours = Math.round(diffMinutes / 60);
      return `in ${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      const days = Math.round(diffMinutes / (24 * 60));
      return `in ${days} day${days === 1 ? '' : 's'}`;
    }
  } else {
    // Past
    const absMinutes = Math.abs(diffMinutes);
    if (absMinutes < 60) {
      return `${absMinutes} minute${absMinutes === 1 ? '' : 's'} ago`;
    } else if (absMinutes < 24 * 60) {
      const hours = Math.round(absMinutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.round(absMinutes / (24 * 60));
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  }
};

/**
 * Checks if two dates are on the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

/**
 * Checks if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Checks if a date is tomorrow
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
};

/**
 * Checks if a date is this week
 */
export const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
};

/**
 * Gets the start of the day for a given date
 */
export const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Gets the end of the day for a given date
 */
export const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Gets the start of the week for a given date (Sunday)
 */
export const getStartOfWeek = (date: Date): Date => {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

/**
 * Gets the end of the week for a given date (Saturday)
 */
export const getEndOfWeek = (date: Date): Date => {
  const endOfWeek = new Date(date);
  const dayOfWeek = endOfWeek.getDay();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - dayOfWeek));
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

/**
 * Gets an array of dates for a week starting from the given date
 */
export const getWeekDates = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Adds days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adds weeks to a date
 */
export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

/**
 * Gets the number of days between two dates
 */
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const start = getStartOfDay(startDate);
  const end = getStartOfDay(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Parses a time string (HH:MM) and returns hours and minutes
 */
export const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Creates a time string from hours and minutes
 */
export const createTimeString = (hours: number, minutes: number): string => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Validates a time string format
 */
export const isValidTimeString = (timeString: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Gets common timezone options for the US
 */
export const getTimezoneOptions = (): { value: string; label: string }[] => {
  return [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  ];
};

/**
 * Gets the display name for a timezone
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const option = getTimezoneOptions().find(opt => opt.value === timezone);
  return option?.label || timezone;
};
/**

 * Creates a date in a specific timezone from date components
 */
export const createDateInTimezone = (
  year: number,
  month: number, // 0-based (0 = January)
  day: number,
  hour: number = 0,
  minute: number = 0,
  timezone: string
): Date => {
  try {
    // Create a date string in ISO format
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const hourStr = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');
    
    const isoString = `${year}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:00`;
    
    // Create a temporary date
    const tempDate = new Date(isoString);
    
    // Get timezone offsets
    const localOffset = tempDate.getTimezoneOffset();
    const targetOffset = getTimezoneOffsetForDate(tempDate, timezone);
    
    // Adjust for timezone difference
    const offsetDifference = (localOffset - targetOffset) * 60 * 1000;
    return new Date(tempDate.getTime() + offsetDifference);
  } catch (error) {
    // Fallback to local timezone
    return new Date(year, month, day, hour, minute);
  }
};

/**
 * Gets the timezone offset for a specific date and timezone
 */
export const getTimezoneOffsetForDate = (date: Date, timezone: string): number => {
  try {
    // Use Intl.DateTimeFormat to get timezone-aware formatting
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    // Calculate offset in minutes
    return Math.round((utcDate.getTime() - tzDate.getTime()) / (1000 * 60));
  } catch (error) {
    return date.getTimezoneOffset();
  }
};

/**
 * Converts a time string and date to a full Date object in a specific timezone
 */
export const timeStringToDateInTimezone = (
  timeString: string,
  date: Date,
  timezone: string
): Date => {
  const { hours, minutes } = parseTimeString(timeString);
  return createDateInTimezone(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    timezone
  );
};

/**
 * Gets the week number of the year for a given date
 */
export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Gets the month name for a given month number
 */
export const getMonthName = (month: number, short: boolean = false): string => {
  const date = new Date(2024, month, 1);
  return date.toLocaleDateString(undefined, { 
    month: short ? 'short' : 'long' 
  });
};

/**
 * Gets the day name for a given day number (0 = Sunday)
 */
export const getDayName = (day: number, short: boolean = false): string => {
  const date = new Date(2024, 0, day + 1); // January 1, 2024 was a Monday, so day 1
  // Adjust to get the correct day
  date.setDate(date.getDate() + (day === 0 ? 6 : day - 1));
  return date.toLocaleDateString(undefined, { 
    weekday: short ? 'short' : 'long' 
  });
};

/**
 * Checks if a year is a leap year
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Gets the number of days in a month
 */
export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Rounds a date to the nearest specified minutes
 */
export const roundToNearestMinutes = (date: Date, minutes: number): Date => {
  const ms = 1000 * 60 * minutes;
  return new Date(Math.round(date.getTime() / ms) * ms);
};

/**
 * Gets business hours for a given date (default 9 AM to 5 PM)
 */
export const getBusinessHours = (
  date: Date,
  startHour: number = 9,
  endHour: number = 17
): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(startHour, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(endHour, 0, 0, 0);
  
  return { start, end };
};

/**
 * Checks if a date falls within business hours
 */
export const isBusinessHours = (
  date: Date,
  startHour: number = 9,
  endHour: number = 17
): boolean => {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  
  // Check if it's a weekday (Monday = 1, Friday = 5)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  // Check if it's within business hours
  const isWithinHours = hour >= startHour && hour < endHour;
  
  return isWeekday && isWithinHours;
};

/**
 * Calculates the duration between two dates in various units
 */
export const calculateDuration = (
  startDate: Date,
  endDate: Date,
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' = 'minutes'
): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  
  switch (unit) {
    case 'milliseconds':
      return diffMs;
    case 'seconds':
      return Math.round(diffMs / 1000);
    case 'minutes':
      return Math.round(diffMs / (1000 * 60));
    case 'hours':
      return Math.round(diffMs / (1000 * 60 * 60));
    case 'days':
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    default:
      return Math.round(diffMs / (1000 * 60));
  }
};

/**
 * Formats a duration in a human-readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Gets the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return num + 'st';
  }
  if (j === 2 && k !== 12) {
    return num + 'nd';
  }
  if (j === 3 && k !== 13) {
    return num + 'rd';
  }
  return num + 'th';
};

/**
 * Creates a date range array between two dates
 */
export const createDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Checks if two date ranges overlap
 */
export const dateRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 <= end2 && start2 <= end1;
};