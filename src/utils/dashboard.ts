import type { Appointment, AppointmentStatusFilter } from '@/types/dashboard';

/**
 * Filter appointments based on search term and status
 */
export function filterAppointments(
  appointments: Appointment[],
  searchTerm: string,
  statusFilter: AppointmentStatusFilter
): Appointment[] {
  let filtered = appointments;

  // Filter by status
  if (statusFilter !== 'All') {
    filtered = filtered.filter(apt => apt.status === statusFilter);
  }

  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      apt =>
        apt.patientName.toLowerCase().includes(term) ||
        apt.token.toLowerCase().includes(term) ||
        apt.testName.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/**
 * Calculate dashboard statistics from appointments data
 */
export function calculateStats(appointments: Appointment[]): {
  todaysBookings: number;
  walkInPatients: number;
  pendingSamples: number;
  pendingReports: number;
} {
  const todaysBookings = appointments.filter(apt => apt.status !== 'Cancelled').length;
  const walkInPatients = appointments.filter(apt => apt.status === 'Booked').length;
  const pendingSamples = appointments.filter(apt => apt.status === 'Booked').length;
  const pendingReports = appointments.filter(apt => apt.status === 'Testing').length;

  return {
    todaysBookings,
    walkInPatients,
    pendingSamples,
    pendingReports,
  };
}

/**
 * Format currency amount in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Get color based on appointment status
 */
export function getStatusColor(
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    Booked: 'warning',
    Collected: 'info',
    Testing: 'default',
    Ready: 'success',
    Cancelled: 'error',
    Pending: 'default',
    Assigned: 'info',
  };

  return colorMap[status] || 'default';
}

/**
 * Validate Indian mobile number (10 digits)
 */
export function validateMobileNumber(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate token number
 */
export function generateToken(prefix: string = 'TOK'): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
