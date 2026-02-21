// Home Collection Module Types

export type HomeCollectionStatus = 
  | 'Pending' 
  | 'Assigned' 
  | 'EnRoute' 
  | 'Collected' 
  | 'DeliveredToLab' 
  | 'Cancelled';

export interface Collector {
  collectorId: string;
  name: string;
  phone: string;
  active: boolean;
  currentAssignments: number;
  vehicleNumber?: string;
  rating?: number;
}

export interface HomePickupAddress {
  line: string;
  area: string;
  city: string;
  pincode: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

export interface HomePickupProof {
  photoDataUrl?: string;
  otpVerified?: boolean;
  receiverName?: string;
  collectedTime?: string;
}

export interface HomePickupAudit {
  at: string;
  by: string;
  action: string;
  notes?: string;
}

export interface HomePickup {
  pickupId: string;
  bookingId: string;
  sampleId: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  testName: string;
  address: HomePickupAddress;
  preferredSlot: {
    date: string;
    timeWindow: string; // e.g., "09:00 AM - 12:00 PM"
  };
  status: HomeCollectionStatus;
  collectorId?: string;
  collectorName?: string;
  assignedAt?: string;
  collectedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  proof?: HomePickupProof;
  notes?: string;
  priority: 'Normal' | 'Urgent';
  amount: number;
  paymentStatus: 'Pending' | 'Paid' | 'COD';
  audit: HomePickupAudit[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignCollectorFormData {
  collectorId: string;
  estimatedTime?: string;
  specialInstructions?: string;
}

export interface CollectSampleFormData {
  collectedTime: string;
  receiverName: string;
  otpVerified: boolean;
  photoDataUrl?: string;
  notes?: string;
}

export interface DeliverToLabFormData {
  deliveredTime: string;
  receivedBy: string;
  notes?: string;
}

export interface CancelPickupFormData {
  reason: string;
  notes?: string;
}

// Status colors
export const HOME_COLLECTION_STATUS_COLORS: Record<HomeCollectionStatus, string> = {
  Pending: '#FF9800',
  Assigned: '#2196F3',
  EnRoute: '#9C27B0',
  Collected: '#4CAF50',
  DeliveredToLab: '#00897B',
  Cancelled: '#F44336',
};

// Time windows
export const TIME_WINDOWS = [
  '06:00 AM - 09:00 AM',
  '09:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
  '06:00 PM - 09:00 PM',
];

// Cancel reasons
export const CANCEL_REASONS = [
  'Patient not available',
  'Wrong address',
  'Sample already collected at lab',
  'Patient cancelled',
  'Unable to contact patient',
  'Weather/Traffic issue',
  'Other',
];
