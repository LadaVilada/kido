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