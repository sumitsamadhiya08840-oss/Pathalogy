// Report Generation Module - TypeScript Types

export type ReportStatus = 'Ready' | 'Draft' | 'Review' | 'Published' | 'Revised';
export type Priority = 'Normal' | 'Urgent' | 'Critical';
export type DeliveryStatus = 'Pending' | 'Sent' | 'Failed' | 'Delivered';
export type SignatureType = 'digital' | 'drawn' | 'none';
export type Language = 'English' | 'Hindi';
export type ReportTemplate = 'Standard' | 'Detailed' | 'Minimal' | 'Branded';

export interface Parameter {
  name: string;
  category?: string;
  result: string | number;
  unit: string;
  normalRange: string;
  flag?: 'L' | 'H' | 'LL' | 'HH' | '';
  isCritical?: boolean;
}

export interface TestResult {
  id: string;
  sampleId: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  testName: string;
  department: string;
  testCompletedTime: Date;
  tatDeadline: Date;
  priority: Priority;
  hasCriticalValues: boolean;
  assignedPathologist?: string;
  reportStatus: ReportStatus;
  referredBy?: string;
  mobile: string;
  email?: string;
  collectionDate: Date;
  sampleType: string;
  fastingStatus: string;
  parameters: Parameter[];
}

export interface Pathologist {
  id: string;
  name: string;
  qualification: string;
  registrationNumber: string;
  signatureUrl?: string;
}

export interface ReportSettings {
  includeGraphs: boolean;
  includePreviousResults: boolean;
  includeReferenceImages: boolean;
  includeQCStatement: boolean;
  includeMethodology: boolean;
  showNABLLogo: boolean;
  showRegistrationNumbers: boolean;
  showPageNumbers: boolean;
  language: Language;
  watermark?: {
    enabled: boolean;
    text: string;
    opacity: number;
  };
}

export interface DeliveryOptions {
  notifyPatient: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  notifyDoctor: boolean;
  doctorEmail?: string;
  uploadToPortal: boolean;
  uploadToABDM: boolean;
  print: {
    enabled: boolean;
    copies: number;
    printer?: string;
  };
}

export interface ReportData {
  reportId: string;
  testResult: TestResult;
  interpretation: string;
  clinicalNotes: string;
  criticalComments?: string;
  pathologist?: Pathologist;
  signatureType: SignatureType;
  signatureData?: string;
  template: ReportTemplate;
  settings: ReportSettings;
  deliveryOptions: DeliveryOptions;
  certificationAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishedReport {
  reportId: string;
  sampleId: string;
  tokenNumber: string;
  patientName: string;
  testName: string;
  department: string;
  publishedBy: string;
  publishedTime: Date;
  hasCriticalValues: boolean;
  deliveryStatus: {
    sms: DeliveryStatus;
    email: DeliveryStatus;
    whatsapp: DeliveryStatus;
    portal: DeliveryStatus;
  };
  pdfUrl?: string;
  viewCount: number;
  downloadCount: number;
}

export interface DraftReport {
  reportId: string;
  sampleId: string;
  tokenNumber: string;
  patientName: string;
  testName: string;
  savedBy: string;
  lastModified: Date;
  status: 'Draft' | 'Pending Review';
  reportData: Partial<ReportData>;
}

export interface RemarksTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  useCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeliveryResult {
  sms: { success: boolean; message?: string };
  email: { success: boolean; message?: string };
  whatsapp: { success: boolean; message?: string };
  portal: { success: boolean; message?: string };
}

export interface QuickStats {
  readyForReport: number;
  draftReports: number;
  publishedToday: number;
  pendingSignature: number;
  criticalReports: number;
}

export interface ReportFilters {
  search: string;
  department: string;
  testCategory: string;
  priority: Priority | 'All';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  pathologist: string;
  sortBy: 'TAT' | 'Priority' | 'PatientName';
}
