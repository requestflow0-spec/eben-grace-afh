'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { 
  doc,
  writeBatch,
  query,
  collection,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CareHubLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Services not available. Please try again later.',
        });
        return;
    }

    if (password !== repeatPassword) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: 'Passwords do not match.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if there's a pending staff invitation for this email
      const staffQuery = query(
        collection(firestore, "staff"),
        where("email", "==", email),
        where("status", "==", "pending")
      );
      const staffSnapshot = await getDocs(staffQuery);

      if (!staffSnapshot.empty) {
        // This is a staff signup
        const staffDoc = staffSnapshot.docs[0];
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        const batch = writeBatch(firestore);

        // 1. Create the user's role document
        const userDocRef = doc(firestore, 'users', user.uid);
        batch.set(userDocRef, {
            email,
            displayName: name,
            role: 'staff',
            createdAt: Timestamp.now(),
        });
        
        // 2. Update the staff document to 'active' and set the UID
        batch.update(staffDoc.ref, {
            status: 'active',
            id: user.uid, // Link the staff profile to the auth user
            name: name, // Update name from signup form
            updatedAt: Timestamp.now(),
        });

        await batch.commit();

        toast({ title: 'Staff account created successfully!' });
        router.push('/dashboard');
        
      } else {
        // This is a potential admin signup. Check if any admin exists.
        const adminQuery = query(collection(firestore, "users"), where("role", "==", "admin"));
        const adminSnapshot = await getDocs(adminQuery);

        if (adminSnapshot.empty) {
          // This is the first user, make them an admin.
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          await updateProfile(user, { displayName: name });
          
          const userDocRef = doc(firestore, 'users', user.uid);
          await writeBatch(firestore)
            .set(userDocRef, {
                email,
                displayName: name,
                role: 'admin',
                createdAt: Timestamp.now(),
            })
            .commit();

          toast({ title: 'Admin account created successfully!' });
          router.push('/dashboard');
        } else {
          // An admin exists, and this email is not an invited staff member.
          throw new Error("This email is not registered for staff sign-up. Please contact an administrator.");
        }
      }

    } catch (error: any) {
      console.error('Sign-Up Error:', error);
      let errorMessage = error.message || 'Could not create account. Please try again.';
      if (error.code === 'auth/email-already-exists') {
          errorMessage = 'An account with this email address already exists. Please log in instead.';
      } else if (error.code === 'auth/weak-password') {
          errorMessage = 'The password is too weak. It must be at least 6 characters long.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <CareHubLogo className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline">CareHub Pro</CardTitle>
          </div>
          <CardDescription>
            Create your account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeat-password">Confirm Password</Label>
              <Input
                id="repeat-password"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
