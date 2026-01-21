import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  userId: string;
  email: string;
  createdAt: Timestamp;
  notificationSettings: {
    oneHour: boolean;
    thirtyMinutes: boolean;
  };
}

// Child types
export interface Child {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Timestamp;
}

// Create child input type (without generated fields)
export interface CreateChildInput {
  name: string;
  color: string;
}

// Update child input type
export interface UpdateChildInput {
  name?: string;
  color?: string;
}

// Activity types
export interface Activity {
  id: string;
  userId: string;
  childId: string;
  title: string;
  location: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
  timezone: string; // IANA timezone identifier
  createdAt: Timestamp;
}

// Create activity input type (without generated fields)
export interface CreateActivityInput {
  childId: string;
  title: string;
  location: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
}

// Update activity input type
export interface UpdateActivityInput {
  childId?: string;
  title?: string;
  location?: string;
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

// Activity Occurrence (computed client-side)
export interface ActivityOccurrence {
  activityId: string;
  date: Date;
  startDateTime: Date;
  endDateTime: Date;
  title: string;
  location: string;
  childName: string;
  childColor: string;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Form state types
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Color options for children
export const CHILD_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#6366f1', // indigo
  '#d946ef', // fuchsia
] as const;

export type ChildColor = typeof CHILD_COLORS[number];

// Days of week constants
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

// Time format utilities
export interface TimeSlot {
  hour: number;
  minute: number;
}

// Notification types
export interface NotificationSettings {
  oneHour: boolean;
  thirtyMinutes: boolean;
}

// Calendar view types
export interface CalendarWeek {
  startDate: Date;
  endDate: Date;
  days: CalendarDay[];
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  activities: ActivityOccurrence[];
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}