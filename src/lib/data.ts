
// This file contains placeholder data.
// In a real application, this data would be fetched from a database.
import { type Timestamp } from "firebase/firestore";

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  assignedStaff: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  medicalHistory: string;
  carePlan: string;
  avatarUrl: string;
  avatarHint: string;
  dateOfBirth?: string;
  disabilityType?: string;
  careNeeds?: string;
  notes?: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
};

export type Staff = {
  id: string;
  name: string;
  role: 'Nurse' | 'Doctor' | 'Admin' | 'Therapist' | 'Staff';
  email: string;
  phone: string;
  certifications: string[];
  schedule: string;
  avatarUrl: string;
  avatarHint: string;
  available: boolean;
  assignedPatients: string[];
  status: 'pending' | 'active';
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
  patientId: string;
  date: string;
  completed: boolean;
  path?: string; // Path of the document in Firestore
  createdBy: {
    uid: string;
    name: string;
  };
};

export type SleepLog = {
    id: string;
    patientId: string;
    log_date: string;
    hours: ('awake' | 'asleep')[];
    notes: string;
}

export type Notification = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  read: boolean;
  href?: string;
};

export type BehaviorEvent = {
  id: string;
  patientId: string;
  eventDateTime: string; // ISO string
  behavior: string[];
  intensity: string;
  activity: string;
  setting: string;
  antecedent: string;
  response: string;
  comment?: string;
};


// This mock data is kept for reference but is no longer used in the main pages.
// The app now fetches live data from Firestore.
export const patients: Patient[] = [];
export const staff: Staff[] = [];
export const appointments: Appointment[] = [];
export const tasks: Task[] = [];
