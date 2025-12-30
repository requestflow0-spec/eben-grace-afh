
'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Edit,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Staff, Patient } from '@/lib/data';
import { useRole } from '@/hooks/useRole';
import DashboardLayout from '../../dashboard/layout';

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const formattedHour = hour.toString().padStart(2, '0');
  return `${formattedHour}:${minute}`;
});

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function ScheduleEditor() {
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
       <div>
        <Label>Working Days</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {daysOfWeek.map(day => (
                <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                        id={`day-${day}`}
                        checked={selectedDays.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label htmlFor={`day-${day}`} className="font-normal text-sm">{day}</Label>
                </div>
            ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-time">Start Time</Label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger id="start-time">
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(time => (
                <SelectItem key={`start-${time}`} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="end-time">End Time</Label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger id="end-time">
              <SelectValue placeholder="End time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(time => (
                <SelectItem key={`end-${time}`} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function StaffDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-48" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
              <div className="mt-4 flex flex-wrap gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-1/3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-2/3" />
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function StaffDetailPageContent({
  params: paramsProp,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsProp);
  const firestore = useFirestore();
  const { role } = useRole();

  const staffDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'staff', id);
  }, [firestore, id]);

  const { data: member, isLoading: isStaffLoading } = useDoc<Staff>(staffDocRef);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    console.log("id: ", id);
    return query(collection(firestore, 'patients'), where('assignedStaff', 'array-contains', id));
  }, [firestore, id]);
  
  const { data: assignedPatients, isLoading: arePatientsLoading } = useCollection<Patient>(patientsQuery);

  const canEdit = role === 'admin';
  
  if (isStaffLoading || arePatientsLoading) {
    return <StaffDetailSkeleton />;
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Staff Member not found</h2>
        <p className="text-muted-foreground mb-4">
          The staff member you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/staff">Back to Staff List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/staff">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Staff Profile
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border">
              <AvatarImage
                src={member.avatarUrl}
                alt={member.name}
                data-ai-hint={member.avatarHint}
              />
              <AvatarFallback className="text-3xl">
                {member.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-headline">
                {member.name}
              </h2>
              <p className="text-muted-foreground">{member.role}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{member.phone}</span>
                </div>
              </div>
            </div>
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
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Working days and hours.
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!canEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Schedule</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <ScheduleEditor />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Save Changes</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <p className="font-medium">{member.schedule}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
            <CardDescription>
              Professional qualifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {member.certifications.map(cert => (
              <Badge key={cert} variant="secondary">
                {cert}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
            <CardDescription>
              Patients this staff member is assigned to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedPatients && assignedPatients.length > 0 ? (
              <div className="space-y-2">
                {assignedPatients.map(patient => (
                  <Link key={patient.id} href={`/patients/${patient.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={patient.avatarUrl} alt={patient.name} data-ai-hint={patient.avatarHint} />
                                <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{patient.name}</span>
                        </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No patients assigned.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardLayout>
      <StaffDetailPageContent params={params} />
    </DashboardLayout>
  )
}
