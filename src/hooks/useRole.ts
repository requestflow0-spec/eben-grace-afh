
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

type UserRole = 'admin' | 'staff';

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
    // Check if the user's email matches the admin email from environment variables
    if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      setRole('admin');
    } else {
      setRole('staff');
    }
    setIsLoading(false);

  }, [user, isUserLoading]);

  return { role, isLoading };
}
