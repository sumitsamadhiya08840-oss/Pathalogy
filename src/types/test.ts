// Test Catalog Management Types

export type TestCategory =
  | 'Hematology'
  | 'Biochemistry'
  | 'Microbiology'
  | 'Immunology'
  | 'Pathology'
  | 'Radiology'
  | 'Other';

export type SampleType =
  | 'Blood'
  | 'Urine'
  | 'Stool'
  | 'Sputum'
  | 'Tissue'
  | 'Serum'
  | 'Plasma'
  | 'CSF'
  | 'Other';

export type ContainerType =
  | 'EDTA Tube'
  | 'Plain Tube'
  | 'Fluoride Tube'
  | 'Citrate Tube'
  | 'Sterile Container'
  | 'Urine Container'
  | 'Other';

export type ReportTime =
  | '2 Hours'
  | '4 Hours'
  | '6 Hours'
  | 'Same Day'
  | '24 Hours'
  | '48 Hours'
  | '72 Hours'
  | '1 Week';

export type ReportFormat = 'Tabular' | 'Descriptive' | 'Graphical' | 'Combined';

export type AnalysisMethod = 'Manual' | 'Semi-Automated' | 'Automated';

export type GenderSpecific = 'All' | 'Male Only' | 'Female Only';

export type PackageCategory =
  | 'Health Checkup'
  | 'Pre-Employment'
  | 'Senior Citizen'
  | 'Women\'s Health'
  | 'Diabetes'
  | 'Cardiac'
  | 'Thyroid'
  | 'Liver'
  | 'Kidney'
  | 'Other';

export interface NormalRange {
  male?: { from: number; to: number };
  female?: { from: number; to: number };
  children?: { from: number; to: number };
}

export interface TestParameter {
  id: string;
  parameterName: string;
  shortName: string;
  unit: string;
  normalRange: NormalRange;
  criticalLowValue?: number;
  criticalHighValue?: number;
  methodOfAnalysis?: string;
  displayOrder: number;
}

export interface Test {
  id: string;
  testCode: string;
  testName: string;
  shortName: string;
  category: TestCategory;
  subCategory?: string;
  description?: string;
  keywords?: string[];

  // Sample Details
  sampleType: SampleType;
  sampleVolume?: string;
  containerType?: ContainerType;
  numberOfContainers?: number;
  sampleHandlingInstructions?: string;
  specialPrecautions?: string;

  // Prerequisites
  fastingRequired: boolean;
  fastingDuration?: string;
  medicationsToAvoid?: string[];
  otherInstructions?: string;

  // Pricing
  basePrice: number;
  discountAllowed: boolean;
  maxDiscountPercent?: number;
  emergencyCharges?: number;
  homeCollectionCharges?: number;
  packageInclusionAllowed: boolean;

  // Reporting
  reportTime: ReportTime;
  reportFormat: ReportFormat;
  reportTemplate?: string;
  criticalValueAlert: boolean;

  // Parameters
  parameters: TestParameter[];

  // Machine Mapping
  analysisMethod: AnalysisMethod;
  machineInstrument?: string;
  machineTestCode?: string;
  qcRequirements?: string;

  // Additional Settings
  department?: string;
  requiresDoctorApproval: boolean;
  minAge?: number;
  maxAge?: number;
  genderSpecific: GenderSpecific;
  consentFormRequired: boolean;
  consentTemplate?: string;

  // Meta
  status: 'Active' | 'Inactive';
  createdDate: string;
  lastModified?: string;
  lastModifiedBy?: string;
  timesPerformed?: number;
  revenueGenerated?: number;
}

export interface Package {
  id: string;
  packageCode: string;
  packageName: string;
  category: PackageCategory;
  description?: string;
  targetAudience?: string[];

  // Tests
  includedTests: string[]; // Array of test IDs
  individualTotal: number;
  packagePrice: number;
  discountPercent: number;
  savingsAmount: number;
  homeCollectionCharges?: number;
  finalPrice: number;

  // Details
  sampleTypesRequired: SampleType[];
  fastingRequired: boolean;
  reportTime: ReportTime;
  packageValidity?: number; // days
  minAge?: number;
  maxAge?: number;
  genderSpecific: GenderSpecific;

  // Marketing
  packageImage?: string;
  highlightPoints?: string[];
  recommendedFor?: string;
  displayOnWebsite: boolean;
  featuredPackage: boolean;

  // Meta
  status: 'Active' | 'Inactive';
  popularity: number; // times booked
  createdDate: string;
  lastModified?: string;
}

export interface TestFilters {
  searchQuery: string;
  category: string;
  sampleType: string;
  status: string;
  priceFrom: number;
  priceTo: number;
}

export interface PackageFilters {
  searchQuery: string;
  category: string;
  status: string;
  priceFrom: number;
  priceTo: number;
}

export interface TestFormData {
  testCode: string;
  testName: string;
  shortName: string;
  category: TestCategory | '';
  subCategory: string;
  description: string;
  keywords: string[];

  sampleType: SampleType | '';
  sampleVolume: string;
  containerType: ContainerType | '';
  numberOfContainers: string;
  sampleHandlingInstructions: string;
  specialPrecautions: string;

  fastingRequired: boolean;
  fastingDuration: string;
  medicationsToAvoid: string[];
  otherInstructions: string;

  basePrice: string;
  discountAllowed: boolean;
  maxDiscountPercent: string;
  emergencyCharges: string;
  homeCollectionCharges: string;
  packageInclusionAllowed: boolean;

  reportTime: ReportTime | '';
  reportFormat: ReportFormat | '';
  reportTemplate: string;
  criticalValueAlert: boolean;

  parameters: TestParameter[];

  analysisMethod: AnalysisMethod | '';
  machineInstrument: string;
  machineTestCode: string;
  qcRequirements: string;

  department: string;
  requiresDoctorApproval: boolean;
  minAge: string;
  maxAge: string;
  genderSpecific: GenderSpecific;
  consentFormRequired: boolean;
}

export interface PackageFormData {
  packageCode: string;
  packageName: string;
  category: PackageCategory | '';
  description: string;
  targetAudience: string[];

  includedTests: string[];
  individualTotal: number;
  packagePrice: string;
  discountPercent: number;
  savingsAmount: number;
  homeCollectionCharges: string;
  finalPrice: number;

  minAge: string;
  maxAge: string;
  genderSpecific: GenderSpecific;

  packageImage: string;
  highlightPoints: string[];
  recommendedFor: string;
  displayOnWebsite: boolean;
  featuredPackage: boolean;
}

export interface BulkImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: Array<{ row: number; message: string }>;
  importedTests: Test[];
}

export interface ValidationErrors {
  [key: string]: string;
}

// Constants
export const TEST_CATEGORIES: TestCategory[] = [
  'Hematology',
  'Biochemistry',
  'Microbiology',
  'Immunology',
  'Pathology',
  'Radiology',
  'Other',
];

export const SAMPLE_TYPES: SampleType[] = [
  'Blood',
  'Urine',
  'Stool',
  'Sputum',
  'Tissue',
  'Serum',
  'Plasma',
  'CSF',
  'Other',
];

export const CONTAINER_TYPES: ContainerType[] = [
  'EDTA Tube',
  'Plain Tube',
  'Fluoride Tube',
  'Citrate Tube',
  'Sterile Container',
  'Urine Container',
  'Other',
];

export const REPORT_TIMES: ReportTime[] = [
  '2 Hours',
  '4 Hours',
  '6 Hours',
  'Same Day',
  '24 Hours',
  '48 Hours',
  '72 Hours',
  '1 Week',
];

export const REPORT_FORMATS: ReportFormat[] = [
  'Tabular',
  'Descriptive',
  'Graphical',
  'Combined',
];

export const ANALYSIS_METHODS: AnalysisMethod[] = [
  'Manual',
  'Semi-Automated',
  'Automated',
];

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  'Health Checkup',
  'Pre-Employment',
  'Senior Citizen',
  'Women\'s Health',
  'Diabetes',
  'Cardiac',
  'Thyroid',
  'Liver',
  'Kidney',
  'Other',
];

export const MACHINES = [
  'None (Manual)',
  'Sysmex XN-1000',
  'Cobas 6000',
  'Architect i2000SR',
  'VITROS 5600',
  'BioRad D-10',
  'Siemens Atellica',
  'Other',
];

export const DEPARTMENTS = [
  'Clinical Pathology',
  'Biochemistry',
  'Microbiology',
  'Immunology',
  'Histopathology',
  'Cytopathology',
  'Molecular Biology',
];
