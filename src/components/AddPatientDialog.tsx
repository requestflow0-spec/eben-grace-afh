
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import { useFirestore, useUser } from '@/firebase';
import { useRole } from '@/hooks/useRole';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  dateOfBirth: z.string().optional(),
  disabilityType: z.string().optional(),
  careNeeds: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export function AddPatientDialog({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { role } = useRole();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { addNotification } = useNotifications();

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
      .then((docRef) => {
        toast({ title: 'Patient created successfully.' });
        addNotification({
          title: 'New Patient Added',
          description: `${values.name} has been added to the system.`,
          href: `/patients/${docRef.id}`,
        });
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
        {children}
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
