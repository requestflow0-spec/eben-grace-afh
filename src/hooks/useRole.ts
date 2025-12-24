
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import type { IdTokenResult } from 'firebase/auth';

type UserRole = 'admin' | 'staff' | null;

export function useRole() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [role, setRole] = useState<UserRole>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      setIsLoading(true);

      if (isAuthLoading) {
        return; // Wait until auth state is determined
      }

      if (!user) {
        setRole(null);
        setClaims(null);
        setIsLoading(false);
        return;
      }
      
      // Use custom claims as the single source of truth for roles.
      try {
        const idTokenResult = await user.getIdTokenResult();
        const userClaims = idTokenResult.claims;
        setClaims(userClaims);

        if (userClaims.admin) {
          setRole('admin');
        } else if (userClaims.staff) {
          setRole('staff');
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching user claims:", error);
        setRole(null);
        setClaims(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, [user, isAuthLoading]);


  return { role, claims, isLoading };
}
