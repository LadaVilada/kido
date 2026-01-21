import { 
  CreateChildInput, 
  UpdateChildInput, 
  CreateActivityInput, 
  UpdateActivityInput,
  ValidationResult,
  ValidationError,
  CHILD_COLORS,
  DAYS_OF_WEEK
} from '@/types';

// Helper function to create validation result
const createValidationResult = (errors: ValidationError[]): ValidationResult => ({
  isValid: errors.length === 0,
  errors,
});

// Helper function to add error
const addError = (errors: ValidationError[], field: string, message: string): void => {
  errors.push({ field, message });
};

// Child validation functions
export const validateChildName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!name || name.trim().length === 0) {
    addError(errors, 'name', 'Child name is required');
  } else if (name.trim().length < 2) {
    addError(errors, 'name', 'Child name must be at least 2 characters long');
  } else if (name.trim().length > 50) {
    addError(errors, 'name', 'Child name must be less than 50 characters');
  } else if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    addError(errors, 'name', 'Child name can only contain letters, spaces, hyphens, and apostrophes');
  }
  
  return errors;
};

export const validateChildColor = (color: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!color) {
    addError(errors, 'color', 'Color selection is required');
  } else if (!CHILD_COLORS.includes(color as any)) {
    addError(errors, 'color', 'Please select a valid color');
  }
  
  return errors;
};

export const validateCreateChild = (input: CreateChildInput): ValidationResult => {
  const errors: ValidationError[] = [];
  
  errors.push(...validateChildName(input.name));
  errors.push(...validateChildColor(input.color));
  
  return createValidationResult(errors);
};

export const validateUpdateChild = (input: UpdateChildInput): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (input.name !== undefined) {
    errors.push(...validateChildName(input.name));
  }
  
  if (input.color !== undefined) {
    errors.push(...validateChildColor(input.color));
  }
  
  return createValidationResult(errors);
};

// Activity validation functions
export const validateActivityTitle = (title: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!title || title.trim().length === 0) {
    addError(errors, 'title', 'Activity title is required');
  } else if (title.trim().length < 2) {
    addError(errors, 'title', 'Activity title must be at least 2 characters long');
  } else if (title.trim().length > 100) {
    addError(errors, 'title', 'Activity title must be less than 100 characters');
  }
  
  return errors;
};

export const validateActivityLocation = (location: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!location || location.trim().length === 0) {
    addError(errors, 'location', 'Location is required');
  } else if (location.trim().length < 2) {
    addError(errors, 'location', 'Location must be at least 2 characters long');
  } else if (location.trim().length > 200) {
    addError(errors, 'location', 'Location must be less than 200 characters');
  }
  
  return errors;
};

export const validateDaysOfWeek = (daysOfWeek: number[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    addError(errors, 'daysOfWeek', 'At least one day must be selected');
  } else {
    const validDays = DAYS_OF_WEEK.map(day => day.value);
    const invalidDays = daysOfWeek.filter(day => !validDays.includes(day as any));
    
    if (invalidDays.length > 0) {
      addError(errors, 'daysOfWeek', 'Invalid day selection');
    }
    
    // Remove duplicates and check again
    const uniqueDays = [...new Set(daysOfWeek)];
    if (uniqueDays.length !== daysOfWeek.length) {
      addError(errors, 'daysOfWeek', 'Duplicate days are not allowed');
    }
  }
  
  return errors;
};

export const validateTime = (time: string, fieldName: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!time) {
    addError(errors, fieldName, `${fieldName} is required`);
    return errors;
  }
  
  // Validate time format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    addError(errors, fieldName, 'Time must be in HH:MM format (24-hour)');
  }
  
  return errors;
};

export const validateTimeRange = (startTime: string, endTime: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // First validate individual times
  errors.push(...validateTime(startTime, 'startTime'));
  errors.push(...validateTime(endTime, 'endTime'));
  
  // If both times are valid, check the range
  if (errors.length === 0) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (startMinutes >= endMinutes) {
      addError(errors, 'endTime', 'End time must be after start time');
    }
    
    // Check for reasonable duration (at least 15 minutes, max 12 hours)
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 15) {
      addError(errors, 'endTime', 'Activity must be at least 15 minutes long');
    } else if (durationMinutes > 720) { // 12 hours
      addError(errors, 'endTime', 'Activity cannot be longer than 12 hours');
    }
  }
  
  return errors;
};

export const validateTimezone = (timezone: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!timezone) {
    addError(errors, 'timezone', 'Timezone is required');
    return errors;
  }
  
  // Basic timezone validation - check if it's a valid IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch (error) {
    addError(errors, 'timezone', 'Invalid timezone');
  }
  
  return errors;
};

export const validateChildId = (childId: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!childId || childId.trim().length === 0) {
    addError(errors, 'childId', 'Child selection is required');
  }
  
  return errors;
};

export const validateCreateActivity = (input: CreateActivityInput): ValidationResult => {
  const errors: ValidationError[] = [];
  
  errors.push(...validateChildId(input.childId));
  errors.push(...validateActivityTitle(input.title));
  errors.push(...validateActivityLocation(input.location));
  errors.push(...validateDaysOfWeek(input.daysOfWeek));
  errors.push(...validateTimeRange(input.startTime, input.endTime));
  errors.push(...validateTimezone(input.timezone));
  
  return createValidationResult(errors);
};

export const validateUpdateActivity = (input: UpdateActivityInput): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (input.childId !== undefined) {
    errors.push(...validateChildId(input.childId));
  }
  
  if (input.title !== undefined) {
    errors.push(...validateActivityTitle(input.title));
  }
  
  if (input.location !== undefined) {
    errors.push(...validateActivityLocation(input.location));
  }
  
  if (input.daysOfWeek !== undefined) {
    errors.push(...validateDaysOfWeek(input.daysOfWeek));
  }
  
  // If both start and end times are provided, validate the range
  if (input.startTime !== undefined && input.endTime !== undefined) {
    errors.push(...validateTimeRange(input.startTime, input.endTime));
  } else {
    // Validate individual times if provided
    if (input.startTime !== undefined) {
      errors.push(...validateTime(input.startTime, 'startTime'));
    }
    if (input.endTime !== undefined) {
      errors.push(...validateTime(input.endTime, 'endTime'));
    }
  }
  
  if (input.timezone !== undefined) {
    errors.push(...validateTimezone(input.timezone));
  }
  
  return createValidationResult(errors);
};

// Utility functions for form validation
export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  const error = errors.find(err => err.field === field);
  return error?.message;
};

export const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some(err => err.field === field);
};

// Time utility functions
export const formatTime = (time: string): string => {
  try {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    return time;
  }
};

export const parseTime = (timeString: string): { hour: number; minute: number } | null => {
  try {
    const [hour, minute] = timeString.split(':').map(Number);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Get user's timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};