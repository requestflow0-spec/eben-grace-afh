
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Mail, Users, KeyRound } from 'lucide-react';
import { type Staff } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useRole } from '@/hooks/useRole';
import { Skeleton } from '@/components/ui/skeleton';

function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSubmitting(true);

    // This is NOT secure for production. In a real app, this should be a serverless function
    // that uses the Firebase Admin SDK to create the user and set their custom claims.
    // For this prototype, we are creating a user on the client and adding them to the /staff collection.
    // The security rules should be configured to only allow admins to write to /staff.
    try {
      // NOTE: This approach of creating users on the client is insecure and for prototype purposes only.
      // A malicious user could intercept this and create users.
      // A proper implementation uses a secure backend endpoint (like a Cloud Function).
      
      const staffDocRef = doc(collection(firestore, 'staff')); // Create a new doc with a random ID
      const newStaffDoc = {
        id: staffDocRef.id, // Use the auto-generated ID
        name: name,
        role: 'Staff',
        email: email, // Note: This doesn't create an actual Firebase Auth user
        certifications: ['Basic Care'],
        schedule: 'Mon-Fri, 9am-5pm',
        available: true,
        avatarUrl: `https://picsum.photos/seed/${staffDocRef.id}/200/200`,
        avatarHint: 'person professional',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        assignedPatients: [],
      };
      
      await setDoc(staffDocRef, newStaffDoc);

      toast({
        title: "Staff Profile Created",
        description: `${name}'s profile has been created. They will need to be invited to create an auth account separately.`,
      });

      setOpen(false);
      setName('');
      setEmail('');
      setPassword('');

    } catch (error: any) {
      console.error("Error creating staff profile:", error);
      const staffCollRef = collection(firestore, 'staff');
       errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: staffCollRef.path,
          operation: 'create',
          requestResourceData: { name, email },
        })
      );
      toast({
        variant: 'destructive',
        title: "Operation Failed",
        description: error.message || "Could not create the staff profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Create a new staff profile. Note: This does not create a login account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
             <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Staff's full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="staff.member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !email || !name}>
              {isSubmitting ? 'Creating Profile...' : 'Create Staff Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffCard({ member }: { member: Staff }) {
  return (
    <Link href={`/dashboard/staff/${member.id}`}>
      <Card className="hover:bg-muted/50 transition-colors h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} />
              <AvatarFallback>
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {member.name}
              </h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant={member.available ? 'secondary' : 'outline'}
                  className={
                    member.available
                      ? 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-transparent'
                      : ''
                  }
                >
                  {member.available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { role } = useRole();
  const firestore = useFirestore();

  const staffQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);

  const { data: staff, isLoading } = useCollection<Staff>(staffQuery);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    const q = searchQuery.toLowerCase();
    return staff.filter(
      member =>
        member.name.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q)
    );
  }, [staff, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Staff Management
          </h1>
          <p className="text-muted-foreground">Manage all staff member profiles</p>
        </div>
        {role === 'admin' && <AddStaffDialog />}
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
        
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : filteredStaff.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStaff.map(member => (
            <StaffCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No staff found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? 'No staff members match your search criteria.'
                : 'Add your first staff member to get started.'}
            </p>
            {!searchQuery && role === 'admin' && (
              <div className="mt-4">
                <AddStaffDialog />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
