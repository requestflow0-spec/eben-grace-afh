
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type UserRole = 'admin' | 'staff' | null;
type UserProfile = {
  role: UserRole;
  // other profile fields...
};

export function useRole() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.id);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const role = userProfile?.role || null;
  const isLoading = isAuthLoading || isProfileLoading;

  return { role, isLoading };
}
