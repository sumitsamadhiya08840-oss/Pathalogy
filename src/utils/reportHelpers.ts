// Report Generation Helper Functions

import { Parameter, ReportData, ValidationResult, TestResult } from '@/types/report';

/**
 * Generate a unique report ID in format: RPT-YYYYMMDD-XXXX
 */
export const generateReportID = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `RPT-${year}${month}${day}-${random}`;
};

/**
 * Generate auto-interpretation based on test results using rule-based logic
 */
export const generateAutoInterpretation = (parameters: Parameter[]): string => {
  const interpretations: string[] = [];
  const abnormalParams: { name: string; flag: string; result: string | number }[] = [];

  // Analyze each parameter
  parameters.forEach((param) => {
    if (param.flag) {
      abnormalParams.push({
        name: param.name,
        flag: param.flag,
        result: param.result,
      });
    }
  });

  if (abnormalParams.length === 0) {
    return 'All parameters are within normal limits. No significant abnormality detected.';
  }

  // Generate interpretation for abnormal values
  interpretations.push(
    `${abnormalParams.length} parameter(s) found outside normal range:\n`
  );

  abnormalParams.forEach((param) => {
    const direction =
      param.flag === 'H' || param.flag === 'HH'
        ? 'elevated'
        : 'reduced';
    const severity =
      param.flag === 'HH' || param.flag === 'LL'
        ? 'significantly'
        : 'mildly';

    interpretations.push(
      `• ${param.name}: ${param.result} - ${severity} ${direction}`
    );
  });

  interpretations.push(
    '\nClinical correlation is recommended. Follow-up testing may be advised based on clinical context.'
  );

  // Add specific interpretations based on parameter names
  const hasHighWBC = abnormalParams.some(
    (p) =>
      p.name.toLowerCase().includes('wbc') &&
      (p.flag === 'H' || p.flag === 'HH')
  );
  const hasLowHemoglobin = abnormalParams.some(
    (p) =>
      p.name.toLowerCase().includes('hemoglobin') &&
      (p.flag === 'L' || p.flag === 'LL')
  );

  if (hasHighWBC) {
    interpretations.push(
      '\nNote: Elevated WBC count may suggest infection, inflammation, or other conditions. Differential count and clinical correlation advised.'
    );
  }

  if (hasLowHemoglobin) {
    interpretations.push(
      '\nNote: Low hemoglobin indicates anemia. Further investigation including iron studies, vitamin B12, and folate levels may be recommended.'
    );
  }

  return interpretations.join('\n');
};

/**
 * Validate report data before publication
 */
export const validateReport = (report: ReportData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check mandatory fields
  if (!report.reportId || report.reportId.trim() === '') {
    errors.push('Report ID is required');
  }

  if (!report.pathologist) {
    errors.push('Pathologist must be selected');
  }

  if (report.signatureType === 'digital' && !report.signatureData) {
    errors.push('Digital signature is required when signature type is set to digital');
  }

  if (report.signatureType === 'drawn' && !report.signatureData) {
    errors.push('Signature must be drawn when signature type is set to drawn');
  }

  if (!report.certificationAccepted) {
    errors.push('Pathologist certification must be accepted');
  }

  // Check critical values
  const hasCriticalValues = report.testResult.parameters.some(
    (p) => p.isCritical || p.flag === 'HH' || p.flag === 'LL'
  );

  if (hasCriticalValues) {
    if (!report.criticalComments || report.criticalComments.trim() === '') {
      errors.push('Critical value comments are mandatory when critical values are present');
    }
    if (!report.interpretation || report.interpretation.trim() === '') {
      warnings.push('Interpretation is recommended for critical value reports');
    }
  }

  // Check interpretation
  if (!report.interpretation || report.interpretation.trim() === '') {
    warnings.push('Report interpretation is recommended');
  }

  // Check delivery options
  const { notifyPatient, notifyDoctor } = report.deliveryOptions;
  if (!notifyPatient.sms && !notifyPatient.email && !notifyPatient.whatsapp) {
    warnings.push('No patient notification method selected');
  }

  if (notifyPatient.email && !report.testResult.email) {
    errors.push('Patient email is required for email notification');
  }

  if (notifyDoctor && !report.deliveryOptions.doctorEmail) {
    errors.push('Doctor email is required for doctor notification');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Format report data for PDF generation
 */
export const formatReportData = (report: ReportData): any => {
  const { testResult, pathologist, interpretation, settings } = report;

  return {
    header: {
      labName: 'NXA PATHOLOGY LAB',
      address: '123 Medical Street, City, State - 400001',
      phone: '+91-1234567890',
      email: 'lab@nxapath.com',
      website: 'www.nxapath.com',
      nablReg: 'NABL Reg: NAB-123456',
      license: 'License: LAB/2024/0001',
    },
    reportInfo: {
      reportId: report.reportId,
      reportDate: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    },
    patientInfo: {
      name: testResult.patientName,
      patientId: testResult.patientId,
      age: testResult.age,
      gender: testResult.gender,
      mobile: testResult.mobile,
      email: testResult.email || 'N/A',
      sampleId: testResult.sampleId,
      tokenNumber: testResult.tokenNumber,
      referredBy: testResult.referredBy || 'Self',
      collectionDate: new Date(testResult.collectionDate).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    testInfo: {
      testName: testResult.testName,
      department: testResult.department,
      sampleType: testResult.sampleType,
      fastingStatus: testResult.fastingStatus,
    },
    results: testResult.parameters,
    interpretation: interpretation || 'No specific comments',
    criticalValues: testResult.parameters.filter((p) => p.isCritical || p.flag === 'HH' || p.flag === 'LL'),
    pathologist: pathologist
      ? {
          name: pathologist.name,
          qualification: pathologist.qualification,
          registrationNumber: pathologist.registrationNumber,
          signature: report.signatureData,
        }
      : null,
    settings: settings,
    footer: {
      testedBy: 'Lab Technician',
      testedDate: new Date(testResult.testCompletedTime).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      disclaimer: report.signatureType === 'none'
        ? 'This is a computer-generated report. Signature not required.'
        : '',
    },
  };
};

/**
 * Calculate TAT status with color coding
 */
export const calculateTATStatus = (deadline: Date): {
  status: string;
  color: 'success' | 'warning' | 'error';
  overdue: boolean;
  hoursRemaining: number;
} => {
  const now = new Date();
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = now.getTime();
  const timeDiff = deadlineTime - currentTime;
  const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (timeDiff < 0) {
    const hoursOverdue = Math.abs(hoursRemaining);
    return {
      status: `Overdue by ${hoursOverdue}h`,
      color: 'error',
      overdue: true,
      hoursRemaining: hoursRemaining,
    };
  } else if (hoursRemaining < 2) {
    return {
      status: `${hoursRemaining}h ${minutesRemaining}m left`,
      color: 'error',
      overdue: false,
      hoursRemaining: hoursRemaining,
    };
  } else if (hoursRemaining < 6) {
    return {
      status: `${hoursRemaining}h ${minutesRemaining}m left`,
      color: 'warning',
      overdue: false,
      hoursRemaining: hoursRemaining,
    };
  } else {
    return {
      status: `${hoursRemaining}h ${minutesRemaining}m left`,
      color: 'success',
      overdue: false,
      hoursRemaining: hoursRemaining,
    };
  }
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority: string): 'error' | 'warning' | 'default' => {
  switch (priority) {
    case 'Critical':
      return 'error';
    case 'Urgent':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Get priority icon
 */
export const getPriorityIcon = (priority: string): string => {
  switch (priority) {
    case 'Critical':
      return '🔴';
    case 'Urgent':
      return '🟠';
    default:
      return '⚪';
  }
};
