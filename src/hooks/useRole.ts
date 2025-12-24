
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
  const [role, setRole] = useState<UserRole>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    
    if (!user) {
      setRole(null);
      setClaims(null);
      setIsLoading(false);
      return;
    }
    
    const getClaims = async () => {
      try {
        const idTokenResult = await user.getIdTokenResult();
        setClaims(idTokenResult.claims);

        if (idTokenResult.claims.admin) {
          setRole('admin');
        } else if (idTokenResult.claims.staff) {
          setRole('staff');
        } else {
          setRole(null); // Fallback for users with no role claim
        }
      } catch (error) {
        console.error("Error fetching user claims:", error);
        setRole(null);
        setClaims(null);
      } finally {
        setIsLoading(false);
      }
    };

    getClaims();

  }, [user, isAuthLoading]);


  return { role, claims, isLoading };
}
