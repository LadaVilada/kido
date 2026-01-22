import { ActivityOccurrence } from '@/types';

/**
 * Represents a time segment where a specific number of activities overlap
 */
export interface TimeSegment {
  startMinutes: number; // Minutes since midnight
  endMinutes: number;
  activityIds: string[];
  columnCount: number;
}

/**
 * Represents a group of activities that overlap with each other
 */
export interface OverlapGroup {
  activities: ActivityOccurrence[];
  segments: TimeSegment[];
}

/**
 * Represents the layout information for a single activity
 */
export interface ActivityLayout {
  activityId: string;
  segments: LayoutSegment[];
  isOverflow: boolean; // True if beyond maxColumns
}

/**
 * Represents layout information for a specific time segment of an activity
 */
export interface LayoutSegment {
  startMinutes: number;
  endMinutes: number;
  columnIndex: number; // 0-based column position
  columnCount: number; // Total columns at this time
  width: string; // CSS percentage: "50%", "33.33%", "25%", "100%"
  left: string; // CSS percentage: "0%", "25%", "50%", "75%"
}

/**
 * Represents a time point where overlap count changes
 */
interface TimePoint {
  minutes: number;
  type: 'start' | 'end';
  activityId: string;
}

/**
 * Converts a Date object to minutes since midnight
 */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Converts minutes since midnight to a time string (HH:MM)
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Checks if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Detects overlapping activities and groups them
 * 
 * Algorithm:
 * 1. Create time points for all activity starts and ends
 * 2. Sort time points chronologically
 * 3. Track active activities at each time point
 * 4. Create time segments where overlap count changes
 * 5. Group activities that share any time segments
 */
export function detectOverlaps(
  activities: ActivityOccurrence[]
): OverlapGroup[] {
  if (activities.length === 0) {
    return [];
  }

  // Sort activities by start time for consistent processing
  const sortedActivities = [...activities].sort((a, b) => {
    const diff = a.startDateTime.getTime() - b.startDateTime.getTime();
    if (diff !== 0) return diff;
    // If same start time, sort by child name for consistency
    return a.childName.localeCompare(b.childName);
  });

  // Create time points for all starts and ends
  const timePoints: TimePoint[] = [];
  sortedActivities.forEach((activity) => {
    timePoints.push({
      minutes: dateToMinutes(activity.startDateTime),
      type: 'start',
      activityId: activity.activityId,
    });
    timePoints.push({
      minutes: dateToMinutes(activity.endDateTime),
      type: 'end',
      activityId: activity.activityId,
    });
  });

  // Sort time points (starts before ends at same time)
  timePoints.sort((a, b) => {
    if (a.minutes !== b.minutes) {
      return a.minutes - b.minutes;
    }
    // Process starts before ends at the same time
    if (a.type === 'start' && b.type === 'end') return -1;
    if (a.type === 'end' && b.type === 'start') return 1;
    return 0;
  });

  // Build time segments
  const segments: TimeSegment[] = [];
  const activeActivities = new Set<string>();
  let lastMinutes = timePoints[0].minutes;

  timePoints.forEach((point, index) => {
    // Create segment for the time range before this point
    if (point.minutes > lastMinutes && activeActivities.size > 0) {
      segments.push({
        startMinutes: lastMinutes,
        endMinutes: point.minutes,
        activityIds: Array.from(activeActivities),
        columnCount: activeActivities.size,
      });
    }

    // Update active activities
    if (point.type === 'start') {
      activeActivities.add(point.activityId);
    } else {
      activeActivities.delete(point.activityId);
    }

    lastMinutes = point.minutes;
  });

  // Group activities that share any segments
  const activityToGroup = new Map<string, number>();
  const groups: OverlapGroup[] = [];

  segments.forEach((segment) => {
    if (segment.activityIds.length === 1) {
      // Single activity - create its own group if not already in one
      const activityId = segment.activityIds[0];
      if (!activityToGroup.has(activityId)) {
        const groupIndex = groups.length;
        activityToGroup.set(activityId, groupIndex);
        const activity = sortedActivities.find((a) => a.activityId === activityId)!;
        groups.push({
          activities: [activity],
          segments: [segment],
        });
      } else {
        // Add segment to existing group
        const groupIndex = activityToGroup.get(activityId)!;
        groups[groupIndex].segments.push(segment);
      }
    } else {
      // Multiple activities - merge into same group
      let targetGroupIndex: number | null = null;

      // Find if any activity is already in a group
      for (const activityId of segment.activityIds) {
        if (activityToGroup.has(activityId)) {
          targetGroupIndex = activityToGroup.get(activityId)!;
          break;
        }
      }

      if (targetGroupIndex === null) {
        // Create new group
        targetGroupIndex = groups.length;
        const groupActivities = segment.activityIds
          .map((id) => sortedActivities.find((a) => a.activityId === id)!)
          .filter(Boolean);
        
        groups.push({
          activities: groupActivities,
          segments: [segment],
        });

        // Mark all activities as belonging to this group
        segment.activityIds.forEach((id) => {
          activityToGroup.set(id, targetGroupIndex!);
        });
      } else {
        // Add to existing group
        const group = groups[targetGroupIndex];
        
        // Add any new activities to the group
        segment.activityIds.forEach((activityId) => {
          if (!activityToGroup.has(activityId)) {
            const activity = sortedActivities.find((a) => a.activityId === activityId)!;
            if (activity) {
              group.activities.push(activity);
              activityToGroup.set(activityId, targetGroupIndex!);
            }
          }
        });

        // Add segment to group
        group.segments.push(segment);
      }
    }
  });

  // Sort segments within each group by start time
  groups.forEach((group) => {
    group.segments.sort((a, b) => a.startMinutes - b.startMinutes);
  });

  return groups;
}

/**
 * Assigns column indices to activities using a greedy algorithm
 * Activities are assigned to the leftmost available column
 * 
 * @param activities - Sorted activities to assign columns to
 * @param segments - Time segments with overlap information
 * @param maxColumns - Maximum number of columns allowed
 * @returns Map of activity ID to column index
 */
function assignColumns(
  activities: ActivityOccurrence[],
  segments: TimeSegment[],
  maxColumns: number
): Map<string, number> {
  const activityColumns = new Map<string, number>();
  
  // Sort activities by start time, then by child name for consistency
  const sortedActivities = [...activities].sort((a, b) => {
    const startDiff = dateToMinutes(a.startDateTime) - dateToMinutes(b.startDateTime);
    if (startDiff !== 0) return startDiff;
    return a.childName.localeCompare(b.childName);
  });

  // For each activity, find the leftmost available column
  sortedActivities.forEach((activity) => {
    const activityStart = dateToMinutes(activity.startDateTime);
    const activityEnd = dateToMinutes(activity.endDateTime);

    // Find which columns are occupied by activities that overlap with this one
    const occupiedColumns = new Set<number>();
    
    sortedActivities.forEach((otherActivity) => {
      if (otherActivity.activityId === activity.activityId) return;
      if (!activityColumns.has(otherActivity.activityId)) return;

      const otherStart = dateToMinutes(otherActivity.startDateTime);
      const otherEnd = dateToMinutes(otherActivity.endDateTime);

      // Check if they overlap
      if (timeRangesOverlap(activityStart, activityEnd, otherStart, otherEnd)) {
        occupiedColumns.add(activityColumns.get(otherActivity.activityId)!);
      }
    });

    // Find the leftmost available column
    let columnIndex = 0;
    while (occupiedColumns.has(columnIndex) && columnIndex < maxColumns) {
      columnIndex++;
    }

    activityColumns.set(activity.activityId, columnIndex);
  });

  return activityColumns;
}

/**
 * Calculates the layout (column positions and widths) for activities
 * 
 * @param overlapGroups - Groups of overlapping activities
 * @param maxColumns - Maximum number of columns to display (default: 4)
 * @returns Array of activity layouts with positioning information
 */
export function calculateLayout(
  overlapGroups: OverlapGroup[],
  maxColumns: number = 4
): ActivityLayout[] {
  const layouts: ActivityLayout[] = [];

  overlapGroups.forEach((group) => {
    // Assign column indices to activities in this group using greedy algorithm
    const activityColumns = assignColumns(group.activities, group.segments, maxColumns);

    // Create layout for each activity
    group.activities.forEach((activity) => {
      const columnIndex = activityColumns.get(activity.activityId)!;
      const isOverflow = columnIndex >= maxColumns;

      // Find all segments that include this activity
      const activitySegments = group.segments
        .filter((seg) => seg.activityIds.includes(activity.activityId))
        .map((seg) => {
          // Calculate effective column count (capped at maxColumns)
          const effectiveColumnCount = Math.min(seg.columnCount, maxColumns);
          
          // For overflow activities, they don't get displayed but we still track them
          const effectiveColumnIndex = isOverflow ? maxColumns : Math.min(columnIndex, maxColumns - 1);

          // Calculate width as percentage of available space
          const widthPercent = 100 / effectiveColumnCount;
          const width = `${widthPercent.toFixed(2)}%`;
          
          // Calculate left position as percentage
          const leftPercent = (effectiveColumnIndex / effectiveColumnCount) * 100;
          const left = `${leftPercent.toFixed(2)}%`;

          return {
            startMinutes: seg.startMinutes,
            endMinutes: seg.endMinutes,
            columnIndex: effectiveColumnIndex,
            columnCount: effectiveColumnCount,
            width,
            left,
          };
        });

      layouts.push({
        activityId: activity.activityId,
        segments: activitySegments,
        isOverflow,
      });
    });
  });

  return layouts;
}

/**
 * Gets the layout for a specific activity
 */
export function getActivityLayout(
  activityId: string,
  layouts: ActivityLayout[]
): ActivityLayout | undefined {
  return layouts.find((layout) => layout.activityId === activityId);
}

/**
 * Checks if an activity should be displayed (not in overflow)
 */
export function shouldDisplayActivity(
  activityId: string,
  layouts: ActivityLayout[]
): boolean {
  const layout = getActivityLayout(activityId, layouts);
  return layout ? !layout.isOverflow : true;
}

/**
 * Gets the count of overflow activities at a specific time
 */
export function getOverflowCount(
  minutes: number,
  layouts: ActivityLayout[]
): number {
  return layouts.filter((layout) => {
    if (!layout.isOverflow) return false;
    
    // Check if this activity is active at the given time
    return layout.segments.some(
      (seg) => seg.startMinutes <= minutes && minutes < seg.endMinutes
    );
  }).length;
}

/**
 * Gets overflow activities for a specific time segment
 * Used to display "+N more" indicator with activity details
 * 
 * @param startMinutes - Start of time segment
 * @param endMinutes - End of time segment
 * @param layouts - All activity layouts
 * @param activities - All activities (to get full activity data)
 * @returns Array of overflow activities in this time segment
 */
export function getOverflowActivities(
  startMinutes: number,
  endMinutes: number,
  layouts: ActivityLayout[],
  activities: ActivityOccurrence[]
): ActivityOccurrence[] {
  const overflowActivityIds = layouts
    .filter((layout) => {
      if (!layout.isOverflow) return false;
      
      // Check if this activity overlaps with the time segment
      return layout.segments.some(
        (seg) => timeRangesOverlap(seg.startMinutes, seg.endMinutes, startMinutes, endMinutes)
      );
    })
    .map((layout) => layout.activityId);

  return activities.filter((activity) => 
    overflowActivityIds.includes(activity.activityId)
  );
}

/**
 * Gets all overflow activities for a day
 * 
 * @param layouts - All activity layouts
 * @param activities - All activities
 * @returns Array of all overflow activities
 */
export function getAllOverflowActivities(
  layouts: ActivityLayout[],
  activities: ActivityOccurrence[]
): ActivityOccurrence[] {
  const overflowActivityIds = layouts
    .filter((layout) => layout.isOverflow)
    .map((layout) => layout.activityId);

  return activities.filter((activity) => 
    overflowActivityIds.includes(activity.activityId)
  );
}
