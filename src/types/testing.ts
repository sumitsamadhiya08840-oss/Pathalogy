// Testing & Result Entry Module Types

// Enums
export type TestCategory = 
  | 'Hematology' 
  | 'Biochemistry' 
  | 'Microbiology' 
  | 'Serology' 
  | 'Immunology' 
  | 'Histopathology'
  | 'Cytology';

export type TestPriority = 
  | 'Normal' 
  | 'Urgent' 
  | 'STAT';

export type TestStatus = 
  | 'Pending' 
  | 'InProgress' 
  | 'Completed' 
  | 'QCPending' 
  | 'QCApproved' 
  | 'Reported'
  | 'Rejected';

export type ParameterFlag = 
  | 'Low' 
  | 'Normal' 
  | 'High' 
  | 'Critical';

export type QCStatus = 
  | 'Passed' 
  | 'Borderline' 
  | 'Failed';

export type MachineType = 
  | 'Manual' 
  | 'Sysmex XN-1000' 
  | 'Cobas 6000' 
  | 'Abbott Architect' 
  | 'Roche Hitachi'
  | 'BioRad D-10'
  | 'Other';

export type GlucoseTestType = 
  | 'Fasting' 
  | 'PP' 
  | 'Random';

// Interfaces
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  patientID: string;
  referringDoctor?: string;
}

export interface Sample {
  id: string;
  sampleID: string;
  tokenNumber: string;
  collectionDate: string;
  collectionTime: string;
  collectedBy: string;
  sampleType: string;
  sampleVolume?: number;
  sampleQuality: string;
  fastingStatus?: string;
  specialInstructions?: string;
}

export interface NormalRange {
  min: number;
  max: number;
  unit?: string;
}

export interface GenderSpecificRange {
  male: NormalRange;
  female: NormalRange;
}

export interface TestParameter {
  id: string;
  name: string;
  shortName: string;
  unit: string;
  normalRange: NormalRange | GenderSpecificRange;
  criticalLow?: number;
  criticalHigh?: number;
  decimalPlaces: number;
  isCalculated?: boolean;
  formula?: string;
  category?: string;
}

export interface ParameterValue {
  parameterId: string;
  parameterName: string;
  value: number | string;
  unit: string;
  normalRange: string;
  flag: ParameterFlag;
  isCritical: boolean;
}

export interface TestDefinition {
  testCode: string;
  testName: string;
  category: TestCategory;
  department: string;
  method: string;
  expectedTAT: number; // in hours
  parameters: TestParameter[];
  requiresFasting?: boolean;
  sampleType: string;
}

export interface TestResult {
  id: string;
  testResultID: string;
  sample: Sample;
  patient: Patient;
  test: TestDefinition;
  priority: TestPriority;
  status: TestStatus;
  
  // Testing details
  testedBy?: string;
  testedDate?: string;
  testedTime?: string;
  machineUsed?: MachineType;
  batchNumber?: string;
  dilutionFactor?: number;
  
  // Results
  parameterValues: ParameterValue[];
  
  // QC
  qcStatus?: QCStatus;
  qcData?: QCData;
  
  // Clinical
  interpretation?: string;
  remarks?: string;
  hasCriticalValues: boolean;
  criticalValueNotifications?: CriticalValueNotification[];
  
  // Timestamps
  startedAt?: string;
  completedAt?: string;
  qcApprovedAt?: string;
  qcApprovedBy?: string;
  
  // TAT
  tatRemaining?: number; // in minutes
  tatExceeded?: boolean;
  
  // Previous results for comparison
  previousResults?: TestResult[];
}

export interface QCData {
  status: QCStatus;
  controlLow?: number;
  controlNormal?: number;
  controlHigh?: number;
  lastCalibrationDate?: string;
  calibrationValid: boolean;
  reagentLotNumber?: string;
  reagentExpiryDate?: string;
}

export interface CriticalValueNotification {
  parameterId: string;
  parameterName: string;
  value: number;
  notifiedTo: string;
  notificationMethod: string[];
  notificationTime: string;
  response: string;
  acknowledgedBy: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface DeltaCheckResult {
  parameter: string;
  currentValue: number;
  previousValue: number;
  change: number;
  percentageChange: number;
  isSignificant: boolean;
  warningMessage?: string;
}

export interface MachineImportData {
  machineType: MachineType;
  importMethod: 'File' | 'API' | 'CopyPaste';
  fileData?: File;
  rawData?: string;
  parsedValues: Record<string, number>;
  importedAt: string;
}

export interface TestingStats {
  readyForTesting: number;
  inProgress: number;
  completedToday: number;
  criticalResults: number;
  pendingQC: number;
}

export interface Technician {
  id: string;
  name: string;
  staffID: string;
  department: string;
  specialization: string[];
  isAuthorized: boolean;
}

export interface ResultFormData {
  testedBy: string;
  testDate: string;
  testTime: string;
  machineUsed: MachineType;
  batchNumber: string;
  dilutionFactor: number;
  parameterValues: Record<string, number | string>;
  qcData: QCData;
  interpretation: string;
  remarks: string;
  verificationChecklist: {
    parametersEntered: boolean;
    valuesCrossChecked: boolean;
    qcPassed: boolean;
    unitsVerified: boolean;
    criticalNotified: boolean;
    patientVerified: boolean;
  };
}

export interface ComparisonResult {
  parameter: string;
  currentValue: number;
  currentDate: string;
  previousValue: number;
  previousDate: string;
  change: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  interpretation: string;
}

// Test-specific types
export interface CBCParameters {
  hemoglobin?: number;
  rbcCount?: number;
  hematocrit?: number;
  mcv?: number;
  mch?: number;
  mchc?: number;
  wbcCount?: number;
  neutrophils?: number;
  lymphocytes?: number;
  monocytes?: number;
  eosinophils?: number;
  basophils?: number;
  plateletCount?: number;
}

export interface BloodSugarParameters {
  glucose?: number;
  testType?: GlucoseTestType;
  hba1c?: number;
}

export interface LipidProfileParameters {
  totalCholesterol?: number;
  triglycerides?: number;
  hdl?: number;
  ldl?: number;
  vldl?: number;
  totalHdlRatio?: number;
}

export interface LFTParameters {
  bilirubinTotal?: number;
  bilirubinDirect?: number;
  bilirubinIndirect?: number;
  sgot?: number;
  sgpt?: number;
  alkalinePhosphatase?: number;
  totalProtein?: number;
  albumin?: number;
  globulin?: number;
  agRatio?: number;
}

export interface KFTParameters {
  bloodUrea?: number;
  serumCreatinine?: number;
  uricAcid?: number;
  egfr?: number;
}

export interface ThyroidParameters {
  t3?: number;
  t4?: number;
  tsh?: number;
}

// Constants
export const PARAMETER_FLAGS: Record<ParameterFlag, { label: string; color: string; icon: string }> = {
  Low: { label: 'Low ⬇️', color: '#FF9800', icon: '⬇️' },
  Normal: { label: 'Normal ✅', color: '#4CAF50', icon: '✅' },
  High: { label: 'High ⬆️', color: '#FF9800', icon: '⬆️' },
  Critical: { label: 'CRITICAL ⚠️', color: '#F44336', icon: '⚠️' },
};

export const QC_STATUS_COLORS: Record<QCStatus, string> = {
  Passed: '#4CAF50',
  Borderline: '#FF9800',
  Failed: '#F44336',
};

export const STATUS_COLORS: Record<TestStatus, string> = {
  Pending: '#FF9800',
  InProgress: '#2196F3',
  Completed: '#4CAF50',
  QCPending: '#9C27B0',
  QCApproved: '#4CAF50',
  Reported: '#757575',
  Rejected: '#F44336',
};

export const PRIORITY_COLORS: Record<TestPriority, string> = {
  Normal: '#757575',
  Urgent: '#FF9800',
  STAT: '#F44336',
};

export const MACHINE_TYPES: MachineType[] = [
  'Manual',
  'Sysmex XN-1000',
  'Cobas 6000',
  'Abbott Architect',
  'Roche Hitachi',
  'BioRad D-10',
  'Other',
];

export const TEST_CATEGORIES: TestCategory[] = [
  'Hematology',
  'Biochemistry',
  'Microbiology',
  'Serology',
  'Immunology',
  'Histopathology',
  'Cytology',
];

export const DEPARTMENTS = [
  'Hematology',
  'Biochemistry',
  'Microbiology',
  'Serology',
  'Immunology',
  'Histopathology',
  'Cytology',
];
