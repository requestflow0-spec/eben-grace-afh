
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type UserRole = 'admin' | 'staff' | null;

type UserProfile = {
  role: UserRole;
  [key: string]: any;
};

export function useRole() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const loading = isAuthLoading || isProfileLoading;
    setIsLoading(loading);

    if (loading) return;

    if (!user || !userProfile) {
      setRole(null);
      return;
    }

    setRole(userProfile.role);

  }, [user, userProfile, isAuthLoading, isProfileLoading]);

  return { role, isLoading };
}
