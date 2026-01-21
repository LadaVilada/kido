/**
 * Example usage of the recurring activity logic
 * This file demonstrates how to use the activity occurrence functions
 */

import { Activity, Child, ActivityOccurrence } from '@/types';
import { Timestamp } from 'firebase/firestore';
import {
  generateActivityOccurrences,
  generateWeeklyOccurrences,
  getNextNOccurrences,
  getOccurrencesForWeek,
  calculateActivityStatistics,
  findSchedulingConflicts,
  getRecurrenceDescription,
  validateActivitySchedule,
  formatOccurrenceTimeRange,
  getOccurrenceDuration,
  isOccurrenceUpcoming,
  getUpcomingOccurrences,
  convertTimezone,
  getTimezoneInfo
} from '../activityOccurrences';

// Example data
const exampleChildren: Child[] = [
  {
    id: 'child-1',
    userId: 'user-123',
    name: 'Emma',
    color: '#3b82f6',
    createdAt: Timestamp.now()
  },
  {
    id: 'child-2',
    userId: 'user-123',
    name: 'Liam',
    color: '#ef4444',
    createdAt: Timestamp.now()
  }
];

const exampleActivities: Activity[] = [
  {
    id: 'activity-1',
    userId: 'user-123',
    childId: 'child-1',
    title: 'Soccer Practice',
    location: 'Community Park',
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    startTime: '16:00',
    endTime: '17:30',
    timezone: 'America/New_York',
    createdAt: Timestamp.now()
  },
  {
    id: 'activity-2',
    userId: 'user-123',
    childId: 'child-1',
    title: 'Piano Lessons',
    location: 'Music School',
    daysOfWeek: [2], // Tuesday
    startTime: '15:30',
    endTime: '16:30',
    timezone: 'America/New_York',
    createdAt: Timestamp.now()
  },
  {
    id: 'activity-3',
    userId: 'user-123',
    childId: 'child-2',
    title: 'Basketball Practice',
    location: 'School Gym',
    daysOfWeek: [2, 4], // Tuesday, Thursday
    startTime: '17:00',
    endTime: '18:30',
    timezone: 'America/New_York',
    createdAt: Timestamp.now()
  }
];

/**
 * Example 1: Generate occurrences for a week
 */
function exampleWeeklyOccurrences() {
  console.log('=== Example 1: Weekly Occurrences ===');
  
  const startOfWeek = new Date('2024-01-01'); // Monday
  const occurrences = getOccurrencesForWeek(exampleActivities, exampleChildren, startOfWeek);
  
  console.log(`Generated ${occurrences.length} occurrences for the week of ${startOfWeek.toDateString()}`);
  
  occurrences.forEach(occ => {
    console.log(`- ${occ.childName}: ${occ.title} at ${occ.location}`);
    console.log(`  ${occ.date.toDateString()} ${formatOccurrenceTimeRange(occ)}`);
    console.log(`  Duration: ${getOccurrenceDuration(occ)} minutes\n`);
  });
}

/**
 * Example 2: Get next occurrences for a specific activity
 */
function exampleNextOccurrences() {
  console.log('=== Example 2: Next Occurrences ===');
  
  const soccerActivity = exampleActivities[0];
  const emma = exampleChildren[0];
  
  const nextOccurrences = getNextNOccurrences(soccerActivity, emma, 5);
  
  console.log(`Next 5 occurrences of ${soccerActivity.title} for ${emma.name}:`);
  
  nextOccurrences.forEach((occ, index) => {
    console.log(`${index + 1}. ${occ.date.toDateString()} ${formatOccurrenceTimeRange(occ)}`);
  });
}

/**
 * Example 3: Calculate activity statistics
 */
function exampleActivityStatistics() {
  console.log('\n=== Example 3: Activity Statistics ===');
  
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31'); // One month
  
  const stats = calculateActivityStatistics(exampleActivities, exampleChildren, startDate, endDate);
  
  console.log(`Statistics for ${startDate.toDateString()} to ${endDate.toDateString()}:`);
  console.log(`- Total occurrences: ${stats.totalOccurrences}`);
  console.log(`- Total hours: ${stats.totalHours.toFixed(1)}`);
  console.log(`- Average per day: ${stats.averagePerDay.toFixed(1)}`);
  console.log(`- Busiest day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][stats.busiest.day]} (${stats.busiest.count} activities)`);
  
  console.log('\nPer child:');
  Object.values(stats.childStats).forEach(child => {
    console.log(`- ${child.name}: ${child.count} activities, ${child.hours.toFixed(1)} hours`);
  });
}

/**
 * Example 4: Find scheduling conflicts
 */
function exampleSchedulingConflicts() {
  console.log('\n=== Example 4: Scheduling Conflicts ===');
  
  const conflicts = findSchedulingConflicts(exampleActivities, exampleChildren, 30);
  
  if (conflicts.length === 0) {
    console.log('No scheduling conflicts found in the next 30 days.');
  } else {
    console.log(`Found ${conflicts.length} days with conflicts:`);
    
    conflicts.forEach(conflict => {
      console.log(`\n${conflict.date.toDateString()}:`);
      conflict.conflicts.forEach(c => {
        console.log(`  Conflict: ${c.occurrence1.title} vs ${c.occurrence2.title}`);
        console.log(`  Overlap: ${c.overlapMinutes} minutes`);
      });
    });
  }
}

/**
 * Example 5: Validate activity schedules
 */
function exampleActivityValidation() {
  console.log('\n=== Example 5: Activity Validation ===');
  
  // Test valid activity
  const validActivity = exampleActivities[0];
  const validResult = validateActivitySchedule(validActivity);
  console.log(`${validActivity.title}: ${validResult.isValid ? 'Valid' : 'Invalid'}`);
  if (!validResult.isValid) {
    validResult.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  // Test invalid activity
  const invalidActivity = {
    ...validActivity,
    startTime: '18:00',
    endTime: '17:00', // End before start
    daysOfWeek: [] // No days selected
  };
  
  const invalidResult = validateActivitySchedule(invalidActivity);
  console.log(`Invalid activity: ${invalidResult.isValid ? 'Valid' : 'Invalid'}`);
  if (!invalidResult.isValid) {
    invalidResult.errors.forEach(error => console.log(`  - ${error}`));
  }
}

/**
 * Example 6: Recurrence descriptions
 */
function exampleRecurrenceDescriptions() {
  console.log('\n=== Example 6: Recurrence Descriptions ===');
  
  exampleActivities.forEach(activity => {
    const description = getRecurrenceDescription(activity);
    console.log(`${activity.title}: ${description}`);
  });
  
  // Additional examples
  const examples = [
    { daysOfWeek: [1, 2, 3, 4, 5], title: 'Weekday Activity' },
    { daysOfWeek: [0, 6], title: 'Weekend Activity' },
    { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Daily Activity' },
    { daysOfWeek: [1], title: 'Monday Only' }
  ];
  
  examples.forEach(example => {
    const description = getRecurrenceDescription(example as Activity);
    console.log(`${example.title}: ${description}`);
  });
}

/**
 * Example 7: Timezone handling
 */
function exampleTimezoneHandling() {
  console.log('\n=== Example 7: Timezone Handling ===');
  
  const now = new Date();
  
  // Convert between timezones
  const easternTime = convertTimezone(now, 'UTC', 'America/New_York');
  const pacificTime = convertTimezone(now, 'UTC', 'America/Los_Angeles');
  
  console.log(`Current UTC time: ${now.toISOString()}`);
  console.log(`Eastern time: ${easternTime.toLocaleString()}`);
  console.log(`Pacific time: ${pacificTime.toLocaleString()}`);
  
  // Get timezone info
  const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];
  
  console.log('\nTimezone information:');
  timezones.forEach(tz => {
    const info = getTimezoneInfo(tz);
    console.log(`${info.name}: ${info.abbreviation} (${info.offset}) ${info.observesDST ? 'DST' : 'No DST'}`);
  });
}

/**
 * Example 8: Upcoming activities
 */
function exampleUpcomingActivities() {
  console.log('\n=== Example 8: Upcoming Activities ===');
  
  const upcoming = getUpcomingOccurrences(exampleActivities, exampleChildren, 24);
  
  console.log(`Upcoming activities in the next 24 hours: ${upcoming.length}`);
  
  upcoming.forEach(occ => {
    const isUpcoming = isOccurrenceUpcoming(occ);
    console.log(`- ${occ.childName}: ${occ.title}`);
    console.log(`  ${formatOccurrenceTimeRange(occ)} ${isUpcoming ? '(Starting soon!)' : ''}`);
  });
}

/**
 * Run all examples
 */
function runAllExamples() {
  console.log('🏃‍♀️ Activity Occurrence Logic Examples\n');
  
  exampleWeeklyOccurrences();
  exampleNextOccurrences();
  exampleActivityStatistics();
  exampleSchedulingConflicts();
  exampleActivityValidation();
  exampleRecurrenceDescriptions();
  exampleTimezoneHandling();
  exampleUpcomingActivities();
  
  console.log('\n✅ All examples completed!');
}

export { runAllExamples };