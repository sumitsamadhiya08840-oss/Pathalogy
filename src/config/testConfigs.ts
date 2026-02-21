// Complete Test Configurations
// Defines all parameters, normal ranges, critical values for each test type

export interface TestParameterConfig {
  name: string;
  shortName: string;
  unit: string;
  normalRange: {
    male?: { min: number; max: number };
    female?: { min: number; max: number };
    general?: { min: number; max: number };
  };
  criticalLow?: number;
  criticalHigh?: number;
  decimalPlaces: number;
  formula?: string;
  isCalculated?: boolean;
  displayOrder: number;
}

export interface TestConfig {
  testCode: string;
  testName: string;
  category: string;
  department: string;
  requiresQCApproval: boolean;
  expectedTAT: number; // hours
  parameters: TestParameterConfig[];
}

// CBC - Complete Blood Count (13 Parameters)
export const CBC_CONFIG: TestConfig = {
  testCode: 'CBC001',
  testName: 'Complete Blood Count',
  category: 'Hematology',
  department: 'Hematology Lab',
  requiresQCApproval: false,
  expectedTAT: 4,
  parameters: [
    {
      name: 'Hemoglobin',
      shortName: 'Hb',
      unit: 'g/dL',
      normalRange: {
        male: { min: 13, max: 17 },
        female: { min: 12, max: 15 }
      },
      criticalLow: 7,
      criticalHigh: 20,
      decimalPlaces: 1,
      displayOrder: 1
    },
    {
      name: 'RBC Count',
      shortName: 'RBC',
      unit: 'million/µL',
      normalRange: {
        male: { min: 4.5, max: 5.5 },
        female: { min: 4.0, max: 5.0 }
      },
      criticalLow: 2,
      criticalHigh: 7,
      decimalPlaces: 2,
      displayOrder: 2
    },
    {
      name: 'Hematocrit',
      shortName: 'HCT',
      unit: '%',
      normalRange: {
        male: { min: 40, max: 54 },
        female: { min: 37, max: 47 }
      },
      decimalPlaces: 1,
      displayOrder: 3
    },
    {
      name: 'MCV',
      shortName: 'MCV',
      unit: 'fL',
      normalRange: {
        general: { min: 80, max: 100 }
      },
      decimalPlaces: 1,
      displayOrder: 4
    },
    {
      name: 'MCH',
      shortName: 'MCH',
      unit: 'pg',
      normalRange: {
        general: { min: 27, max: 32 }
      },
      decimalPlaces: 1,
      displayOrder: 5
    },
    {
      name: 'MCHC',
      shortName: 'MCHC',
      unit: 'g/dL',
      normalRange: {
        general: { min: 32, max: 36 }
      },
      decimalPlaces: 1,
      displayOrder: 6
    },
    {
      name: 'WBC Count',
      shortName: 'WBC',
      unit: 'cells/µL',
      normalRange: {
        general: { min: 4000, max: 11000 }
      },
      criticalLow: 2000,
      criticalHigh: 30000,
      decimalPlaces: 0,
      displayOrder: 7
    },
    {
      name: 'Neutrophils',
      shortName: 'Neut',
      unit: '%',
      normalRange: {
        general: { min: 40, max: 70 }
      },
      decimalPlaces: 1,
      displayOrder: 8
    },
    {
      name: 'Lymphocytes',
      shortName: 'Lymph',
      unit: '%',
      normalRange: {
        general: { min: 20, max: 40 }
      },
      decimalPlaces: 1,
      displayOrder: 9
    },
    {
      name: 'Monocytes',
      shortName: 'Mono',
      unit: '%',
      normalRange: {
        general: { min: 2, max: 8 }
      },
      decimalPlaces: 1,
      displayOrder: 10
    },
    {
      name: 'Eosinophils',
      shortName: 'Eos',
      unit: '%',
      normalRange: {
        general: { min: 1, max: 4 }
      },
      decimalPlaces: 1,
      displayOrder: 11
    },
    {
      name: 'Basophils',
      shortName: 'Baso',
      unit: '%',
      normalRange: {
        general: { min: 0, max: 1 }
      },
      decimalPlaces: 1,
      displayOrder: 12
    },
    {
      name: 'Platelet Count',
      shortName: 'PLT',
      unit: 'lakhs/µL',
      normalRange: {
        general: { min: 1.5, max: 4.5 }
      },
      criticalLow: 0.5,
      criticalHigh: 10,
      decimalPlaces: 1,
      displayOrder: 13
    }
  ]
};

// Blood Sugar (2 Parameters)
export const BLOOD_SUGAR_CONFIG: TestConfig = {
  testCode: 'SUGAR001',
  testName: 'Blood Sugar',
  category: 'Biochemistry',
  department: 'Biochemistry Lab',
  requiresQCApproval: false,
  expectedTAT: 2,
  parameters: [
    {
      name: 'Glucose Level',
      shortName: 'Glucose',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 70, max: 100 } // Fasting
      },
      criticalLow: 50,
      criticalHigh: 400,
      decimalPlaces: 0,
      displayOrder: 1
    },
    {
      name: 'HbA1c',
      shortName: 'HbA1c',
      unit: '%',
      normalRange: {
        general: { min: 0, max: 5.7 }
      },
      decimalPlaces: 1,
      displayOrder: 2
    }
  ]
};

// Lipid Profile (6 Parameters)
export const LIPID_PROFILE_CONFIG: TestConfig = {
  testCode: 'LIPID001',
  testName: 'Lipid Profile',
  category: 'Biochemistry',
  department: 'Biochemistry Lab',
  requiresQCApproval: false,
  expectedTAT: 6,
  parameters: [
    {
      name: 'Total Cholesterol',
      shortName: 'TC',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 0, max: 200 }
      },
      decimalPlaces: 0,
      displayOrder: 1
    },
    {
      name: 'Triglycerides',
      shortName: 'TG',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 0, max: 150 }
      },
      decimalPlaces: 0,
      displayOrder: 2
    },
    {
      name: 'HDL',
      shortName: 'HDL',
      unit: 'mg/dL',
      normalRange: {
        male: { min: 40, max: 999 },
        female: { min: 50, max: 999 }
      },
      decimalPlaces: 0,
      displayOrder: 3
    },
    {
      name: 'LDL',
      shortName: 'LDL',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 0, max: 100 }
      },
      formula: 'Total - (HDL + Triglycerides/5)',
      isCalculated: true,
      decimalPlaces: 0,
      displayOrder: 4
    },
    {
      name: 'VLDL',
      shortName: 'VLDL',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 2, max: 30 }
      },
      formula: 'Triglycerides/5',
      isCalculated: true,
      decimalPlaces: 0,
      displayOrder: 5
    },
    {
      name: 'Total/HDL Ratio',
      shortName: 'TC/HDL',
      unit: '',
      normalRange: {
        general: { min: 0, max: 5 }
      },
      formula: 'Total Cholesterol / HDL',
      isCalculated: true,
      decimalPlaces: 2,
      displayOrder: 6
    }
  ]
};

// LFT - Liver Function Test (10 Parameters)
export const LFT_CONFIG: TestConfig = {
  testCode: 'LFT001',
  testName: 'Liver Function Test',
  category: 'Biochemistry',
  department: 'Biochemistry Lab',
  requiresQCApproval: false,
  expectedTAT: 6,
  parameters: [
    {
      name: 'Bilirubin Total',
      shortName: 'TB',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 0.3, max: 1.2 }
      },
      decimalPlaces: 2,
      displayOrder: 1
    },
    {
      name: 'Bilirubin Direct',
      shortName: 'DB',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 0, max: 0.3 }
      },
      decimalPlaces: 2,
      displayOrder: 2
    },
    {
      name: 'Bilirubin Indirect',
      shortName: 'IB',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 0.2, max: 0.8 }
      },
      formula: 'Total - Direct',
      isCalculated: true,
      decimalPlaces: 2,
      displayOrder: 3
    },
    {
      name: 'SGOT',
      shortName: 'AST',
      unit: 'U/L',
      normalRange: {
        general: { min: 0, max: 40 }
      },
      decimalPlaces: 0,
      displayOrder: 4
    },
    {
      name: 'SGPT',
      shortName: 'ALT',
      unit: 'U/L',
      normalRange: {
        general: { min: 0, max: 40 }
      },
      decimalPlaces: 0,
      displayOrder: 5
    },
    {
      name: 'Alkaline Phosphatase',
      shortName: 'ALP',
      unit: 'U/L',
      normalRange: {
        general: { min: 44, max: 147 }
      },
      decimalPlaces: 0,
      displayOrder: 6
    },
    {
      name: 'Total Protein',
      shortName: 'TP',
      unit: 'g/dL',
      normalRange: {
        general: { min: 6.0, max: 8.3 }
      },
      decimalPlaces: 1,
      displayOrder: 7
    },
    {
      name: 'Albumin',
      shortName: 'ALB',
      unit: 'g/dL',
      normalRange: {
        general: { min: 3.5, max: 5.5 }
      },
      decimalPlaces: 1,
      displayOrder: 8
    },
    {
      name: 'Globulin',
      shortName: 'GLOB',
      unit: 'g/dL',
      normalRange: {
        general: { min: 2.0, max: 3.5 }
      },
      formula: 'Total Protein - Albumin',
      isCalculated: true,
      decimalPlaces: 1,
      displayOrder: 9
    },
    {
      name: 'A/G Ratio',
      shortName: 'A/G',
      unit: '',
      normalRange: {
        general: { min: 1.0, max: 2.5 }
      },
      formula: 'Albumin / Globulin',
      isCalculated: true,
      decimalPlaces: 2,
      displayOrder: 10
    }
  ]
};

// KFT - Kidney Function Test (4 Parameters)
export const KFT_CONFIG: TestConfig = {
  testCode: 'KFT001',
  testName: 'Kidney Function Test',
  category: 'Biochemistry',
  department: 'Biochemistry Lab',
  requiresQCApproval: false,
  expectedTAT: 6,
  parameters: [
    {
      name: 'Blood Urea',
      shortName: 'Urea',
      unit: 'mg/dL',
      normalRange: {
        general: { min: 15, max: 40 }
      },
      decimalPlaces: 0,
      displayOrder: 1
    },
    {
      name: 'Serum Creatinine',
      shortName: 'Creatinine',
      unit: 'mg/dL',
      normalRange: {
        male: { min: 0.7, max: 1.3 },
        female: { min: 0.6, max: 1.1 }
      },
      criticalHigh: 3,
      decimalPlaces: 2,
      displayOrder: 2
    },
    {
      name: 'Uric Acid',
      shortName: 'UA',
      unit: 'mg/dL',
      normalRange: {
        male: { min: 3.4, max: 7.0 },
        female: { min: 2.4, max: 6.0 }
      },
      decimalPlaces: 1,
      displayOrder: 3
    },
    {
      name: 'eGFR',
      shortName: 'eGFR',
      unit: 'mL/min/1.73m²',
      normalRange: {
        general: { min: 60, max: 999 }
      },
      formula: 'Based on Creatinine, Age, Gender',
      isCalculated: true,
      decimalPlaces: 0,
      displayOrder: 4
    }
  ]
};

// Thyroid Profile (3 Parameters)
export const THYROID_PROFILE_CONFIG: TestConfig = {
  testCode: 'THYROID001',
  testName: 'Thyroid Profile',
  category: 'Immunology',
  department: 'Immunology Lab',
  requiresQCApproval: true,
  expectedTAT: 24,
  parameters: [
    {
      name: 'T3',
      shortName: 'T3',
      unit: 'ng/mL',
      normalRange: {
        general: { min: 0.8, max: 2.0 }
      },
      decimalPlaces: 2,
      displayOrder: 1
    },
    {
      name: 'T4',
      shortName: 'T4',
      unit: 'µg/dL',
      normalRange: {
        general: { min: 5.0, max: 12.0 }
      },
      decimalPlaces: 1,
      displayOrder: 2
    },
    {
      name: 'TSH',
      shortName: 'TSH',
      unit: 'µIU/mL',
      normalRange: {
        general: { min: 0.4, max: 4.0 }
      },
      decimalPlaces: 2,
      displayOrder: 3
    }
  ]
};

// Export all test configurations
export const TEST_CONFIGS: Record<string, TestConfig> = {
  'CBC': CBC_CONFIG,
  'Blood Sugar': BLOOD_SUGAR_CONFIG,
  'Lipid Profile': LIPID_PROFILE_CONFIG,
  'LFT': LFT_CONFIG,
  'KFT': KFT_CONFIG,
  'Thyroid Profile': THYROID_PROFILE_CONFIG
};

export const getTestConfig = (testName: string): TestConfig | undefined => {
  return TEST_CONFIGS[testName];
};
