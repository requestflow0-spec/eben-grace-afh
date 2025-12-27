
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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRole } from '@/hooks/useRole';
import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Patient, Task, Staff } from '@/lib/data';

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
      // This is not efficient for large datasets, but works for a prototype.
      // In a real app, you'd likely paginate or query by date range.
      return query(collection(firestore, 'patients'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  // This is a placeholder as we don't have a flat 'dailyRecords' collection anymore
  const { data: allRecords } = useCollection<Task>(null);

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
            <Button asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/records">
                <ClipboardList className="h-5 w-5" />
                <span>Create Daily Record</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/patients">
                <Users className="h-5 w-5" />
                <span>View Patients</span>
              </Link>
            </Button>
            {role === 'admin' && (
              <>
                <Button asChild variant="secondary" className="h-auto py-4 flex-col gap-2">
                  <Link href="/patients">
                    <Users className="h-5 w-5" />
                    <span>Add Patient</span>
                  </Link>
                </Button>
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

    