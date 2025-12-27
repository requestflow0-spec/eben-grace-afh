
'use client';

import { useState, use, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bed,
  Calendar,
  ClipboardList,
  Edit,
  FileText,
  Phone,
  Plus,
  Smile,
  User,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Save,
  AlertCircle,
  FilePlus,
  Sparkles,
  Loader2,
  Check,
  MessageSquare,
} from 'lucide-react';
import { format, differenceInYears, parseISO, addDays, subDays, isSameDay } from 'date-fns';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { type Task, type Staff, type BehaviorEvent, type SleepLog } from '@/lib/data';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove, query, orderBy, setDoc } from 'firebase/firestore';
import type { Patient } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useRole } from '@/hooks/useRole';
import { generateBehaviorComment } from '@/ai/flows/generate-behavior-comment';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/hooks/use-notifications';
import DashboardLayout from '../../dashboard/layout';


type SleepStatus = 'awake' | 'asleep';
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const BEHAVIOR_OPTIONS = ["Eloping", "Wandering", "Rummaging", "Verbal Aggression", "Physical Aggression", "Self-harm"];

function LogBehaviorDialog({ patientId, patientName }: { patientId: string; patientName: string; }) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { addNotification } = useNotifications();

  const formSchema = z.object({
    behavior: z.array(z.string()).min(1, 'Please select at least one behavior.'),
    activity: z.string().min(1, 'Activity is required.'),
    setting: z.string().min(1, 'Setting is required.'),
    antecedent: z.string().min(1, 'Antecedent is required.'),
    response: z.string().min(1, 'Response is required.'),
    intensity: z.string().min(1, 'Intensity is required.'),
    comment: z.string().optional(),
    eventDate: z.string(),
    eventTime: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      behavior: [],
      activity: '',
      setting: '',
      antecedent: '',
      response: '',
      intensity: '',
      comment: '',
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      eventTime: format(new Date(), 'HH:mm'),
    },
  });

  const watchedFields = useWatch({ control: form.control });

  const handleGenerateComment = async () => {
    setIsGenerating(true);
    try {
      const { behavior, intensity, activity, setting, antecedent, response } = watchedFields;
      if (!behavior || behavior.length === 0 || !intensity || !activity || !setting || !antecedent || !response) {
        toast({
          variant: 'destructive',
          title: 'Missing Information',
          description: 'Please fill out all fields before generating a comment.',
        });
        return;
      }
      
      const result = await generateBehaviorComment({
        behavior: behavior || [],
        intensity,
        activity,
        setting,
        antecedent,
        response,
      });
      form.setValue('comment', result.comment);

    } catch (error) {
      console.error("AI comment generation failed:", error);
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'Could not generate a comment at this time.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  

  const handleSave = (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
  
    const eventDateTime = new Date(`${values.eventDate}T${values.eventTime}`).toISOString();
    
    const newBehaviorEvent = {
      patientId,
      eventDateTime,
      behavior: values.behavior,
      intensity: values.intensity,
      activity: values.activity,
      setting: values.setting,
      antecedent: values.antecedent,
      response: values.response,
      comment: values.comment || '',
    };
  
    const behaviorEventsRef = collection(firestore, `patients/${patientId}/behaviorEvents`);
    addDoc(behaviorEventsRef, newBehaviorEvent)
      .then(() => {
        toast({ title: "Behavior event saved successfully." });
        addNotification({
          title: 'New Behavior Event Logged',
          description: `A ${values.intensity} intensity behavior event was logged for ${patientName}.`,
          href: `/patients/${patientId}`,
        });
        setOpen(false);
        form.reset();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: behaviorEventsRef.path,
          operation: 'create',
          requestResourceData: newBehaviorEvent,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: "Save failed", description: "Could not save the behavior event." });
      });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FilePlus className="mr-2 h-4 w-4" />
          Log Behavior
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Behavior Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="eventDate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Date</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="eventTime" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Time</FormLabel>
                            <FormControl><Input type="time" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="behavior"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Behavior Type</FormLabel>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {field.value && field.value.length > 0
                                  ? field.value.join(', ')
                                  : "Select behavior(s)..."}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Select Behaviors</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4 py-4">
                                {BEHAVIOR_OPTIONS.map((option) => (
                                  <FormField
                                    key={option}
                                    control={form.control}
                                    name="behavior"
                                    render={({ field: checkboxField }) => {
                                      return (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={checkboxField.value?.includes(option)}
                                              onCheckedChange={(checked) => {
                                                const currentValue = checkboxField.value || [];
                                                return checked
                                                  ? checkboxField.onChange([...currentValue, option])
                                                  : checkboxField.onChange(
                                                      currentValue?.filter(
                                                        (value) => value !== option
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {option}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                               <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button">Done</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="intensity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Intensity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select intensity" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="activity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Activity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select activity..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="leisure">Leisure</SelectItem>
                                    <SelectItem value="community">Community</SelectItem>
                                    <SelectItem value="dining">Dining</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="setting" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Setting</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select setting..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="community">Community</SelectItem>
                                    <SelectItem value="bedroom">Bedroom</SelectItem>
                                    <SelectItem value="patio">Patio</SelectItem>
                                    <SelectItem value="living-area">Living Area</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="antecedent" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Antecedent</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="What was the antecedent?" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="given-instruction">Given instruction</SelectItem>
                                <SelectItem value="peer-interaction">Peer interaction</SelectItem>
                                <SelectItem value="staff-interaction">Staff Interaction</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="response" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Intervention/Response</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="How was this addressed?" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="verbal-redirection">Verbal redirection</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="comment" render={({ field }) => (
                    <FormItem>
                         <div className="flex items-center justify-between">
                            <FormLabel>Comments</FormLabel>
                            <Button type="button" variant="ghost" size="sm" onClick={handleGenerateComment} disabled={isGenerating}>
                                {isGenerating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Generate with AI
                            </Button>
                        </div>
                        <FormControl>
                           <Textarea
                                placeholder="Additional observations... or generate one with AI!"
                                rows={3}
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">
                    Save Event
                  </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function SleepLogViewer({ patientId }: { patientId: string }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hours, setHours] = useState<SleepStatus[]>(Array(24).fill('awake'));
    const [notes, setNotes] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const logId = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

    const sleepLogRef = useMemoFirebase(() => {
        if (!firestore || !patientId) return null;
        return doc(firestore, `patients/${patientId}/sleepLogs`, logId);
    }, [firestore, patientId, logId]);

    const { data: sleepLog, isLoading: isLoadingLog } = useDoc<SleepLog>(sleepLogRef);

    useEffect(() => {
        if (isLoadingLog) return;
        if (sleepLog) {
            setHours(sleepLog.hours);
            setNotes(sleepLog.notes);
            setIsDirty(false);
        } else {
            setHours(Array(24).fill('awake'));
            setNotes('');
            setIsDirty(false);
        }
    }, [sleepLog, isLoadingLog, logId]);

    const handleHourToggle = (hour: number) => {
        setHours(currentHours => {
            const newHours = [...currentHours];
            newHours[hour] = newHours[hour] === 'asleep' ? 'awake' : 'asleep';
            return newHours;
        });
        setIsDirty(true);
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        setIsDirty(true);
    };

    const handleSave = () => {
        if (!sleepLogRef) return;
        setIsSaving(true);
        
        const logData: Omit<SleepLog, 'id'> = {
            patientId,
            log_date: format(selectedDate, 'yyyy-MM-dd'),
            hours,
            notes
        };

        setDoc(sleepLogRef, logData, { merge: true })
            .then(() => {
                toast({ title: "Sleep log saved." });
                setIsDirty(false);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: sleepLogRef.path,
                    operation: 'write',
                    requestResourceData: logData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: "Save failed", description: "Could not save the sleep log." });
            })
            .finally(() => {
                setIsSaving(false);
            });
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                    <h3 className="font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
                    <p className="text-xs text-muted-foreground">
                        {isSameDay(selectedDate, new Date()) ? 'Today' : ''}
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {isLoadingLog ? (
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {HOURS.map((hour) => {
                                const isAsleep = hours[hour] === 'asleep';
                                return (
                                    <div
                                        key={hour}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors",
                                            isAsleep
                                                ? "bg-primary/10 border-primary/50"
                                                : "bg-secondary hover:bg-secondary/80",
                                            "hover:border-primary/50"
                                        )}
                                        onClick={() => handleHourToggle(hour)}
                                    >
                                        <div className="text-xs font-mono text-muted-foreground mb-1">
                                            {format(new Date(new Date().setHours(hour, 0)), 'ha')}
                                        </div>
                                        {isAsleep ? (
                                            <Moon className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Sun className="h-5 w-5 text-yellow-500" />
                                        )}
                                        <span className="text-[10px] uppercase font-bold mt-1 tracking-wider">
                                            {isAsleep ? 'Sleep' : 'Awake'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <p>Tap on any hour block to toggle between Sleep and Awake states.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sleep-notes">Daily Notes</Label>
                        <Textarea
                            id="sleep-notes"
                            value={notes}
                            onChange={handleNotesChange}
                            placeholder="Any notes about sleep quality or disturbances..."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Saving...' : 'Save Sleep Log'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const editPatientSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  dateOfBirth: z.string().optional(),
  disabilityType: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  careNeeds: z.string().optional(),
  notes: z.string().optional(),
});


function PatientDetailPageContent({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const firestore = useFirestore();
  const { user } = useUser();
  const { role } = useRole();
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const patientRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'patients', id);
  }, [firestore, id]);

  const { data: patient, isLoading: isPatientLoading } = useDoc<Patient>(patientRef);

  const recordsQuery = useMemoFirebase(() => {
      if (!firestore || !id) return null;
      return query(collection(firestore, `patients/${id}/dailyRecords`), orderBy('date', 'desc'));
  }, [firestore, id]);

  const { data: tasks, isLoading: areTasksLoading } = useCollection<Task>(recordsQuery);

  const behaviorEventsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, `patients/${id}/behaviorEvents`), orderBy('eventDateTime', 'desc'));
  }, [firestore, id]);

  const { data: behaviorEvents, isLoading: areBehaviorEventsLoading } = useCollection<BehaviorEvent>(behaviorEventsQuery);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);

  const { data: staffData, isLoading: areStaffLoading } = useCollection<Staff>(staffQuery);

  const [isEditing, setIsEditing] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isCreateRecordDialogOpen, setIsCreateRecordDialogOpen] = useState(false);
  const [newRecordDescription, setNewRecordDescription] = useState('');
  const [activeTab, setActiveTab] = useState('care-records');

  const form = useForm<z.infer<typeof editPatientSchema>>({
    resolver: zodResolver(editPatientSchema),
  });

  const { isSubmitting } = form.formState;

  // When patient data loads or editing starts, reset the form with patient data
  useMemo(() => {
    if (patient) {
      form.reset({
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        disabilityType: patient.disabilityType,
        emergencyContactName: patient.emergencyContact?.name,
        emergencyContactPhone: patient.emergencyContact?.phone,
        emergencyContactRelation: patient.emergencyContact?.relation,
        careNeeds: patient.careNeeds,
        notes: patient.notes,
      });
    }
  }, [patient, form]);

  const canEdit = role === 'admin';

  const handleUpdatePatient = (values: z.infer<typeof editPatientSchema>) => {
    if (!patientRef) return;
    
    const updatedData = {
      ...values,
      emergencyContact: {
        name: values.emergencyContactName || '',
        phone: values.emergencyContactPhone || '',
        relation: values.emergencyContactRelation || '',
      },
      updatedAt: serverTimestamp()
    };
    // Remove individual contact fields
    delete (updatedData as any).emergencyContactName;
    delete (updatedData as any).emergencyContactPhone;
    delete (updatedData as any).emergencyContactRelation;

    updateDoc(patientRef, updatedData)
      .then(() => {
        toast({ title: 'Patient updated successfully.' });
        setIsEditing(false);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: patientRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Update failed', description: 'Could not save changes.'})
    });
  };

  const handleCreateTodayRecord = () => {
    if (!firestore || !id || !newRecordDescription || !user || !patient) return;
    const recordsRef = collection(firestore, `patients/${id}/dailyRecords`);
    const newRecord = {
        description: newRecordDescription,
        patientName: patient.name,
        patientId: id,
        date: new Date().toISOString(),
        completed: false,
        createdBy: {
          uid: user.uid,
          name: user.displayName || 'Unknown Staff',
        }
    };
    addDoc(recordsRef, newRecord).then(() => {
        addNotification({
          title: 'New Care Record Added',
          description: `A new record for ${patient.name} has been added.`,
          href: `/patients/${id}`,
        });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: recordsRef.path,
            operation: 'create',
            requestResourceData: newRecord,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    setNewRecordDescription('');
    setIsCreateRecordDialogOpen(false);
  };

  const handleToggleRecordStatus = (taskId: string, currentStatus: boolean) => {
    if (!firestore || !id || !patient) return;
    const recordRef = doc(firestore, `patients/${id}/dailyRecords`, taskId);
    updateDoc(recordRef, { completed: !currentStatus }).then(() => {
       if (!currentStatus) { // If it was false, it's now true (completed)
        addNotification({
          title: 'Care Record Completed',
          description: `A care record for ${patient.name} was marked as complete.`,
          href: `/patients/${id}`,
        });
      }
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: recordRef.path,
            operation: 'update',
            requestResourceData: { completed: !currentStatus },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleAssignStaff = () => {
    if (!patientRef || !selectedStaffId) return;
    updateDoc(patientRef, {
        assignedStaff: arrayUnion(selectedStaffId)
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: patientRef.path,
            operation: 'update',
            requestResourceData: { assignedStaff: arrayUnion(selectedStaffId) },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    setShowAssignDialog(false);
    setSelectedStaffId('');
  };

  const handleUnassignStaff = (staffId: string) => {
    if (!patientRef) return;
    updateDoc(patientRef, {
        assignedStaff: arrayRemove(staffId)
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: patientRef.path,
            operation: 'update',
            requestResourceData: { assignedStaff: arrayRemove(staffId) },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const isLoading = isPatientLoading || areTasksLoading || areStaffLoading || areBehaviorEventsLoading;

  if (isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Patient not found</h2>
        <p className="text-muted-foreground mb-4">
          The patient you're looking for doesn't exist or you don't have permission to view them.
        </p>
        <Button asChild>
          <Link href="/patients">Back to Patients</Link>
        </Button>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
    : null;
  
  const assignedStaff = (staffData || [])
    .filter(s => (patient.assignedStaff || []).includes(s.id));
    
  const availableStaff = (staffData || []).filter(s => s.status === 'active' && !(patient.assignedStaff || []).includes(s.id));
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {patient.name}
          </h1>
          <p className="text-muted-foreground">
            Patient profile and care records
          </p>
        </div>
        {canEdit && (
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleUpdatePatient)}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="disabilityType" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Disability Type</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Emergency Contact</FormLabel>
                                <FormControl><Input placeholder="Name" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Emergency Phone</FormLabel>
                                <FormControl><Input placeholder="Phone" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="careNeeds" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Care Needs</FormLabel>
                            <FormControl><Textarea rows={3} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl><Textarea rows={2} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium">{age !== null ? `${age} years old` : 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Disability Type
                        </p>
                        <p className="font-medium">
                          {patient.disabilityType || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {patient.careNeeds && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Care Needs
                      </p>
                      <p className="text-foreground">{patient.careNeeds}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Phone className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Emergency Contact</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.emergencyContact?.name} (
                        {patient.emergencyContact?.relation}) &bull;{' '}
                        {patient.emergencyContact?.phone}
                      </p>
                    </div>
                  </div>

                  {patient.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Additional Notes
                      </p>
                      <p className="text-foreground text-sm">
                        {patient.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="care-records" value={activeTab} onValueChange={setActiveTab}>
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                  <TabsList>
                    <TabsTrigger value="care-records">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Care Records
                    </TabsTrigger>
                    <TabsTrigger value="sleep-log">
                      <Bed className="mr-2 h-4 w-4" />
                      Sleep Log
                    </TabsTrigger>
                    <TabsTrigger value="behavior-tracking">
                      <Activity className="mr-2 h-4 w-4" />
                      Behavior
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                    {activeTab === 'care-records' && (
                        <Dialog open={isCreateRecordDialogOpen} onOpenChange={setIsCreateRecordDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>Create New Care Record</DialogTitle>
                            <DialogDescription>
                                Log a new event, observation, or task for {patient.name} for today.
                            </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                                <Label htmlFor="record-description">Description</Label>
                                <Textarea 
                                    id="record-description"
                                    placeholder="e.g., Patient seemed more energetic today and enjoyed the afternoon activity."
                                    value={newRecordDescription}
                                    onChange={(e) => setNewRecordDescription(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleCreateTodayRecord} disabled={!newRecordDescription}>
                                Save Record
                            </Button>
                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                    )}
                    {activeTab === 'behavior-tracking' && (
                        <LogBehaviorDialog patientId={id} patientName={patient.name} />
                    )}
                  </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="care-records">
                    {tasks && tasks.length > 0 ? (
                      <div className="space-y-2">
                        {tasks.map(task => {
                          const staffMember = task.createdBy ? staffData?.find(s => s.id === task.createdBy.uid) : null;
                          const creatorName = staffMember?.name || task.createdBy?.name || 'Unknown Staff';
                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {format(
                                      new Date(task.date),
                                      'EEEE, MMMM d, yyyy, p'
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                   <p className="text-xs text-muted-foreground mt-1">
                                    By {creatorName}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  task.completed ? 'secondary' : 'default'
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRecordStatus(task.id, task.completed);
                                }}
                                className="cursor-pointer"
                              >
                                {task.completed ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No records yet</p>
                      </div>
                    )}
                </TabsContent>
                <TabsContent value="sleep-log">
                  <SleepLogViewer patientId={id}/>
                </TabsContent>
                <TabsContent value="behavior-tracking">
                {behaviorEvents && behaviorEvents.length > 0 ? (
                      <div className="space-y-4">
                        {behaviorEvents.map(event => (
                          <div key={event.id} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">
                                {format(new Date(event.eventDateTime), 'EEEE, MMMM d, yyyy, p')}
                              </p>
                              <Badge variant="secondary">{event.intensity}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {event.behavior.map((b: string) => <Badge key={b}>{b}</Badge>)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                                <p><strong className="text-foreground">Activity:</strong> {event.activity}</p>
                                <p><strong className="text-foreground">Setting:</strong> {event.setting}</p>
                                <p><strong className="text-foreground">Antecedent:</strong> {event.antecedent}</p>
                                <p><strong className="text-foreground">Response:</strong> {event.response}</p>
                            </div>
                            {event.comment && (
                                <div className="mt-3 text-sm p-3 bg-muted/50 rounded-md flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p>{event.comment}</p>
                                </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-semibold">No Behavior Events Logged</p>
                          <p className="text-sm">Use the 'Log Behavior' button to add a new event.</p>
                      </div>
                    )}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Assigned Staff</CardTitle>
              {canEdit && (
                <Dialog
                  open={showAssignDialog}
                  onOpenChange={setShowAssignDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Staff Member</DialogTitle>
                      <DialogDescription>
                        Select a staff member to assign to this patient.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Select
                        value={selectedStaffId}
                        onValueChange={setSelectedStaffId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStaff?.map(staff => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          onClick={handleAssignStaff}
                          disabled={!selectedStaffId}
                        >
                          Assign
                        </Button>
                      </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {assignedStaff.length > 0 ? (
                <div className="space-y-2">
                  {assignedStaff.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={s.avatarUrl}
                            alt={s.name}
                            data-ai-hint={s.avatarHint}
                          />
                          <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleUnassignStaff(s.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No staff assigned
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Records
                  </span>
                  <span className="font-semibold">
                    {tasks?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Profile Created
                  </span>
                  <span className="text-sm">
                    {patient.createdAt
                      ? format(new Date((patient.createdAt as any).seconds * 1000), 'MMM d, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Last Updated
                  </span>
                  <span className="text-sm">
                    {patient.updatedAt
                      ? format(new Date((patient.updatedAt as any).seconds * 1000), 'MMM d, yyyy')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <DashboardLayout>
      <PatientDetailPageContent params={params} />
    </DashboardLayout>
  )
}

    