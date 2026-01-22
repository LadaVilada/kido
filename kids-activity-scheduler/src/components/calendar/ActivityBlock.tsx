'use client';

import React from 'react';
import { ActivityOccurrence } from '@/types';
import { formatOccurrenceTimeRange, getOccurrenceDuration } from '@/lib/activityOccurrences';
import { getContrastingTextHex, darkenColor } from '@/lib/colorUtils';
import { ActivityLayout } from '@/lib/calendarLayout';

/**
 * Props for the ActivityBlock component
 * 
 * @property occurrence - The activity occurrence data to display
 * @property onClick - Optional callback when the activity is clicked
 * @property style - Optional additional CSS styles
 * @property className - Optional additional CSS classes
 * @property layout - Optional layout information for positioning when activities overlap
 */
interface ActivityBlockProps {
  occurrence: ActivityOccurrence;
  onClick?: (occurrence: ActivityOccurrence) => void;
  style?: React.CSSProperties;
  className?: string;
  layout?: ActivityLayout;
}

/**
 * ActivityBlock Component
 * 
 * Renders a single activity block in the calendar with support for overlap display.
 * 
 * Features:
 * - Single segment rendering for activities with consistent width
 * - Multi-segment rendering for activities that change width due to varying overlaps
 * - Preserves child-specific color coding
 * - Touch-optimized with minimum 44x44px targets
 * - Keyboard accessible with Enter/Space activation
 * - Memoized for performance
 * 
 * @example
 * // Basic usage without overlap
 * <ActivityBlock
 *   occurrence={activity}
 *   onClick={handleClick}
 * />
 * 
 * @example
 * // With overlap layout
 * const layout = getActivityLayout(activity.activityId, layouts);
 * <ActivityBlock
 *   occurrence={activity}
 *   onClick={handleClick}
 *   layout={layout}
 * />
 */
export const ActivityBlock: React.FC<ActivityBlockProps> = React.memo(({
  occurrence,
  onClick,
  style,
  className = '',
  layout,
}) => {
  const duration = getOccurrenceDuration(occurrence);
  const timeRange = formatOccurrenceTimeRange(occurrence);
  const textColor = getContrastingTextHex(occurrence.childColor);
  const borderColor = darkenColor(occurrence.childColor, 15);

  const handleClick = () => {
    if (onClick) {
      onClick(occurrence);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Base styles for all segments
  const baseStyles: React.CSSProperties = {
    backgroundColor: occurrence.childColor,
    borderLeftColor: borderColor,
    color: textColor,
    ...style,
  };

  // If no layout or single segment, render as single block
  if (!layout || layout.segments.length <= 1) {
    const segmentStyle = layout?.segments[0]
      ? {
          ...baseStyles,
          width: layout.segments[0].width,
          left: layout.segments[0].left,
          position: 'absolute' as const,
        }
      : baseStyles;

    return (
      <div
        className={`
          activity-block relative p-1 sm:p-2 rounded-md cursor-pointer
          hover:opacity-90 active:opacity-80 transition-all duration-200
          shadow-sm border-l-4 touch-action-none
          min-h-[44px] min-w-[50px] sm:min-w-[60px]
          ${className}
        `}
        style={segmentStyle}
        onClick={handleClick}
        title={`${occurrence.title} - ${occurrence.childName}\n${timeRange}\n${occurrence.location}`}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="activity-content">
          <div className="font-semibold truncate mb-0.5 text-[9px] sm:text-xs">
            {occurrence.title}
          </div>
          <div className="text-[8px] sm:text-xs opacity-90 truncate font-medium">
            {occurrence.childName}
          </div>
          <div className="text-[8px] sm:text-xs opacity-80 truncate">
            {timeRange}
          </div>
          {occurrence.location && (
            <div className="text-[8px] sm:text-xs opacity-75 truncate mt-0.5">
              📍 {occurrence.location}
            </div>
          )}
        </div>
        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[8px] sm:text-xs opacity-70 font-medium">
          {duration}m
        </div>
      </div>
    );
  }

  // Multi-segment rendering: render activity as multiple connected blocks
  return (
    <>
      {layout.segments.map((segment, index) => {
        const isFirst = index === 0;
        const isLast = index === layout.segments.length - 1;
        
        const segmentStyle: React.CSSProperties = {
          ...baseStyles,
          width: segment.width,
          left: segment.left,
          position: 'absolute' as const,
        };

        return (
          <div
            key={`${occurrence.activityId}-segment-${index}`}
            className={`
              activity-block relative p-1 sm:p-2 cursor-pointer
              hover:opacity-90 active:opacity-80 transition-all duration-200
              shadow-sm border-l-4 touch-action-none
              min-h-[44px] min-w-[50px] sm:min-w-[60px]
              ${isFirst ? 'rounded-t-md' : ''}
              ${isLast ? 'rounded-b-md' : ''}
              ${!isFirst && !isLast ? 'border-t border-t-white/20' : ''}
              ${className}
            `}
            style={segmentStyle}
            onClick={handleClick}
            title={`${occurrence.title} - ${occurrence.childName}\n${timeRange}\n${occurrence.location}`}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {/* Show full content only in first segment */}
            {isFirst && (
              <div className="activity-content">
                <div className="font-semibold truncate mb-0.5 text-[9px] sm:text-xs">
                  {occurrence.title}
                </div>
                <div className="text-[8px] sm:text-xs opacity-90 truncate font-medium">
                  {occurrence.childName}
                </div>
                <div className="text-[8px] sm:text-xs opacity-80 truncate">
                  {timeRange}
                </div>
                {occurrence.location && (
                  <div className="text-[8px] sm:text-xs opacity-75 truncate mt-0.5">
                    📍 {occurrence.location}
                  </div>
                )}
                <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[8px] sm:text-xs opacity-70 font-medium">
                  {duration}m
                </div>
              </div>
            )}
            
            {/* Show minimal content in continuation segments */}
            {!isFirst && (
              <div className="text-[8px] sm:text-xs opacity-75 truncate">
                ↓ {occurrence.title}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these props change
  return (
    prevProps.occurrence.activityId === nextProps.occurrence.activityId &&
    prevProps.occurrence.startDateTime.getTime() === nextProps.occurrence.startDateTime.getTime() &&
    prevProps.occurrence.endDateTime.getTime() === nextProps.occurrence.endDateTime.getTime() &&
    prevProps.occurrence.childColor === nextProps.occurrence.childColor &&
    prevProps.occurrence.title === nextProps.occurrence.title &&
    prevProps.layout?.segments.length === nextProps.layout?.segments.length &&
    prevProps.layout?.isOverflow === nextProps.layout?.isOverflow
  );
});