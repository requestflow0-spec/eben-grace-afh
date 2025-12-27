
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Patient, Task, SleepLog } from '@/lib/data';
import { Loader2, User, Printer, Calendar, Bed, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { differenceInYears, parseISO, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ReportsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<{
    patient: Patient;
    records: Task[];
    sleepLogs: SleepLog[];
    behaviorEvents: any[]; // Placeholder for now
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const { data: patients, isLoading: isLoadingPatients } = useCollection<Patient>(patientsQuery);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!selectedPatientId || !firestore) {
        setPatientData(null);
        return;
      }

      setIsLoading(true);
      const patient = patients?.find(p => p.id === selectedPatientId);
      if (!patient) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not find the selected patient.',
        });
        setIsLoading(false);
        return;
      }

      try {
        const recordsRef = collection(firestore, `patients/${selectedPatientId}/dailyRecords`);
        const recordsSnap = await getDocs(recordsRef);
        const records = recordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const sleepLogsRef = collection(firestore, `patients/${selectedPatientId}/sleepLogs`);
        const sleepLogsSnap = await getDocs(sleepLogsRef);
        const sleepLogs = sleepLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SleepLog));

        // Placeholder for behavior events as this collection does not exist yet
        const behaviorEvents: any[] = [];

        setPatientData({
          patient,
          records: records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          sleepLogs,
          behaviorEvents,
        });

      } catch (error) {
        console.error("Error fetching patient subcollections:", error);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Data',
          description: 'Could not load all data for the selected patient.',
        });
        setPatientData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [selectedPatientId, firestore, patients, toast]);
  
  const handlePrint = () => {
    window.print();
  };

  const age = patientData?.patient.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patientData.patient.dateOfBirth))
    : null;

  return (
    <div className="space-y-6">
       {/* Printable area will have different styles applied via @media print */}
      <style>{`
        @media print {
          body {
            background-color: #fff;
            color: #000;
          }
          .no-print {
            display: none !important;
          }
          .printable-area {
            box-shadow: none;
            border: none;
            padding: 0;
            margin: 0;
          }
          .printable-card {
            border: 1px solid #e2e8f0;
            break-inside: avoid;
          }
        }
      `}</style>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Patient Reports</h1>
          <p className="text-muted-foreground">
            Select a patient to view a printable summary of their records.
          </p>
        </div>
         <Button onClick={handlePrint} disabled={!patientData || isLoading}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
        </Button>
      </div>

      <Card className="no-print">
        <CardContent className="p-4">
            <Label htmlFor="patient-select" className="text-sm font-medium">Select Patient</Label>
            <Select onValueChange={setSelectedPatientId} disabled={isLoadingPatients}>
                <SelectTrigger id="patient-select">
                    <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select a patient"} />
                </SelectTrigger>
                <SelectContent>
                    {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </CardContent>
      </Card>
      
      {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-full">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            <h3 className="mt-4 text-lg font-semibold">Loading Patient Data...</h3>
            <p className="mt-1 text-sm text-muted-foreground">Please wait while we fetch all records.</p>
          </div>
      )}

      {!selectedPatientId && !isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-full no-print">
            <User className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No patient selected</h3>
            <p className="mt-1 text-sm text-muted-foreground">Please select a patient from the dropdown above.</p>
        </div>
      )}

      {patientData && !isLoading && (
        <div className="printable-area space-y-6">
            {/* Patient Summary Card */}
            <Card className="printable-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarImage src={patientData.patient.avatarUrl} alt={patientData.patient.name} />
                        <AvatarFallback>{patientData.patient.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-2xl">{patientData.patient.name}</CardTitle>
                        <CardDescription>
                            {age !== null ? `${age} years old` : 'Age not specified'}
                            {patientData.patient.disabilityType && ` • ${patientData.patient.disabilityType}`}
                        </CardDescription>
                         <div className="mt-4 text-sm text-muted-foreground space-y-1">
                            <p><strong>Care Needs:</strong> {patientData.patient.careNeeds || 'N/A'}</p>
                            <p><strong>Emergency Contact:</strong> {patientData.patient.emergencyContact?.name} ({patientData.patient.emergencyContact?.relation}) - {patientData.patient.emergencyContact?.phone}</p>
                        </div>
                    </div>
                </div>
              </CardHeader>
            </Card>

            {/* Daily Records Card */}
            <Card className="printable-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5" />
                        Daily Care Records
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {patientData.records.length > 0 ? (
                        <div className="space-y-4">
                            {patientData.records.map(record => (
                                <div key={record.id} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{format(new Date(record.date), 'EEEE, MMMM d, yyyy, p')}</p>
                                        <Badge variant={record.completed ? "secondary" : "default"}>{record.completed ? 'Completed' : 'Pending'}</Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm">{record.description}</p>
                                    <Separator className="pt-2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No daily records found.</p>
                    )}
                </CardContent>
            </Card>

            {/* Sleep Logs Card */}
            <Card className="printable-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Bed className="h-5 w-5" />
                        Recent Sleep Logs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                   {patientData.sleepLogs.length > 0 ? (
                        <div className="space-y-4">
                            {patientData.sleepLogs.map(log => (
                                <div key={log.id}>
                                    <p className="font-semibold">{format(new Date(log.log_date), 'EEEE, MMMM d, yyyy')}</p>
                                    <p className="text-muted-foreground text-sm">{log.notes || 'No notes for this day.'}</p>
                                    <p className="text-sm">Asleep for {log.hours.filter(h => h === 'asleep').length} hours.</p>
                                     <Separator className="pt-2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No sleep logs found.</p>
                    )}
                </CardContent>
            </Card>
             {/* Behavior Logs Card */}
            <Card className="printable-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Activity className="h-5 w-5" />
                        Behavior Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground text-center py-4">No behavior events logged for this patient.</p>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
