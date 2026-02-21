import type { Patient, PatientFormData } from '@/types/patient';

/**
 * Generate unique patient ID (PAT-000001 format)
 */
export function generatePatientId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  const combined = (timestamp + random) % 1000000;
  return `PAT-${String(combined).padStart(6, '0')}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format patient name (title case)
 */
export function formatPatientName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get avatar initials from patient name
 */
export function getAvatarInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

/**
 * Format Aadhar number with masked display
 */
export function formatAadhar(aadhar: string): string {
  const cleaned = aadhar.replace(/\D/g, '');
  if (cleaned.length !== 12) return aadhar;
  return `XXXX-XXXX-${cleaned.slice(-4)}`;
}

/**
 * Generate token number (TOK-YYYYMMDD-XXXX)
 */
export function generateToken(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TOK-${dateStr}-${random}`;
}

/**
 * Generate sample ID
 */
export function generateSampleId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SAMPLE-${timestamp}${random}`;
}

/**
 * Export patients to Excel
 */
export function exportToExcel(patients: Patient[]): void {
  const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Mobile', 'Email', 'City', 'Registration Date', 'Total Visits', 'Status'];

  const rows = patients.map(p => [
    p.patientId,
    p.fullName,
    p.age,
    p.gender,
    p.mobileNumber,
    p.email || '',
    p.address.city,
    p.registrationDate,
    p.totalVisits,
    p.status,
  ]);

  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `patients_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print patient card
 */
export function printPatientCard(patient: Patient): void {
  const printContent = `
    <html>
      <head>
        <title>Patient Card - ${patient.fullName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .card { 
            border: 2px solid #1976d2; 
            padding: 20px; 
            max-width: 400px; 
            border-radius: 8px;
          }
          .header { 
            text-align: center; 
            font-weight: bold; 
            font-size: 16px; 
            margin-bottom: 20px;
          }
          .field { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0;
            border-bottom: 1px solid #ddd;
          }
          .label { font-weight: bold; }
          .qr { text-align: center; margin-top: 20px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">PATIENT REGISTRATION CARD</div>
          <div class="field">
            <span class="label">Patient ID:</span>
            <span>${patient.patientId}</span>
          </div>
          <div class="field">
            <span class="label">Name:</span>
            <span>${patient.fullName}</span>
          </div>
          <div class="field">
            <span class="label">Age/Gender:</span>
            <span>${patient.age}/${patient.gender}</span>
          </div>
          <div class="field">
            <span class="label">Mobile:</span>
            <span>${patient.mobileNumber}</span>
          </div>
          <div class="field">
            <span class="label">DOB:</span>
            <span>${patient.dateOfBirth}</span>
          </div>
          <div class="qr">
            <p>QR Code: [${patient.patientId}]</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '', 'height=500,width=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  }
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format date and time
 */
export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get status color
 */
export function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const colorMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    Active: 'success',
    Inactive: 'error',
    Paid: 'success',
    Pending: 'warning',
    Failed: 'error',
    Imported: 'success',
    Rejected: 'error',
  };

  return colorMap[status] || 'default';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Search patients by name (case-insensitive)
 */
export function searchPatientsByName(patients: Patient[], query: string): Patient[] {
  if (!query) return patients;
  const lowerQuery = query.toLowerCase();
  return patients.filter(
    p =>
      p.fullName.toLowerCase().includes(lowerQuery) ||
      p.patientId.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search patients by mobile
 */
export function searchPatientsByMobile(patients: Patient[], mobile: string): Patient[] {
  if (!mobile) return patients;
  const cleanedMobile = mobile.replace(/\D/g, '');
  return patients.filter(
    p =>
      p.mobileNumber.replace(/\D/g, '').includes(cleanedMobile) ||
      (p.alternateMobile && p.alternateMobile.replace(/\D/g, '').includes(cleanedMobile))
  );
}

/**
 * Search patients by token
 */
export function searchPatientsByToken(patients: Patient[], token: string): Patient[] {
  if (!token) return patients;
  return patients.filter(p =>
    p.visitHistory.some(v => v.token.toLowerCase().includes(token.toLowerCase()))
  );
}

/**
 * Search patients by Health ID
 */
export function searchPatientsByHealthId(patients: Patient[], healthId: string): Patient[] {
  if (!healthId) return patients;
  return patients.filter(p =>
    p.identification.healthId?.toLowerCase().includes(healthId.toLowerCase())
  );
}

/**
 * Filter patients by age range
 */
export function filterByAgeRange(patients: Patient[], ageFrom?: number, ageTo?: number): Patient[] {
  return patients.filter(p => {
    if (ageFrom && p.age < ageFrom) return false;
    if (ageTo && p.age > ageTo) return false;
    return true;
  });
}

/**
 * Filter patients by gender
 */
export function filterByGender(patients: Patient[], gender: string): Patient[] {
  if (!gender) return patients;
  return patients.filter(p => p.gender === gender);
}

/**
 * Filter patients by registration date range
 */
export function filterByRegistrationDate(patients: Patient[], from?: string, to?: string): Patient[] {
  return patients.filter(p => {
    const regDate = new Date(p.registrationDate);
    if (from && regDate < new Date(from)) return false;
    if (to && regDate > new Date(to)) return false;
    return true;
  });
}

/**
 * Filter patients by visit status
 */
export function filterByVisitStatus(patients: Patient[], status: string): Patient[] {
  if (!status) return patients;
  if (status === 'New') return patients.filter(p => p.totalVisits === 0);
  if (status === 'Returning') return patients.filter(p => p.totalVisits > 0);
  return patients;
}
