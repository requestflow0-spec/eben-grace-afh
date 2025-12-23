// This file contains placeholder data.
// In a real application, this data would be fetched from a database.

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  assignedNurse: string;
  emergencyContact: { name: string; phone: string; relation: string };
  medicalHistory: string;
  carePlan: string;
  avatarUrl: string;
  avatarHint: string;
  dateOfBirth?: string;
  disabilityType?: string;
  careNeeds?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Staff = {
  id: string;
  name: string;
  role: 'Nurse' | 'Doctor' | 'Admin' | 'Therapist';
  certifications: string[];
  schedule: string;
  avatarUrl: string;
  avatarHint: string;
  available: boolean;
};

export type Appointment = {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
};

export type Task = {
  id: string;
  description: string;
  patientName: string;
  dueDate: string;
  completed: boolean;
};

export const patients: Patient[] = [];
export const staff: Staff[] = [];
export const appointments: Appointment[] = [];
export const tasks: Task[] = [];
