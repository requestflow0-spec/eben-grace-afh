
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Plus,
  Search,
  User,
  Phone,
  Calendar,
} from 'lucide-react';
import { patients, type Patient } from '@/lib/data';
import { differenceInYears, parseISO } from 'date-fns';

function AddPatientDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // In a real app, you would handle form submission here.
    // For this prototype, we'll just simulate it.
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setOpen(false);
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
          <DialogDescription>
            Enter the patient's information to create their profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Patient's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disability_type">Disability Type</Label>
              <Input
                id="disability_type"
                name="disability_type"
                placeholder="e.g., Physical, Cognitive"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="care_needs">Care Needs</Label>
            <Textarea
              id="care_needs"
              name="care_needs"
              placeholder="Describe specific care requirements..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">
                Emergency Contact Name
              </Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional information..."
              rows={2}
            />
          </div>

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

  const filteredPatients = patients.filter(
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
        
      {filteredPatients.length > 0 ? (
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
                : 'Add your first patient to get started.'}
            </p>
            {!searchQuery && (
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
