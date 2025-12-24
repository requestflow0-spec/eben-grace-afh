
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

type UserRole = 'admin' | 'staff' | null;

export function useRole() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // Asynchronously get the user's ID token to check for custom claims.
    user.getIdTokenResult()
      .then((idTokenResult) => {
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
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [user, isAuthLoading]);

  return { role, isLoading };
}
