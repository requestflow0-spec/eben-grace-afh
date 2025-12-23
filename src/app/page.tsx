
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="h-8 w-64 mt-4" />
      <Skeleton className="h-4 w-48 mt-2" />
    </div>
  );
}
