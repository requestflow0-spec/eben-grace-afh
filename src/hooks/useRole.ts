
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

type UserRole = 'admin' | 'staff';

const ADMIN_UID = 'RN2nXYcrPWTcUTECt3tOnkscAEX2';

export function useRole() {
  const { user, isUserLoading } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
        setIsLoading(true);
        return;
    }
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    // Check if the user's UID matches the admin UID
    if (user.uid === ADMIN_UID) {
      setRole('admin');
    } else {
      setRole('staff');
    }
    setIsLoading(false);

  }, [user, isUserLoading]);

  return { role, isLoading };
}
