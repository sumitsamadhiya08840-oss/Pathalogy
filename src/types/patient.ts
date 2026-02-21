// Patient Interface
export interface Patient {
  id: string;
  patientId: string; // PAT-000001 format
  fullName: string;
  age: number;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  mobileNumber: string;
  alternateMobile?: string;
  email?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pinCode: string;
  };
  identification: {
    aadharNumber?: string;
    healthId?: string;
  };
  emergencyContact: EmergencyContact;
  medicalInfo: {
    allergies?: string;
    chronicConditions?: string[];
    currentMedications?: string;
    previousSurgeries?: string;
  };
  photo?: string; // Base64 or URL
  registrationDate: string;
  lastVisitDate?: string;
  totalVisits: number;
  status: 'Active' | 'Inactive';
  visitHistory: VisitHistory[];
}

// Emergency Contact Interface
export interface EmergencyContact {
  name?: string;
  relationship?: 'Spouse' | 'Parent' | 'Sibling' | 'Friend' | 'Other';
  mobileNumber?: string;
}

// Visit History Interface
export interface VisitHistory {
  id: string;
  date: string;
  time: string;
  token: string;
  testsConducted: {
    name: string;
    amount: number;
  }[];
  reportsGenerated: boolean;
  amountPaid: number;
  doctorReferredBy?: string;
  notes?: string;
}

// Search Filters Interface
export interface PatientSearchFilters {
  ageFrom?: number;
  ageTo?: number;
  gender?: 'Male' | 'Female' | 'Other' | '';
  registrationDateFrom?: string;
  registrationDateTo?: string;
  visitStatus?: 'New' | 'Returning' | '';
}

// Online Booking Interface
export interface OnlineBooking {
  id: string;
  bookingId: string;
  patientName: string;
  mobileNumber: string;
  email?: string;
  testBooked: string;
  bookingTime: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentAmount: number;
  status: 'Pending' | 'Imported' | 'Rejected';
  rejectionReason?: string;
}

// Booking Form Data Interface
export interface BookingFormData {
  patientId: string;
  patientName: string;
  selectedTests?: {
    id: string;
    name: string;
    amount: number;
  }[];
  packageId?: string;
  totalAmount: number;
  appointmentDate: string;
  appointmentTime: string;
  bookingType: 'Walk-in' | 'Home Collection';
  homeCollectionAddress?: string;
  preferredTimeSlot?: string;
  specialInstructions?: string;
}

// Appointment/Token Data
export interface Appointment {
  token: string;
  sampleId: string;
  bookingDate: string;
  appointmentDate: string;
  appointmentTime: string;
}

// Test Interface
export interface Test {
  id: string;
  name: string;
  category: string;
  amount: number;
  homeCollectionAvailable: boolean;
}

// Test Package Interface
export interface TestPackage {
  id: string;
  name: string;
  description: string;
  tests: Test[];
  totalAmount: number;
  discount?: number;
}

// Patient Form State
export interface PatientFormData {
  fullName: string;
  age: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | '';
  mobileNumber: string;
  alternateMobile: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  aadharNumber: string;
  healthId: string;
  emergencyContactName: string;
  emergencyContactRelationship: 'Spouse' | 'Parent' | 'Sibling' | 'Friend' | 'Other' | '';
  emergencyContactMobile: string;
  allergies: string;
  chronicConditions: string[];
  currentMedications: string;
  previousSurgeries: string;
  photo?: string;
}

// Search Tab Type
export type SearchTabType = 'name' | 'mobile' | 'token' | 'healthId';

// India States
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Puducherry',
  'Lakshadweep',
  'Daman and Diu',
  'Dadra and Nagar Haveli',
];

// Blood Groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

// Common Chronic Conditions
export const CHRONIC_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'COPD',
  'Heart Disease',
  'Thyroid',
  'Kidney Disease',
  'Liver Disease',
  'Arthritis',
  'Migraine',
];
