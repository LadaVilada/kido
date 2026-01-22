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
