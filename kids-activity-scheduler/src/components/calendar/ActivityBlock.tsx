'use client';

import React from 'react';
import { ActivityOccurrence } from '@/types';
import { formatOccurrenceTimeRange, getOccurrenceDuration } from '@/lib/activityOccurrences';
import { getContrastingTextHex, darkenColor } from '@/lib/colorUtils';

interface ActivityBlockProps {
  occurrence: ActivityOccurrence;
  onClick?: (occurrence: ActivityOccurrence) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const ActivityBlock: React.FC<ActivityBlockProps> = ({
  occurrence,
  onClick,
  style,
  className = '',
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

  return (
    <div
      className={`
        relative p-1.5 sm:p-2 rounded-md cursor-pointer
        hover:opacity-90 active:opacity-80 transition-all duration-200
        shadow-sm border-l-4 touch-action-none
        ${className}
      `}
      style={{
        backgroundColor: occurrence.childColor,
        borderLeftColor: borderColor,
        color: textColor,
        ...style,
      }}
      onClick={handleClick}
      title={`${occurrence.title} - ${occurrence.childName}\n${timeRange}\n${occurrence.location}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="font-semibold truncate mb-0.5 sm:mb-1 text-[10px] sm:text-xs">
        {occurrence.title}
      </div>
      <div className="text-[9px] sm:text-xs opacity-90 truncate font-medium">
        {occurrence.childName}
      </div>
      <div className="text-[9px] sm:text-xs opacity-80 truncate">
        {timeRange}
      </div>
      {occurrence.location && (
        <div className="text-[9px] sm:text-xs opacity-75 truncate mt-0.5 sm:mt-1">
          📍 {occurrence.location}
        </div>
      )}
      <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[9px] sm:text-xs opacity-70 font-medium">
        {duration}m
      </div>
    </div>
  );
};