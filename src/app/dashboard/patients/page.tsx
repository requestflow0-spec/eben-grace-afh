
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Plus,
  Search,
  User,
  Phone,
  Calendar,
} from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Patient, Staff } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useRole } from '@/hooks/useRole';

const formSchema = z.object({
    name: z.string().min(1, 'Full name is required.'),
    dateOfBirth: z.string().optional(),
    disabilityType: z.string().optional(),
    careNeeds: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;


function AddPatientDialog() {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { role } = useRole();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '',
      disabilityType: '',
      careNeeds: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notes: '',
    },
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: FormValues) => {
    if (!firestore) return;

    const patientsRef = collection(firestore, 'patients');
    const newPatientDoc = {
        name: values.name,
        dateOfBirth: values.dateOfBirth,
        disabilityType: values.disabilityType,
        careNeeds: values.careNeeds,
        emergencyContact: {
            name: values.emergencyContactName || '',
            phone: values.emergencyContactPhone || '',
            relation: '', // Defaulting this, can be added to form if needed
        },
        notes: values.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/200/200`,
        avatarHint: 'person portrait',
    };

    addDoc(patientsRef, newPatientDoc).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
          path: patientsRef.path,
          operation: 'create',
          requestResourceData: newPatientDoc,
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    toast({
        title: "Patient Created",
        description: `${values.name} has been added to the system.`,
    });
    
    form.reset();
    setOpen(false);
  };

  if (role !== 'admin') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter the patient's information to create their profile.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Patient's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="disabilityType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Disability Type</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Physical, Cognitive" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="careNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Care Needs</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe specific care requirements..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                        <Input type="tel" placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional information..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Patient'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PatientCard({ patient }: { patient: Patient }) {
  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
    : null;

  return (
    <Link href={`/dashboard/patients/${patient.id}`}>
      <Card className="hover:bg-muted/50 transition-colors h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={patient.avatarUrl} alt={patient.name} data-ai-hint={patient.avatarHint} />
              <AvatarFallback>
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {patient.name}
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {age !== null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {age} years old
                  </span>
                )}
                {patient.disabilityType && (
                  <Badge variant="secondary">{patient.disabilityType}</Badge>
                )}
              </div>
              {patient.emergencyContact?.name && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Emergency: {patient.emergencyContact.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();
  const { role } = useRole();
  
  const staffQuery = useMemoFirebase(() => {
    return firestore ? collection(firestore, 'staff') : null;
  }, [firestore]);
  const { data: staffData } = useCollection<Staff>(staffQuery);

  const assignedPatientIds = useMemo(() => {
    if (role === 'staff' && staffData) {
      const staffMember = staffData.find(s => s.id === user?.uid);
      return staffMember?.assignedPatients || [];
    }
    return null;
  }, [role, user, staffData]);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (role === 'admin') {
      return collection(firestore, 'patients');
    }
    if (role === 'staff') {
      if (assignedPatientIds && assignedPatientIds.length > 0) {
        return query(collection(firestore, 'patients'), where('id', 'in', assignedPatientIds));
      }
      return null;
    }
    return null;
  }, [firestore, role, assignedPatientIds]);

  const { data: patients, isLoading } = useCollection<Patient>(patientsQuery);

  const filteredPatients = patients?.filter(
    patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.disabilityType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Patients
          </h1>
          <p className="text-muted-foreground">Manage all patient profiles</p>
        </div>
        <AddPatientDialog />
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No patients found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? 'No patients match your search criteria.'
                : role === 'admin' ? 'Add your first patient to get started.' : 'You have not been assigned any patients.'}
            </p>
            {!searchQuery && role === 'admin' && (
              <div className="mt-4">
                <AddPatientDialog />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
