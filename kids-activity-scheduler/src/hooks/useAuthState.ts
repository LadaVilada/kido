'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createUserDocument, getUserData } from '@/lib/auth';
import { User as UserType } from '@/types';

interface UseAuthStateReturn {
  user: UserType | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook that provides user authentication state and user data from Firestore
 */
export const useAuthState = (): UseAuthStateReturn => {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUserChange = async () => {
      if (firebaseUser) {
        try {
          // Create user document if it doesn't exist
          await createUserDocument(firebaseUser);
          
          // Get user data from Firestore
          const data = await getUserData(firebaseUser.uid);
          setUserData(data);
          setError(null);
        } catch (err) {
          console.error('Error handling user change:', err);
          setError('Failed to load user data');
          setUserData(null);
        }
      } else {
        setUserData(null);
        setError(null);
      }
      
      setLoading(false);
    };

    if (!authLoading) {
      handleUserChange();
    }
  }, [firebaseUser, authLoading]);

  return {
    user: userData,
    loading: authLoading || loading,
    error,
  };
};