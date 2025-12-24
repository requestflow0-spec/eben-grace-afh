
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { differenceInYears, parseISO } from 'date-fns';
import {
  Plus,
  Search,
  User,
  Phone,
  Calendar,
} from 'lucide-react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { useRole } from '@/hooks/useRole';
import { useToast } from '@/hooks/use-toast';

import type { Patient } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/* -------------------------------------------------------------------------- */
/*                                ADD PATIENT                                 */
/* -------------------------------------------------------------------------- */

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  dateOfBirth: z.string().optional(),
  disabilityType: z.string().optional(),
  careNeeds: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

function AddPatientDialog() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { role } = useRole();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
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

  if (role !== 'admin') return null;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) return;

    const newPatientDoc = {
      name: values.name,
      dateOfBirth: values.dateOfBirth,
      disabilityType: values.disabilityType,
      careNeeds: values.careNeeds,
      emergencyContact: {
        name: values.emergencyContactName || '',
        phone: values.emergencyContactPhone || '',
        relation: "",
      },
      notes: values.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      avatarUrl: `https://picsum.photos/seed/${Math.random()}/200/200`,
      avatarHint: 'person portrait',
    };
    
    const patientsRef = collection(firestore, 'patients');
    addDoc(patientsRef, newPatientDoc)
      .then(() => {
        toast({ title: 'Patient created successfully.' });
        form.reset();
        setOpen(false);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: patientsRef.path,
          operation: 'create',
          requestResourceData: newPatientDoc,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

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
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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


/* -------------------------------------------------------------------------- */
/*                                PATIENT CARD                                */
/* -------------------------------------------------------------------------- */

function PatientCard({ patient }: { patient: Patient }) {
  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
    : null;

  return (
    <Link href={`/dashboard/patients/${patient.id}`}>
      <Card className="hover:bg-muted/50 transition-colors h-full">
        <CardContent className="p-4 flex gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={patient.avatarUrl} data-ai-hint={patient.avatarHint} />
            <AvatarFallback>
              {patient.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{patient.name}</h3>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {age !== null && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {age} years old
                </span>
              )}
              {patient.disabilityType && (
                <Badge variant="secondary">
                  {patient.disabilityType}
                </Badge>
              )}
            </div>

            {patient.emergencyContact?.name && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Emergency: {patient.emergencyContact.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


/* -------------------------------------------------------------------------- */
/*                                MAIN PAGE                                   */
/* -------------------------------------------------------------------------- */

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const firestore = useFirestore();
  const { role } = useRole();

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const { data: patients, isLoading } = useCollection<Patient>(patientsQuery);

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = search.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.disabilityType && p.disabilityType.toLowerCase().includes(q))
    );
  }, [patients, search]);

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Patients</h1>
        <AddPatientDialog />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(p => (
            <PatientCard key={p.id} patient={p} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto mb-4 h-10 w-10 opacity-40" />
            <h3 className="font-semibold text-lg mb-1">No patients found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {search
                ? 'No patients match your search criteria.'
                : role === 'admin' ? 'Add your first patient to get started.' : 'No patients have been added to the system yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
