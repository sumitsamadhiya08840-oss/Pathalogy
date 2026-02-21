// Settings Module Types

export type ReportFormat = 'A4' | 'Letter';
export type TokenSlipSize = '58mm' | '80mm' | 'A4';
export type UserRole = 'Admin' | 'Staff' | 'Pathologist' | 'Collector';
export type NotificationChannel = 'SMS';
export type NotificationType = 
  | 'BookingConfirmation' 
  | 'SampleCollected' 
  | 'ReportPublished' 
  | 'CriticalAlert';

// Lab Profile
export interface LabAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
}

export interface NABLInfo {
  enabled: boolean;
  registrationNo?: string;
}

export interface ABDMInfo {
  enabled: boolean;
  facilityId?: string;
}

export interface LabProfile {
  labName: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address: LabAddress;
  logoDataUrl?: string;
  nabl: NABLInfo;
  abdm: ABDMInfo;
}

// Report Settings
export interface ReportSettings {
  defaultReportFormat: ReportFormat;
  showReferenceRanges: boolean;
  showMethodology: boolean;
  showBarcodeOnReport: boolean;
  autoPublishAfterSignature: boolean;
  footerNote?: string;
}

// Notification Template
export interface NotificationTemplate {
  templateId: string;
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
  templateText: string;
  variables: string[]; // e.g., ['patientName', 'token', 'reportLink']
}

// Print Settings
export interface PrintSettings {
  tokenSlipEnabled: boolean;
  tokenSlipSize: TokenSlipSize;
  defaultPrinterName?: string;
  marginMm: number;
}

// Staff User
export interface StaffUser {
  userId: string;
  name: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Complete App Settings
export interface AppSettings {
  labProfile: LabProfile;
  report: ReportSettings;
  notifications: NotificationTemplate[];
  print: PrintSettings;
  users: StaffUser[];
}

// Template variable helpers
export const TEMPLATE_VARIABLES: Record<NotificationType, string[]> = {
  BookingConfirmation: ['patientName', 'token', 'bookingDate', 'testNames', 'labName', 'labPhone'],
  SampleCollected: ['patientName', 'token', 'sampleId', 'expectedReportDate', 'labName'],
  ReportPublished: ['patientName', 'token', 'reportLink', 'labName', 'labPhone'],
  CriticalAlert: ['patientName', 'token', 'testName', 'criticalValue', 'labName', 'labPhone'],
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  BookingConfirmation: 'Booking Confirmation',
  SampleCollected: 'Sample Collected',
  ReportPublished: 'Report Published',
  CriticalAlert: 'Critical Alert',
};

// Color mapping
export const ROLE_COLORS: Record<UserRole, string> = {
  Admin: '#D32F2F',
  Staff: '#1976D2',
  Pathologist: '#7B1FA2',
  Collector: '#388E3C',
};
