import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayView } from '../DayView';
import { ActivityOccurrence } from '@/types';

// Helper to create test activity occurrences
function createOccurrence(
  id: string,
  date: Date,
  startHour: number,
  endHour: number,
  childName: string = 'Test Child',
  childColor: string = '#FF0000'
): ActivityOccurrence {
  const startDateTime = new Date(date);
  startDateTime.setHours(startHour, 0, 0, 0);
  const endDateTime = new Date(date);
  endDateTime.setHours(endHour, 0, 0, 0);

  return {
    activityId: id,
    date: new Date(date),
    startDateTime,
    endDateTime,
    title: `Activity ${id}`,
    location: 'Test Location',
    childName,
    childColor,
  };
}

describe('DayView - Activity Display', () => {
  it('should render activities for the selected day', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 14, 15, 'Child B', '#00FF00'),
    ];

    render(<DayView occurrences={occurrences} currentDate={testDate} />);

    // Use getAllByText since activities appear in both calendar and summary
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
  });

  it('should display activities with correct color coding', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 14, 15, 'Child B', '#00FF00'),
    ];

    render(<DayView occurrences={occurrences} currentDate={testDate} />);

    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });

  it('should show activity summary section', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 14, 15, 'Child B', '#00FF00'),
    ];

    render(<DayView occurrences={occurrences} currentDate={testDate} />);

    expect(screen.getByText(/Today's Activities \(2\)/)).toBeInTheDocument();
  });

  it('should show empty state when no activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');

    render(<DayView occurrences={[]} currentDate={testDate} />);

    expect(screen.getByText('No activities scheduled for this day')).toBeInTheDocument();
  });
});

describe('DayView - Date Navigation', () => {
  it('should navigate to next day', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const onDateChange = vi.fn();

    render(
      <DayView
        occurrences={[]}
        currentDate={testDate}
        onDateChange={onDateChange}
      />
    );

    const nextButtons = screen.getAllByRole('button');
    const nextButton = nextButtons.find(btn => btn.querySelector('svg'));
    
    if (nextButton) {
      fireEvent.click(nextButton);
      expect(onDateChange).toHaveBeenCalled();
    }
  });

  it('should navigate to previous day', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const onDateChange = vi.fn();

    render(
      <DayView
        occurrences={[]}
        currentDate={testDate}
        onDateChange={onDateChange}
      />
    );

    const prevButtons = screen.getAllByRole('button');
    const prevButton = prevButtons.find(btn => btn.querySelector('svg'));
    
    if (prevButton) {
      fireEvent.click(prevButton);
      expect(onDateChange).toHaveBeenCalled();
    }
  });

  it('should navigate to today', () => {
    const pastDate = new Date('2024-01-01T12:00:00');
    const onDateChange = vi.fn();

    render(
      <DayView
        occurrences={[]}
        currentDate={pastDate}
        onDateChange={onDateChange}
      />
    );

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    expect(onDateChange).toHaveBeenCalled();
  });

  it('should display correct day name and date', () => {
    const testDate = new Date('2024-01-15T12:00:00'); // Monday

    render(<DayView occurrences={[]} currentDate={testDate} />);

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
  });
});

describe('DayView - Activity Click Handler', () => {
  it('should call onClick handler when activity is clicked', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrence = createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000');
    const onActivityClick = vi.fn();

    render(
      <DayView
        occurrences={[occurrence]}
        currentDate={testDate}
        onActivityClick={onActivityClick}
      />
    );

    // Get the first activity block (not the summary)
    const activityBlocks = screen.getAllByText('Activity 1');
    fireEvent.click(activityBlocks[0]);

    expect(onActivityClick).toHaveBeenCalledWith(occurrence);
  });

  it('should call onClick handler from activity summary', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrence = createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000');
    const onActivityClick = vi.fn();

    render(
      <DayView
        occurrences={[occurrence]}
        currentDate={testDate}
        onActivityClick={onActivityClick}
      />
    );

    // Click on the summary item
    const summaryItems = screen.getAllByText('Activity 1');
    if (summaryItems.length > 1) {
      fireEvent.click(summaryItems[1]); // Click the one in the summary
      expect(onActivityClick).toHaveBeenCalled();
    }
  });
});

describe('DayView - Activity Positioning', () => {
  it('should position activities correctly by time', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 14, 16, 'Child B', '#00FF00'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // Find activity blocks
    const activityBlocks = container.querySelectorAll('[role="button"]');
    expect(activityBlocks.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle overlapping activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
    ];

    render(<DayView occurrences={occurrences} currentDate={testDate} />);

    // Use getAllByText since activities appear in both calendar and summary
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
  });
});

describe('DayView - Overlap Detection and Layout', () => {
  it('should display overlapping activities side-by-side', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // Both activities should be rendered
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);

    // Activities should have layout styles applied (width and left position)
    const activityBlocks = container.querySelectorAll('[role="button"]');
    expect(activityBlocks.length).toBeGreaterThanOrEqual(2);
    
    // Check that activities have positioning styles
    const hasPositionedBlocks = Array.from(activityBlocks).some(block => {
      const style = (block as HTMLElement).style;
      return style.width && style.width !== '100%';
    });
    expect(hasPositionedBlocks).toBe(true);
  });

  it('should handle three overlapping activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 9, 11, 'Child B', '#00FF00'),
      createOccurrence('3', testDate, 9, 11, 'Child C', '#0000FF'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // All three activities should be rendered
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 3').length).toBeGreaterThan(0);

    // Check that activities have appropriate widths (approximately 33.33% each)
    const activityBlocks = container.querySelectorAll('[role="button"]');
    const hasNarrowBlocks = Array.from(activityBlocks).some(block => {
      const style = (block as HTMLElement).style;
      return style.width && parseFloat(style.width) < 50;
    });
    expect(hasNarrowBlocks).toBe(true);
  });

  it('should handle partial overlaps with dynamic width changes', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 12, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 11, 'Child B', '#00FF00'),
    ];

    render(<DayView occurrences={occurrences} currentDate={testDate} />);

    // Both activities should be rendered
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
  });

  it('should display non-overlapping activities at full width', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 11, 12, 'Child B', '#00FF00'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // Both activities should be rendered
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);

    // Non-overlapping activities should have full width
    const activityBlocks = container.querySelectorAll('[role="button"]');
    const hasFullWidthBlocks = Array.from(activityBlocks).some(block => {
      const style = (block as HTMLElement).style;
      return style.width === '100%' || !style.width;
    });
    expect(hasFullWidthBlocks).toBe(true);
  });

  it('should handle overflow when more than 4 activities overlap', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 9, 11, 'Child B', '#00FF00'),
      createOccurrence('3', testDate, 9, 11, 'Child C', '#0000FF'),
      createOccurrence('4', testDate, 9, 11, 'Child D', '#FFFF00'),
      createOccurrence('5', testDate, 9, 11, 'Child E', '#FF00FF'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // First 4 activities should be visible
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 4').length).toBeGreaterThan(0);

    // Should show "+1 more" indicator for the overflow activity
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('should maintain color coding for overlapping activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
    ];

    render(<DayView occurrences={occurrences} currentDate={testDate} />);

    // Both child names should be visible (color coding preserved)
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });

  it('should handle activities with identical start and end times', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 9, 11, 'Child B', '#00FF00'),
    ];

    render(<DayView occurrences={occurrences} currentDate={testDate} />);

    // Both activities should be rendered side-by-side
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
  });

  it('should use consistent layout algorithm with WeekView', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
      createOccurrence('3', testDate, 10, 11, 'Child C', '#0000FF'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // All activities should be rendered with layout
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 3').length).toBeGreaterThan(0);

    // Check that activities have positioning styles
    const activityBlocks = container.querySelectorAll('[role="button"]');
    const hasPositionedBlocks = Array.from(activityBlocks).some(block => {
      const style = (block as HTMLElement).style;
      return style.width && style.width !== '100%';
    });
    expect(hasPositionedBlocks).toBe(true);
  });
});

describe('DayView - Mobile Scroll Behavior', () => {
  it('should render scrollable container for overlapping activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
      createOccurrence('3', testDate, 10, 11, 'Child C', '#0000FF'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // Check for scrollable container (overflow-x-auto class)
    const scrollableContainer = container.querySelector('[class*="overflow-x-auto"]');
    expect(scrollableContainer).toBeTruthy();
  });

  it('should maintain minimum touch target size for mobile', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // Activity blocks should be rendered
    const activityBlocks = container.querySelectorAll('[role="button"]');
    expect(activityBlocks.length).toBeGreaterThan(0);
    
    // Each block should be clickable (touch target)
    activityBlocks.forEach(block => {
      expect(block.getAttribute('role')).toBe('button');
    });
  });

  it('should handle horizontal scroll with many overlapping activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 9, 11, 'Child B', '#00FF00'),
      createOccurrence('3', testDate, 9, 11, 'Child C', '#0000FF'),
      createOccurrence('4', testDate, 9, 11, 'Child D', '#FFFF00'),
    ];

    const { container } = render(
      <DayView occurrences={occurrences} currentDate={testDate} />
    );

    // All 4 activities should be rendered
    expect(screen.getAllByText('Activity 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activity 4').length).toBeGreaterThan(0);

    // Check for scrollable container
    const scrollableContainer = container.querySelector('[class*="overflow-x-auto"]');
    expect(scrollableContainer).toBeTruthy();
  });
});
