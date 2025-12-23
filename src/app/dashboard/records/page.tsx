'use client';

import { useState } from 'react';
import Link from 'next/link';
import { patients, tasks, type Task, type Patient } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

type PatientWithTasks = Patient & { tasks: Task[] };

export default function DailyRecordsPage() {
  const [allTasks, setAllTasks] = useState<Task[]>(tasks);

  const handleToggleRecordStatus = (taskId: string) => {
    setAllTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const patientsWithTasks: PatientWithTasks[] = patients
    .map(patient => ({
      ...patient,
      tasks: allTasks.filter(task => task.patientName === patient.name),
    }))
    .filter(patient => patient.tasks.length > 0);

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

      {patientsWithTasks.length > 0 ? (
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
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy')}
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
                          handleToggleRecordStatus(task.id);
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
              There are no daily records for any patients yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
