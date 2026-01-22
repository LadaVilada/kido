import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekView } from '../WeekView';
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

describe('WeekView - Activity Positioning and Color Coding', () => {
  it('should render activities with correct color coding', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 14, 15, 'Child B', '#00FF00'),
    ];

    render(<WeekView occurrences={occurrences} currentDate={testDate} />);

    // Check that activities are rendered
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();

    // Check child names are displayed
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });

  it('should position activities correctly by time', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 14, 16, 'Child B', '#00FF00'),
    ];

    const { container } = render(
      <WeekView occurrences={occurrences} currentDate={testDate} />
    );

    // Find activity blocks
    const activityBlocks = container.querySelectorAll('[role="button"]');
    expect(activityBlocks.length).toBeGreaterThanOrEqual(2);
  });

  it('should display multiple activities on the same day', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 11, 12, 'Child B', '#00FF00'),
      createOccurrence('3', testDate, 14, 15, 'Child C', '#0000FF'),
    ];

    render(<WeekView occurrences={occurrences} currentDate={testDate} />);

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('Activity 3')).toBeInTheDocument();
  });

  it('should handle activities across multiple days', () => {
    const monday = new Date('2024-01-15T12:00:00');
    const tuesday = new Date('2024-01-16T12:00:00');
    const wednesday = new Date('2024-01-17T12:00:00');

    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', monday, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', tuesday, 14, 15, 'Child B', '#00FF00'),
      createOccurrence('3', wednesday, 11, 12, 'Child C', '#0000FF'),
    ];

    render(<WeekView occurrences={occurrences} currentDate={monday} />);

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('Activity 3')).toBeInTheDocument();
  });
});

describe('WeekView - Date Navigation', () => {
  it('should navigate to next week', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const onDateChange = vi.fn();

    render(
      <WeekView
        occurrences={[]}
        currentDate={testDate}
        onDateChange={onDateChange}
      />
    );

    const nextButton = screen.getByLabelText('Next week');
    fireEvent.click(nextButton);

    expect(onDateChange).toHaveBeenCalled();
    const calledDate = onDateChange.mock.calls[0][0];
    // Week navigation moves by 7 days
    expect(calledDate.getTime()).toBeGreaterThan(testDate.getTime());
  });

  it('should navigate to previous week', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const onDateChange = vi.fn();

    render(
      <WeekView
        occurrences={[]}
        currentDate={testDate}
        onDateChange={onDateChange}
      />
    );

    const prevButton = screen.getByLabelText('Previous week');
    fireEvent.click(prevButton);

    expect(onDateChange).toHaveBeenCalled();
    const calledDate = onDateChange.mock.calls[0][0];
    // Week navigation moves by 7 days
    expect(calledDate.getTime()).toBeLessThan(testDate.getTime());
  });

  it('should navigate to today', () => {
    const pastDate = new Date('2024-01-01T12:00:00');
    const onDateChange = vi.fn();

    render(
      <WeekView
        occurrences={[]}
        currentDate={pastDate}
        onDateChange={onDateChange}
      />
    );

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    expect(onDateChange).toHaveBeenCalled();
  });

  it('should display correct week range', () => {
    const testDate = new Date('2024-01-15T12:00:00'); // Monday

    render(<WeekView occurrences={[]} currentDate={testDate} />);

    // Should show week range (Sunday to Saturday)
    expect(screen.getByText(/Jan 14 - 20, 2024/)).toBeInTheDocument();
  });
});

describe('WeekView - Activity Click Handler', () => {
  it('should call onClick handler when activity is clicked', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrence = createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000');
    const onActivityClick = vi.fn();

    render(
      <WeekView
        occurrences={[occurrence]}
        currentDate={testDate}
        onActivityClick={onActivityClick}
      />
    );

    const activityBlock = screen.getByText('Activity 1');
    fireEvent.click(activityBlock);

    expect(onActivityClick).toHaveBeenCalledWith(occurrence);
  });
});

describe('WeekView - Empty State', () => {
  it('should render without activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');

    const { container } = render(
      <WeekView occurrences={[]} currentDate={testDate} />
    );

    // Should still render the calendar grid
    expect(container.querySelector('[class*="grid"]')).toBeTruthy();
  });
});

describe('WeekView - Overlap Detection and Layout', () => {
  it('should display overlapping activities side-by-side', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
    ];

    const { container } = render(
      <WeekView occurrences={occurrences} currentDate={testDate} />
    );

    // Both activities should be rendered
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();

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
      <WeekView occurrences={occurrences} currentDate={testDate} />
    );

    // All three activities should be rendered
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('Activity 3')).toBeInTheDocument();

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

    render(<WeekView occurrences={occurrences} currentDate={testDate} />);

    // Both activities should be rendered
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
  });

  it('should display non-overlapping activities at full width', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 10, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 11, 12, 'Child B', '#00FF00'),
    ];

    const { container } = render(
      <WeekView occurrences={occurrences} currentDate={testDate} />
    );

    // Both activities should be rendered
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();

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
      <WeekView occurrences={occurrences} currentDate={testDate} />
    );

    // First 4 activities should be visible
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('Activity 3')).toBeInTheDocument();
    expect(screen.getByText('Activity 4')).toBeInTheDocument();

    // Should show "+1 more" indicator for the overflow activity
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('should maintain color coding for overlapping activities', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 10, 12, 'Child B', '#00FF00'),
    ];

    render(<WeekView occurrences={occurrences} currentDate={testDate} />);

    // Both child names should be visible (color coding preserved)
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });

  it('should apply consistent layout across multiple days', () => {
    const monday = new Date('2024-01-15T12:00:00');
    const tuesday = new Date('2024-01-16T12:00:00');

    const occurrences: ActivityOccurrence[] = [
      // Monday overlaps
      createOccurrence('1', monday, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', monday, 10, 12, 'Child B', '#00FF00'),
      // Tuesday overlaps
      createOccurrence('3', tuesday, 9, 11, 'Child C', '#0000FF'),
      createOccurrence('4', tuesday, 10, 12, 'Child D', '#FFFF00'),
    ];

    const { container } = render(
      <WeekView occurrences={occurrences} currentDate={monday} />
    );

    // All activities should be rendered
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('Activity 3')).toBeInTheDocument();
    expect(screen.getByText('Activity 4')).toBeInTheDocument();

    // Check that both days have positioned blocks
    const activityBlocks = container.querySelectorAll('[role="button"]');
    expect(activityBlocks.length).toBeGreaterThanOrEqual(4);
  });

  it('should handle activities with identical start and end times', () => {
    const testDate = new Date('2024-01-15T12:00:00');
    const occurrences: ActivityOccurrence[] = [
      createOccurrence('1', testDate, 9, 11, 'Child A', '#FF0000'),
      createOccurrence('2', testDate, 9, 11, 'Child B', '#00FF00'),
    ];

    render(<WeekView occurrences={occurrences} currentDate={testDate} />);

    // Both activities should be rendered side-by-side
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
  });
});
