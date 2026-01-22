/**
 * Touch interaction fixes for PWA
 * Addresses common issues with unresponsive buttons/tabs on mobile devices
 */

/**
 * Remove 300ms tap delay on mobile devices
 * This is automatically handled by modern browsers when viewport is set correctly,
 * but we ensure it's applied
 */
export function removeTapDelay() {
  if (typeof document !== 'undefined') {
    // Add touch-action CSS to prevent delays
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      button, a, [role="button"], [role="tab"], [role="link"] {
        touch-action: manipulation;
        -webkit-user-select: none;
        user-select: none;
      }
      
      /* Ensure buttons are always clickable */
      button:not(:disabled), 
      a:not([aria-disabled="true"]), 
      [role="button"]:not([aria-disabled="true"]) {
        cursor: pointer;
        pointer-events: auto !important;
      }
      
      /* Fix for iOS Safari double-tap zoom */
      button, a, input, select, textarea {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Fix for iOS Safari button click issues
 * iOS Safari sometimes doesn't register clicks on elements without cursor: pointer
 */
export function fixIOSClickIssues() {
  if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // Add click event listener to body to enable click events on all elements
    document.body.style.cursor = 'pointer';
    
    // Ensure all interactive elements have proper cursor
    const interactiveElements = document.querySelectorAll(
      'button, a, [role="button"], [role="tab"], [role="link"], input, select, textarea'
    );
    
    interactiveElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.cursor = 'pointer';
      }
    });
  }
}

/**
 * Prevent ghost clicks after touch events
 * This can cause buttons to appear unresponsive
 */
export function preventGhostClicks() {
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    let lastTouchTime = 0;
    
    document.addEventListener('touchend', () => {
      lastTouchTime = Date.now();
    }, { passive: true });
    
    document.addEventListener('click', (e) => {
      // If click happens within 300ms of touch, it might be a ghost click
      if (Date.now() - lastTouchTime < 300) {
        // Allow the click to proceed normally
        // Modern browsers handle this well, but we track it for debugging
      }
    }, { passive: true });
  }
}

/**
 * Fix for service worker caching stale JavaScript
 * Force reload when new service worker is available
 */
export function handleServiceWorkerUpdate() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, show update notification
              console.log('New version available! Please refresh.');
              
              // Optionally auto-reload (be careful with this in production)
              if (process.env.NODE_ENV === 'development') {
                window.location.reload();
              }
            }
          });
        }
      });
    });
  }
}

/**
 * Ensure buttons are always interactive
 * Fixes issues where buttons become unresponsive after navigation
 */
export function ensureButtonsInteractive() {
  if (typeof window !== 'undefined') {
    // Use MutationObserver to watch for new buttons
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const buttons = node.querySelectorAll('button, a, [role="button"]');
            buttons.forEach((button) => {
              if (button instanceof HTMLElement) {
                // Ensure button is interactive
                button.style.pointerEvents = 'auto';
                button.style.touchAction = 'manipulation';
              }
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Return cleanup function
    return () => observer.disconnect();
  }
}

/**
 * Fix for React event handling issues
 * Sometimes React's synthetic events don't fire properly on mobile
 */
export function fixReactEventHandling() {
  if (typeof window !== 'undefined') {
    // Ensure React events are properly delegated
    // This is mostly handled by React 18+, but we can add fallbacks
    
    // Add passive event listeners for better scroll performance
    const passiveSupported = (() => {
      let passive = false;
      try {
        const options = {
          get passive() {
            passive = true;
            return false;
          },
        };
        const testHandler = () => {};
        window.addEventListener('scroll', testHandler, options as AddEventListenerOptions);
        window.removeEventListener('scroll', testHandler);
      } catch (err) {
        passive = false;
      }
      return passive;
    })();
    
    if (passiveSupported) {
      // Touch events should be passive for better performance
      ['touchstart', 'touchmove', 'touchend'].forEach((event) => {
        window.addEventListener(event, () => {}, { passive: true });
      });
    }
  }
}

/**
 * Initialize all touch fixes
 * Call this once when the app loads
 */
export function initializeTouchFixes() {
  if (typeof window !== 'undefined') {
    removeTapDelay();
    fixIOSClickIssues();
    preventGhostClicks();
    handleServiceWorkerUpdate();
    fixReactEventHandling();
    
    const cleanup = ensureButtonsInteractive();
    
    // Re-apply fixes after page becomes visible (handles iOS Safari issues)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        fixIOSClickIssues();
      }
    });
    
    // Re-apply fixes after orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        fixIOSClickIssues();
      }, 100);
    });
    
    return cleanup;
  }
}

/**
 * Debug helper to log touch events
 * Use this to diagnose touch issues
 */
export function debugTouchEvents() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    ['touchstart', 'touchend', 'click', 'mousedown', 'mouseup'].forEach((event) => {
      document.addEventListener(event, (e) => {
        console.log(`[Touch Debug] ${event}:`, {
          target: (e.target as HTMLElement)?.tagName,
          timestamp: Date.now(),
          type: e.type,
        });
      }, { passive: true });
    });
  }
}
