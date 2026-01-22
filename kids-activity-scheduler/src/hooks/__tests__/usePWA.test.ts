import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWA, useIOSInstallPrompt } from '../usePWA';

describe('usePWA Hook', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PWA Installation Detection', () => {
    it('should detect standalone mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isStandalone).toBe(true);
      expect(result.current.isInstalled).toBe(true);
    });

    it('should detect non-standalone mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isStandalone).toBe(false);
      expect(result.current.isInstalled).toBe(false);
    });

    it('should detect iOS standalone mode', () => {
      (window.navigator as any).standalone = true;

      const { result } = renderHook(() => usePWA());

      expect(result.current.isStandalone).toBe(true);
    });
  });

  describe('Platform Detection', () => {
    it('should detect iOS platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.platform).toBe('ios');
    });

    it('should detect Android platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.platform).toBe('android');
    });

    it('should detect desktop platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.platform).toBe('desktop');
    });

    it('should handle unknown platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: '',
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.platform).toBe('unknown');
    });
  });

  describe('Install Capability', () => {
    it('should detect install capability', () => {
      (window as any).BeforeInstallPromptEvent = class {};

      const { result } = renderHook(() => usePWA());

      expect(result.current.canInstall).toBe(true);
    });

    it('should detect no install capability', () => {
      delete (window as any).BeforeInstallPromptEvent;

      const { result } = renderHook(() => usePWA());

      expect(result.current.canInstall).toBe(false);
    });
  });

  describe('Display Mode Changes', () => {
    it('should update state when display mode changes', () => {
      let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          addEventListener: vi.fn((event, listener) => {
            if (event === 'change') {
              mediaQueryListener = listener;
            }
          }),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isStandalone).toBe(false);

      // Simulate display mode change
      if (mediaQueryListener) {
        act(() => {
          mediaQueryListener({ matches: true } as MediaQueryListEvent);
        });
      }

      expect(result.current.isStandalone).toBe(true);
    });
  });
});

describe('useIOSInstallPrompt Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('iOS Install Prompt', () => {
    it('should show prompt for iOS devices not installed', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      const { result } = renderHook(() => useIOSInstallPrompt());

      expect(result.current.shouldShow).toBe(true);
    });

    it('should not show prompt for iOS devices already installed', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useIOSInstallPrompt());

      expect(result.current.shouldShow).toBe(false);
    });

    it('should not show prompt for non-iOS devices', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
      });

      const { result } = renderHook(() => useIOSInstallPrompt());

      expect(result.current.shouldShow).toBe(false);
    });

    it('should dismiss prompt and save to localStorage', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      const { result } = renderHook(() => useIOSInstallPrompt());

      expect(result.current.shouldShow).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.shouldShow).toBe(false);
      expect(localStorage.getItem('ios-install-dismissed')).toBeTruthy();
    });

    it('should not show prompt if previously dismissed', () => {
      localStorage.setItem('ios-install-dismissed', Date.now().toString());

      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      const { result } = renderHook(() => useIOSInstallPrompt());

      expect(result.current.shouldShow).toBe(false);
    });
  });
});
