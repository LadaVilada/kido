import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import React from 'react';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// Mock Firebase config
vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

// Mock user initialization
vi.mock('@/lib/userInit', () => ({
  initializeUserDocument: vi.fn(),
}));

// Mock family service
vi.mock('@/services/familyService', () => ({
  FamilyService: {
    acceptInvitation: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window location
    if (typeof window !== 'undefined') {
      delete (window as any).location;
      (window as any).location = { search: '', pathname: '/' };
      window.history.replaceState = vi.fn();
    }
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });

  describe('Authentication state management', () => {
    it('should initialize with loading state', () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('should update user state when authentication changes', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };

      // Simulate auth state change
      await waitFor(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle user logout', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Simulate logout
      await waitFor(() => {
        authStateCallback(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('signIn', () => {
    it('should call Firebase signInWithEmailAndPassword', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({} as any);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await result.current.signIn('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });

    it('should throw error on failed sign in', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const mockError = new Error('Invalid credentials');
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(mockError);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await expect(
        result.current.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should call Firebase createUserWithEmailAndPassword', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({} as any);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await result.current.signUp('newuser@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );
    });

    it('should throw error on failed sign up', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const mockError = new Error('Email already in use');
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(mockError);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await expect(
        result.current.signUp('existing@example.com', 'password123')
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('signInWithGoogle', () => {
    it('should call Firebase signInWithPopup with Google provider', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      vi.mocked(signInWithPopup).mockResolvedValue({} as any);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await result.current.signInWithGoogle();

      expect(signInWithPopup).toHaveBeenCalled();
    });

    it('should throw error on failed Google sign in', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const mockError = new Error('Popup closed');
      vi.mocked(signInWithPopup).mockRejectedValue(mockError);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await expect(result.current.signInWithGoogle()).rejects.toThrow('Popup closed');
    });
  });

  describe('logout', () => {
    it('should call Firebase signOut', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      vi.mocked(signOut).mockResolvedValue(undefined);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await result.current.logout();

      expect(signOut).toHaveBeenCalled();
    });

    it('should throw error on failed logout', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const mockError = new Error('Logout failed');
      vi.mocked(signOut).mockRejectedValue(mockError);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await expect(result.current.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('resetPassword', () => {
    it('should call Firebase sendPasswordResetEmail', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await result.current.resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });

    it('should throw error on failed password reset', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const mockError = new Error('User not found');
      vi.mocked(sendPasswordResetEmail).mockRejectedValue(mockError);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        authStateCallback(null);
      });

      await expect(result.current.resetPassword('nonexistent@example.com')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('Session persistence', () => {
    it('should persist authentication state across component remounts', async () => {
      let authStateCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result, unmount } = renderHook(() => useAuth(), { wrapper });

      // Simulate auth state change
      await waitFor(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Unmount and remount
      unmount();

      const { result: result2 } = renderHook(() => useAuth(), { wrapper });

      // Auth state should be restored
      await waitFor(() => {
        authStateCallback(mockUser);
      });

      await waitFor(() => {
        expect(result2.current.user).toEqual(mockUser);
      });
    });
  });
});
