
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

type UserRole = 'admin' | 'staff';

export function useRole() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user?.uid]);


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
    
    if (!adminRoleRef) {
        // This case can happen briefly when firestore is initializing
        return;
    }

    setIsLoading(true);
    getDoc(adminRoleRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          setRole('admin');
        } else {
          setRole('staff');
        }
      })
      .catch(error => {
        console.error('Error checking admin role:', error);
        setRole('staff'); // Default to 'staff' on error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, isUserLoading, adminRoleRef]);

  return { role, isLoading };
}
