
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
import type { Patient, Task, SleepLog, BehaviorEvent } from '@/lib/data';
import { Loader2, User, Printer, Calendar, Bed, Activity, ChevronDown, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { differenceInYears, parseISO, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';

type PrintOption = "all" | "care" | "sleep" | "behavior";

export default function ReportsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [printOption, setPrintOption] = useState<PrintOption>("all");
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [patientData, setPatientData] = useState<{
    patient: Patient;
    records: Task[];
    sleepLogs: SleepLog[];
    behaviorEvents: BehaviorEvent[];
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
        
        const behaviorEventsRef = collection(firestore, `patients/${selectedPatientId}/behaviorEvents`);
        const behaviorEventsSnap = await getDocs(behaviorEventsRef);
        const behaviorEvents = behaviorEventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BehaviorEvent));

        setPatientData({
          patient,
          records: records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          sleepLogs,
          behaviorEvents: behaviorEvents.sort((a,b) => new Date(b.eventDateTime).getTime() - new Date(a.eventDateTime).getTime()),
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
  
  const filteredData = useMemo(() => {
    if (!patientData) return null;

    const { from, to } = dateRange;
    if (!from || !to) return patientData;
    
    const interval = {
        start: startOfDay(new Date(from)),
        end: endOfDay(new Date(to)),
    };

    const filteredRecords = patientData.records.filter(r => isWithinInterval(new Date(r.date), interval));
    const filteredSleepLogs = patientData.sleepLogs.filter(l => isWithinInterval(new Date(l.log_date), interval));
    const filteredBehaviorEvents = patientData.behaviorEvents.filter(e => isWithinInterval(new Date(e.eventDateTime), interval));


    return {
        ...patientData,
        records: filteredRecords,
        sleepLogs: filteredSleepLogs,
        behaviorEvents: filteredBehaviorEvents,
    };
  }, [patientData, dateRange]);


  const handlePrint = () => {
    // Set the data attribute on the body right before printing
    document.body.setAttribute('data-print-option', printOption);
    window.print();
  };
  
  const printLabels: Record<PrintOption, string> = {
    all: "All Reports",
    care: "Daily Care Records",
    sleep: "Sleep Log",
    behavior: "Behavior Events",
  };

  const age = filteredData?.patient.dateOfBirth
    ? differenceInYears(new Date(), parseISO(filteredData.patient.dateOfBirth))
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
            page-break-inside: avoid;
          }
           /* Base styles for printing */
          .print-section {
            display: none;
          }

          /* Conditional printing styles */
          body[data-print-option="all"] .print-section {
            display: block;
          }
          body[data-print-option="care"] .print-care {
            display: block;
          }
          body[data-print-option="sleep"] .print-sleep {
            display: block;
          }
          body[data-print-option="behavior"] .print-behavior {
            display: block;
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
         <div className="flex items-center gap-2">
            <Button onClick={handlePrint} disabled={!filteredData || isLoading}>
                <Printer className="mr-2 h-4 w-4" />
                Print {printLabels[printOption]}
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={!filteredData || isLoading}>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setPrintOption("all")}>Print All Reports</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setPrintOption("care")}>Daily Care Records</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setPrintOption("sleep")}>Sleep Log</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setPrintOption("behavior")}>Behavior Events</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </div>

      <Card className="no-print">
        <CardContent className="p-4 grid sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 sm:col-span-1">
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
            </div>
            <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input 
                    type="date" 
                    id="start-date" 
                    value={dateRange.from || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    disabled={!selectedPatientId}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input 
                    type="date" 
                    id="end-date" 
                    value={dateRange.to || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    disabled={!selectedPatientId}
                />
            </div>
        </CardContent>
      </Card>
      
      {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-full no-print">
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

      {filteredData && !isLoading && (
        <div className="printable-area space-y-6">
            {/* Patient Summary Card */}
            <Card className="printable-card print-section print-summary">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarImage src={filteredData.patient.avatarUrl} alt={filteredData.patient.name} />
                        <AvatarFallback>{filteredData.patient.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-2xl">{filteredData.patient.name}</CardTitle>
                        <CardDescription>
                            {age !== null ? `${age} years old` : 'Age not specified'}
                            {filteredData.patient.disabilityType && ` • ${filteredData.patient.disabilityType}`}
                        </CardDescription>
                         <div className="mt-4 text-sm text-muted-foreground space-y-1">
                            <p><strong>Care Needs:</strong> {filteredData.patient.careNeeds || 'N/A'}</p>
                            <p><strong>Emergency Contact:</strong> {filteredData.patient.emergencyContact?.name} ({filteredData.patient.emergencyContact?.relation}) - {filteredData.patient.emergencyContact?.phone}</p>
                        </div>
                    </div>
                </div>
              </CardHeader>
            </Card>

            {/* Daily Records Card */}
            <Card className="printable-card print-section print-care">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5" />
                        Daily Care Records
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredData.records.length > 0 ? (
                        <div className="space-y-4">
                            {filteredData.records.map(record => (
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
                        <p className="text-muted-foreground text-center py-4">No daily records found for the selected date range.</p>
                    )}
                </CardContent>
            </Card>

            {/* Sleep Logs Card */}
            <Card className="printable-card print-section print-sleep">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Bed className="h-5 w-5" />
                        Recent Sleep Logs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                   {filteredData.sleepLogs.length > 0 ? (
                        <div className="space-y-4">
                            {filteredData.sleepLogs.map(log => (
                                <div key={log.id}>
                                    <p className="font-semibold">{format(new Date(log.log_date), 'EEEE, MMMM d, yyyy')}</p>
                                    <p className="text-muted-foreground text-sm">{log.notes || 'No notes for this day.'}</p>
                                    <p className="text-sm">Asleep for {log.hours.filter(h => h === 'asleep').length} hours.</p>
                                     <Separator className="pt-2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No sleep logs found for the selected date range.</p>
                    )}
                </CardContent>
            </Card>
             {/* Behavior Logs Card */}
            <Card className="printable-card print-section print-behavior">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Activity className="h-5 w-5" />
                        Behavior Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredData.behaviorEvents.length > 0 ? (
                        <div className="space-y-4">
                            {filteredData.behaviorEvents.map(event => (
                                <div key={event.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{format(new Date(event.eventDateTime), 'EEEE, MMMM d, yyyy, p')}</p>
                                        <Badge variant="secondary">{event.intensity}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {event.behavior.map((b: string) => <Badge key={b}>{b}</Badge>)}
                                    </div>
                                    <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                                        <p><strong className="text-foreground">Activity:</strong> {event.activity}</p>
                                        <p><strong className="text-foreground">Setting:</strong> {event.setting}</p>
                                        <p><strong className="text-foreground">Antecedent:</strong> {event.antecedent}</p>
                                        <p><strong className="text-foreground">Response:</strong> {event.response}</p>
                                    </div>
                                    {event.comment && (
                                        <div className="text-sm p-3 bg-muted/50 rounded-md flex items-start gap-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <p>{event.comment}</p>
                                        </div>
                                    )}
                                     <Separator className="pt-2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No behavior events logged for this patient for the selected date range.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );

    