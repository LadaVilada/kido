'use client';

import React from 'react';
import { Share, Plus, X } from 'lucide-react';
import { useIOSInstallPrompt } from '@/hooks/usePWA';

export function IOSInstallPrompt() {
  const { shouldShow, dismiss } = useIOSInstallPrompt();

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="pr-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Install on iOS
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Install this app on your iPhone or iPad:
        </p>
        
        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-4">
          <li className="flex items-start gap-2">
            <span className="font-semibold">1.</span>
            <span>
              Tap the <Share className="inline w-4 h-4 mx-1" /> Share button in Safari
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">2.</span>
            <span>
              Scroll down and tap <Plus className="inline w-4 h-4 mx-1" /> Add to Home Screen
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">3.</span>
            <span>Tap Add in the top right corner</span>
          </li>
        </ol>
        
        <button
          onClick={dismiss}
          className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-md transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}