// Dynamic imports for code splitting and lazy loading
import dynamic from 'next/dynamic';
import React from 'react';
import { PageLoader } from '@/components/common/LoadingSpinner';

// Lazy load calendar components
export const CalendarView = dynamic(
  () => import('@/components/calendar/CalendarView').then(mod => ({ default: mod.CalendarView })),
  {
    loading: () => React.createElement(PageLoader),
    ssr: true,
  }
);

export const ActivityList = dynamic(
  () => import('@/components/activities/ActivityList').then(mod => ({ default: mod.ActivityList })),
  {
    loading: () => React.createElement(PageLoader),
    ssr: true,
  }
);

export const ActivityForm = dynamic(
  () => import('@/components/activities/ActivityForm').then(mod => ({ default: mod.ActivityForm })),
  {
    loading: () => React.createElement(PageLoader),
    ssr: false, // Form doesn't need SSR
  }
);

// Lazy load PWA install prompts (only when needed)
export const InstallPrompt = dynamic(
  () => import('@/components/pwa/InstallPrompt').then(mod => ({ default: mod.InstallPrompt })),
  {
    ssr: false, // Client-side only
  }
);

export const IOSInstallPrompt = dynamic(
  () => import('@/components/pwa/IOSInstallPrompt').then(mod => ({ default: mod.IOSInstallPrompt })),
  {
    ssr: false, // Client-side only
  }
);