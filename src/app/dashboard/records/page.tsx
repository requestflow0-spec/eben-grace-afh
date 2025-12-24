
'use client';

import { useState, useMemo } from 'react';
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, collectionGroup, doc, query, updateDoc, where, orderBy } from 'firebase/firestore';
import type { Patient, Task, Staff } from '@/lib/data';
import { useRole } from '@/hooks/useRole';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type PatientWithTasks = Patient & { tasks: Task[] };

export default function DailyRecordsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { role, isLoading: isRoleLoading } = useRole();
  
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'staff');
  }, [firestore]);

  const { data: staffData } = useCollection<Staff>(staffQuery);

  const assignedPatientIds = useMemo(() => {
    if (role === 'staff' && staffData) {
      const staffMember = staffData.find(s => s.id === user?.uid);
      return staffMember?.assignedPatients || [];
    }
    return null;
  }, [role, user?.uid, staffData]);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || isRoleLoading) return null;
    if (role === 'admin') {
      return collection(firestore, 'patients');
    }
    if (role === 'staff') {
      if (assignedPatientIds && assignedPatientIds.length > 0) {
        return query(collection(firestore, 'patients'), where('__name__', 'in', assignedPatientIds));
      }
      return null;
    }
    return null;
  }, [firestore, role, isRoleLoading, assignedPatientIds]);

  const { data: patients, isLoading: isLoadingPatients } = useCollection<Patient>(patientsQuery);
  
  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || isRoleLoading) return null;
    if (role === 'admin') {
        return query(collectionGroup(firestore, 'dailyRecords'), orderBy('date', 'desc'));
    }
    if (role === 'staff') {
        if (assignedPatientIds && assignedPatientIds.length > 0) {
            return query(collectionGroup(firestore, 'dailyRecords'), where('patientId', 'in', assignedPatientIds), orderBy('date', 'desc'));
        }
        return null;
    }
    return null;
  }, [firestore, role, isRoleLoading, assignedPatientIds]);
  
  const { data: allTasks, isLoading: isLoadingTasks } = useCollection<Task>(recordsQuery);

  const handleToggleRecordStatus = (task: Task) => {
    if (!firestore || !task.id || !task.patientId) return;

    // To get the full path, we must construct it.
    // collectionGroup queries don't provide the full path in the snapshot.
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

  const patientsWithTasks: PatientWithTasks[] = useMemo(() => {
    if (!patients || !allTasks) return [];

    const patientMap = new Map<string, PatientWithTasks>();

    patients.forEach(p => {
      patientMap.set(p.id, { ...p, tasks: [] });
    });

    allTasks.forEach(task => {
      if (task.patientId && patientMap.has(task.patientId)) {
        patientMap.get(task.patientId)?.tasks.push(task);
      }
    });

    return Array.from(patientMap.values()).filter(p => p.tasks.length > 0);

  }, [patients, allTasks]);


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

      {isLoadingPatients || isLoadingTasks ? (
         <p>Loading records...</p>
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
                      href={`/dashboard/patients/${patient.id}`}
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
              {role === 'staff' ? 'No records found for your assigned patients.' : 'There are no daily records for any patients yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    