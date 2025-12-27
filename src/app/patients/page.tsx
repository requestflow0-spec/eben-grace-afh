
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  collection,
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
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { useRole } from '@/hooks/useRole';

import type { Patient } from '@/lib/data';
import DashboardLayout from '../dashboard/layout';
import { AddPatientDialog } from '@/components/AddPatientDialog';


/* -------------------------------------------------------------------------- */
/*                                PATIENT CARD                                */
/* -------------------------------------------------------------------------- */

function PatientCard({ patient }: { patient: Patient }) {
  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
    : null;

  return (
    <Link href={`/patients/${patient.id}`}>
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

function PatientsPageContent() {
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
        {role === 'admin' && (
          <AddPatientDialog>
             <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
            </Button>
          </AddPatientDialog>
        )}
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
                : role === 'admin' ? 'Add your first patient to get started.' : 'There are no patients in the system yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PatientsPage() {
  return (
    <DashboardLayout>
      <PatientsPageContent />
    </DashboardLayout>
  );
}
