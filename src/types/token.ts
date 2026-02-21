// Token & Sample Management Types

export type TokenStatus = 'Pending' | 'Collected' | 'Testing' | 'Ready' | 'Cancelled';
export type BookingType = 'WalkIn' | 'Scheduled' | 'HomeCollection';
export type SampleQuality = 'Good' | 'Hemolyzed' | 'Contaminated' | 'Insufficient';
export type TimeUnit = 'Hours' | 'Days';
export type DiscountReason = 'SeniorCitizen' | 'Staff' | 'DoctorReferral' | 'Promotional' | 'Other';
export type TimeSlot = '6-9 AM' | '9-12 PM' | '12-3 PM' | '3-6 PM';

// Patient interface
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  email?: string;
  patientID: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lastVisit?: string;
  totalBookings: number;
  photo?: string;
}

// Test interface (reference from test catalog)
export interface BookingTest {
  id: string;
  testCode: string;
  testName: string;
  price: number;
  sampleType: string;
  reportTime: string;
  fastingRequired: boolean;
  containerType?: string;
}

// Package interface
export interface BookingPackage {
  id: string;
  packageCode: string;
  packageName: string;
  tests: BookingTest[];
  price: number;
  discountPercent: number;
  savingsAmount: number;
}

// Sample interface
export interface Sample {
  id: string;
  sampleID: string;
  tokenID: string;
  patientID: string;
  sampleType: string;
  containerType?: string;
  tubeType?: string;
  collectedAt?: string;
  collectedBy?: string;
  quality?: SampleQuality;
  notes?: string;
  barcode: string;
  qrCode?: string;
  status: TokenStatus;
}

// Timeline event
export interface TimelineEvent {
  id: string;
  status: TokenStatus;
  timestamp: string;
  description: string;
  updatedBy?: string;
  duration?: string; // Time spent in this stage
  metadata?: Record<string, any>;
}

// Booking interface
export interface Booking {
  id: string;
  bookingID: string;
  tokenNumber: string;
  patientID: string;
  patientName: string;
  patientMobile: string;
  bookingType: BookingType;
  bookingDate: string;
  bookingTime: string;
  tests: BookingTest[];
  selectedPackage?: BookingPackage;
  totalTests: number;
  totalAmount: number;
  discountPercent: number;
  discountReason?: DiscountReason;
  finalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Partial';
  status: TokenStatus;
  sample: Sample;
  referredBy?: string;
  specialInstructions?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  homeCollectionAddress?: string;
  preferredDate?: string;
  preferredTimeSlot?: TimeSlot;
  sendReminder?: boolean;
  collectionNow?: boolean;
  priority: 'Normal' | 'Urgent';
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notes?: string;
}

// Form data for booking creation
export interface BookingFormData {
  patientID: string;
  patientName: string;
  selectedTests: string[]; // Test IDs
  selectedPackage?: string; // Package ID
  bookingType: BookingType;
  collectionNow: boolean;
  priority: 'Normal' | 'Urgent';
  appointmentDate: string;
  appointmentTime: string;
  sendReminder: boolean;
  homeCollectionAddress: string;
  preferredDate: string;
  preferredTimeSlot: TimeSlot;
  specialInstructions: string;
  referredBy: string;
  discountPercent: number;
  discountReason: DiscountReason;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Insurance';
}

// Token generation response
export interface TokenGenerationResponse {
  success: boolean;
  tokenNumber: string;
  sampleID: string;
  bookingID: string;
  qrCode: string;
  barcode: string;
  booking: Booking;
  message?: string;
}

// SMS template
export interface SMSTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  active: boolean;
}

// Statistics
export interface TokenStatistics {
  totalTokensToday: number;
  pendingCollection: number;
  collected: number;
  testing: number;
  ready: number;
  cancelled: number;
  averageTAT: number;
  peakHour: string;
  totalRevenue: number;
}

// Booking filters
export interface BookingFilters {
  status?: TokenStatus;
  bookingType?: BookingType;
  searchQuery?: string;
  timeRange?: 'AllDay' | 'Morning' | 'Afternoon' | 'Evening';
  dateFrom?: string;
  dateTo?: string;
}

// Print data
export interface PrintTokenData {
  tokenNumber: string;
  sampleID: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientMobile: string;
  patientID: string;
  tests: BookingTest[];
  sampleType: string;
  collectionType: BookingType;
  appointmentTime?: string;
  reportReadyTime: string;
  fastingRequired: boolean;
  fastingHours?: number;
  collectionInstructions?: string;
  qrCode: string;
  barcode: string;
}

// Label data
export interface SampleLabel {
  sampleID: string;
  barcode: string;
  patientName: string;
  testName: string;
  collectionDate: string;
  collectionTime: string;
  tubeType?: string;
  barcodeData: string;
}

// Activity log
export interface ActivityLog {
  id: string;
  tokenID: string;
  action: string;
  actionType: 'StatusChange' | 'SMSSent' | 'Print' | 'Edit' | 'Cancel' | 'Note' | 'SampleUpdate';
  performedBy: string;
  timestamp: string;
  details?: Record<string, any>;
}

// Validation errors
export interface ValidationErrors {
  isValid: boolean;
  errors: Record<string, string>;
}

// Quick add patient form
export interface QuickAddPatientForm {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
}

// Kanban card (sample tracking)
export interface KanbanCard {
  id: string;
  tokenNumber: string;
  patientName: string;
  sampleID: string;
  tests: string; // comma-separated test names
  timeInStage: string;
  priority: 'Normal' | 'Urgent';
  status: TokenStatus;
  scheduledTime?: string;
}

// Time slot availability
export interface TimeSlotAvailability {
  slot: TimeSlot;
  available: boolean;
  capacity: number;
  booked: number;
}

// Doctor reference
export interface Doctor {
  id: string;
  name: string;
  mobile?: string;
  specialization?: string;
  hospital?: string;
  isActive: boolean;
}

// Booking summary for print
export interface BookingSummary {
  booking: Booking;
  patient: Patient;
  tests: BookingTest[];
  package?: BookingPackage;
  generatedAt: string;
  qrCode: string;
  barcode: string;
  staffName: string;
}

// Constants
export const BOOKING_TYPES = ['WalkIn', 'Scheduled', 'HomeCollection'] as const;
export const TOKEN_STATUSES = ['Pending', 'Collected', 'Testing', 'Ready', 'Cancelled'] as const;
export const SAMPLE_QUALITIES = ['Good', 'Hemolyzed', 'Contaminated', 'Insufficient'] as const;
export const DISCOUNT_REASONS = ['SeniorCitizen', 'Staff', 'DoctorReferral', 'Promotional', 'Other'] as const;
export const TIME_SLOTS: TimeSlot[] = ['6-9 AM', '9-12 PM', '12-3 PM', '3-6 PM'];
export const PRIORITIES = ['Normal', 'Urgent'] as const;
export const TIME_UNITS = ['Hours', 'Days'] as const;
export const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Insurance'] as const;

// Status colors for UI
export const STATUS_COLORS: Record<TokenStatus, string> = {
  Pending: '#FFC107',
  Collected: '#2196F3',
  Testing: '#FF9800',
  Ready: '#4CAF50',
  Cancelled: '#F44336',
};

export const STATUS_LABELS: Record<TokenStatus, string> = {
  Pending: '🟡 Pending',
  Collected: '🔵 Collected',
  Testing: '🟠 Testing',
  Ready: '🟢 Ready',
  Cancelled: '🔴 Cancelled',
};

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  WalkIn: 'Walk-in',
  Scheduled: 'Scheduled',
  HomeCollection: 'Home Collection',
};
