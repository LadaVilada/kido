'use client';

import { useEffect } from 'react';
import { initializeTouchFixes } from '@/lib/touchFix';

/**
 * Component to initialize touch interaction fixes
 * This fixes common issues with unresponsive buttons/tabs on mobile devices
 */
export function TouchFixInitializer() {
  useEffect(() => {
    // Initialize all touch fixes
    const cleanup = initializeTouchFixes();
    
    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
