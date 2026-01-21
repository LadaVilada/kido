'use client';

import React from 'react';
import { ActivityOccurrence } from '@/types';
import { formatOccurrenceTimeRange, getOccurrenceDuration } from '@/lib/activityOccurrences';

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

  const handleClick = () => {
    if (onClick) {
      onClick(occurrence);
    }
  };

  return (
    <div
      className={`
        relative p-2 rounded-md text-white text-xs cursor-pointer
        hover:opacity-90 transition-opacity duration-200
        shadow-sm border-l-4
        ${className}
      `}
      style={{
        backgroundColor: occurrence.childColor,
        borderLeftColor: occurrence.childColor,
        ...style,
      }}
      onClick={handleClick}
      title={`${occurrence.title} - ${occurrence.childName}\n${timeRange}\n${occurrence.location}`}
    >
      <div className="font-medium truncate mb-1">
        {occurrence.title}
      </div>
      <div className="text-xs opacity-90 truncate">
        {occurrence.childName}
      </div>
      <div className="text-xs opacity-80 truncate">
        {timeRange}
      </div>
      {occurrence.location && (
        <div className="text-xs opacity-75 truncate mt-1">
          📍 {occurrence.location}
        </div>
      )}
      <div className="absolute top-1 right-1 text-xs opacity-60">
        {duration}m
      </div>
    </div>
  );
};