# Calendar Overlap Display Feature

## Overview

The Calendar Overlap Display feature enables the calendar views (Week View and Day View) to display overlapping activities side-by-side instead of stacking them. This allows parents to clearly see when multiple children have activities at the same time.

## Key Features

- **Side-by-side Layout**: Overlapping activities are displayed in separate columns
- **Dynamic Width Allocation**: Column widths adjust based on the number of concurrent activities
- **Overflow Handling**: When more than 4 activities overlap, a "+N more" indicator is shown
- **Mobile Support**: Horizontal scrolling enables viewing all activities on small screens
- **Consistent Behavior**: Same layout algorithm works in both Week View and Day View
- **Performance Optimized**: Memoization and caching for efficient rendering

## Architecture

### Core Components

1. **calendarLayout.ts** - Overlap detection and layout calculation engine
2. **ActivityBlock.tsx** - Renders individual activity blocks with layout support
3. **WeekView.tsx** - Week calendar with overlap display integration
4. **DayView.tsx** - Day calendar with overlap display integration

### Data Flow

```
Activities → Overlap Detection → Column Assignment → Width Calculation → Rendering
```

## API Reference

### calendarLayout.ts

#### Core Interfaces

```typescript
interface TimeSegment {
  startMinutes: number;      // Minutes since midnight
  endMinutes: number;
  activityIds: string[];
  columnCount: number;
}

interface OverlapGroup {
  activities: ActivityOccurrence[];
  segments: TimeSegment[];
}

interface ActivityLayout {
  activityId: string;
  segments: LayoutSegment[];
  isOverflow: boolean;       // True if beyond maxColumns
}

interface LayoutSegment {
  startMinutes: number;
  endMinutes: number;
  columnIndex: number;       // 0-based column position
  columnCount: number;       // Total columns at this time
  width: string;             // CSS percentage: "50%", "33.33%", etc.
  left: string;              // CSS percentage: "0%", "25%", etc.
}
```

#### Main Functions

##### `detectOverlaps(activities: ActivityOccurrence[]): OverlapGroup[]`

Analyzes activities to identify overlapping time ranges and groups them.

**Parameters:**
- `activities` - Array of activity occurrences to analyze

**Returns:**
- Array of overlap groups, each containing activities that overlap with each other

**Example:**
```typescript
const activities = [
  { activityId: '1', startDateTime: new Date('2024-01-15T10:00'), endDateTime: new Date('2024-01-15T11:00'), ... },
  { activityId: '2', startDateTime: new Date('2024-01-15T10:30'), endDateTime: new Date('2024-01-15T11:30'), ... },
];

const overlapGroups = detectOverlaps(activities);
// Returns groups of activities that overlap
```

**Performance:**
- Results are memoized for repeated calls with same activities
- Time complexity: O(n log n) where n is the number of activities

---

##### `calculateLayout(overlapGroups: OverlapGroup[], maxColumns?: number): ActivityLayout[]`

Calculates column positions and widths for activities based on overlap analysis.

**Parameters:**
- `overlapGroups` - Groups of overlapping activities from `detectOverlaps()`
- `maxColumns` - Maximum number of columns to display (default: 4)

**Returns:**
- Array of activity layouts with positioning information

**Example:**
```typescript
const overlapGroups = detectOverlaps(activities);
const layouts = calculateLayout(overlapGroups, 4);

// Each layout contains segments with width and position
layouts.forEach(layout => {
  console.log(`Activity ${layout.activityId}:`);
  layout.segments.forEach(seg => {
    console.log(`  ${seg.width} wide at ${seg.left} position`);
  });
});
```

**Performance:**
- Results are memoized based on activities and maxColumns
- Time complexity: O(n * m) where n is activities and m is segments

---

##### `getActivityLayout(activityId: string, layouts: ActivityLayout[]): ActivityLayout | undefined`

Retrieves the layout for a specific activity.

**Parameters:**
- `activityId` - ID of the activity to find
- `layouts` - Array of all activity layouts

**Returns:**
- Layout for the specified activity, or undefined if not found

---

##### `shouldDisplayActivity(activityId: string, layouts: ActivityLayout[]): boolean`

Checks if an activity should be displayed (not in overflow).

**Parameters:**
- `activityId` - ID of the activity to check
- `layouts` - Array of all activity layouts

**Returns:**
- `true` if activity should be displayed, `false` if it's in overflow

---

##### `getAllOverflowActivities(layouts: ActivityLayout[], activities: ActivityOccurrence[]): ActivityOccurrence[]`

Gets all overflow activities for a day.

**Parameters:**
- `layouts` - Array of all activity layouts
- `activities` - Array of all activities

**Returns:**
- Array of activities that are in overflow (beyond maxColumns)

**Example:**
```typescript
const overflowActivities = getAllOverflowActivities(layouts, activities);
if (overflowActivities.length > 0) {
  console.log(`${overflowActivities.length} activities in overflow`);
}
```

---

##### `clearLayoutCaches(): void`

Clears all internal caches. Useful for testing or manual cache invalidation.

**Example:**
```typescript
// Clear caches when activities are updated
clearLayoutCaches();
```

---

#### Utility Functions

##### `dateToMinutes(date: Date): number`

Converts a Date object to minutes since midnight.

**Example:**
```typescript
const date = new Date('2024-01-15T14:30');
const minutes = dateToMinutes(date); // Returns 870 (14 * 60 + 30)
```

---

##### `minutesToTimeString(minutes: number): string`

Converts minutes since midnight to a time string (HH:MM).

**Example:**
```typescript
const timeString = minutesToTimeString(870); // Returns "14:30"
```

---

##### `timeRangesOverlap(start1: number, end1: number, start2: number, end2: number): boolean`

Checks if two time ranges overlap.

**Example:**
```typescript
const overlaps = timeRangesOverlap(600, 720, 660, 780); // 10:00-12:00 and 11:00-13:00
console.log(overlaps); // true
```

---

### ActivityBlock Component

#### Props

```typescript
interface ActivityBlockProps {
  occurrence: ActivityOccurrence;     // Activity data to display
  onClick?: (occurrence: ActivityOccurrence) => void;  // Click handler
  style?: React.CSSProperties;        // Additional styles
  className?: string;                 // Additional CSS classes
  layout?: ActivityLayout;            // Layout information for positioning
}
```

#### Usage

**Basic Usage (No Overlap):**
```typescript
<ActivityBlock
  occurrence={activity}
  onClick={handleActivityClick}
/>
```

**With Layout (Overlapping Activities):**
```typescript
const layouts = calculateLayout(overlapGroups, 4);
const activityLayout = getActivityLayout(activity.activityId, layouts);

<ActivityBlock
  occurrence={activity}
  onClick={handleActivityClick}
  layout={activityLayout}
/>
```

#### Features

- **Single Segment Rendering**: When activity has consistent width throughout
- **Multi-Segment Rendering**: When activity width changes due to varying overlap counts
- **Color Preservation**: Maintains child-specific color coding
- **Touch Optimization**: Minimum 44x44px touch targets on mobile
- **Accessibility**: Keyboard navigation and ARIA labels

---

### WeekView Component

#### Props

```typescript
interface WeekViewProps {
  occurrences: ActivityOccurrence[];  // Activities to display
  onActivityClick?: (occurrence: ActivityOccurrence) => void;  // Click handler
  currentDate?: Date;                 // Current date for week calculation
  onDateChange?: (date: Date) => void;  // Date change callback
  className?: string;                 // Additional CSS classes
}
```

#### Usage

```typescript
<WeekView
  occurrences={activities}
  onActivityClick={handleActivityClick}
  currentDate={new Date()}
  onDateChange={handleDateChange}
/>
```

#### Features

- **Automatic Overlap Detection**: Detects and displays overlapping activities per day
- **Horizontal Scroll**: Enables scrolling on mobile when activities overlap
- **Overflow Indicators**: Shows "+N more" for activities beyond 4 columns
- **Current Time Indicator**: Red line showing current time (updates every minute)
- **Week Navigation**: Previous/Next week buttons and "Today" button
- **Responsive Design**: Adapts to mobile and desktop screens

---

### DayView Component

#### Props

```typescript
interface DayViewProps {
  occurrences: ActivityOccurrence[];  // Activities to display
  onActivityClick?: (occurrence: ActivityOccurrence) => void;  // Click handler
  selectedDate?: Date;                // Date to display
  onDateChange?: (date: Date) => void;  // Date change callback
  className?: string;                 // Additional CSS classes
}
```

#### Usage

```typescript
<DayView
  occurrences={activities}
  onActivityClick={handleActivityClick}
  selectedDate={new Date()}
  onDateChange={handleDateChange}
/>
```

#### Features

- **Same Layout Algorithm**: Uses identical overlap detection as WeekView
- **Horizontal Scroll**: Enables scrolling on mobile for overlapping activities
- **Overflow Indicators**: Shows "+N more" for activities beyond 4 columns
- **Day Navigation**: Previous/Next day buttons and "Today" button
- **Consistent Behavior**: Maintains same UX as WeekView

---

## Implementation Guide

### Basic Integration

1. **Import Required Functions:**
```typescript
import { 
  detectOverlaps, 
  calculateLayout, 
  getActivityLayout 
} from '@/lib/calendarLayout';
```

2. **Detect Overlaps:**
```typescript
const overlapGroups = detectOverlaps(activities);
```

3. **Calculate Layouts:**
```typescript
const layouts = calculateLayout(overlapGroups, 4);
```

4. **Apply to Activities:**
```typescript
activities.map(activity => {
  const layout = getActivityLayout(activity.activityId, layouts);
  return (
    <ActivityBlock
      occurrence={activity}
      layout={layout}
      onClick={handleClick}
    />
  );
});
```

### Advanced: Per-Day Layout

```typescript
// Group activities by date
const occurrencesByDate = groupOccurrencesByDate(activities);

// Calculate layouts for each day
const layoutsByDate = new Map();
occurrencesByDate.forEach((dayActivities, dateKey) => {
  const overlapGroups = detectOverlaps(dayActivities);
  const layouts = calculateLayout(overlapGroups, 4);
  layoutsByDate.set(dateKey, layouts);
});

// Render activities with layouts
dayActivities.map(activity => {
  const layouts = layoutsByDate.get(dateKey);
  const layout = getActivityLayout(activity.activityId, layouts);
  
  // Skip overflow activities
  if (layout?.isOverflow) return null;
  
  return <ActivityBlock occurrence={activity} layout={layout} />;
});
```

### Handling Overflow

```typescript
import { getAllOverflowActivities } from '@/lib/calendarLayout';

// Get overflow activities
const overflowActivities = getAllOverflowActivities(layouts, activities);

// Display indicator
if (overflowActivities.length > 0) {
  return (
    <div className="overflow-indicator">
      +{overflowActivities.length} more
    </div>
  );
}
```

---

## Performance Considerations

### Memoization

The layout engine uses automatic memoization:

- **Overlap Detection**: Cached based on activity IDs and times
- **Layout Calculation**: Cached based on activities and maxColumns
- **Cache Size**: Limited to 100 entries to prevent memory leaks

### Optimization Tips

1. **Stable Activity IDs**: Use consistent activity IDs to maximize cache hits
2. **Batch Updates**: Update multiple activities at once rather than individually
3. **Clear Cache**: Call `clearLayoutCaches()` when activities change significantly
4. **Debounce Resize**: Window resize handlers are debounced (150ms)

### Performance Targets

- Layout calculation: < 50ms for 50 activities
- Render time: < 100ms for week view
- Smooth scrolling: 60fps on mobile

---

## Mobile Considerations

### Responsive Breakpoints

- **< 640px**: Mobile layout with horizontal scroll
- **640px - 1024px**: Tablet layout
- **> 1024px**: Desktop layout

### Touch Interactions

- **Minimum Touch Target**: 44x44px (WCAG compliant)
- **Horizontal Scroll**: Smooth scrolling within day columns
- **Touch-Friendly Padding**: Reduced padding on mobile for better space usage

### Mobile-Specific Features

- Horizontal scroll within day columns when activities overlap
- Reduced font sizes and padding for compact display
- Touch-optimized "+N more" indicators

---

## Accessibility

### Keyboard Navigation

- Tab through activities in time order
- Enter/Space to activate activity
- Arrow keys for week/day navigation

### Screen Readers

- Activities announce overlap count and position
- Time information included in labels
- Semantic HTML structure

### Color Contrast

- Maintains WCAG AA standards
- Contrasting text colors calculated automatically
- Border colors for better definition

---

## Testing

### Unit Tests

Located in `src/lib/__tests__/calendarLayout.test.ts`:

**Overlap Detection Tests:**
- No overlaps scenario
- Partial overlaps
- Complete overlaps
- Multiple overlap groups
- Edge cases (identical start/end times)

**Layout Calculation Tests:**
- 2-activity overlap (50% width each)
- 3-activity overlap (33.33% width each)
- 4-activity overlap (25% width each)
- Dynamic width changes across time segments
- Overflow handling (more than 4 activities)

**Width and Position Tests:**
- Percentage-based width calculations
- Left position calculations
- Column assignment algorithm
- Full-width for non-overlapping activities

**Overflow Tests:**
- Overflow detection (>4 activities)
- Overflow count at specific times
- Overflow activities retrieval
- Partial overlap with overflow

### Integration Tests

Located in component test files:

**WeekView Tests** (`src/components/calendar/__tests__/WeekView.test.tsx`):
- Activity positioning and color coding
- Multiple activities on same day
- Activities across multiple days
- Date navigation
- Activity click handlers
- Overlap display with side-by-side layout
- Overflow indicators
- Mobile scroll behavior

**DayView Tests** (`src/components/calendar/__tests__/DayView.test.tsx`):
- Activity display with color coding
- Activity summary section
- Empty state handling
- Date navigation
- Activity click handlers
- Overlap detection and layout
- Overflow indicators
- Mobile scroll behavior
- Current time indicator

**ActivityBlock Tests** (`src/components/calendar/__tests__/ActivityBlock.test.tsx`):
- Color coding from child color
- Content display (title, child name, location, time, duration)
- Click handlers
- Keyboard events
- Custom styling

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/lib/__tests__/calendarLayout.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Test Coverage

Current test coverage includes:
- ✅ Overlap detection algorithm
- ✅ Column assignment logic
- ✅ Width and position calculations
- ✅ Overflow handling
- ✅ Component rendering
- ✅ User interactions
- ✅ Mobile responsiveness
- ✅ Edge cases and error scenarios

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

## Troubleshooting

### Activities Not Displaying Side-by-Side

**Issue**: Activities stack instead of displaying side-by-side

**Solutions**:
1. Verify activities have overlapping times
2. Check that layout is being passed to ActivityBlock
3. Ensure CSS positioning is not overridden
4. Clear layout caches: `clearLayoutCaches()`

### Overflow Indicator Not Showing

**Issue**: "+N more" indicator doesn't appear

**Solutions**:
1. Verify more than 4 activities overlap at the same time
2. Check that overflow activities are being filtered correctly
3. Ensure OverflowIndicator component is rendered
4. Check console for JavaScript errors

### Performance Issues

**Issue**: Slow rendering with many activities

**Solutions**:
1. Check cache is working (use browser dev tools)
2. Verify activities have stable IDs
3. Consider reducing number of visible days
4. Profile with React DevTools
5. Check that memoization is working (layouts should be cached)

### Mobile Scroll Not Working

**Issue**: Cannot scroll horizontally on mobile

**Solutions**:
1. Verify `overflow-x-auto` class is applied
2. Check that container has `min-w-max` or similar
3. Test on actual device (not just browser resize)
4. Ensure touch-action CSS is not preventing scroll

### Test Failures

**Issue**: Tests failing after code changes

**Solutions**:
1. Run `npm test` to see specific failures
2. Check if test data matches new requirements
3. Update test expectations if behavior changed intentionally
4. Clear test caches: `vi.clearAllMocks()`
5. Verify mock implementations are correct

---

## Future Enhancements

Potential improvements for future versions:

1. **Drag-and-Drop**: Reorder activities by dragging between columns
2. **Conflict Warnings**: Highlight scheduling conflicts visually
3. **Smart Grouping**: Group activities by location or type
4. **Compact Mode**: Toggle between detailed and compact views
5. **Print Layout**: Optimized layout for printing schedules
6. **Custom Column Limits**: Allow users to configure max columns
7. **Activity Filtering**: Filter by child, activity type, or location
8. **Export**: Export calendar view as image or PDF

---

## Related Documentation

- [Requirements Document](../.kiro/specs/calendar-overlap-display/requirements.md)
- [Design Document](../.kiro/specs/calendar-overlap-display/design.md)
- [Implementation Tasks](../.kiro/specs/calendar-overlap-display/tasks.md)
- [Main README](../README.md)
