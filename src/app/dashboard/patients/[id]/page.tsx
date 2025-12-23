'use client';

import { useState, use } from 'react';
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
} from 'lucide-react';
import { format, differenceInYears, parseISO, addDays, subDays, isSameDay } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { patients, staff, tasks as initialTasks, Task } from '@/lib/data';
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


const behaviorData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  positive: Math.floor(Math.random() * 5),
  negative: Math.floor(Math.random() * 3),
}));

type SleepStatus = 'awake' | 'asleep';
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function SleepLogViewer() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hours, setHours] = useState<SleepStatus[]>(Array(24).fill('awake'));
    const [notes, setNotes] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    const handleHourToggle = (hour: number) => {
        const newHours = [...hours];
        newHours[hour] = newHours[hour] === 'asleep' ? 'awake' : 'asleep';
        setHours(newHours);
        setIsDirty(true);
    };

    const handleSave = () => {
        setIsDirty(false);
        // In a real app, you would save this data.
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
                    onChange={(e) => {
                        setNotes(e.target.value);
                        setIsDirty(true);
                    }}
                    placeholder="Any notes about sleep quality or disturbances..."
                    rows={3}
                />
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={!isDirty}>
                    {false ? 'Saving...' : 'Save Sleep Log'}
                    {isDirty && <Save className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isCreateRecordDialogOpen, setIsCreateRecordDialogOpen] = useState(false);
  const [newRecordDescription, setNewRecordDescription] = useState('');

  const patient = patients.find(p => p.id === id);

  const handleCreateTodayRecord = () => {
    if (!patient || !newRecordDescription) return;
    const newRecord: Task = {
      id: `t${tasks.length + 1}`,
      description: newRecordDescription,
      patientName: patient.name,
      dueDate: new Date().toISOString(),
      completed: false,
    };
    setTasks([newRecord, ...tasks]);
    setNewRecordDescription('');
    setIsCreateRecordDialogOpen(false);
  };

  const handleToggleRecordStatus = (taskId: string) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Patient not found</h2>
        <p className="text-muted-foreground mb-4">
          The patient you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/dashboard/patients">Back to Patients</Link>
        </Button>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
    : null;
  const assignedStaff = staff
    .filter(s => s.role === 'Nurse' || s.role === 'Doctor')
    .slice(0, 1);
  const availableStaff = staff.filter(s => s.role !== 'Admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/patients">
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
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          <Edit className="mr-2 h-4 w-4" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setIsEditing(false);
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={patient.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        defaultValue={patient.dateOfBirth}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disability_type">Disability Type</Label>
                      <Input
                        id="disability_type"
                        name="disability_type"
                        defaultValue={patient.disabilityType}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_name">
                        Emergency Contact
                      </Label>
                      <Input
                        id="emergency_contact_name"
                        name="emergency_contact_name"
                        defaultValue={patient.emergencyContact.name}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="emergency_contact_phone">
                        Emergency Phone
                      </Label>
                      <Input
                        id="emergency_contact_phone"
                        name="emergency_contact_phone"
                        defaultValue={patient.emergencyContact.phone}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="care_needs">Care Needs</Label>
                    <Textarea
                      id="care_needs"
                      name="care_needs"
                      defaultValue={patient.careNeeds}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      defaultValue={patient.notes}
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
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
                        {patient.emergencyContact.name} (
                        {patient.emergencyContact.relation}) &bull;{' '}
                        {patient.emergencyContact.phone}
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

          <Tabs defaultValue="care-records">
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
                <Dialog open={isCreateRecordDialogOpen} onOpenChange={setIsCreateRecordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Start Today's Record
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
              </CardHeader>
              <CardContent>
                <TabsContent value="care-records">
                    {tasks && tasks.length > 0 ? (
                      <div className="space-y-2">
                        {tasks
                          .filter(t => t.patientName === patient.name)
                          .map(task => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {format(
                                      new Date(task.dueDate),
                                      'EEEE, MMMM d, yyyy'
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    By{' '}
                                    {staff.find(s => s.role === 'Nurse')
                                      ?.name || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  task.completed ? 'secondary' : 'default'
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRecordStatus(task.id);
                                }}
                                className="cursor-pointer"
                              >
                                {task.completed ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No records yet</p>
                      </div>
                    )}
                </TabsContent>
                <TabsContent value="sleep-log">
                  <SleepLogViewer />
                </TabsContent>
                <TabsContent value="behavior-tracking">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={behaviorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="positive" fill="hsl(var(--primary))" name="Positive" stackId="a" />
                        <Bar dataKey="negative" fill="hsl(var(--destructive))" name="Negative" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Assigned Staff</CardTitle>
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
                  <div className="space-y-4 py-4">
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
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowAssignDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setShowAssignDialog(false)}
                        disabled={!selectedStaffId}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
                    {tasks.filter(t => t.patientName === patient.name).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Profile Created
                  </span>
                  <span className="text-sm">
                    {patient.createdAt
                      ? format(new Date(patient.createdAt), 'MMM d, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Last Updated
                  </span>
                  <span className="text-sm">
                    {patient.updatedAt
                      ? format(new Date(patient.updatedAt), 'MMM d, yyyy')
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
