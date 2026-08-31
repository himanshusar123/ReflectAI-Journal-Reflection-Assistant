import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import firebaseConfigRaw from '../firebase-applet-config.json';
import { JournalEntry } from './types';

// Initialize Firebase App
const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if configured
const databaseId = firebaseConfigRaw.firestoreDatabaseId && firebaseConfigRaw.firestoreDatabaseId !== '(default)'
  ? firebaseConfigRaw.firestoreDatabaseId
  : undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

/**
 * Utility to strip undefined properties recursively from objects
 * before sending them to Firestore to prevent crashes.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  return JSON.parse(JSON.stringify(data));
}

// Authentication Actions
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Google Sign-In Popup failed (possibly iframe blocked), trying anonymous login fallback...', error);
    // If popup is blocked in sandbox iframe, allow anonymous login as fallback
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      const anonResult = await signInAnonymously(auth);
      return anonResult.user;
    }
    throw error;
  }
}

export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Firestore Database Operations (Strict User Isolation)
export function getUserEntriesRef(userId: string) {
  return collection(db, 'users', userId, 'entries');
}

export function getUserInteractionsRef(userId: string) {
  return collection(db, 'users', userId, 'interactions');
}

export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('User ID is required to save an entry.');
  const cleanEntry = sanitizeForFirestore(entry);
  const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);
  await setDoc(entryDocRef, cleanEntry, { merge: true });
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID required.');
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryDocRef);
}

export async function togglePinEntry(userId: string, entryId: string, currentPinned: boolean): Promise<void> {
  if (!userId || !entryId) return;
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await updateDoc(entryDocRef, {
    pinned: !currentPinned,
    updatedAt: new Date().toISOString()
  });
}
