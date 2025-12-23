import { PlaceHolderImages } from './placeholder-images';

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

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id) || { imageUrl: '', imageHint: '' };

export const patients: Patient[] = [
  {
    id: '1',
    name: 'Eleanor Vance',
    age: 72,
    gender: 'Female',
    assignedNurse: 'Dr. Evelyn Reed',
    emergencyContact: { name: 'Samuel Vance', phone: '555-0101', relation: 'Son' },
    medicalHistory: 'Hypertension, Type 2 Diabetes, past history of stroke.',
    carePlan: 'Monitor blood pressure twice daily, administer insulin as prescribed, assist with mobility exercises.',
    avatarUrl: findImage('patient1').imageUrl,
    avatarHint: findImage('patient1').imageHint,
    dateOfBirth: '1952-03-15',
    disabilityType: 'Mobility Impairment',
    careNeeds: 'Assistance with daily living activities, physical therapy.',
    notes: 'Patient is cheerful and cooperative.',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Arthur Pendelton',
    age: 68,
    gender: 'Male',
    assignedNurse: 'Dr. Ben Carter',
    emergencyContact: { name: 'Clara Pendelton', phone: '555-0102', relation: 'Wife' },
    medicalHistory: 'Coronary Artery Disease, recovering from bypass surgery.',
    carePlan: 'Wound care, medication management for heart condition, gradual increase in physical activity.',
    avatarUrl: findImage('patient2').imageUrl,
    avatarHint: findImage('patient2').imageHint,
    dateOfBirth: '1956-07-20',
    disabilityType: 'Post-surgical recovery',
    careNeeds: 'Cardiac monitoring and rehabilitation support.',
    notes: 'Monitor for signs of infection at the surgical site.',
    createdAt: '2023-02-20T14:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Margaret "Maggie" O\'Connell',
    age: 81,
    gender: 'Female',
    assignedNurse: 'Dr. Evelyn Reed',
    emergencyContact: { name: 'Finn O\'Connell', phone: '555-0103', relation: 'Grandson' },
    medicalHistory: 'Osteoporosis, mild cognitive impairment.',
    carePlan: 'Fall prevention protocol, memory engagement activities, calcium and Vitamin D supplements.',
    avatarUrl: findImage('patient3').imageUrl,
    avatarHint: findImage('patient3').imageHint,
    dateOfBirth: '1943-09-01',
    disabilityType: 'Cognitive Decline',
    careNeeds: 'Supervision for safety, cognitive stimulation.',
    notes: 'Patient enjoys listening to classical music.',
    createdAt: '2023-03-10T09:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Isabelle Moreau',
    age: 75,
    gender: 'Female',
    assignedNurse: 'Dr. Ben Carter',
    emergencyContact: { name: 'Luc Moreau', phone: '555-0104', relation: 'Husband' },
    medicalHistory: 'Chronic Obstructive Pulmonary Disease (COPD).',
    carePlan: 'Administer oxygen therapy as needed, breathing exercises, monitor for respiratory infections.',
    avatarUrl: findImage('patient4').imageUrl,
    avatarHint: findImage('patient4').imageHint,
    dateOfBirth: '1949-11-25',
    disabilityType: 'Respiratory',
    careNeeds: 'Management of COPD symptoms and medication.',
    notes: 'Ensure humidifier is maintained.',
    createdAt: '2023-04-05T11:20:00Z',
    updatedAt: new Date().toISOString(),
  },
];

export const staff: Staff[] = [
  {
    id: 's1',
    name: 'Dr. Evelyn Reed',
    role: 'Doctor',
    certifications: ['MD', 'Geriatrics Specialist'],
    schedule: 'Mon-Fri, 8am-4pm',
    avatarUrl: findImage('staff1').imageUrl,
    avatarHint: findImage('staff1').imageHint,
    available: true,
  },
  {
    id: 's2',
    name: 'Ben Carter',
    role: 'Nurse',
    certifications: ['RN', 'ACLS Certified'],
    schedule: 'Tue-Sat, 7am-3pm',
    avatarUrl: findImage('staff2').imageUrl,
    avatarHint: findImage('staff2').imageHint,
    available: true,
  },
  {
    id: 's3',
    name: 'Dr. Anya Sharma',
    role: 'Therapist',
    certifications: ['DPT', 'Orthopedic Clinical Specialist'],
    schedule: 'Mon, Wed, Fri, 9am-5pm',
    avatarUrl: findImage('staff3').imageUrl,
    avatarHint: findImage('staff3').imageHint,
    available: false,
  },
];

export const appointments: Appointment[] = [
  { id: 'a1', patientName: 'Eleanor Vance', doctorName: 'Dr. Anya Sharma', date: 'Tomorrow', time: '10:00 AM', reason: 'Physical Therapy' },
  { id: 'a2', patientName: 'Arthur Pendelton', doctorName: 'Dr. Evelyn Reed', date: 'In 2 days', time: '11:30 AM', reason: 'Post-op Checkup' },
];

export const tasks: Task[] = [
  { id: 't1', description: 'Administer morning medication', patientName: 'Margaret O\'Connell', dueDate: new Date().toISOString(), completed: false },
  { id: 't2', description: 'Update care plan notes', patientName: 'Isabelle Moreau', dueDate: new Date().toISOString(), completed: false },
  { id: 't3', description: 'Check vital signs', patientName: 'Arthur Pendelton', dueDate: new Date().toISOString(), completed: true },
];
