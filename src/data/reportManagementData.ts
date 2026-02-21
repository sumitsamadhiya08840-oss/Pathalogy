import { Report } from '@/types/reportManagement';

// Helper function to generate dates in the last 30 days
const getRandomDate = (daysAgo: number) => {
  const date = new Date('2026-02-05');
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
};

// Helper to generate future date for access
const getAccessDate = (publishedDate: Date, hoursAfter: number) => {
  const date = new Date(publishedDate);
  date.setHours(date.getHours() + hoursAfter);
  return date;
};

export const reportManagementData: Report[] = [
  {
    id: '1',
    reportId: 'RPT-20260204-0001',
    sampleId: 'SMP-20260204-0001',
    token: 'TOK-20260204-0001',
    patientName: 'Rajesh Kumar',
    patientId: 'PAT-000123',
    age: 45,
    gender: 'Male',
    mobile: '9876543210',
    email: 'rajesh.kumar@email.com',
    testName: 'Complete Blood Count',
    testCode: 'CBC001',
    department: 'Hematology',
    category: 'Hematology',
    referredByDoctor: 'Dr. Sharma',
    publishedAt: new Date('2026-02-04T14:30:00'),
    publishedBy: 'Dr. Anjali Mehta',
    pathologist: 'Dr. Anjali Mehta',
    pathologistQualification: 'MBBS, MD (Pathology)',
    status: 'Published',
    hasCriticalValues: true,
    criticalValues: [
      {
        parameter: 'WBC Count',
        value: 12500,
        unit: 'cells/µL',
        normalRange: '4,000-11,000',
        criticalThreshold: '> 11,000',
        notifiedAt: new Date('2026-02-04T14:31:00'),
        notifiedTo: 'Dr. Sharma'
      }
    ],
    criticalAcknowledged: true,
    pdfUrl: '/reports/RPT-20260204-0001.pdf',
    pdfSize: 245000,
    deliveryStatus: {
      sms: 'Delivered',
      email: 'Opened',
      whatsapp: 'Sent',
      smsSentAt: new Date('2026-02-04T14:31:00'),
      smsDeliveredAt: new Date('2026-02-04T14:31:30'),
      emailSentAt: new Date('2026-02-04T14:31:00'),
      emailDeliveredAt: new Date('2026-02-04T14:31:15'),
      emailOpenedAt: new Date('2026-02-04T14:45:00'),
      emailOpenCount: 3,
      whatsappSentAt: new Date('2026-02-04T14:35:00')
    },
    downloadCount: 3,
    printCount: 1,
    viewCount: 5,
    version: 1,
    isRevision: false,
    hasAddendum: false,
    accessHistory: [
      {
        accessedAt: new Date('2026-02-04T14:45:00'),
        accessedBy: 'Patient',
        accessedByName: 'Rajesh Kumar',
        ipAddress: '192.168.1.100',
        device: 'Mobile App',
        action: 'Downloaded'
      },
      {
        accessedAt: new Date('2026-02-04T15:00:00'),
        accessedBy: 'Doctor',
        accessedByName: 'Dr. Sharma',
        ipAddress: '103.15.201.45',
        device: 'Web Browser',
        action: 'Viewed'
      },
      {
        accessedAt: new Date('2026-02-04T15:15:00'),
        accessedBy: 'Patient',
        accessedByName: 'Rajesh Kumar',
        ipAddress: '192.168.1.100',
        device: 'Web Browser',
        action: 'Printed'
      }
    ],
    auditLog: [
      {
        timestamp: new Date('2026-02-04T14:30:00'),
        user: 'Dr. Anjali Mehta',
        userRole: 'Pathologist',
        action: 'Report Published',
        details: 'Report generated and published',
        ipAddress: '192.168.10.5'
      },
      {
        timestamp: new Date('2026-02-04T14:31:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'SMS Sent',
        details: 'SMS sent to 9876543210 - Status: Delivered'
      },
      {
        timestamp: new Date('2026-02-04T14:31:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'Email Sent',
        details: 'Email sent to rajesh.kumar@email.com - Status: Delivered'
      },
      {
        timestamp: new Date('2026-02-04T14:45:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'Email Opened',
        details: 'Email opened by patient@email.com'
      },
      {
        timestamp: new Date('2026-02-04T14:45:00'),
        user: 'Rajesh Kumar',
        userRole: 'Patient',
        action: 'Report Downloaded',
        details: 'PDF downloaded',
        ipAddress: '192.168.1.100'
      }
    ],
    isReviewed: true,
    reviewedBy: 'Lab Manager',
    reviewedAt: new Date('2026-02-04T16:00:00')
  },
  {
    id: '2',
    reportId: 'RPT-20260204-0002',
    sampleId: 'SMP-20260204-0002',
    token: 'TOK-20260204-0002',
    patientName: 'Priya Sharma',
    patientId: 'PAT-000124',
    age: 32,
    gender: 'Female',
    mobile: '9876543211',
    email: 'priya.sharma@email.com',
    testName: 'Blood Sugar - Fasting',
    testCode: 'BS001',
    department: 'Biochemistry',
    category: 'Diabetes',
    referredByDoctor: 'Dr. Patel',
    publishedAt: new Date('2026-02-04T10:15:00'),
    publishedBy: 'Dr. Rajesh Gupta',
    pathologist: 'Dr. Rajesh Gupta',
    pathologistQualification: 'MBBS, MD (Biochemistry)',
    status: 'Published',
    hasCriticalValues: false,
    pdfUrl: '/reports/RPT-20260204-0002.pdf',
    pdfSize: 198000,
    deliveryStatus: {
      sms: 'Delivered',
      email: 'Delivered',
      whatsapp: 'Delivered',
      smsSentAt: new Date('2026-02-04T10:16:00'),
      smsDeliveredAt: new Date('2026-02-04T10:16:15'),
      emailSentAt: new Date('2026-02-04T10:16:00'),
      emailDeliveredAt: new Date('2026-02-04T10:16:20'),
      emailOpenCount: 0,
      whatsappSentAt: new Date('2026-02-04T10:18:00')
    },
    downloadCount: 0,
    printCount: 0,
    viewCount: 0,
    version: 1,
    isRevision: false,
    hasAddendum: false,
    accessHistory: [],
    auditLog: [
      {
        timestamp: new Date('2026-02-04T10:15:00'),
        user: 'Dr. Rajesh Gupta',
        userRole: 'Pathologist',
        action: 'Report Published',
        details: 'Report generated and published',
        ipAddress: '192.168.10.8'
      },
      {
        timestamp: new Date('2026-02-04T10:16:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'SMS Sent',
        details: 'SMS sent to 9876543211 - Status: Delivered'
      },
      {
        timestamp: new Date('2026-02-04T10:16:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'Email Sent',
        details: 'Email sent to priya.sharma@email.com - Status: Delivered'
      }
    ],
    isReviewed: false
  },
  {
    id: '3',
    reportId: 'RPT-20260203-0001',
    sampleId: 'SMP-20260203-0001',
    token: 'TOK-20260203-0001',
    patientName: 'Amit Verma',
    patientId: 'PAT-000125',
    age: 58,
    gender: 'Male',
    mobile: '9876543212',
    email: 'amit.verma@email.com',
    testName: 'Lipid Profile',
    testCode: 'LP001',
    department: 'Biochemistry',
    category: 'Cardiology',
    referredByDoctor: 'Dr. Gupta',
    publishedAt: new Date('2026-02-03T16:45:00'),
    publishedBy: 'Dr. Priya Sharma',
    pathologist: 'Dr. Priya Sharma',
    pathologistQualification: 'MBBS, MD (Pathology)',
    status: 'Published',
    hasCriticalValues: true,
    criticalValues: [
      {
        parameter: 'LDL Cholesterol',
        value: 185,
        unit: 'mg/dL',
        normalRange: '< 100',
        criticalThreshold: '> 160',
        notifiedAt: new Date('2026-02-03T16:46:00'),
        notifiedTo: 'Dr. Gupta'
      }
    ],
    criticalAcknowledged: true,
    pdfUrl: '/reports/RPT-20260203-0001.pdf',
    pdfSize: 234000,
    deliveryStatus: {
      sms: 'Delivered',
      email: 'Opened',
      whatsapp: 'Delivered',
      smsSentAt: new Date('2026-02-03T16:46:00'),
      smsDeliveredAt: new Date('2026-02-03T16:46:20'),
      emailSentAt: new Date('2026-02-03T16:46:00'),
      emailDeliveredAt: new Date('2026-02-03T16:46:25'),
      emailOpenedAt: new Date('2026-02-03T17:30:00'),
      emailOpenCount: 5,
      whatsappSentAt: new Date('2026-02-03T16:48:00')
    },
    downloadCount: 4,
    printCount: 2,
    viewCount: 8,
    version: 1,
    isRevision: false,
    hasAddendum: false,
    accessHistory: [
      {
        accessedAt: new Date('2026-02-03T17:30:00'),
        accessedBy: 'Patient',
        accessedByName: 'Amit Verma',
        ipAddress: '192.168.1.105',
        device: 'Desktop',
        action: 'Viewed'
      },
      {
        accessedAt: new Date('2026-02-03T17:35:00'),
        accessedBy: 'Patient',
        accessedByName: 'Amit Verma',
        ipAddress: '192.168.1.105',
        device: 'Desktop',
        action: 'Downloaded'
      },
      {
        accessedAt: new Date('2026-02-03T18:00:00'),
        accessedBy: 'Doctor',
        accessedByName: 'Dr. Gupta',
        ipAddress: '103.15.202.50',
        device: 'Web Browser',
        action: 'Viewed'
      }
    ],
    auditLog: [
      {
        timestamp: new Date('2026-02-03T16:45:00'),
        user: 'Dr. Priya Sharma',
        userRole: 'Pathologist',
        action: 'Report Published',
        details: 'Report generated and published with critical values',
        ipAddress: '192.168.10.12'
      },
      {
        timestamp: new Date('2026-02-03T16:46:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'Critical Value Alert',
        details: 'Critical value notification sent to Dr. Gupta'
      },
      {
        timestamp: new Date('2026-02-03T16:46:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'SMS Sent',
        details: 'SMS sent to 9876543212 - Status: Delivered'
      }
    ],
    isReviewed: true,
    reviewedBy: 'Dr. Rajesh Gupta',
    reviewedAt: new Date('2026-02-03T17:00:00')
  },
  {
    id: '4',
    reportId: 'RPT-20260205-0001',
    sampleId: 'SMP-20260205-0001',
    token: 'TOK-20260205-0001',
    patientName: 'Sneha Patel',
    patientId: 'PAT-000126',
    age: 28,
    gender: 'Female',
    mobile: '9876543213',
    email: 'sneha.patel@email.com',
    testName: 'Thyroid Profile',
    testCode: 'TH001',
    department: 'Biochemistry',
    category: 'Endocrinology',
    publishedAt: new Date('2026-02-05T09:20:00'),
    publishedBy: 'Dr. Anjali Mehta',
    pathologist: 'Dr. Anjali Mehta',
    pathologistQualification: 'MBBS, MD (Pathology)',
    status: 'Published',
    hasCriticalValues: false,
    pdfUrl: '/reports/RPT-20260205-0001.pdf',
    pdfSize: 210000,
    deliveryStatus: {
      sms: 'Delivered',
      email: 'Opened',
      whatsapp: 'Sent',
      smsSentAt: new Date('2026-02-05T09:21:00'),
      smsDeliveredAt: new Date('2026-02-05T09:21:15'),
      emailSentAt: new Date('2026-02-05T09:21:00'),
      emailDeliveredAt: new Date('2026-02-05T09:21:20'),
      emailOpenedAt: new Date('2026-02-05T09:45:00'),
      emailOpenCount: 2,
      whatsappSentAt: new Date('2026-02-05T09:23:00')
    },
    downloadCount: 2,
    printCount: 0,
    viewCount: 3,
    version: 1,
    isRevision: false,
    hasAddendum: false,
    accessHistory: [
      {
        accessedAt: new Date('2026-02-05T09:45:00'),
        accessedBy: 'Patient',
        accessedByName: 'Sneha Patel',
        ipAddress: '192.168.1.110',
        device: 'Mobile App',
        action: 'Viewed'
      },
      {
        accessedAt: new Date('2026-02-05T09:50:00'),
        accessedBy: 'Patient',
        accessedByName: 'Sneha Patel',
        ipAddress: '192.168.1.110',
        device: 'Mobile App',
        action: 'Downloaded'
      }
    ],
    auditLog: [
      {
        timestamp: new Date('2026-02-05T09:20:00'),
        user: 'Dr. Anjali Mehta',
        userRole: 'Pathologist',
        action: 'Report Published',
        details: 'Report generated and published',
        ipAddress: '192.168.10.5'
      },
      {
        timestamp: new Date('2026-02-05T09:21:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'Notifications Sent',
        details: 'SMS, Email, and WhatsApp notifications sent'
      }
    ],
    isReviewed: false
  },
  {
    id: '5',
    reportId: 'RPT-20260202-0001',
    sampleId: 'SMP-20260202-0001',
    token: 'TOK-20260202-0001',
    patientName: 'Vikram Singh',
    patientId: 'PAT-000127',
    age: 62,
    gender: 'Male',
    mobile: '9876543214',
    testName: 'Liver Function Test',
    testCode: 'LFT001',
    department: 'Biochemistry',
    category: 'Hepatology',
    referredByDoctor: 'Dr. Sharma',
    publishedAt: new Date('2026-02-02T14:00:00'),
    publishedBy: 'Dr. Rajesh Gupta',
    pathologist: 'Dr. Rajesh Gupta',
    pathologistQualification: 'MBBS, MD (Biochemistry)',
    status: 'Published',
    hasCriticalValues: false,
    pdfUrl: '/reports/RPT-20260202-0001.pdf',
    pdfSize: 256000,
    deliveryStatus: {
      sms: 'Failed',
      email: 'Failed',
      whatsapp: 'Pending',
      smsSentAt: new Date('2026-02-02T14:01:00'),
      smsFailureReason: 'Invalid number',
      emailSentAt: new Date('2026-02-02T14:01:00'),
      emailFailureReason: 'Bounce - Invalid email address'
    },
    downloadCount: 0,
    printCount: 1,
    viewCount: 1,
    version: 1,
    isRevision: false,
    hasAddendum: false,
    accessHistory: [
      {
        accessedAt: new Date('2026-02-02T15:30:00'),
        accessedBy: 'Lab Staff',
        accessedByName: 'Ramesh Kumar',
        ipAddress: '192.168.10.25',
        device: 'Desktop',
        action: 'Printed'
      }
    ],
    auditLog: [
      {
        timestamp: new Date('2026-02-02T14:00:00'),
        user: 'Dr. Rajesh Gupta',
        userRole: 'Pathologist',
        action: 'Report Published',
        details: 'Report generated and published',
        ipAddress: '192.168.10.8'
      },
      {
        timestamp: new Date('2026-02-02T14:01:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'SMS Failed',
        details: 'SMS delivery failed - Invalid number'
      },
      {
        timestamp: new Date('2026-02-02T14:01:00'),
        user: 'System',
        userRole: 'Automated',
        action: 'Email Failed',
        details: 'Email delivery failed - Bounce'
      }
    ],
    isReviewed: false
  }
];

// Generate additional 95+ reports with varied data
const testTypes = [
  { name: 'Complete Blood Count', code: 'CBC001', dept: 'Hematology', size: 245000 },
  { name: 'Blood Sugar - Fasting', code: 'BS001', dept: 'Biochemistry', size: 198000 },
  { name: 'Blood Sugar - PP', code: 'BS002', dept: 'Biochemistry', size: 202000 },
  { name: 'Lipid Profile', code: 'LP001', dept: 'Biochemistry', size: 234000 },
  { name: 'Liver Function Test', code: 'LFT001', dept: 'Biochemistry', size: 256000 },
  { name: 'Kidney Function Test', code: 'KFT001', dept: 'Biochemistry', size: 241000 },
  { name: 'Thyroid Profile', code: 'TH001', dept: 'Biochemistry', size: 210000 },
  { name: 'Urine Routine', code: 'UR001', dept: 'Clinical Pathology', size: 189000 },
  { name: 'HbA1c', code: 'HBA1C', dept: 'Biochemistry', size: 195000 },
  { name: 'Vitamin D', code: 'VITD', dept: 'Biochemistry', size: 201000 },
  { name: 'Vitamin B12', code: 'VITB12', dept: 'Biochemistry', size: 203000 },
  { name: 'Serum Creatinine', code: 'CREAT', dept: 'Biochemistry', size: 192000 },
  { name: 'Electrolytes', code: 'ELEC', dept: 'Biochemistry', size: 215000 },
  { name: 'ESR', code: 'ESR001', dept: 'Hematology', size: 178000 },
  { name: 'Blood Group', code: 'BG001', dept: 'Serology', size: 165000 }
];

const doctors = ['Dr. Sharma', 'Dr. Patel', 'Dr. Gupta', undefined];
const pathologists = [
  { name: 'Dr. Anjali Mehta', qual: 'MBBS, MD (Pathology)' },
  { name: 'Dr. Rajesh Gupta', qual: 'MBBS, MD (Biochemistry)' },
  { name: 'Dr. Priya Sharma', qual: 'MBBS, MD (Pathology)' }
];

const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Pooja', 'Arjun', 'Divya', 'Karan', 'Nisha', 'Sanjay', 'Megha', 'Rohan'];
const lastNames = ['Kumar', 'Sharma', 'Patel', 'Verma', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Joshi', 'Nair', 'Rao', 'Desai', 'Mehta', 'Shah', 'Pillai'];

for (let i = 6; i <= 120; i++) {
  const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
  const doctor = doctors[Math.floor(Math.random() * doctors.length)];
  const pathologist = pathologists[Math.floor(Math.random() * pathologists.length)];
  const publishedDate = getRandomDate(30);
  const hasCritical = Math.random() < 0.15; // 15% have critical values
  const deliveryFailed = Math.random() < 0.08; // 8% delivery failure
  const notDownloaded = Math.random() < 0.12; // 12% not downloaded
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const patientName = `${firstName} ${lastName}`;
  
  const reportIdDate = publishedDate.toISOString().split('T')[0].replace(/-/g, '').slice(2);
  const reportNum = String(i).padStart(4, '0');
  
  const downloadCount = notDownloaded ? 0 : Math.floor(Math.random() * 8) + 1;
  const viewCount = downloadCount > 0 ? downloadCount + Math.floor(Math.random() * 3) : 0;
  
  const smsStatus = deliveryFailed && Math.random() < 0.5 ? 'Failed' : 'Delivered';
  const emailStatus = deliveryFailed && Math.random() < 0.5 ? 'Failed' : (Math.random() < 0.7 ? 'Opened' : 'Delivered');
  
  reportManagementData.push({
    id: String(i),
    reportId: `RPT-${reportIdDate}-${reportNum}`,
    sampleId: `SMP-${reportIdDate}-${reportNum}`,
    token: `TOK-${reportIdDate}-${reportNum}`,
    patientName,
    patientId: `PAT-${String(i + 122).padStart(6, '0')}`,
    age: Math.floor(Math.random() * 70) + 10,
    gender,
    mobile: `98765${String(43210 + i).slice(-5)}`,
    email: Math.random() < 0.9 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : undefined,
    testName: testType.name,
    testCode: testType.code,
    department: testType.dept,
    category: testType.dept,
    referredByDoctor: doctor,
    publishedAt: publishedDate,
    publishedBy: pathologist.name,
    pathologist: pathologist.name,
    pathologistQualification: pathologist.qual,
    status: 'Published',
    hasCriticalValues: hasCritical,
    criticalValues: hasCritical ? [{
      parameter: 'Test Parameter',
      value: 150,
      unit: 'unit',
      normalRange: '80-120',
      criticalThreshold: '> 140',
      notifiedAt: getAccessDate(publishedDate, 0.02),
      notifiedTo: doctor || 'Patient'
    }] : undefined,
    criticalAcknowledged: hasCritical ? Math.random() < 0.8 : undefined,
    pdfUrl: `/reports/RPT-${reportIdDate}-${reportNum}.pdf`,
    pdfSize: testType.size + Math.floor(Math.random() * 50000),
    deliveryStatus: {
      sms: smsStatus,
      email: emailStatus,
      whatsapp: Math.random() < 0.85 ? 'Delivered' : 'Pending',
      smsSentAt: getAccessDate(publishedDate, 0.02),
      smsDeliveredAt: smsStatus === 'Delivered' ? getAccessDate(publishedDate, 0.025) : undefined,
      smsFailureReason: smsStatus === 'Failed' ? 'Network error' : undefined,
      emailSentAt: getAccessDate(publishedDate, 0.02),
      emailDeliveredAt: emailStatus !== 'Failed' ? getAccessDate(publishedDate, 0.03) : undefined,
      emailOpenedAt: emailStatus === 'Opened' ? getAccessDate(publishedDate, 0.5) : undefined,
      emailOpenCount: emailStatus === 'Opened' ? Math.floor(Math.random() * 5) + 1 : 0,
      emailFailureReason: emailStatus === 'Failed' ? 'Bounce - Invalid address' : undefined,
      whatsappSentAt: getAccessDate(publishedDate, 0.05)
    },
    downloadCount,
    printCount: Math.floor(Math.random() * 3),
    viewCount,
    version: 1,
    isRevision: false,
    hasAddendum: false,
    accessHistory: downloadCount > 0 ? [
      {
        accessedAt: getAccessDate(publishedDate, 1),
        accessedBy: 'Patient',
        accessedByName: patientName,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        device: Math.random() < 0.5 ? 'Mobile App' : 'Web Browser',
        action: 'Downloaded'
      }
    ] : [],
    auditLog: [
      {
        timestamp: publishedDate,
        user: pathologist.name,
        userRole: 'Pathologist',
        action: 'Report Published',
        details: 'Report generated and published',
        ipAddress: '192.168.10.5'
      },
      {
        timestamp: getAccessDate(publishedDate, 0.02),
        user: 'System',
        userRole: 'Automated',
        action: smsStatus === 'Failed' ? 'SMS Failed' : 'SMS Sent',
        details: `SMS ${smsStatus === 'Failed' ? 'failed' : 'sent'} to mobile`
      }
    ],
    isReviewed: Math.random() < 0.6,
    reviewedBy: Math.random() < 0.6 ? 'Lab Manager' : undefined,
    reviewedAt: Math.random() < 0.6 ? getAccessDate(publishedDate, 2) : undefined
  });
}

export default reportManagementData;
