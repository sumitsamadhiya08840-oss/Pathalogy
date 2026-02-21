// Report Management Types
// Comprehensive type definitions for the Report Management Module

export interface CriticalValue {
  parameter: string;
  value: number;
  unit: string;
  normalRange: string;
  criticalThreshold: string;
  notifiedAt?: Date;
  notifiedTo?: string;
}

export interface DeliveryStatus {
  sms: 'Pending' | 'Sent' | 'Delivered' | 'Failed';
  email: 'Pending' | 'Sent' | 'Delivered' | 'Opened' | 'Failed';
  whatsapp: 'Pending' | 'Sent' | 'Delivered' | 'Failed';
  smsSentAt?: Date;
  smsDeliveredAt?: Date;
  smsFailureReason?: string;
  emailSentAt?: Date;
  emailDeliveredAt?: Date;
  emailOpenedAt?: Date;
  emailOpenCount?: number;
  emailFailureReason?: string;
  whatsappSentAt?: Date;
}

export interface AccessRecord {
  accessedAt: Date;
  accessedBy: string; // 'Patient', 'Doctor', 'Lab Staff'
  accessedByName?: string;
  ipAddress: string;
  device: string; // 'Mobile App', 'Web Browser', 'Desktop'
  action: 'Viewed' | 'Downloaded' | 'Printed' | 'Shared';
}

export interface AuditLogEntry {
  timestamp: Date;
  user: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface AddendumData {
  addendumText: string;
  addedBy: string;
  addedByQualification: string;
  addedAt: Date;
  signature?: string;
}

export interface Report {
  id: string;
  reportId: string;
  sampleId: string;
  token: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  email?: string;
  testName: string;
  testCode: string;
  department: string;
  category: string;
  referredByDoctor?: string;
  publishedAt: Date;
  publishedBy: string;
  pathologist: string;
  pathologistQualification: string;
  status: 'Published' | 'Pending' | 'Draft' | 'Cancelled' | 'Revised';
  hasCriticalValues: boolean;
  criticalValues?: CriticalValue[];
  criticalAcknowledged?: boolean;
  pdfUrl: string;
  pdfSize: number; // in bytes
  deliveryStatus: DeliveryStatus;
  downloadCount: number;
  printCount: number;
  viewCount: number;
  version: number;
  isRevision: boolean;
  originalReportId?: string;
  revisionReason?: string;
  hasAddendum: boolean;
  addendumData?: AddendumData;
  accessHistory: AccessRecord[];
  auditLog: AuditLogEntry[];
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  lastModified?: Date;
  modifiedBy?: string;
}

export interface StatsData {
  totalReports: number;
  todayReports: number;
  pendingReports: number;
  criticalReports: number;
  deliveryFailed: number;
  notDownloaded: number;
}

export interface FilterState {
  dateRange: { from: Date | null; to: Date | null };
  patientSearch: string;
  testFilter: string;
  doctorFilter: string;
  statusFilter: string;
  deliveryStatusFilter: string;
  departmentFilter: string;
  pathologistFilter: string;
  downloadStatusFilter: string;
  reportTypeFilter: string;
  criticalOnlyFilter: boolean;
}
