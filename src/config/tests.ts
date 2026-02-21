import { TestDefinition } from '@/types/testing';

// Complete Blood Count (CBC) Configuration
export const CBC_TEST: TestDefinition = {
  testCode: 'CBC001',
  testName: 'Complete Blood Count',
  category: 'Hematology',
  department: 'Hematology',
  method: 'Automated Cell Counter',
  expectedTAT: 2,
  requiresFasting: false,
  sampleType: 'Blood (EDTA)',
  parameters: [
    {
      id: 'hb',
      name: 'Hemoglobin',
      shortName: 'Hb',
      unit: 'g/dL',
      normalRange: {
        male: { min: 13, max: 17 },
        female: { min: 12, max: 15 },
      },
      criticalLow: 7,
      criticalHigh: 20,
      decimalPlaces: 1,
      category: 'Red Blood Cell Parameters',
    },
    {
      id: 'rbc',
      name: 'RBC Count',
      shortName: 'RBC',
      unit: 'million/µL',
      normalRange: {
        male: { min: 4.5, max: 5.5 },
        female: { min: 4.0, max: 5.0 },
      },
      decimalPlaces: 2,
      category: 'Red Blood Cell Parameters',
    },
    {
      id: 'hct',
      name: 'Hematocrit',
      shortName: 'HCT',
      unit: '%',
      normalRange: {
        male: { min: 40, max: 54 },
        female: { min: 37, max: 47 },
      },
      decimalPlaces: 1,
      category: 'Red Blood Cell Parameters',
    },
    {
      id: 'mcv',
      name: 'Mean Corpuscular Volume',
      shortName: 'MCV',
      unit: 'fL',
      normalRange: { min: 80, max: 100 },
      decimalPlaces: 1,
      category: 'Red Blood Cell Parameters',
    },
    {
      id: 'mch',
      name: 'Mean Corpuscular Hemoglobin',
      shortName: 'MCH',
      unit: 'pg',
      normalRange: { min: 27, max: 32 },
      decimalPlaces: 1,
      category: 'Red Blood Cell Parameters',
    },
    {
      id: 'mchc',
      name: 'Mean Corpuscular Hemoglobin Concentration',
      shortName: 'MCHC',
      unit: 'g/dL',
      normalRange: { min: 32, max: 36 },
      decimalPlaces: 1,
      category: 'Red Blood Cell Parameters',
    },
    {
      id: 'wbc',
      name: 'WBC Count',
      shortName: 'WBC',
      unit: 'cells/µL',
      normalRange: { min: 4000, max: 11000 },
      criticalLow: 2000,
      criticalHigh: 30000,
      decimalPlaces: 0,
      category: 'White Blood Cell Parameters',
    },
    {
      id: 'neutrophils',
      name: 'Neutrophils',
      shortName: 'Neutrophils',
      unit: '%',
      normalRange: { min: 40, max: 70 },
      decimalPlaces: 1,
      category: 'White Blood Cell Parameters',
    },
    {
      id: 'lymphocytes',
      name: 'Lymphocytes',
      shortName: 'Lymphocytes',
      unit: '%',
      normalRange: { min: 20, max: 40 },
      decimalPlaces: 1,
      category: 'White Blood Cell Parameters',
    },
    {
      id: 'monocytes',
      name: 'Monocytes',
      shortName: 'Monocytes',
      unit: '%',
      normalRange: { min: 2, max: 8 },
      decimalPlaces: 1,
      category: 'White Blood Cell Parameters',
    },
    {
      id: 'eosinophils',
      name: 'Eosinophils',
      shortName: 'Eosinophils',
      unit: '%',
      normalRange: { min: 1, max: 4 },
      decimalPlaces: 1,
      category: 'White Blood Cell Parameters',
    },
    {
      id: 'basophils',
      name: 'Basophils',
      shortName: 'Basophils',
      unit: '%',
      normalRange: { min: 0, max: 1 },
      decimalPlaces: 1,
      category: 'White Blood Cell Parameters',
    },
    {
      id: 'platelets',
      name: 'Platelet Count',
      shortName: 'Platelets',
      unit: 'lakhs/µL',
      normalRange: { min: 1.5, max: 4.5 },
      criticalLow: 0.5,
      criticalHigh: 10,
      decimalPlaces: 2,
      category: 'Platelet Parameters',
    },
  ],
};

// Blood Sugar Test Configuration
export const BLOOD_SUGAR_TEST: TestDefinition = {
  testCode: 'BS001',
  testName: 'Blood Sugar',
  category: 'Biochemistry',
  department: 'Biochemistry',
  method: 'Glucose Oxidase Method',
  expectedTAT: 1,
  requiresFasting: true,
  sampleType: 'Blood (Fluoride)',
  parameters: [
    {
      id: 'glucose',
      name: 'Glucose',
      shortName: 'Glucose',
      unit: 'mg/dL',
      normalRange: { min: 70, max: 100 },
      criticalLow: 50,
      criticalHigh: 400,
      decimalPlaces: 0,
    },
  ],
};

// HbA1c Test Configuration
export const HBA1C_TEST: TestDefinition = {
  testCode: 'HBA1C001',
  testName: 'HbA1c',
  category: 'Biochemistry',
  department: 'Biochemistry',
  method: 'HPLC',
  expectedTAT: 24,
  requiresFasting: false,
  sampleType: 'Blood (EDTA)',
  parameters: [
    {
      id: 'hba1c',
      name: 'HbA1c',
      shortName: 'HbA1c',
      unit: '%',
      normalRange: { min: 4, max: 5.6 },
      decimalPlaces: 1,
    },
  ],
};

// Lipid Profile Test Configuration
export const LIPID_PROFILE_TEST: TestDefinition = {
  testCode: 'LIPID001',
  testName: 'Lipid Profile',
  category: 'Biochemistry',
  department: 'Biochemistry',
  method: 'Enzymatic Colorimetric',
  expectedTAT: 4,
  requiresFasting: true,
  sampleType: 'Blood (Plain)',
  parameters: [
    {
      id: 'totalCholesterol',
      name: 'Total Cholesterol',
      shortName: 'Total Cholesterol',
      unit: 'mg/dL',
      normalRange: { min: 0, max: 200 },
      decimalPlaces: 0,
    },
    {
      id: 'triglycerides',
      name: 'Triglycerides',
      shortName: 'Triglycerides',
      unit: 'mg/dL',
      normalRange: { min: 0, max: 150 },
      decimalPlaces: 0,
    },
    {
      id: 'hdl',
      name: 'HDL Cholesterol',
      shortName: 'HDL',
      unit: 'mg/dL',
      normalRange: {
        male: { min: 40, max: 200 },
        female: { min: 50, max: 200 },
      },
      decimalPlaces: 0,
    },
    {
      id: 'ldl',
      name: 'LDL Cholesterol',
      shortName: 'LDL',
      unit: 'mg/dL',
      normalRange: { min: 0, max: 100 },
      decimalPlaces: 0,
      isCalculated: true,
      formula: 'totalCholesterol - (hdl + triglycerides/5)',
    },
    {
      id: 'vldl',
      name: 'VLDL',
      shortName: 'VLDL',
      unit: 'mg/dL',
      normalRange: { min: 2, max: 30 },
      decimalPlaces: 0,
      isCalculated: true,
      formula: 'triglycerides / 5',
    },
    {
      id: 'totalHdlRatio',
      name: 'Total Cholesterol/HDL Ratio',
      shortName: 'TC/HDL Ratio',
      unit: '',
      normalRange: { min: 0, max: 5 },
      decimalPlaces: 2,
      isCalculated: true,
      formula: 'totalCholesterol / hdl',
    },
  ],
};

// Liver Function Test (LFT) Configuration
export const LFT_TEST: TestDefinition = {
  testCode: 'LFT001',
  testName: 'Liver Function Test',
  category: 'Biochemistry',
  department: 'Biochemistry',
  method: 'Enzymatic/Photometric',
  expectedTAT: 4,
  requiresFasting: true,
  sampleType: 'Blood (Plain)',
  parameters: [
    {
      id: 'bilirubinTotal',
      name: 'Bilirubin Total',
      shortName: 'Total Bilirubin',
      unit: 'mg/dL',
      normalRange: { min: 0.3, max: 1.2 },
      decimalPlaces: 2,
    },
    {
      id: 'bilirubinDirect',
      name: 'Bilirubin Direct',
      shortName: 'Direct Bilirubin',
      unit: 'mg/dL',
      normalRange: { min: 0, max: 0.3 },
      decimalPlaces: 2,
    },
    {
      id: 'bilirubinIndirect',
      name: 'Bilirubin Indirect',
      shortName: 'Indirect Bilirubin',
      unit: 'mg/dL',
      normalRange: { min: 0.2, max: 0.8 },
      decimalPlaces: 2,
      isCalculated: true,
      formula: 'bilirubinTotal - bilirubinDirect',
    },
    {
      id: 'sgot',
      name: 'SGOT (AST)',
      shortName: 'SGOT',
      unit: 'U/L',
      normalRange: { min: 0, max: 40 },
      decimalPlaces: 0,
    },
    {
      id: 'sgpt',
      name: 'SGPT (ALT)',
      shortName: 'SGPT',
      unit: 'U/L',
      normalRange: { min: 0, max: 40 },
      decimalPlaces: 0,
    },
    {
      id: 'alkalinePhosphatase',
      name: 'Alkaline Phosphatase',
      shortName: 'ALP',
      unit: 'U/L',
      normalRange: { min: 44, max: 147 },
      decimalPlaces: 0,
    },
    {
      id: 'totalProtein',
      name: 'Total Protein',
      shortName: 'Total Protein',
      unit: 'g/dL',
      normalRange: { min: 6.0, max: 8.3 },
      decimalPlaces: 1,
    },
    {
      id: 'albumin',
      name: 'Albumin',
      shortName: 'Albumin',
      unit: 'g/dL',
      normalRange: { min: 3.5, max: 5.5 },
      decimalPlaces: 1,
    },
    {
      id: 'globulin',
      name: 'Globulin',
      shortName: 'Globulin',
      unit: 'g/dL',
      normalRange: { min: 2.0, max: 3.5 },
      decimalPlaces: 1,
      isCalculated: true,
      formula: 'totalProtein - albumin',
    },
    {
      id: 'agRatio',
      name: 'A/G Ratio',
      shortName: 'A/G Ratio',
      unit: '',
      normalRange: { min: 1.0, max: 2.5 },
      decimalPlaces: 2,
      isCalculated: true,
      formula: 'albumin / globulin',
    },
  ],
};

// Kidney Function Test (KFT) Configuration
export const KFT_TEST: TestDefinition = {
  testCode: 'KFT001',
  testName: 'Kidney Function Test',
  category: 'Biochemistry',
  department: 'Biochemistry',
  method: 'Enzymatic/Photometric',
  expectedTAT: 4,
  requiresFasting: true,
  sampleType: 'Blood (Plain)',
  parameters: [
    {
      id: 'bloodUrea',
      name: 'Blood Urea',
      shortName: 'Urea',
      unit: 'mg/dL',
      normalRange: { min: 15, max: 40 },
      decimalPlaces: 0,
    },
    {
      id: 'serumCreatinine',
      name: 'Serum Creatinine',
      shortName: 'Creatinine',
      unit: 'mg/dL',
      normalRange: {
        male: { min: 0.7, max: 1.3 },
        female: { min: 0.6, max: 1.1 },
      },
      criticalHigh: 3,
      decimalPlaces: 2,
    },
    {
      id: 'uricAcid',
      name: 'Uric Acid',
      shortName: 'Uric Acid',
      unit: 'mg/dL',
      normalRange: {
        male: { min: 3.4, max: 7.0 },
        female: { min: 2.4, max: 6.0 },
      },
      decimalPlaces: 1,
    },
    {
      id: 'egfr',
      name: 'eGFR',
      shortName: 'eGFR',
      unit: 'mL/min/1.73m²',
      normalRange: { min: 60, max: 120 },
      decimalPlaces: 0,
      isCalculated: true,
      formula: 'eGFR',
    },
  ],
};

// Thyroid Profile Configuration
export const THYROID_TEST: TestDefinition = {
  testCode: 'THYROID001',
  testName: 'Thyroid Profile',
  category: 'Immunology',
  department: 'Immunology',
  method: 'Chemiluminescence',
  expectedTAT: 24,
  requiresFasting: false,
  sampleType: 'Blood (Plain)',
  parameters: [
    {
      id: 't3',
      name: 'T3 (Triiodothyronine)',
      shortName: 'T3',
      unit: 'ng/mL',
      normalRange: { min: 0.8, max: 2.0 },
      decimalPlaces: 2,
    },
    {
      id: 't4',
      name: 'T4 (Thyroxine)',
      shortName: 'T4',
      unit: 'µg/dL',
      normalRange: { min: 5.0, max: 12.0 },
      decimalPlaces: 1,
    },
    {
      id: 'tsh',
      name: 'TSH (Thyroid Stimulating Hormone)',
      shortName: 'TSH',
      unit: 'µIU/mL',
      normalRange: { min: 0.4, max: 4.0 },
      decimalPlaces: 2,
    },
  ],
};

// Export all test configurations
export const TEST_CONFIGS: Record<string, TestDefinition> = {
  CBC: CBC_TEST,
  BLOOD_SUGAR: BLOOD_SUGAR_TEST,
  HBA1C: HBA1C_TEST,
  LIPID_PROFILE: LIPID_PROFILE_TEST,
  LFT: LFT_TEST,
  KFT: KFT_TEST,
  THYROID: THYROID_TEST,
};

// Get test configuration by code
export function getTestConfig(testCode: string): TestDefinition | undefined {
  return Object.values(TEST_CONFIGS).find(test => test.testCode === testCode);
}

// Get test configuration by name
export function getTestConfigByName(testName: string): TestDefinition | undefined {
  return Object.values(TEST_CONFIGS).find(
    test => test.testName.toLowerCase() === testName.toLowerCase()
  );
}
