// Export all services
export { ChildrenService } from './childrenService';
export { ActivitiesService } from './activitiesService';
export { NotificationService } from './notificationService';

// Re-export types for convenience
export type {
  Child,
  Activity,
  CreateChildInput,
  UpdateChildInput,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityOccurrence,
  LoadingState,
  ValidationResult,
  ValidationError
} from '@/types';

// Re-export utility functions
export {
  generateActivityOccurrences,
  getOccurrencesForDate,
  getOccurrencesForWeek,
  getWeekStartDate,
  getWeekEndDate,
  formatOccurrenceTimeRange,
  isOccurrenceActive,
  isOccurrencePast,
  isOccurrenceUpcoming
} from '@/lib/activityOccurrences';

export {
  validateCreateChild,
  validateUpdateChild,
  validateCreateActivity,
  validateUpdateActivity,
  formatTime,
  getUserTimezone
} from '@/lib/validation';

export {
  handleFirestoreError,
  timestampToDate,
  dateToTimestamp
} from '@/lib/firestore';