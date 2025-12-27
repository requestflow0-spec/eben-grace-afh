
'use client';

import { useUser } from '@/firebase';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import DashboardLayout from '../dashboard/layout';

function SettingsPageContent() {
  const { user, isUserLoading } = useUser();
  const { role, isLoading: isRoleLoading } = useRole();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const isLoading = isUserLoading || isRoleLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Settings
      </h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {role === 'admin' && <TabsTrigger value="data">Data</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Manage your account and personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={role || 'Loading...'} readOnly className="capitalize"/>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive in-app notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium">In-App Notifications</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox id="push-critical" defaultChecked />
                  <Label htmlFor="push-critical">
                    Critical Alerts (e.g., patient emergencies)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="push-tasks" defaultChecked />
                  <Label htmlFor="push-tasks">
                    Task Reminders and Updates
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="push-reports" />
                  <Label htmlFor="push-reports">
                    Weekly Summary Reports
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {role === 'admin' && (
          <TabsContent value="data" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage your application data and backups.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">
                    Automatic Backup Frequency
                  </Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger id="backup-frequency" className="w-[180px]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Data is securely stored and backed up.
                  </p>
                </div>
                <div className="space-y-2 pt-4">
                  <Label>Manual Backup</Label>
                  <p className="text-sm text-muted-foreground pb-2">
                    Create a manual backup of all your current data.
                  </p>
                  <Button variant="outline">Create Backup Now</Button>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <div className="flex flex-col">
                  <Label className="text-destructive">Danger Zone</Label>
                  <p className="text-sm text-muted-foreground pt-1 pb-2">
                    Permanently delete all data. This action cannot be undone.
                  </p>
                  <Button variant="destructive">Delete All Data</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsPageContent />
    </DashboardLayout>
  );
}

    