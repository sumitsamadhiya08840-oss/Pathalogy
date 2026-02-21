import {
  ParameterFlag,
  TestParameter,
  NormalRange,
  GenderSpecificRange,
  ParameterValue,
  ValidationResult,
  ValidationError,
  DeltaCheckResult,
  TestResult,
  CriticalValueNotification,
} from '@/types/testing';

/**
 * Calculate parameter flag based on value and normal range
 */
export function calculateFlag(
  value: number,
  normalRange: NormalRange | GenderSpecificRange,
  gender?: 'Male' | 'Female' | 'Other',
  criticalLow?: number,
  criticalHigh?: number
): ParameterFlag {
  // Get appropriate range based on gender
  let range: NormalRange;
  if ('male' in normalRange && 'female' in normalRange) {
    range = gender === 'Male' ? normalRange.male : normalRange.female;
  } else {
    range = normalRange as NormalRange;
  }

  // Check critical values first
  if (criticalLow !== undefined && value < criticalLow) return 'Critical';
  if (criticalHigh !== undefined && value > criticalHigh) return 'Critical';

  // Check normal range
  if (value < range.min) return 'Low';
  if (value > range.max) return 'High';
  return 'Normal';
}

/**
 * Check if value is in critical range
 */
export function isCritical(
  value: number,
  criticalLow?: number,
  criticalHigh?: number
): boolean {
  if (criticalLow !== undefined && value < criticalLow) return true;
  if (criticalHigh !== undefined && value > criticalHigh) return true;
  return false;
}

/**
 * Calculate TAT (Turnaround Time)
 */
export function calculateTAT(collectionTime: string, completionTime?: string): string {
  const collection = new Date(collectionTime);
  const completion = completionTime ? new Date(completionTime) : new Date();
  
  const diffMs = completion.getTime() - collection.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate TAT remaining in minutes
 */
export function calculateTATRemaining(
  collectionTime: string,
  expectedTATHours: number
): number {
  const collection = new Date(collectionTime);
  const now = new Date();
  const elapsedMs = now.getTime() - collection.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const expectedMinutes = expectedTATHours * 60;
  return expectedMinutes - elapsedMinutes;
}

/**
 * Format TAT remaining as string
 */
export function formatTATRemaining(minutes: number): string {
  if (minutes < 0) {
    const overdue = Math.abs(minutes);
    const hours = Math.floor(overdue / 60);
    const mins = overdue % 60;
    if (hours === 0) return `${mins}m overdue`;
    return `${hours}h ${mins}m overdue`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format parameter value with proper decimal places
 */
export function formatParameterValue(value: number, decimalPlaces: number): string {
  return value.toFixed(decimalPlaces);
}

/**
 * Format normal range as string
 */
export function formatNormalRange(
  normalRange: NormalRange | GenderSpecificRange,
  gender?: 'Male' | 'Female' | 'Other'
): string {
  if ('male' in normalRange && 'female' in normalRange) {
    const range = gender === 'Male' ? normalRange.male : normalRange.female;
    return `${range.min}-${range.max}`;
  }
  const range = normalRange as NormalRange;
  return `${range.min}-${range.max}`;
}

/**
 * Validate parameter value
 */
export function validateParameterValue(
  value: number,
  parameter: TestParameter
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check if value is a valid number
  if (isNaN(value)) {
    errors.push({
      field: parameter.name,
      message: 'Invalid numeric value',
    });
    return { isValid: false, errors };
  }
  
  // Check for reasonable ranges (sanity check)
  const range = 'male' in parameter.normalRange 
    ? parameter.normalRange.male 
    : parameter.normalRange as NormalRange;
  
  // Value should not be negative for most parameters
  if (value < 0) {
    errors.push({
      field: parameter.name,
      message: 'Value cannot be negative',
    });
  }
  
  // Value should not be extremely high (likely data entry error)
  const maxReasonable = range.max * 10;
  if (value > maxReasonable) {
    errors.push({
      field: parameter.name,
      message: `Value seems unusually high. Please verify.`,
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Auto-calculate derived parameters
 */
export function autoCalculate(
  formula: string,
  values: Record<string, number>
): number | null {
  try {
    // LFT calculations
    if (formula === 'bilirubinTotal - bilirubinDirect') {
      return values.bilirubinTotal - values.bilirubinDirect;
    }
    if (formula === 'totalProtein - albumin') {
      return values.totalProtein - values.albumin;
    }
    if (formula === 'albumin / globulin') {
      return values.globulin !== 0 ? values.albumin / values.globulin : 0;
    }
    
    // Lipid Profile calculations
    if (formula === 'totalCholesterol - (hdl + triglycerides/5)') {
      return values.totalCholesterol - (values.hdl + values.triglycerides / 5);
    }
    if (formula === 'triglycerides / 5') {
      return values.triglycerides / 5;
    }
    if (formula === 'totalCholesterol / hdl') {
      return values.hdl !== 0 ? values.totalCholesterol / values.hdl : 0;
    }
    
    // eGFR calculation (simplified CKD-EPI formula)
    if (formula === 'eGFR') {
      const creatinine = values.serumCreatinine;
      const age = values.age || 40;
      const isFemale = values.gender === 1; // 1 for female, 0 for male
      
      let egfr = 141;
      egfr *= Math.pow(Math.min(creatinine / (isFemale ? 0.7 : 0.9), 1), isFemale ? -0.329 : -0.411);
      egfr *= Math.pow(Math.max(creatinine / (isFemale ? 0.7 : 0.9), 1), -1.209);
      egfr *= Math.pow(0.993, age);
      if (isFemale) egfr *= 1.018;
      
      return egfr;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate clinical interpretation
 */
export function generateInterpretation(parameterValues: ParameterValue[]): string {
  const interpretations: string[] = [];
  
  // Anemia detection
  const hb = parameterValues.find(p => p.parameterName === 'Hemoglobin');
  const rbc = parameterValues.find(p => p.parameterName === 'RBC Count');
  if (hb && hb.flag === 'Low' && rbc && rbc.flag === 'Low') {
    interpretations.push('Anemia detected - Low Hemoglobin and RBC count');
  }
  
  // Infection/Inflammation
  const wbc = parameterValues.find(p => p.parameterName === 'WBC Count');
  if (wbc && wbc.flag === 'High') {
    interpretations.push('Elevated WBC count - Possible infection or inflammation');
  }
  
  // Thrombocytopenia
  const platelets = parameterValues.find(p => p.parameterName === 'Platelet Count');
  if (platelets && platelets.flag === 'Low') {
    interpretations.push('Low platelet count - Risk of bleeding');
  }
  
  // Diabetes indicators
  const glucose = parameterValues.find(p => p.parameterName === 'Glucose');
  if (glucose && glucose.flag === 'High') {
    interpretations.push('Elevated blood glucose - Diabetes workup recommended');
  }
  
  const hba1c = parameterValues.find(p => p.parameterName === 'HbA1c');
  if (hba1c && typeof hba1c.value === 'number') {
    if (hba1c.value >= 6.5) {
      interpretations.push('HbA1c indicates Diabetes');
    } else if (hba1c.value >= 5.7) {
      interpretations.push('HbA1c indicates Prediabetes');
    }
  }
  
  // Kidney function
  const creatinine = parameterValues.find(p => p.parameterName === 'Serum Creatinine');
  if (creatinine && creatinine.flag === 'High') {
    interpretations.push('Elevated creatinine - Kidney function impairment');
  }
  
  // Liver function
  const sgot = parameterValues.find(p => p.parameterName === 'SGOT');
  const sgpt = parameterValues.find(p => p.parameterName === 'SGPT');
  if (sgot && sgot.flag === 'High' && sgpt && sgpt.flag === 'High') {
    interpretations.push('Elevated liver enzymes - Hepatocellular injury');
  }
  
  // Dyslipidemia
  const cholesterol = parameterValues.find(p => p.parameterName === 'Total Cholesterol');
  const ldl = parameterValues.find(p => p.parameterName === 'LDL');
  if (cholesterol && cholesterol.flag === 'High' || ldl && ldl.flag === 'High') {
    interpretations.push('Elevated cholesterol - Cardiovascular risk');
  }
  
  // Thyroid
  const tsh = parameterValues.find(p => p.parameterName === 'TSH');
  if (tsh && typeof tsh.value === 'number') {
    if (tsh.value < 0.4) {
      interpretations.push('Low TSH - Possible Hyperthyroidism');
    } else if (tsh.value > 4.0) {
      interpretations.push('Elevated TSH - Possible Hypothyroidism');
    }
  }
  
  if (interpretations.length === 0) {
    return 'All parameters within normal limits';
  }
  
  return interpretations.join('. ');
}

/**
 * Send critical value alert (mock implementation)
 */
export async function sendCriticalAlert(
  notification: CriticalValueNotification
): Promise<void> {
  // Mock implementation - in production, this would integrate with SMS/Email service
  console.log('Critical Alert:', notification);
  
  // Simulate SMS sending
  if (notification.notificationMethod.includes('SMS')) {
    console.log(`SMS Alert sent: Critical value detected for ${notification.parameterName}`);
  }
  
  // Simulate email
  if (notification.notificationMethod.includes('Email')) {
    console.log(`Email Alert sent: Critical value detected for ${notification.parameterName}`);
  }
  
  return Promise.resolve();
}

/**
 * Parse machine data from CSV
 */
export function parseMachineData(fileContent: string, machineType: string): Record<string, number> {
  const values: Record<string, number> = {};
  
  try {
    const lines = fileContent.split('\n');
    
    // Simple CSV parsing (parameter,value format)
    lines.forEach(line => {
      const [param, value] = line.split(',').map(s => s.trim());
      if (param && value && !isNaN(Number(value))) {
        values[param] = Number(value);
      }
    });
    
    return values;
  } catch (error) {
    console.error('Error parsing machine data:', error);
    return {};
  }
}

/**
 * Delta check - compare with previous results
 */
export function deltaCheck(
  parameterName: string,
  currentValue: number,
  previousResult?: TestResult
): DeltaCheckResult | null {
  if (!previousResult) return null;
  
  const previousParam = previousResult.parameterValues.find(
    p => p.parameterName === parameterName
  );
  
  if (!previousParam || typeof previousParam.value !== 'number') return null;
  
  const previousValue = previousParam.value;
  const change = currentValue - previousValue;
  const percentageChange = (change / previousValue) * 100;
  
  // Significant change thresholds (can be customized per parameter)
  const isSignificant = Math.abs(percentageChange) > 50;
  
  return {
    parameter: parameterName,
    currentValue,
    previousValue,
    change,
    percentageChange,
    isSignificant,
    warningMessage: isSignificant
      ? `Significant change detected: ${percentageChange.toFixed(1)}% change from previous result`
      : undefined,
  };
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for display
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time
 */
export function formatDateTime(datetime: string): string {
  return `${formatDate(datetime)} ${formatTime(datetime)}`;
}

/**
 * Check if TAT is exceeded
 */
export function isTATExceeded(collectionTime: string, expectedTATHours: number): boolean {
  const remaining = calculateTATRemaining(collectionTime, expectedTATHours);
  return remaining < 0;
}

/**
 * Get color for TAT status
 */
export function getTATColor(minutes: number): string {
  if (minutes < 0) return '#F44336'; // Red - exceeded
  if (minutes < 60) return '#FF9800'; // Orange - less than 1 hour
  return '#4CAF50'; // Green - within limit
}

/**
 * Export results to CSV (mock)
 */
export function exportResults(results: TestResult[]): void {
  // Mock implementation
  console.log('Exporting results:', results.length);
  
  const csv = [
    'Sample ID,Patient,Test,Result,Status,TAT',
    ...results.map(r => 
      `${r.sample.sampleID},${r.patient.name},${r.test.testName},Completed,${r.status},${r.completedAt ? calculateTAT(r.sample.collectionTime, r.completedAt) : '-'}`
    )
  ].join('\n');
  
  console.log('CSV Content:', csv);
}

/**
 * Get HbA1c interpretation
 */
export function getHbA1cInterpretation(value: number): string {
  if (value < 5.7) return 'Normal';
  if (value < 6.5) return 'Prediabetes';
  return 'Diabetes';
}

/**
 * Get cholesterol classification
 */
export function getCholesterolClassification(value: number): string {
  if (value < 200) return 'Desirable';
  if (value < 240) return 'Borderline High';
  return 'High';
}

/**
 * Get CKD stage from eGFR
 */
export function getCKDStage(egfr: number): string {
  if (egfr >= 90) return 'Normal (Stage 1)';
  if (egfr >= 60) return 'Mild CKD (Stage 2)';
  if (egfr >= 45) return 'Moderate CKD (Stage 3a)';
  if (egfr >= 30) return 'Moderate CKD (Stage 3b)';
  if (egfr >= 15) return 'Severe CKD (Stage 4)';
  return 'Kidney Failure (Stage 5)';
}

/**
 * Calculate trend from multiple results
 */
export function calculateTrend(
  parameterName: string,
  currentValue: number,
  previousResults: TestResult[]
): 'up' | 'down' | 'stable' {
  if (previousResults.length === 0) return 'stable';
  
  const previousParam = previousResults[0].parameterValues.find(
    p => p.parameterName === parameterName
  );
  
  if (!previousParam || typeof previousParam.value !== 'number') return 'stable';
  
  const previousValue = previousParam.value;
  const change = ((currentValue - previousValue) / previousValue) * 100;
  
  if (Math.abs(change) < 5) return 'stable';
  return change > 0 ? 'up' : 'down';
}

/**
 * Validate all parameters are filled
 */
export function checkCompleteness(
  parameterValues: Record<string, number | string>,
  requiredParameters: string[]
): boolean {
  return requiredParameters.every(param => {
    const value = parameterValues[param];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Generate sample ID barcode data
 */
export function generateBarcodeData(sampleID: string): string {
  return sampleID;
}

/**
 * Print worksheet (mock)
 */
export function printWorksheet(testResult: TestResult): void {
  console.log('Printing worksheet for:', testResult.sample.sampleID);
}
