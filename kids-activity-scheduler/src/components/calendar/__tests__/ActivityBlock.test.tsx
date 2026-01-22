import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityBlock } from '../ActivityBlock';
import { ActivityOccurrence } from '@/types';

// Helper to create test activity occurrence
function createOccurrence(
  id: string,
  startHour: number,
  endHour: number,
  childName: string = 'Test Child',
  childColor: string = '#FF0000'
): ActivityOccurrence {
  const date = new Date('2024-01-15T12:00:00');
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

describe('ActivityBlock - Color Coding', () => {
  it('should apply correct background color from child color', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');

    const { container } = render(<ActivityBlock occurrence={occurrence} />);

    const block = container.querySelector('[role="button"]');
    expect(block).toBeTruthy();
    // Check that the style attribute contains the color
    expect(block?.getAttribute('style')).toContain('rgb(255, 0, 0)');
  });

  it('should display different colors for different children', () => {
    const occurrence1 = createOccurrence('1', 9, 10, 'Child A', '#FF0000');
    const occurrence2 = createOccurrence('2', 11, 12, 'Child B', '#00FF00');

    const { container: container1 } = render(<ActivityBlock occurrence={occurrence1} />);
    const { container: container2 } = render(<ActivityBlock occurrence={occurrence2} />);

    const block1 = container1.querySelector('[role="button"]');
    const block2 = container2.querySelector('[role="button"]');

    expect(block1?.getAttribute('style')).toContain('rgb(255, 0, 0)');
    expect(block2?.getAttribute('style')).toContain('rgb(0, 255, 0)');
  });
});

describe('ActivityBlock - Content Display', () => {
  it('should display activity title', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');

    render(<ActivityBlock occurrence={occurrence} />);

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
  });

  it('should display child name', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');

    render(<ActivityBlock occurrence={occurrence} />);

    expect(screen.getByText('Child A')).toBeInTheDocument();
  });

  it('should display location', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');

    render(<ActivityBlock occurrence={occurrence} />);

    expect(screen.getByText(/Test Location/)).toBeInTheDocument();
  });

  it('should display time range', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');

    render(<ActivityBlock occurrence={occurrence} />);

    // Should show time in format like "9:00 AM - 10:00 AM"
    const timeText = screen.getByText(/9:00 AM - 10:00 AM/);
    expect(timeText).toBeInTheDocument();
  });

  it('should display duration', () => {
    const occurrence = createOccurrence('1', 9, 11, 'Child A', '#FF0000');

    render(<ActivityBlock occurrence={occurrence} />);

    // Should show duration in minutes (120m for 2 hours)
    expect(screen.getByText('120m')).toBeInTheDocument();
  });
});

describe('ActivityBlock - Click Handler', () => {
  it('should call onClick handler when clicked', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');
    const onClick = vi.fn();

    render(<ActivityBlock occurrence={occurrence} onClick={onClick} />);

    const block = screen.getByRole('button');
    fireEvent.click(block);

    expect(onClick).toHaveBeenCalledWith(occurrence);
  });

  it('should handle keyboard events', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');
    const onClick = vi.fn();

    render(<ActivityBlock occurrence={occurrence} onClick={onClick} />);

    const block = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(block, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith(occurrence);

    // Test Space key
    fireEvent.keyDown(block, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('should not call onClick if handler not provided', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');

    render(<ActivityBlock occurrence={occurrence} />);

    const block = screen.getByRole('button');
    
    // Should not throw error
    expect(() => fireEvent.click(block)).not.toThrow();
  });
});

describe('ActivityBlock - Custom Styling', () => {
  it('should apply custom className', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');

    const { container } = render(
      <ActivityBlock occurrence={occurrence} className="custom-class" />
    );

    const block = container.querySelector('.custom-class');
    expect(block).toBeTruthy();
  });

  it('should apply custom style', () => {
    const occurrence = createOccurrence('1', 9, 10, 'Child A', '#FF0000');
    const customStyle = { opacity: 0.5 };

    const { container } = render(
      <ActivityBlock occurrence={occurrence} style={customStyle} />
    );

    const block = container.querySelector('[role="button"]');
    expect(block?.getAttribute('style')).toContain('opacity: 0.5');
  });
});
