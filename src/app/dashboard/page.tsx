
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  Calendar,
  TrendingUp,
  UsersRound,
  Plus,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRole } from '@/hooks/useRole';
import { useMemo, useState } from 'react';
import { collection, query, orderBy, addDoc, serverTimestamp, getDocs, collectionGroup, limit } from 'firebase/firestore';
import type { Patient, Task, Staff } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { AddPatientDialog } from '@/components/AddPatientDialog';

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RecentRecordsList({ records }: { records: Task[] | null }) {
  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No records yet</p>
        <p className="text-sm">Daily records will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Link
          key={record.id}
          href={`/patients/${record.patientId}`}
          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${
              !record.completed ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <div>
              <p className="font-medium text-sm">{record.patientName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(record.date), 'MMM d, yyyy, p')}
              </p>
            </div>
          </div>
          <Badge variant={record.completed ? 'secondary' : 'default'}>
            {record.completed ? 'Completed' : 'Pending'}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

const createRecordSchema = z.object({
    patientId: z.string().min(1, 'Please select a patient.'),
    description: z.string().min(1, 'Description is required.'),
});

function CreateDailyRecordDialog({ patients }: { patients: Patient[] | null }) {
    const [open, setOpen] = useState(false);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const { addNotification } = useNotifications();

    const form = useForm<z.infer<typeof createRecordSchema>>({
        resolver: zodResolver(createRecordSchema),
        defaultValues: {
            patientId: '',
            description: '',
        },
    });

    const { isSubmitting } = form.formState;

    const onSubmit = (values: z.infer<typeof createRecordSchema>) => {
        if (!firestore || !user || !patients) return;

        const selectedPatient = patients.find(p => p.id === values.patientId);
        if (!selectedPatient) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected patient not found.' });
            return;
        }

        const recordsRef = collection(firestore, `patients/${values.patientId}/dailyRecords`);
        const newRecord = {
            description: values.description,
            patientName: selectedPatient.name,
            patientId: values.patientId,
            date: new Date().toISOString(),
            completed: false,
            createdBy: {
                uid: user.uid,
                name: user.displayName || 'Unknown Staff',
            }
        };

        addDoc(recordsRef, newRecord).then(() => {
            toast({ title: 'Record created successfully.' });
            addNotification({
                title: 'New Care Record Added',
                description: `A new record for ${selectedPatient.name} has been added.`,
                href: `/patients/${values.patientId}`,
            });
            form.reset();
            setOpen(false);
        }).catch((error) => {
            console.error("Error creating record: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create the record.' });
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-auto py-4 flex-col gap-2">
                    <ClipboardList className="h-5 w-5" />
                    <span>Create Daily Record</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Care Record</DialogTitle>
                    <DialogDescription>
                        Log a new event, observation, or task for a patient.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="patientId"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Patient</Label>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a patient..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {patients?.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Description</Label>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g., Patient seemed more energetic today..."
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4" />}
                                Save Record
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { role } = useRole();
  const firestore = useFirestore();

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);
  
  const { data: patients } = useCollection<Patient>(patientsQuery);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);

  const { data: staffData } = useCollection<Staff>(staffQuery);

  const allRecordsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      // Use a collection group query to get all daily records across all patients.
      return query(
        collectionGroup(firestore, 'dailyRecords'), 
        orderBy('date', 'desc'),
        limit(20) // Limit to a reasonable number for the dashboard
      );
  }, [firestore]);
  
  const { data: allRecords } = useCollection<Task>(allRecordsQuery);

  const recentRecords = useMemo(() => {
    if (!allRecords) return [];
    return allRecords.slice(0, 4);
  }, [allRecords]);

  const pendingTasks = allRecords?.filter(t => !t.completed).length || 0;
  const today = new Date();
  const todayRecords = allRecords?.filter(
    t => new Date(t.date).toDateString() === today.toDateString()
  ).length;

  const completionRate =
    patients?.length && todayRecords !== undefined
      ? `${Math.round((todayRecords / Math.max(patients.length, 1)) * 100)}%`
      : '0%';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of today's care activities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={patients?.length || 0}
          icon={<Users className="h-4 w-4 text-primary" />}
          description="All active patients"
        />
         <StatCard
          title="Total Staff"
          value={staffData?.length || 0}
          icon={<UsersRound className="h-4 w-4 text-primary" />}
          description="All staff members"
        />
        <StatCard
          title="Pending Records"
          value={pendingTasks}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          description="Awaiting completion"
        />
        <StatCard
          title="Completion Rate"
          value={completionRate}
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
          description="Today's progress"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <CreateDailyRecordDialog patients={patients} />
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/patients">
                <Users className="h-5 w-5" />
                <span>View Patients</span>
              </Link>
            </Button>
            {role === 'admin' && (
              <>
                <AddPatientDialog>
                  <Button variant="secondary" className="h-auto py-4 flex-col gap-2">
                    <Users className="h-5 w-5" />
                    <span>Add Patient</span>
                  </Button>
                </AddPatientDialog>
                <Button asChild variant="secondary" className="h-auto py-4 flex-col gap-2">
                  <Link href="/reports">
                    <TrendingUp className="h-5 w-5" />
                    <span>Generate Report</span>
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Records</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/records">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentRecordsList records={recentRecords} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
