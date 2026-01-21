import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Child, Activity } from '@/types';

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  CHILDREN: 'children',
  ACTIVITIES: 'activities',
} as const;

// Helper function to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date();
};

// Helper function to convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Database initialization utilities
export const initializeDatabase = async (userId: string): Promise<void> => {
  try {
    // Check if user document exists
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User document not found. Please sign in again.');
    }
    
    console.log('Database initialized for user:', userId);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Generic CRUD operations
export const createDocument = async (
  collectionName: string, 
  data: any
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

export const getDocument = async <T>(
  collectionName: string, 
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as T;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (
  collectionName: string, 
  docId: string, 
  data: any
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (
  collectionName: string, 
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

export const getDocumentsByUser = async <T>(
  collectionName: string, 
  userId: string,
  orderByField?: string
): Promise<T[]> => {
  try {
    let q = query(
      collection(db, collectionName),
      where('userId', '==', userId)
    );
    
    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }
    
    const querySnapshot = await getDocs(q);
    const documents: T[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      } as T);
    });
    
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

// Real-time subscription utilities
export const subscribeToUserDocuments = <T>(
  collectionName: string,
  userId: string,
  callback: (documents: T[]) => void,
  orderByField?: string
): (() => void) => {
  try {
    let q = query(
      collection(db, collectionName),
      where('userId', '==', userId)
    );
    
    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documents: T[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        } as T);
      });
      callback(documents);
    }, (error) => {
      console.error(`Error in subscription to ${collectionName}:`, error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error(`Error setting up subscription to ${collectionName}:`, error);
    throw error;
  }
};

export const subscribeToDocument = <T>(
  collectionName: string,
  docId: string,
  callback: (document: T | null) => void
): (() => void) => {
  try {
    const docRef = doc(db, collectionName, docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...docSnap.data(),
        } as T);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error in document subscription to ${collectionName}:`, error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error(`Error setting up document subscription to ${collectionName}:`, error);
    throw error;
  }
};

// Error handling utilities
export const handleFirestoreError = (error: any): string => {
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'not-found':
      return 'The requested document was not found.';
    case 'already-exists':
      return 'A document with this ID already exists.';
    case 'resource-exhausted':
      return 'Too many requests. Please try again later.';
    case 'failed-precondition':
      return 'The operation failed due to a conflict. Please refresh and try again.';
    case 'aborted':
      return 'The operation was aborted. Please try again.';
    case 'out-of-range':
      return 'The operation was attempted past the valid range.';
    case 'unimplemented':
      return 'This operation is not implemented or supported.';
    case 'internal':
      return 'An internal error occurred. Please try again later.';
    case 'unavailable':
      return 'The service is currently unavailable. Please try again later.';
    case 'data-loss':
      return 'Unrecoverable data loss or corruption occurred.';
    case 'unauthenticated':
      return 'You must be signed in to perform this action.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};