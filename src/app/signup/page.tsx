'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth } from '@/firebase';

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
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminSignup, setIsAdminSignup] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // In a real app you might check if any admin exists to determine this.
  // For this prototype, we'll keep it simple.
  // We can add a button or a separate route for the first admin signup.
  // Let's assume for now the first user is an admin.
  // This logic is flawed, a better approach is needed. For now, let's focus on staff signup.

  // const handleSignUp = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   if (password !== repeatPassword) {
  //     toast({
  //       variant: 'destructive',
  //       title: 'Sign-up Failed',
  //       description: 'Passwords do not match.',
  //     });
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //       const response = await fetch('/api/signup-staff', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({ name, email, password }),
  //       });

  //       const result = await response.json();

  //       if (!response.ok) {
  //           throw new Error(result.error || 'An unknown error occurred.');
  //       }

  //       // After successful server-side creation, log the user in on the client
  //       if (auth) {
  //           await signInWithEmailAndPassword(auth, email, password);
  //       }

  //       toast({ title: 'Account created successfully!' });
  //       router.push('/dashboard');

  //   } catch (error: any) {
  //     console.error('Sign-Up Error:', error);
  //     toast({
  //       variant: 'destructive',
  //       title: 'Sign-up Failed',
  //       description: error.message || 'Could not create account. Please try again.',
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const response = await fetch('/api/signup-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
  
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server error. Please check the console and try again.');
      }
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }
  
      // After successful server-side creation, log the user in on the client
      if (auth) {
        await signInWithEmailAndPassword(auth, email, password);
      }
  
      toast({ title: 'Account created successfully!' });
      router.push('/dashboard');
  
    } catch (error: any) {
      console.error('Sign-Up Error:', error);
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
