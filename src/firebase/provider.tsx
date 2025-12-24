'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Define the shape of the context state
interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

// Define the shape of the user context state
interface UserContextState {
  user: User | null;
  isUserLoading: boolean;
}

// Create the contexts with initial null values
const FirebaseContext = createContext<FirebaseContextState>({
  firebaseApp: null,
  auth: null,
  firestore: null,
});

const UserContext = createContext<UserContextState>({
  user: null,
  isUserLoading: true,
});

// Define props for the provider
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

/**
 * Provides Firebase services (App, Auth, Firestore) to the component tree.
 * Also manages the user's authentication state.
 */
export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: FirebaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Memoize the Firebase services to prevent unnecessary re-renders
  const firebaseContextValue = useMemo(
    () => ({
      firebaseApp,
      auth,
      firestore,
    }),
    [firebaseApp, auth, firestore]
  );
  
  // Effect to handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsUserLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // Memoize the user context value
  const userContextValue = useMemo(
    () => ({
      user,
      isUserLoading,
    }),
    [user, isUserLoading]
  );

  return (
    <FirebaseContext.Provider value={firebaseContextValue}>
      <UserContext.Provider value={userContextValue}>
        <FirebaseErrorListener />
        {children}
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
}

// Custom hooks to easily access the contexts
export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useAuth = () => useContext(FirebaseContext).auth as Auth;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useUser = () => useContext(UserContext);

/**
 * A hook to create a stable, memoized reference to a Firestore query or document.
 * This is CRITICAL to prevent infinite loops when using `useCollection` or `useDoc`.
 *
 * @param factory A function that returns a Firestore query or document reference.
 * @param deps The dependency array for the `useMemo` hook.
 * @returns A memoized Firestore reference.
 */
export const useMemoFirebase = <T>(factory: () => T, deps: React.DependencyList) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  if (memoized) {
    (memoized as any).__memo = true;
  }
  return memoized;
};
