import { describe, it, expect } from 'vitest';
import {
  calculateLayout,
  detectOverlaps,
  dateToMinutes,
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
