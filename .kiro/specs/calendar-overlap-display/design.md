# Design Document

## Overview

This feature implements a dynamic column-based layout system for displaying overlapping activities in calendar views. The system detects time-based overlaps and automatically positions activities side-by-side with appropriate width allocation.

## Architecture

### High-Level Flow

```
Activity Data → Overlap Detection → Column Assignment → Width Calculation → Rendering
```

### Component Structure

```
CalendarView (Week/Day)
├── TimeGrid
│   ├── TimeSlots (vertical axis)
│   └── DayColumns (horizontal axis)
│       ├── DayColumn (per day)
│       │   ├── OverlapDetector (new)
│       │   ├── ColumnLayoutEngine (new)
│       │   └── ActivityBlocks (positioned)
```

## Components and Interfaces

### 1. OverlapDetector

**Purpose**: Analyzes activities to identify overlapping time ranges and group them.

**Interface**:
```typescript
interface TimeSegment {
  startMinutes: number;
  endMinutes: number;
  activityIds: string[];
  columnCount: number;
}

interface OverlapGroup {
  activities: ActivityOccurrence[];
  segments: TimeSegment[];
}

function detectOverlaps(
  activities: ActivityOccurrence[]
): OverlapGroup[];
```

**Algorithm**:
1. Sort activities by start time
2. Create time segments where overlap count changes
3. For each segment, track which activities are active
4. Group activities that share any time segments

### 2. ColumnLayoutEngine

**Purpose**: Assigns column positions and widths to activities based on overlap analysis.

**Interface**:
```typescript
interface ActivityLayout {
  activityId: string;
  segments: LayoutSegment[];
}

interface LayoutSegment {
  startMinutes: number;
  endMinutes: number;
  columnIndex: number;
  columnCount: number;
  width: string; // CSS percentage
  left: string; // CSS percentage
}

function calculateLayout(
  overlapGroups: OverlapGroup[],
  maxColumns: number = 4
): ActivityLayout[];
```

**Algorithm**:
1. For each overlap group:
   - Assign column indices (0, 1, 2, 3...)
   - If more than maxColumns, mark extras as "+N more"
2. For each time segment:
   - Calculate width: `100% / columnCount`
   - Calculate left position: `(columnIndex / columnCount) * 100%`
3. Split activities into visual segments based on width changes

### 3. ActivityBlockRenderer

**Purpose**: Renders activity blocks with dynamic positioning.

**Interface**:
```typescript
interface ActivityBlockProps {
  occurrence: ActivityOccurrence;
  layout: ActivityLayout;
  onClick: (occurrence: ActivityOccurrence) => void;
}

function ActivityBlockRenderer(props: ActivityBlockProps): JSX.Element;
```

**Rendering Strategy**:
- If activity has single segment: Render as one block
- If activity has multiple segments: Render as multiple connected blocks
- Apply color, borders, and styling per segment
- Maintain click handlers across all segments

## Data Models

### Extended ActivityOccurrence

```typescript
interface ActivityOccurrence {
  // Existing fields...
  activityId: string;
  date: Date;
  startDateTime: Date;
  endDateTime: Date;
  title: string;
  location: string;
  childName: string;
  childColor: string;
  
  // New fields for layout
  layout?: ActivityLayout;
}
```

### Layout Data Structures

```typescript
interface TimeSegment {
  startMinutes: number; // Minutes since midnight
  endMinutes: number;
  activityIds: string[];
  columnCount: number;
}

interface LayoutSegment {
  startMinutes: number;
  endMinutes: number;
  columnIndex: number; // 0-based column position
  columnCount: number; // Total columns at this time
  width: string; // "50%", "33.33%", "25%", "100%"
  left: string; // "0%", "25%", "50%", "75%"
}

interface ActivityLayout {
  activityId: string;
  segments: LayoutSegment[];
  isOverflow: boolean; // True if beyond maxColumns
}
```

## Error Handling

### Edge Cases

1. **No overlaps**: Activities render at full width (100%)
2. **Identical times**: Activities sorted by childName for consistent ordering
3. **More than 4 overlaps**: Show first 4, display "+N more" indicator
4. **Very short activities**: Maintain minimum height of 28px
5. **Narrow columns**: Maintain minimum width of 60px, enable horizontal scroll

### Error States

- **Invalid time data**: Skip activity, log error
- **Missing child data**: Use default color, display activity
- **Layout calculation failure**: Fall back to stacked layout

## Testing Strategy

### Unit Tests

1. **OverlapDetector**:
   - Test no overlaps
   - Test partial overlaps
   - Test complete overlaps
   - Test multiple groups
   - Test edge cases (same start/end times)

2. **ColumnLayoutEngine**:
   - Test 2-activity overlap
   - Test 3-activity overlap
   - Test 4+ activity overflow
   - Test width calculations
   - Test position calculations

3. **ActivityBlockRenderer**:
   - Test single segment rendering
   - Test multi-segment rendering
   - Test click handlers
   - Test color preservation

### Integration Tests

1. Week View with overlapping activities
2. Day View with overlapping activities
3. Mobile responsive behavior
4. Switching between views

### Visual Regression Tests

1. Screenshot comparison for various overlap scenarios
2. Mobile vs desktop layouts
3. Color coding preservation

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Cache overlap detection results per day
2. **Lazy calculation**: Only calculate layout for visible days
3. **Debouncing**: Debounce layout recalculation on window resize
4. **Virtual scrolling**: For week view with many activities

### Performance Targets

- Layout calculation: < 50ms for 50 activities
- Render time: < 100ms for week view
- Smooth scrolling: 60fps on mobile

## Accessibility

1. **Keyboard navigation**: Tab through activities in time order
2. **Screen readers**: Announce overlap count and position
3. **Touch targets**: Minimum 44x44px on mobile
4. **Color contrast**: Maintain WCAG AA standards

## Mobile Considerations

### Responsive Breakpoints

- **< 640px**: Enable horizontal scroll, reduce padding
- **640px - 1024px**: Standard layout
- **> 1024px**: Full desktop layout

### Touch Interactions

- Horizontal scroll within day column
- Tap to view activity details
- Swipe between days (existing behavior)

## Future Enhancements

1. **Drag-and-drop**: Reorder activities by dragging
2. **Conflict warnings**: Highlight scheduling conflicts
3. **Smart grouping**: Group activities by location or type
4. **Compact mode**: Toggle between detailed and compact views
5. **Print layout**: Optimized layout for printing schedules
