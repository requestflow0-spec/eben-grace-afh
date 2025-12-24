
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import type { IdTokenResult } from 'firebase/auth';

type UserRole = 'admin' | 'staff' | null;
type UserClaims = IdTokenResult['claims'] | null;

export function useRole() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [role, setRole] = useState<UserRole>(null);
  const [claims, setClaims] = useState<UserClaims>(null);
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

    // Asynchronously get the user's ID token to check for custom claims.
    user.getIdTokenResult(true) // Pass true to force refresh the token
      .then((idTokenResult) => {
        setClaims(idTokenResult.claims);
        // The 'admin' claim is set by our secure API route during signup.
        if (idTokenResult.claims.admin) {
          setRole('admin');
        } else {
          setRole('staff');
        }
      })
      .catch(() => {
        // If there's an error, default to the lowest privilege for safety.
        setRole('staff');
        setClaims(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [user, isAuthLoading]);

  return { role, claims, isLoading };
}
