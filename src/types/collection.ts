// Import only if patient.ts exports Address type
// For now, define locally if not available
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// Enums
export enum SampleQuality {
  Good = 'Good',
  Hemolyzed = 'Hemolyzed',
  Clotted = 'Clotted',
  InsufficientVolume = 'InsufficientVolume',
  Lipemic = 'Lipemic',
  Contaminated = 'Contaminated'
}

export enum TubeType {
  EdtaTube = 'EDTA Tube (Purple/Lavender Cap)',
  PlainTube = 'Plain Tube (Red Cap)',
  SodiumCitrateTube = 'Sodium Citrate Tube (Blue Cap)',
  FluorideTube = 'Fluoride Tube (Gray Cap)',
  HeparinTube = 'Heparin Tube (Green Cap)',
  GelTube = 'Gel Tube (Yellow Cap)',
  SterileUrineContainer = 'Sterile Urine Container',
  PlainUrineContainer = 'Plain Container',
  UrineCollectionBottle = '24-hour Collection Bottle',
  StoolContainer = 'Stool Container with Preservative',
  PlainStoolContainer = 'Plain Stool Container'
}

export enum CollectionStatus {
  Pending = 'Pending Collection',
  Collected = 'Collected',
  Rejected = 'Rejected'
}

export enum HomeCollectionStatus {
  PendingAssignment = 'Pending Assignment',
  Assigned = 'Assigned',
  InProgress = 'In Progress',
  Collected = 'Collected',
  Cancelled = 'Cancelled'
}

export enum Priority {
  Normal = 'Normal',
  Urgent = 'Urgent',
  STAT = 'STAT'
}

export enum BookingType {
  WalkIn = 'Walk-in',
  Scheduled = 'Scheduled'
}

export enum PatientCondition {
  Normal = 'Normal',
  Anxious = 'Anxious',
  DifficultVeinAccess = 'Difficult Vein Access',
  PatientMoved = 'Patient Moved/Flinched',
  Pediatric = 'Pediatric (child)',
  Geriatric = 'Geriatric (elderly)',
  Other = 'Other'
}

export enum FastingStatus {
  Fasting = 'Fasting',
  NonFasting = 'Non-Fasting',
  NotApplicable = 'Not Applicable'
}

export enum CollectionSite {
  LeftArm = 'Left Arm',
  RightArm = 'Right Arm',
  LeftHand = 'Left Hand',
  RightHand = 'Right Hand',
  Other = 'Other'
}

export enum SampleLocation {
  InCollection = 'In Collection',
  InTransit = 'In Transit',
  AtTesting = 'At Testing'
}

export enum NextStep {
  Waiting = 'Waiting',
  Testing = 'Testing',
  Reported = 'Reported'
}

export enum QualityIssueStatus {
  ReCollectionRequested = 'Re-collection Requested',
  Cancelled = 'Cancelled',
  AcceptedWithDisclaimer = 'Accepted with Disclaimer',
  PendingAction = 'Pending Action'
}

export enum TimeFilter {
  AllDay = 'All Day',
  Overdue = 'Overdue (>30 mins)',
  Next1Hour = 'Next 1 Hour',
  Next2Hours = 'Next 2 Hours'
}

export type Department = 
  | 'Hematology' 
  | 'Biochemistry' 
  | 'Microbiology' 
  | 'Serology';

export type CollectionMethod = 
  | 'Random' 
  | 'Midstream' 
  | '24Hour';

export type RejectionReason = 
  | 'NotFasting' 
  | 'InsufficientID' 
  | 'PatientRefused' 
  | 'MedicalContraindication' 
  | 'Other';

export type TimeSlot = 
  | '6-9 AM' 
  | '9-12 PM' 
  | '12-3 PM' 
  | '3-6 PM';

export type PriorityLevel = 'Normal' | 'Urgent' | 'STAT';

// Interfaces
export interface Collector {
  id: string;
  name: string;
  staffID: string;
  mobile: string;
  currentAssignments: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  availability: 'Free' | 'Busy';
  email?: string;
  photo?: string;
}

export interface Test {
  id: string;
  testCode: string;
  testName: string;
  sampleType: string;
  sampleVolume: number; // in ml
  containerType: string;
  tubeType?: TubeType;
  fastingRequired: boolean;
  reportTime: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  patientID: string;
  email?: string;
  address?: string;
  photo?: string;
}

export interface SampleRequirement {
  sampleType: string;
  volume: number;
  tubeType: TubeType | string;
  containerType: string;
  count: number;
  testNames: string[];
}

export interface SampleDetail {
  id: string;
  sampleType: string;
  tubeType: string;
  numberOfTubes: number;
  volumeCollected: number;
  quality: SampleQuality;
  qualityNotes?: string;
  collectionMethod?: CollectionMethod;
}

export interface CollectionFormData {
  collectorID: string;
  collectorName: string;
  collectionDate: string;
  collectionTime: string;
  samples: SampleDetail[];
  fastingStatus: 'Fasting' | 'NonFasting' | 'NotApplicable';
  fastingHours?: number;
  patientCondition: PatientCondition;
  patientConditionNotes?: string;
  collectionSite?: CollectionSite;
  collectionNotes?: string;
  printLabels: boolean;
  numberOfLabels: number;
  qualityChecklist: {
    patientVerified: boolean;
    correctTube: boolean;
    adequateVolume: boolean;
    labelApplied: boolean;
    storedProperly: boolean;
    patientInformed: boolean;
  };
  department: Department;
  priority: 'Normal' | 'Urgent' | 'STAT';
  priorityReason?: string;
}

export interface Collection {
  id: string;
  tokenNumber: string;
  sampleID: string;
  bookingID: string;
  patient: Patient;
  tests: Test[];
  bookingType: BookingType;
  bookingTime: string;
  bookingDate: string;
  status: CollectionStatus;
  priority: 'Normal' | 'Urgent' | 'STAT';
  waitingTime?: number; // in minutes
  sampleRequirements: SampleRequirement[];
  specialInstructions?: string;
  collectionData?: CollectionFormData;
  collectedAt?: string;
  collectedBy?: string;
  rejectionReason?: string;
  qualityIssues?: QualityIssue[];
  type: 'Lab' | 'Home';
}

export interface HomeCollection extends Collection {
  address: string;
  area: string;
  locality: string;
  preferredDate: string;
  preferredTimeSlot: TimeSlot;
  assignedCollector?: Collector;
  homeCollectionStatus: HomeCollectionStatus;
  distance?: number; // km from lab
  latitude?: number;
  longitude?: number;
  scheduledTime?: string;
  collectionProof?: CollectionProof;
}

export interface CollectionProof {
  samplePhotos: string[]; // URLs
  patientSignature?: string; // Base64 or URL
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  idProof?: string; // URL
  collectionConfirmed: boolean;
  paymentCollected?: boolean;
  paymentAmount?: number;
  receiptNumber?: string;
  timestamp: string;
}

export interface QualityIssue {
  id: string;
  sampleID: string;
  tokenNumber: string;
  patientName: string;
  issueType: SampleQuality;
  description: string;
  collectedBy: string;
  reportedBy: string;
  reportedAt: string;
  actionTaken?: string;
  status: 'Open' | 'ReCollectionRequested' | 'AcceptedWithDisclaimer' | 'Cancelled';
}

export interface RouteStop {
  id: string;
  sequence: number;
  collection: HomeCollection;
  estimatedTime: string;
  estimatedDuration: number; // minutes
  distance: number; // km from previous stop
}

export interface Route {
  id: string;
  date: string;
  collector: Collector;
  area: string[];
  stops: RouteStop[];
  totalDistance: number; // km
  totalDuration: number; // hours
  startTime: string;
  endTime: string;
  status: 'Planned' | 'InProgress' | 'Completed';
}

export interface CollectionStatistics {
  pendingCollections: number;
  todaysCollections: number;
  homeCollectionsPending: number;
  qualityIssues: number;
  overdue: number;
  rejectedToday: number;
  averageCollectionTime: number; // minutes
  collectorPerformance: CollectorPerformance[];
}

export interface CollectorPerformance {
  collector: Collector;
  totalCollections: number;
  averageTime: number; // minutes
  qualityIssuesCount: number;
  successRate: number; // percentage
}

export interface ValidationErrors {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface AssignCollectorData {
  collectionID: string;
  collectorID: string;
  scheduledTime: string;
  estimatedDuration: number;
  specialInstructions?: string;
  notifyCollector: boolean;
  notifyPatient: boolean;
}

export interface BatchCollectionData {
  collections: Collection[];
  collectorID: string;
  collectionTime: string;
}

export interface SampleLabel {
  sampleID: string;
  patientName: string;
  testNames: string;
  collectionDate: string;
  collectionTime: string;
  collectorName: string;
  barcode: string;
}

// Constants
export const TUBE_TYPES: Record<string, { label: string; color: string }> = {
  [TubeType.EdtaTube]: { label: 'EDTA Tube (Purple Cap)', color: '#9C27B0' },
  [TubeType.PlainTube]: { label: 'Plain Tube (Red Cap)', color: '#F44336' },
  [TubeType.SodiumCitrateTube]: { label: 'Sodium Citrate Tube (Blue Cap)', color: '#2196F3' },
  [TubeType.FluorideTube]: { label: 'Fluoride Tube (Gray Cap)', color: '#9E9E9E' },
  [TubeType.GelTube]: { label: 'Gel Tube (Yellow Cap)', color: '#FFEB3B' },
};

export const SAMPLE_QUALITY_OPTIONS: Record<SampleQuality, { label: string; icon: string; color: string }> = {
  [SampleQuality.Good]: { label: '✅ Good', icon: '✅', color: '#4CAF50' },
  [SampleQuality.Hemolyzed]: { label: '⚠️ Hemolyzed', icon: '⚠️', color: '#FF9800' },
  [SampleQuality.Clotted]: { label: '⚠️ Clotted', icon: '⚠️', color: '#FF9800' },
  [SampleQuality.InsufficientVolume]: { label: '⚠️ Insufficient Volume', icon: '⚠️', color: '#FF9800' },
  [SampleQuality.Lipemic]: { label: '❌ Lipemic', icon: '❌', color: '#F44336' },
  [SampleQuality.Contaminated]: { label: '❌ Contaminated', icon: '❌', color: '#F44336' },
};

export const STATUS_COLORS: Record<CollectionStatus, string> = {
  [CollectionStatus.Pending]: '#FF9800',
  [CollectionStatus.Collected]: '#4CAF50',
  [CollectionStatus.Rejected]: '#F44336',
};

export const HOME_COLLECTION_STATUS_COLORS: Record<HomeCollectionStatus, string> = {
  [HomeCollectionStatus.PendingAssignment]: '#FFC107',
  [HomeCollectionStatus.Assigned]: '#2196F3',
  [HomeCollectionStatus.InProgress]: '#FF9800',
  [HomeCollectionStatus.Collected]: '#4CAF50',
  [HomeCollectionStatus.Cancelled]: '#F44336',
};

export const TIME_SLOTS: TimeSlot[] = ['6-9 AM', '9-12 PM', '12-3 PM', '3-6 PM'];

export const DEPARTMENTS: Department[] = ['Hematology', 'Biochemistry', 'Microbiology', 'Serology'];

export const REJECTION_REASONS: RejectionReason[] = [
  'NotFasting',
  'InsufficientID',
  'PatientRefused',
  'MedicalContraindication',
  'Other',
];

export const COLLECTION_SITES: CollectionSite[] = [
  CollectionSite.LeftArm,
  CollectionSite.RightArm,
  CollectionSite.LeftHand,
  CollectionSite.Other,
];

export const PATIENT_CONDITIONS: PatientCondition[] = [
  PatientCondition.Normal,
  PatientCondition.Anxious,
  PatientCondition.DifficultVeinAccess,
  PatientCondition.Other,
];
