
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { IdTokenResult } from 'firebase/auth';

type UserRole = 'admin' | 'staff' | null;

type UserProfile = {
  role: UserRole;
  [key: string]: any;
};

export function useRole() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [role, setRole] = useState<UserRole>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    const checkRole = async () => {
      setIsLoading(true);

      if (isAuthLoading || (user && isProfileLoading)) {
        return; // Wait until all data is loaded
      }

      if (!user) {
        setRole(null);
        setClaims(null);
        setIsLoading(false);
        return;
      }
      
      // 1. Check custom claims first (for staff)
      try {
        const idTokenResult = await user.getIdTokenResult();
        setClaims(idTokenResult.claims);
        if (idTokenResult.claims.staff) {
          setRole('staff');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error fetching user claims:", error);
      }

      // 2. Check Firestore document (for admin)
      if (userProfile?.role === 'admin') {
        setRole('admin');
        setIsLoading(false);
        return;
      }
      
      // 3. Fallback
      setRole(null);
      setIsLoading(false);
    };

    checkRole();
  }, [user, isAuthLoading, userProfile, isProfileLoading]);


  return { role, claims, isLoading };
}
