import { describe, it, expect } from 'vitest';
import {
  calculateLayout,
  detectOverlaps,
  dateToMinutes,
  getOverflowCount,
  getOverflowActivities,
  getAllOverflowActivities,
  shouldDisplayActivity,
  type ActivityLayout,
} from '../calendarLayout';
import { ActivityOccurrence } from '@/types';

// Helper to create test activities
function createActivity(
  id: string,
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
  childName: string = 'Child A'
): ActivityOccurrence {
  const date = new Date('2024-01-15');
  const startDateTime = new Date(date);
  startDateTime.setHours(startHour, startMin, 0, 0);
  const endDateTime = new Date(date);
  endDateTime.setHours(endHour, endMin, 0, 0);

  return {
    activityId: id,
    date,
    startDateTime,
    endDateTime,
    title: `Activity ${id}`,
    location: 'Test Location',
    childName,
    childColor: '#FF0000',
  } as ActivityOccurrence;
}

describe('calculateLayout - Width and Position Calculations', () => {
  it('should calculate 50% width for 2 overlapping activities', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups);

    expect(layouts).toHaveLength(2);
    
    // Both activities should have 50% width
    layouts.forEach((layout) => {
      expect(layout.segments).toHaveLength(1);
      expect(layout.segments[0].width).toBe('50.00%');
      expect(layout.segments[0].columnCount).toBe(2);
    });

    // One should be at left: 0%, other at left: 50%
    const leftPositions = layouts.map(l => l.segments[0].left).sort();
    expect(leftPositions).toEqual(['0.00%', '50.00%']);
  });

  it('should calculate 33.33% width for 3 overlapping activities', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups);

    expect(layouts).toHaveLength(3);
    
    // All activities should have 33.33% width
    layouts.forEach((layout) => {
      expect(layout.segments).toHaveLength(1);
      expect(layout.segments[0].width).toBe('33.33%');
      expect(layout.segments[0].columnCount).toBe(3);
    });

    // Should be at left: 0%, 33.33%, 66.67%
    const leftPositions = layouts.map(l => parseFloat(l.segments[0].left)).sort((a, b) => a - b);
    expect(leftPositions[0]).toBeCloseTo(0, 1);
    expect(leftPositions[1]).toBeCloseTo(33.33, 1);
    expect(leftPositions[2]).toBeCloseTo(66.67, 1);
  });

  it('should handle dynamic width changes across time segments', () => {
    // Activity 1: 9:00-11:00
    // Activity 2: 9:00-10:00
    // Activity 3: 10:00-11:00
    // Expected: 9-10 has 2 activities (50% each), 10-11 has 2 activities (50% each)
    const activities = [
      createActivity('1', 9, 0, 11, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 10, 0, 11, 0, 'Child C'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups);

    // Activity 1 should have 2 segments (width changes at 10:00)
    const activity1Layout = layouts.find(l => l.activityId === '1');
    expect(activity1Layout).toBeDefined();
    expect(activity1Layout!.segments).toHaveLength(2);
    
    // First segment (9:00-10:00): 2 columns
    expect(activity1Layout!.segments[0].startMinutes).toBe(9 * 60);
    expect(activity1Layout!.segments[0].endMinutes).toBe(10 * 60);
    expect(activity1Layout!.segments[0].columnCount).toBe(2);
    expect(activity1Layout!.segments[0].width).toBe('50.00%');
    
    // Second segment (10:00-11:00): 2 columns
    expect(activity1Layout!.segments[1].startMinutes).toBe(10 * 60);
    expect(activity1Layout!.segments[1].endMinutes).toBe(11 * 60);
    expect(activity1Layout!.segments[1].columnCount).toBe(2);
    expect(activity1Layout!.segments[1].width).toBe('50.00%');
  });

  it('should calculate 25% width for 4 overlapping activities', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups);

    expect(layouts).toHaveLength(4);
    
    // All activities should have 25% width
    layouts.forEach((layout) => {
      expect(layout.segments).toHaveLength(1);
      expect(layout.segments[0].width).toBe('25.00%');
      expect(layout.segments[0].columnCount).toBe(4);
    });

    // Should be at left: 0%, 25%, 50%, 75%
    const leftPositions = layouts.map(l => parseFloat(l.segments[0].left)).sort((a, b) => a - b);
    expect(leftPositions[0]).toBeCloseTo(0, 1);
    expect(leftPositions[1]).toBeCloseTo(25, 1);
    expect(leftPositions[2]).toBeCloseTo(50, 1);
    expect(leftPositions[3]).toBeCloseTo(75, 1);
  });

  it('should handle 100% width for non-overlapping activities', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 10, 0, 11, 0, 'Child B'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups);

    expect(layouts).toHaveLength(2);
    
    // Both activities should have 100% width (no overlap)
    layouts.forEach((layout) => {
      expect(layout.segments).toHaveLength(1);
      expect(layout.segments[0].width).toBe('100.00%');
      expect(layout.segments[0].left).toBe('0.00%');
      expect(layout.segments[0].columnCount).toBe(1);
    });
  });

  it('should mark overflow activities when more than 4 overlap', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
      createActivity('5', 9, 0, 10, 0, 'Child E'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    expect(layouts).toHaveLength(5);
    
    // First 4 should not be overflow
    const displayedLayouts = layouts.filter(l => !l.isOverflow);
    expect(displayedLayouts).toHaveLength(4);
    
    // 5th should be overflow
    const overflowLayouts = layouts.filter(l => l.isOverflow);
    expect(overflowLayouts).toHaveLength(1);
  });
});

describe('Overflow Handling', () => {
  it('should detect overflow when more than 4 activities overlap', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
      createActivity('5', 9, 0, 10, 0, 'Child E'),
      createActivity('6', 9, 0, 10, 0, 'Child F'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    // Should have 6 layouts total
    expect(layouts).toHaveLength(6);
    
    // First 4 should not be overflow
    const displayedLayouts = layouts.filter(l => !l.isOverflow);
    expect(displayedLayouts).toHaveLength(4);
    
    // Last 2 should be overflow
    const overflowLayouts = layouts.filter(l => l.isOverflow);
    expect(overflowLayouts).toHaveLength(2);
    expect(overflowLayouts[0].isOverflow).toBe(true);
    expect(overflowLayouts[1].isOverflow).toBe(true);
  });

  it('should get overflow count at specific time', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
      createActivity('5', 9, 0, 10, 0, 'Child E'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    // At 9:30 (570 minutes), should have 1 overflow activity
    const count = getOverflowCount(570, layouts);
    expect(count).toBe(1);
  });

  it('should get overflow count of 0 when no overflow', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    const count = getOverflowCount(570, layouts);
    expect(count).toBe(0);
  });

  it('should get overflow activities for time segment', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
      createActivity('5', 9, 0, 10, 0, 'Child E'),
      createActivity('6', 10, 0, 11, 0, 'Child F'), // Not overlapping with first 5
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    // Get overflow activities for 9:00-10:00 segment
    const overflowActivities = getOverflowActivities(540, 600, layouts, activities);
    
    expect(overflowActivities).toHaveLength(1);
    expect(overflowActivities[0].activityId).toBe('5');
  });

  it('should get all overflow activities', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
      createActivity('5', 9, 0, 10, 0, 'Child E'),
      createActivity('6', 9, 0, 10, 0, 'Child F'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    const allOverflow = getAllOverflowActivities(layouts, activities);
    
    expect(allOverflow).toHaveLength(2);
    expect(allOverflow.map(a => a.activityId).sort()).toEqual(['5', '6']);
  });

  it('should correctly identify displayable activities', () => {
    const activities = [
      createActivity('1', 9, 0, 10, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
      createActivity('5', 9, 0, 10, 0, 'Child E'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    // First 4 should be displayable
    expect(shouldDisplayActivity('1', layouts)).toBe(true);
    expect(shouldDisplayActivity('2', layouts)).toBe(true);
    expect(shouldDisplayActivity('3', layouts)).toBe(true);
    expect(shouldDisplayActivity('4', layouts)).toBe(true);
    
    // 5th should not be displayable
    expect(shouldDisplayActivity('5', layouts)).toBe(false);
  });

  it('should handle partial overlap with overflow', () => {
    // Activities 1-5 overlap at 9:00-10:00
    // Activity 6 overlaps only with activity 1 at 10:00-11:00
    const activities = [
      createActivity('1', 9, 0, 11, 0, 'Child A'),
      createActivity('2', 9, 0, 10, 0, 'Child B'),
      createActivity('3', 9, 0, 10, 0, 'Child C'),
      createActivity('4', 9, 0, 10, 0, 'Child D'),
      createActivity('5', 9, 0, 10, 0, 'Child E'),
      createActivity('6', 10, 0, 11, 0, 'Child F'),
    ];

    const overlapGroups = detectOverlaps(activities);
    const layouts = calculateLayout(overlapGroups, 4);

    // At 9:30, should have 1 overflow (activity 5)
    const count930 = getOverflowCount(570, layouts);
    expect(count930).toBe(1);

    // At 10:30, should have 0 overflow (only activities 1 and 6)
    const count1030 = getOverflowCount(630, layouts);
    expect(count1030).toBe(0);

    // Get overflow for 9:00-10:00 segment
    const overflow9to10 = getOverflowActivities(540, 600, layouts, activities);
    expect(overflow9to10).toHaveLength(1);
    expect(overflow9to10[0].activityId).toBe('5');

    // Get overflow for 10:00-11:00 segment
    const overflow10to11 = getOverflowActivities(600, 660, layouts, activities);
    expect(overflow10to11).toHaveLength(0);
  });
});
