
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const processStaffInvitation = async (userId: string, userEmail: string, userName: string) => {
    if (!firestore) return;
    const invitationsRef = collection(firestore, 'invitations');
    const q = query(invitationsRef, where('email', '==', userEmail));

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return; // Not a staff invitation
      }

      const batch = writeBatch(firestore);
      const invitationDoc = querySnapshot.docs[0];
      
      // 1. Create a new staff profile
      const staffRef = collection(firestore, 'staff');
      const newStaffDoc = {
        id: userId,
        name: userName,
        role: invitationDoc.data().role || 'Staff',
        email: userEmail,
        certifications: ['Basic Care'],
        schedule: 'Mon-Fri, 9am-5pm',
        available: true,
        avatarUrl: `https://picsum.photos/seed/${userId}/200/200`,
        avatarHint: 'person professional',
      };
      batch.set(collection(firestore, 'staff', userId), newStaffDoc);

      // 2. Delete the invitation
      batch.delete(invitationDoc.ref);

      // Commit the batch
      await batch.commit();

      toast({ title: "Welcome!", description: "Your staff account has been set up." });
    } catch (error) {
      console.error("Error processing staff invitation: ", error);
      // Let's not surface this error to the user for now to keep UX simple
    }
  };


  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeatPassword) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: 'Passwords do not match. Please try again.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      // After user is created, check for staff invitation
      await processStaffInvitation(user.uid, email, name);


      // Here you would typically save the phone number to Firestore
      // For now, we are just collecting it.

      toast({ title: 'Account created successfully!' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Email Sign-Up Error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: error.message || 'Could not create account. Please try again.',
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
            Create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
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
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(123) 456-7890"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
