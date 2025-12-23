'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase } from 'lucide-react';
import { staff } from '@/lib/data';
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
import { Separator } from '@/components/ui/separator';

export default function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const member = staff.find(s => s.id === id);

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Staff Member not found</h2>
        <p className="text-muted-foreground mb-4">
          The staff member you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/dashboard/staff">Back to Staff List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/staff">
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
              <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} />
              <AvatarFallback className="text-3xl">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-headline">{member.name}</h2>
              <p className="text-muted-foreground">{member.role}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{member.name.toLowerCase().replace(' ', '.')}@carehub.pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>555-010-0{member.id.replace('s','')}</span>
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
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Current weekly schedule for this staff member.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <p className="font-medium">{member.schedule}</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>Professional qualifications and certifications.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {member.certifications.map(cert => (
                    <Badge key={cert} variant="secondary">{cert}</Badge>
                ))}
            </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Assigned Patients</CardTitle>
                <CardDescription>Patients currently assigned to {member.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Patient assignment functionality coming soon.</p>
            </CardContent>
        </Card>

    </div>
  );
}