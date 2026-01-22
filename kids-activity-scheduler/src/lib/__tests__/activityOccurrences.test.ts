import { describe, it, expect } from 'vitest';
import {
  timeStringToMinutes,
  minutesToTimeString,
  generateOccurrencesForActivity,
  generateActivityOccurrences,
  getOccurrencesForWeek,
  getWeekStartDate,
  createDateTimeInTimezone,
  getTimezoneOffset,
  validateActivitySchedule,
  getRecurrenceDescription,
  hasTimeConflict,
  getOccurrenceDuration,
} from '../activityOccurrences';
import { Activity, Child, ActivityOccurrence } from '@/types';

describe('activityOccurrences', () => {
  const mockChild: Child = {
    id: 'child-1',
    familyId: 'user-1',
    name: 'Emma',
    color: '#3b82f6',
    createdAt: {} as any,
  };

  const mockActivity: Activity = {
    id: 'activity-1',
    userId: 'user-1',
    childId: 'child-1',
    title: 'Soccer Practice',
    location: 'Local Park',
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    startTime: '16:00',
    endTime: '17:30',
    timezone: 'America/New_York',
    createdAt: {} as any,
  };

  describe('timeStringToMinutes', () => {
    it('should convert time string to minutes since midnight', () => {
      expect(timeStringToMinutes('00:00')).toBe(0);
      expect(timeStringToMinutes('09:30')).toBe(570);
      expect(timeStringToMinutes('16:00')).toBe(960);
      expect(timeStringToMinutes('23:59')).toBe(1439);
    });
  });

  describe('minutesToTimeString', () => {
    it('should convert minutes to time string', () => {
      expect(minutesToTimeString(0)).toBe('00:00');
      expect(minutesToTimeString(570)).toBe('09:30');
      expect(minutesToTimeString(960)).toBe('16:00');
      expect(minutesToTimeString(1439)).toBe('23:59');
    });

    it('should pad single digits with zeros', () => {
      expect(minutesToTimeString(65)).toBe('01:05');
      expect(minutesToTimeString(125)).toBe('02:05');
    });
  });

  describe('generateOccurrencesForActivity', () => {
    it('should generate occurrences for specified days of week', () => {
      const startDate = new Date('2024-01-01'); // Monday
      const endDate = new Date('2024-01-07'); // Sunday

      const occurrences = generateOccurrencesForActivity(
        mockActivity,
        mockChild,
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(3); // Mon, Wed, Fri
      expect(occurrences[0].date.getDay()).toBe(1); // Monday
      expect(occurrences[1].date.getDay()).toBe(3); // Wednesday
      expect(occurrences[2].date.getDay()).toBe(5); // Friday
    });

    it('should set correct times for each occurrence', () => {
      const startDate = new Date('2024-01-01'); // Monday
      const endDate = new Date('2024-01-01');

      const occurrences = generateOccurrencesForActivity(
        mockActivity,
        mockChild,
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0].startDateTime.getHours()).toBe(16);
      expect(occurrences[0].startDateTime.getMinutes()).toBe(0);
      expect(occurrences[0].endDateTime.getHours()).toBe(17);
      expect(occurrences[0].endDateTime.getMinutes()).toBe(30);
    });

    it('should include child information in occurrences', () => {
      const startDate = new Date('2024-01-01'); // Monday
      const endDate = new Date('2024-01-01');

      const occurrences = generateOccurrencesForActivity(
        mockActivity,
        mockChild,
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0].childName).toBe('Emma');
      expect(occurrences[0].childColor).toBe('#3b82f6');
      expect(occurrences[0].title).toBe('Soccer Practice');
      expect(occurrences[0].location).toBe('Local Park');
    });

    it('should handle activities spanning multiple weeks', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-14');

      const occurrences = generateOccurrencesForActivity(
        mockActivity,
        mockChild,
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(6); // 3 days per week × 2 weeks
    });

    it('should handle single day activities', () => {
      const singleDayActivity: Activity = {
        ...mockActivity,
        daysOfWeek: [2], // Tuesday only
      };

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const occurrences = generateOccurrencesForActivity(
        singleDayActivity,
        mockChild,
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0].date.getDay()).toBe(2);
    });

    it('should handle daily activities', () => {
      const dailyActivity: Activity = {
        ...mockActivity,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
      };

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const occurrences = generateOccurrencesForActivity(
        dailyActivity,
        mockChild,
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(7);
    });
  });

  describe('generateActivityOccurrences', () => {
    it('should generate occurrences for multiple activities', () => {
      const activity2: Activity = {
        id: 'activity-2',
        userId: 'user-1',
        childId: 'child-1',
        title: 'Piano Lessons',
        location: 'Music School',
        daysOfWeek: [2, 4], // Tuesday, Thursday
        startTime: '15:00',
        endTime: '16:00',
        timezone: 'America/New_York',
        createdAt: {} as any,
      };

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const occurrences = generateActivityOccurrences(
        [mockActivity, activity2],
        [mockChild],
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(5); // 3 soccer + 2 piano
    });

    it('should sort occurrences by start time', () => {
      const activity2: Activity = {
        id: 'activity-2',
        userId: 'user-1',
        childId: 'child-1',
        title: 'Piano Lessons',
        location: 'Music School',
        daysOfWeek: [1], // Monday
        startTime: '14:00',
        endTime: '15:00',
        timezone: 'America/New_York',
        createdAt: {} as any,
      };

      const startDate = new Date('2024-01-01'); // Monday
      const endDate = new Date('2024-01-01');

      const occurrences = generateActivityOccurrences(
        [mockActivity, activity2],
        [mockChild],
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(2);
      expect(occurrences[0].title).toBe('Piano Lessons');
      expect(occurrences[1].title).toBe('Soccer Practice');
    });

    it('should skip activities with missing children', () => {
      const activity2: Activity = {
        ...mockActivity,
        id: 'activity-2',
        childId: 'non-existent-child',
      };

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const occurrences = generateActivityOccurrences(
        [mockActivity, activity2],
        [mockChild],
        startDate,
        endDate
      );

      expect(occurrences).toHaveLength(3); // Only mockActivity occurrences
    });
  });

  describe('getWeekStartDate', () => {
    it('should return Sunday as start of week', () => {
      const wednesday = new Date('2024-01-03');
      const weekStart = getWeekStartDate(wednesday);

      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getDate()).toBe(31); // Dec 31, 2023
    });

    it('should handle dates already on Sunday', () => {
      const sunday = new Date('2024-01-07');
      const weekStart = getWeekStartDate(sunday);

      expect(weekStart.getDay()).toBe(0);
      // When the date is already Sunday, it should return the same Sunday
      expect(weekStart.toDateString()).toBe(sunday.toDateString());
    });

    it('should set time to midnight', () => {
      const date = new Date('2024-01-03T15:30:00');
      const weekStart = getWeekStartDate(date);

      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
    });
  });

  describe('getOccurrencesForWeek', () => {
    it('should generate occurrences for a full week', () => {
      const weekStart = new Date('2024-01-07'); // Sunday

      const occurrences = getOccurrencesForWeek(
        [mockActivity],
        [mockChild],
        weekStart
      );

      expect(occurrences).toHaveLength(3); // Mon, Wed, Fri
    });

    it('should handle week starting mid-week', () => {
      const wednesday = new Date('2024-01-03');

      const occurrences = getOccurrencesForWeek(
        [mockActivity],
        [mockChild],
        wednesday
      );

      expect(occurrences).toHaveLength(3);
    });
  });

  describe('timezone handling', () => {
    it('should create date time in specified timezone', () => {
      const date = new Date('2024-01-01');
      const dateTime = createDateTimeInTimezone(date, 16, 0, 'America/New_York');

      expect(dateTime.getHours()).toBe(16);
      expect(dateTime.getMinutes()).toBe(0);
    });

    it('should handle different timezones', () => {
      const date = new Date('2024-01-01');
      const easternTime = createDateTimeInTimezone(date, 16, 0, 'America/New_York');
      const pacificTime = createDateTimeInTimezone(date, 16, 0, 'America/Los_Angeles');

      expect(easternTime).toBeDefined();
      expect(pacificTime).toBeDefined();
    });

    it('should get timezone offset', () => {
      const date = new Date('2024-01-01');
      const offset = getTimezoneOffset(date, 'America/New_York');

      expect(typeof offset).toBe('number');
    });
  });

  describe('validateActivitySchedule', () => {
    it('should validate correct activity schedule', () => {
      const result = validateActivitySchedule({
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty days of week', () => {
      const result = validateActivitySchedule({
        daysOfWeek: [],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one day must be selected');
    });

    it('should reject end time before start time', () => {
      const result = validateActivitySchedule({
        daysOfWeek: [1, 3, 5],
        startTime: '17:00',
        endTime: '16:00',
        timezone: 'America/New_York',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End time must be after start time');
    });

    it('should reject activities shorter than 15 minutes', () => {
      const result = validateActivitySchedule({
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '16:10',
        timezone: 'America/New_York',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Activity must be at least 15 minutes long');
    });

    it('should reject activities longer than 12 hours', () => {
      const result = validateActivitySchedule({
        daysOfWeek: [1, 3, 5],
        startTime: '08:00',
        endTime: '21:00',
        timezone: 'America/New_York',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Activity cannot be longer than 12 hours');
    });

    it('should reject missing timezone', () => {
      const result = validateActivitySchedule({
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Timezone is required');
    });
  });

  describe('getRecurrenceDescription', () => {
    it('should describe daily activities', () => {
      const activity: Activity = {
        ...mockActivity,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      };

      expect(getRecurrenceDescription(activity)).toBe('Every day');
    });

    it('should describe weekday activities', () => {
      const activity: Activity = {
        ...mockActivity,
        daysOfWeek: [1, 2, 3, 4, 5],
      };

      expect(getRecurrenceDescription(activity)).toBe('Weekdays (Mon-Fri)');
    });

    it('should describe weekend activities', () => {
      const activity: Activity = {
        ...mockActivity,
        daysOfWeek: [0, 6],
      };

      expect(getRecurrenceDescription(activity)).toBe('Weekends (Sat-Sun)');
    });

    it('should describe single day activities', () => {
      const activity: Activity = {
        ...mockActivity,
        daysOfWeek: [1],
      };

      expect(getRecurrenceDescription(activity)).toBe('Every Mon');
    });

    it('should describe custom day patterns', () => {
      const activity: Activity = {
        ...mockActivity,
        daysOfWeek: [1, 3, 5],
      };

      expect(getRecurrenceDescription(activity)).toBe('Mon, Wed, Fri');
    });

    it('should handle no recurring schedule', () => {
      const activity: Activity = {
        ...mockActivity,
        daysOfWeek: [],
      };

      expect(getRecurrenceDescription(activity)).toBe('No recurring schedule');
    });
  });

  describe('hasTimeConflict', () => {
    it('should detect overlapping occurrences on same date', () => {
      const occurrence1: ActivityOccurrence = {
        activityId: 'activity-1',
        date: new Date('2024-01-01'),
        startDateTime: new Date('2024-01-01T16:00:00'),
        endDateTime: new Date('2024-01-01T17:30:00'),
        title: 'Soccer Practice',
        location: 'Local Park',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      const occurrence2: ActivityOccurrence = {
        activityId: 'activity-2',
        date: new Date('2024-01-01'),
        startDateTime: new Date('2024-01-01T17:00:00'),
        endDateTime: new Date('2024-01-01T18:00:00'),
        title: 'Piano Lessons',
        location: 'Music School',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      expect(hasTimeConflict(occurrence1, occurrence2)).toBe(true);
    });

    it('should not detect conflict for non-overlapping times', () => {
      const occurrence1: ActivityOccurrence = {
        activityId: 'activity-1',
        date: new Date('2024-01-01'),
        startDateTime: new Date('2024-01-01T16:00:00'),
        endDateTime: new Date('2024-01-01T17:00:00'),
        title: 'Soccer Practice',
        location: 'Local Park',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      const occurrence2: ActivityOccurrence = {
        activityId: 'activity-2',
        date: new Date('2024-01-01'),
        startDateTime: new Date('2024-01-01T17:00:00'),
        endDateTime: new Date('2024-01-01T18:00:00'),
        title: 'Piano Lessons',
        location: 'Music School',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      expect(hasTimeConflict(occurrence1, occurrence2)).toBe(false);
    });

    it('should not detect conflict for different dates', () => {
      const occurrence1: ActivityOccurrence = {
        activityId: 'activity-1',
        date: new Date('2024-01-01'),
        startDateTime: new Date('2024-01-01T16:00:00'),
        endDateTime: new Date('2024-01-01T17:30:00'),
        title: 'Soccer Practice',
        location: 'Local Park',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      const occurrence2: ActivityOccurrence = {
        activityId: 'activity-2',
        date: new Date('2024-01-02'),
        startDateTime: new Date('2024-01-02T16:00:00'),
        endDateTime: new Date('2024-01-02T17:30:00'),
        title: 'Piano Lessons',
        location: 'Music School',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      expect(hasTimeConflict(occurrence1, occurrence2)).toBe(false);
    });
  });

  describe('getOccurrenceDuration', () => {
    it('should calculate duration in minutes', () => {
      const occurrence: ActivityOccurrence = {
        activityId: 'activity-1',
        date: new Date('2024-01-01'),
        startDateTime: new Date('2024-01-01T16:00:00'),
        endDateTime: new Date('2024-01-01T17:30:00'),
        title: 'Soccer Practice',
        location: 'Local Park',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      expect(getOccurrenceDuration(occurrence)).toBe(90);
    });

    it('should handle different durations', () => {
      const occurrence: ActivityOccurrence = {
        activityId: 'activity-1',
        date: new Date('2024-01-01'),
        startDateTime: new Date('2024-01-01T14:00:00'),
        endDateTime: new Date('2024-01-01T15:00:00'),
        title: 'Piano Lessons',
        location: 'Music School',
        childName: 'Emma',
        childColor: '#3b82f6',
      };

      expect(getOccurrenceDuration(occurrence)).toBe(60);
    });
  });
});
