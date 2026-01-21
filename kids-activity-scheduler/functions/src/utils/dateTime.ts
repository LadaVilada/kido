/**
 * Utility functions for date and time calculations
 */

/**
 * Get the next occurrence of a specific day of week from a given date
 */
export function getNextOccurrence(
  fromDate: Date,
  dayOfWeek: number,
  timeString: string,
  timezone: string
): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const result = new Date(fromDate);
  result.setHours(hours, minutes, 0, 0);
  
  // Calculate days until target day
  const currentDay = result.getDay();
  let daysUntil = dayOfWeek - currentDay;
  
  if (daysUntil < 0) {
    daysUntil += 7;
  } else if (daysUntil === 0 && result <= fromDate) {
    // If it's today but the time has passed, move to next week
    daysUntil = 7;
  }
  
  result.setDate(result.getDate() + daysUntil);
  
  return result;
}

/**
 * Get all occurrences of an activity within a date range
 */
export function getOccurrencesInRange(
  daysOfWeek: number[],
  startTime: string,
  startDate: Date,
  endDate: Date,
  timezone: string
): Date[] {
  const occurrences: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    for (const dayOfWeek of daysOfWeek) {
      const occurrence = getNextOccurrence(current, dayOfWeek, startTime, timezone);
      
      if (occurrence >= startDate && occurrence <= endDate) {
        occurrences.push(new Date(occurrence));
      }
    }
    
    // Move to next week
    current.setDate(current.getDate() + 7);
  }
  
  return occurrences.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Calculate notification time based on activity start time and offset
 */
export function calculateNotificationTime(
  activityStartTime: Date,
  offsetMinutes: number
): Date {
  const notificationTime = new Date(activityStartTime);
  notificationTime.setMinutes(notificationTime.getMinutes() - offsetMinutes);
  return notificationTime;
}

/**
 * Check if a date is within the next 24 hours
 */
export function isWithinNext24Hours(date: Date): boolean {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return date >= now && date <= twentyFourHoursFromNow;
}

/**
 * Format date for display in notifications
 */
export function formatNotificationTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}
