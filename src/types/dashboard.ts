// Dashboard Statistics Interface
export interface DashboardStats {
  todaysBookings: number;
  walkInPatients: number;
  pendingSamples: number;
  pendingReports: number;
  todaysRevenue: number;
}

// Appointment Interface
export interface Appointment {
  id: string;
  token: string;
  patientName: string;
  patientAge: number;
  patientMobile: string;
  testName: string;
  time: string;
  bookingTime: string;
  status: 'Booked' | 'Collected' | 'Testing' | 'Ready' | 'Cancelled';
  collectedBy?: string;
  collectionTime?: string;
}

// Home Collection Interface
export interface HomeCollection {
  id: string;
  token: string;
  patientName: string;
  patientMobile: string;
  address: string;
  fullAddress: string;
  scheduledTime: string;
  collectorName: string | null;
  collectorId: string | null;
  status: 'Pending' | 'Assigned' | 'Collected';
  collectionTime?: string;
  specialInstructions?: string;
}

// Patient Form Data Interface
export interface PatientFormData {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  mobile: string;
  email: string;
  address: string;
}

// Sample Collection Form Data Interface
export interface SampleCollectionFormData {
  patientId: string;
  patientName: string;
  token: string;
  sampleType: 'Blood' | 'Urine' | 'Stool' | '';
  collectedBy: string;
  collectionTime: string;
  notes: string;
}

// Collector Interface
export interface Collector {
  id: string;
  name: string;
  mobile: string;
  available: boolean;
  currentAssignments: number;
}

// Filter types
export type HomeCollectionFilter = 'All' | 'Pending' | 'Assigned' | 'Collected';
export type AppointmentStatusFilter = 'All' | 'Booked' | 'Collected' | 'Testing' | 'Ready' | 'Cancelled';
export type DateFilter = 'Today' | 'Tomorrow' | 'This Week';
