import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUserDocument,
  getUserData,
  updateNotificationSettings,
  isValidEmail,
  isValidPassword,
  getAuthErrorMessage,
} from '../auth';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Mock Firebase modules
vi.mock('../firebase', () => ({
  db: {},
  auth: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

describe('Authentication Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserDocument', () => {
    it('should create user document when user does not exist', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      } as User;

      const mockUserSnap = {
        exists: () => false,
      };

      const mockDocRef = { id: 'test-user-123' };
      vi.mocked(doc).mockReturnValue(mockDocRef as any);
      vi.mocked(getDoc).mockResolvedValue(mockUserSnap as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await createUserDocument(mockUser);

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          email: 'test@example.com',
          notificationSettings: {
            oneHour: true,
            thirtyMinutes: true,
          },
        })
      );
    });

    it('should not create user document when user already exists', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      } as User;

      const mockUserSnap = {
        exists: () => true,
      };

      vi.mocked(getDoc).mockResolvedValue(mockUserSnap as any);

      await createUserDocument(mockUser);

      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle errors during user document creation', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      } as User;

      const mockUserSnap = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockUserSnap as any);
      vi.mocked(setDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(createUserDocument(mockUser)).rejects.toThrow('Firestore error');
    });

    it('should handle null user gracefully', async () => {
      await createUserDocument(null as any);
      expect(getDoc).not.toHaveBeenCalled();
    });
  });

  describe('getUserData', () => {
    it('should retrieve user data when user exists', async () => {
      const mockUserData = {
        email: 'test@example.com',
        createdAt: new Date(),
        notificationSettings: {
          oneHour: true,
          thirtyMinutes: true,
        },
      };

      const mockUserSnap = {
        exists: () => true,
        data: () => mockUserData,
      };

      vi.mocked(getDoc).mockResolvedValue(mockUserSnap as any);

      const result = await getUserData('test-user-123');

      expect(result).toEqual({
        userId: 'test-user-123',
        ...mockUserData,
      });
    });

    it('should return null when user does not exist', async () => {
      const mockUserSnap = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockUserSnap as any);

      const result = await getUserData('test-user-123');

      expect(result).toBeNull();
    });

    it('should handle errors during user data retrieval', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(getUserData('test-user-123')).rejects.toThrow('Firestore error');
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings successfully', async () => {
      const settings = {
        oneHour: false,
        thirtyMinutes: true,
      };

      const mockDocRef = { id: 'test-user-123' };
      vi.mocked(doc).mockReturnValue(mockDocRef as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await updateNotificationSettings('test-user-123', settings);

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        { notificationSettings: settings },
        { merge: true }
      );
    });

    it('should handle errors during settings update', async () => {
      const settings = {
        oneHour: false,
        thirtyMinutes: true,
      };

      vi.mocked(setDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(
        updateNotificationSettings('test-user-123', settings)
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate passwords with 6 or more characters', () => {
      expect(isValidPassword('123456')).toBe(true);
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('abcdef')).toBe(true);
    });

    it('should reject passwords with less than 6 characters', () => {
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('abc')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should return user-friendly message for user-not-found error', () => {
      const error = { code: 'auth/user-not-found' };
      expect(getAuthErrorMessage(error)).toBe('No account found with this email address.');
    });

    it('should return user-friendly message for wrong-password error', () => {
      const error = { code: 'auth/wrong-password' };
      expect(getAuthErrorMessage(error)).toBe('Incorrect password.');
    });

    it('should return user-friendly message for email-already-in-use error', () => {
      const error = { code: 'auth/email-already-in-use' };
      expect(getAuthErrorMessage(error)).toBe('An account with this email already exists.');
    });

    it('should return user-friendly message for weak-password error', () => {
      const error = { code: 'auth/weak-password' };
      expect(getAuthErrorMessage(error)).toBe('Password should be at least 6 characters.');
    });

    it('should return user-friendly message for invalid-email error', () => {
      const error = { code: 'auth/invalid-email' };
      expect(getAuthErrorMessage(error)).toBe('Please enter a valid email address.');
    });

    it('should return user-friendly message for too-many-requests error', () => {
      const error = { code: 'auth/too-many-requests' };
      expect(getAuthErrorMessage(error)).toBe('Too many failed attempts. Please try again later.');
    });

    it('should return user-friendly message for network-request-failed error', () => {
      const error = { code: 'auth/network-request-failed' };
      expect(getAuthErrorMessage(error)).toBe('Network error. Please check your connection.');
    });

    it('should return user-friendly message for popup-closed-by-user error', () => {
      const error = { code: 'auth/popup-closed-by-user' };
      expect(getAuthErrorMessage(error)).toBe('Sign-in was cancelled.');
    });

    it('should return user-friendly message for popup-blocked error', () => {
      const error = { code: 'auth/popup-blocked' };
      expect(getAuthErrorMessage(error)).toBe('Pop-up was blocked. Please allow pop-ups and try again.');
    });

    it('should return error message for unknown errors', () => {
      const error = { code: 'auth/unknown-error', message: 'Unknown error occurred' };
      expect(getAuthErrorMessage(error)).toBe('Unknown error occurred');
    });

    it('should return default message when no error message is provided', () => {
      const error = { code: 'auth/unknown-error' };
      expect(getAuthErrorMessage(error)).toBe('An error occurred during authentication.');
    });
  });
});
