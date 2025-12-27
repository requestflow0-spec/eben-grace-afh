
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, getDocs } from 'firebase/firestore';
import type { Patient, Task } from '@/lib/data';
import { useRole } from '@/hooks/useRole';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '../dashboard/layout';

type PatientWithTasks = Patient & { tasks: Task[] };

function DailyRecordsPageContent() {
  const firestore = useFirestore();
  const { role } = useRole();
  const [patientsWithTasks, setPatientsWithTasks] = React.useState<PatientWithTasks[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const { data: patients, isLoading: isLoadingPatients } = useCollection<Patient>(patientsQuery);

  React.useEffect(() => {
    if (isLoadingPatients || !patients || !firestore) return;

    const fetchTasksForPatients = async () => {
        setIsLoading(true);
        const patientsMap = new Map<string, PatientWithTasks>();
        patients.forEach(p => patientsMap.set(p.id, { ...p, tasks: [] }));

        const tasksPromises = patients.map(p => 
            getDocs(collection(firestore, `patients/${p.id}/dailyRecords`))
        );
        
        const taskSnapshots = await Promise.all(tasksPromises);

        taskSnapshots.forEach((snapshot, index) => {
            const patientId = patients[index].id;
            const patient = patientsMap.get(patientId);
            if (patient) {
                snapshot.forEach(doc => {
                    patient.tasks.push({ ...doc.data(), id: doc.id } as Task);
                });
            }
        });
        
        const finalData = Array.from(patientsMap.values()).filter(p => p.tasks.length > 0);
        finalData.forEach(p => p.tasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        setPatientsWithTasks(finalData);
        setIsLoading(false);
    };

    fetchTasksForPatients();
  }, [patients, isLoadingPatients, firestore]);


  const handleToggleRecordStatus = (task: Task) => {
    if (!firestore || !task.id || !task.patientId) return;

    const recordRef = doc(firestore, `patients/${task.patientId}/dailyRecords/${task.id}`);
    
    updateDoc(recordRef, { completed: !task.completed }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: recordRef.path,
            operation: 'update',
            requestResourceData: { completed: !task.completed },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Daily Records
          </h1>
          <p className="text-muted-foreground">
            A comprehensive log of all patient activities.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : patientsWithTasks.length > 0 ? (
        <div className="space-y-6">
          {patientsWithTasks.map(patient => (
            <Card key={patient.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={patient.avatarUrl}
                      alt={patient.name}
                      data-ai-hint={patient.avatarHint}
                    />
                    <AvatarFallback>
                      {patient.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{patient.name}</CardTitle>
                    <CardDescription>
                      {patient.tasks.length} record(s) found.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.tasks.map(task => (
                     <Link
                      key={task.id}
                      href={`/patients/${patient.id}`}
                    >
                    <div
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {format(new Date(task.date), 'EEEE, MMMM d, yyyy, p')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={task.completed ? 'secondary' : 'default'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleRecordStatus(task);
                        }}
                        className="cursor-pointer"
                      >
                        {task.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No Records Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {role === 'staff' ? 'No records found for any assigned patients.' : 'There are no daily records for any patients yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DailyRecordsPage() {
  return (
    <DashboardLayout>
      <DailyRecordsPageContent />
    </DashboardLayout>
  )
}

    