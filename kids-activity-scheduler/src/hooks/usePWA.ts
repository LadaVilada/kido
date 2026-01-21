'use client';

import { useState, useEffect } from 'react';

export interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export function usePWA(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    platform: 'unknown',
  });

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    let platform: PWAStatus['platform'] = 'unknown';
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = 'ios';
    } else if (/android/.test(userAgent)) {
      platform = 'android';
    } else {
      platform = 'desktop';
    }

    // Check if app can be installed
    const canInstall = 'BeforeInstallPromptEvent' in window;

    setStatus({
      isInstalled: isStandalone,
      isStandalone,
      canInstall,
      platform,
    });

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setStatus(prev => ({
        ...prev,
        isStandalone: e.matches,
        isInstalled: e.matches,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return status;
}

// Hook to show iOS install instructions
export function useIOSInstallPrompt() {
  const [shouldShow, setShouldShow] = useState(false);
  const pwaStatus = usePWA();

  useEffect(() => {
    // Only show for iOS devices that aren't already installed
    if (pwaStatus.platform === 'ios' && !pwaStatus.isInstalled) {
      const dismissed = localStorage.getItem('ios-install-dismissed');
      if (!dismissed) {
        setShouldShow(true);
      }
    }
  }, [pwaStatus]);

  const dismiss = () => {
    setShouldShow(false);
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  return {
    shouldShow,
    dismiss,
  };
}