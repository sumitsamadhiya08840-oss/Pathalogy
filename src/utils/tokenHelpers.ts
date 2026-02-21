// Token & Sample Management Helper Functions

import type { Booking, Sample, TimelineEvent, SMSTemplate, TokenGenerationResponse, BookingTest, TokenStatus } from '@/types/token';

/**
 * Generate unique token number
 * Format: TOK-YYYYMMDD-XXXX
 */
export function generateTokenNumber(date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TOK-${dateStr}-${randomNum}`;
}

/**
 * Generate unique sample ID
 * Format: SMP-YYYYMMDD-XXXX
 */
export function generateSampleID(date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SMP-${dateStr}-${randomNum}`;
}

/**
 * Generate unique booking ID
 * Format: BKG-XXXXX
 */
export function generateBookingID(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BKG-${randomNum}`;
}

/**
 * Format token number for display
 */
export function formatTokenNumber(token: string): string {
  return token.toUpperCase();
}

/**
 * Calculate report ready time based on tests
 */
export function calculateReportTime(tests: BookingTest[]): Date {
  const now = new Date();
  
  if (tests.length === 0) return now;

  // Get maximum report time from all tests
  let maxHours = 0;
  tests.forEach(test => {
    const reportStr = test.reportTime || '24 Hours';
    const hours = parseInt(reportStr) || 24;
    maxHours = Math.max(maxHours, hours);
  });

  const reportTime = new Date(now.getTime() + maxHours * 60 * 60 * 1000);
  return reportTime;
}

/**
 * Format report time for display
 */
export function formatReportTime(reportTime: Date): string {
  const now = new Date();
  const diffMs = reportTime.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Less than 1 hour';
  if (diffHours === 1) return '1 hour';
  if (diffHours <= 24) return `${diffHours} hours`;
  
  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
}

/**
 * Get SMS text with template variables replaced
 */
export function getSMSText(template: SMSTemplate, data: Record<string, any>): string {
  let text = template.template;

  template.variables.forEach(variable => {
    const placeholder = `[${variable}]`;
    const value = data[variable] || '';
    text = text.replace(new RegExp(placeholder, 'g'), value);
  });

  return text;
}

/**
 * Generate default SMS template
 */
export function generateSMSTemplate(
  patientName: string,
  tokenNumber: string,
  tests: string,
  collectionType: string,
  dateTime: string,
  sampleID: string,
  reportTime: string
): string {
  return `Dear ${patientName}, your token ${tokenNumber} is generated for ${tests}. ${collectionType} at ${dateTime}. Sample ID: ${sampleID}. Report ready by ${reportTime}. -NXA Pathology Lab`;
}

/**
 * Send SMS (mock - ready for API integration)
 */
export async function sendSMS(mobile: string, text: string): Promise<boolean> {
  return new Promise(resolve => {
    // Mock SMS sending
    console.log(`📱 SMS sent to ${mobile}:\n${text}`);
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
}

/**
 * Log activity
 */
export function logActivity(
  tokenID: string,
  action: string,
  actionType: string,
  performedBy: string,
  details?: Record<string, any>
): void {
  console.log(`[${new Date().toISOString()}] Token: ${tokenID}, Action: ${action}, Type: ${actionType}, By: ${performedBy}`, details);
}

/**
 * Calculate time duration between two dates
 */
export function getTimeDuration(startDate: string | Date, endDate: string | Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

/**
 * Create timeline event
 */
export function createTimelineEvent(
  status: TokenStatus,
  description: string,
  updatedBy: string = 'System'
): TimelineEvent {
  return {
    id: `event_${Date.now()}`,
    status,
    timestamp: new Date().toISOString(),
    description,
    updatedBy,
    duration: '0 min',
  };
}

/**
 * Update token status and add timeline event
 */
export async function updateTokenStatus(
  booking: Booking,
  newStatus: TokenStatus,
  description: string,
  updatedBy: string = 'System'
): Promise<Booking> {
  const updatedBooking = { ...booking };
  updatedBooking.status = newStatus;
  updatedBooking.sample.status = newStatus;
  updatedBooking.updatedAt = new Date().toISOString();

  // Add timeline event
  const timelineEvent = createTimelineEvent(newStatus, description, updatedBy);
  updatedBooking.timeline.push(timelineEvent);

  // Log activity
  logActivity(booking.tokenNumber, `Status updated to ${newStatus}`, 'StatusChange', updatedBy, {
    previousStatus: booking.status,
    newStatus,
  });

  return updatedBooking;
}

/**
 * Format booking date and time
 */
export function formatBookingDateTime(date: string, time: string): string {
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${dateStr} at ${time}`;
}

/**
 * Format price
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate total tests count including package
 */
export function calculateTotalTests(selectedTests: BookingTest[], selectedPackage?: any): number {
  if (selectedPackage && selectedPackage.tests) {
    return selectedPackage.tests.length;
  }
  return selectedTests.length;
}

/**
 * Calculate total amount with discount
 */
export function calculateTotalAmount(baseAmount: number, discountPercent: number = 0): number {
  const discountAmount = (baseAmount * discountPercent) / 100;
  return Math.max(0, baseAmount - discountAmount);
}

/**
 * Get unique sample types from tests
 */
export function getUniqueSampleTypes(tests: BookingTest[]): string[] {
  const sampleTypes = new Set<string>();
  tests.forEach(test => {
    if (test.sampleType) {
      sampleTypes.add(test.sampleType);
    }
  });
  return Array.from(sampleTypes);
}

/**
 * Check if any test requires fasting
 */
export function requiresFasting(tests: BookingTest[]): boolean {
  return tests.some(test => test.fastingRequired);
}

/**
 * Get fasting hours
 */
export function getFastingHours(tests: BookingTest[]): number {
  // Standard fasting requirement is 8-12 hours for fasting tests
  return requiresFasting(tests) ? 8 : 0;
}

/**
 * Get collection instructions
 */
export function getCollectionInstructions(tests: BookingTest[]): string[] {
  const instructions: string[] = [];

  if (requiresFasting(tests)) {
    instructions.push('Fasting for 8 hours is required. Last meal should be before 10 PM.');
  }

  const hasBloodTest = tests.some(t => t.sampleType === 'Blood');
  if (hasBloodTest) {
    instructions.push('Wear loose fitting clothes for blood collection.');
  }

  const hasUrineTest = tests.some(t => t.sampleType === 'Urine');
  if (hasUrineTest) {
    instructions.push('Collect first morning urine in the provided container.');
  }

  return instructions;
}

/**
 * Format tests list for display
 */
export function formatTestsList(tests: BookingTest[]): string {
  return tests.map(t => t.testName).join(', ');
}

/**
 * Format tests list for SMS (max 50 chars)
 */
export function formatTestsForSMS(tests: BookingTest[]): string {
  const testNames = tests.map(t => t.testName).join(', ');
  if (testNames.length > 50) {
    return `${tests.length} tests`;
  }
  return testNames;
}

/**
 * Get time slot start time
 */
export function getTimeSlotStartTime(slot: string): string {
  const slotMap: Record<string, string> = {
    '6-9 AM': '06:00',
    '9-12 PM': '09:00',
    '12-3 PM': '12:00',
    '3-6 PM': '15:00',
  };
  return slotMap[slot] || '09:00';
}

/**
 * Get time slot end time
 */
export function getTimeSlotEndTime(slot: string): string {
  const slotMap: Record<string, string> = {
    '6-9 AM': '09:00',
    '9-12 PM': '12:00',
    '12-3 PM': '15:00',
    '3-6 PM': '18:00',
  };
  return slotMap[slot] || '17:00';
}

/**
 * Get appointment time suggestions for today
 */
export function getAvailableTimeSlots(): { slot: string; available: number; booked: number }[] {
  return [
    { slot: '6-9 AM', available: 15, booked: 8 },
    { slot: '9-12 PM', available: 20, booked: 15 },
    { slot: '12-3 PM', available: 10, booked: 5 },
    { slot: '3-6 PM', available: 18, booked: 9 },
  ];
}

/**
 * Check if appointment slot is full
 */
export function isSlotFull(slot: string, slots: any[]): boolean {
  const slotData = slots.find(s => s.slot === slot);
  if (!slotData) return false;
  return slotData.booked >= slotData.available;
}

/**
 * Generate print HTML
 */
export function generatePrintHTML(booking: Booking, qrCode: string, barcode: string): string {
  const instructions = getCollectionInstructions(booking.tests);
  const testsList = booking.tests.map(t => `<li>${t.testName} - ${formatPrice(t.price)}</li>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Token - ${booking.tokenNumber}</title>
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .logo { font-size: 24px; font-weight: bold; color: #1976D2; }
        .lab-name { font-size: 18px; margin: 5px 0; }
        .lab-contact { font-size: 12px; color: #666; }
        .token-section { text-align: center; margin: 30px 0; }
        .token-label { font-size: 14px; color: #666; margin-bottom: 10px; }
        .token-number { font-size: 48px; font-weight: bold; color: #1976D2; letter-spacing: 2px; margin: 20px 0; }
        .qr-barcode { display: flex; justify-content: space-around; align-items: center; margin: 30px 0; }
        .qr-barcode img { max-width: 150px; }
        .patient-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
        .info-label { font-weight: bold; }
        .tests-list { margin: 20px 0; }
        .tests-list ul { margin-left: 20px; }
        .tests-list li { margin: 5px 0; font-size: 14px; }
        .instructions { background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .instructions h4 { margin-bottom: 10px; }
        .instructions ul { margin-left: 20px; }
        .instructions li { margin: 5px 0; font-size: 13px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .amount { font-size: 18px; font-weight: bold; color: #4CAF50; text-align: right; margin: 20px 0; }
        @media print {
          body { padding: 0; }
          .container { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏥</div>
          <div class="lab-name">NXA PATHOLOGY LAB</div>
          <div class="lab-contact">
            Address: 123 Medical Street, City | Phone: 1234567890
          </div>
        </div>

        <div class="token-section">
          <div class="token-label">TOKEN NUMBER</div>
          <div class="token-number">${booking.tokenNumber}</div>
        </div>

        <div class="qr-barcode">
          <div>
            <div style="font-size: 12px; margin-bottom: 5px;">QR Code</div>
            <img src="${qrCode}" alt="QR Code">
          </div>
          <div>
            <div style="font-size: 12px; margin-bottom: 5px;">Sample ID: ${booking.sample.sampleID}</div>
            <img src="${barcode}" alt="Barcode" style="max-width: 200px;">
          </div>
        </div>

        <div class="patient-info">
          <div class="info-row">
            <span class="info-label">Patient Name:</span>
            <span>${booking.patientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Age/Gender:</span>
            <span>${booking.sample.sampleType || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Mobile:</span>
            <span>${booking.patientMobile}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Patient ID:</span>
            <span>${booking.patientID}</span>
          </div>
        </div>

        <div class="tests-list">
          <strong>Tests Ordered:</strong>
          <ul>
            ${testsList}
          </ul>
        </div>

        <div class="amount">
          Amount: ${formatPrice(booking.finalAmount)}
        </div>

        ${instructions.length > 0 ? `
          <div class="instructions">
            <h4>Collection Instructions:</h4>
            <ul>
              ${instructions.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for choosing NXA Pathology Lab</p>
          <p>Report will be ready by ${formatReportTime(calculateReportTime(booking.tests))}</p>
          <p>For assistance: 1234567890</p>
        </div>
      </div>
      <script>
        window.print();
      </script>
    </body>
    </html>
  `;
}

/**
 * Export bookings to CSV
 */
export function exportBookingsToCSV(bookings: Booking[]): void {
  const headers = ['Token Number', 'Sample ID', 'Patient Name', 'Mobile', 'Tests', 'Type', 'Amount', 'Status', 'Booking Time'];
  const rows = bookings.map(b => [
    b.tokenNumber,
    b.sample.sampleID,
    b.patientName,
    b.patientMobile,
    formatTestsList(b.tests),
    b.bookingType,
    b.finalAmount,
    b.status,
    b.bookingTime,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tokens-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get booking statistics
 */
export function getBookingStatistics(bookings: Booking[]) {
  return {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    collected: bookings.filter(b => b.status === 'Collected').length,
    testing: bookings.filter(b => b.status === 'Testing').length,
    ready: bookings.filter(b => b.status === 'Ready').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.finalAmount, 0),
  };
}

/**
 * Detect peak hours
 */
export function detectPeakHours(bookings: Booking[]): string {
  const hourCounts: Record<string, number> = {};

  bookings.forEach(b => {
    const hour = b.bookingTime.split(':')[0];
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourCounts).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0]);
  return `${peakHour[0]}:00 - ${(parseInt(peakHour[0]) + 1) % 24}:00`;
}

/**
 * Calculate average TAT
 */
export function calculateAverageTAT(bookings: Booking[]): number {
  const completedBookings = bookings.filter(b => b.status === 'Ready');
  if (completedBookings.length === 0) return 0;

  const totalTime = completedBookings.reduce((sum, b) => {
    const created = new Date(b.createdAt);
    const updated = new Date(b.updatedAt);
    return sum + (updated.getTime() - created.getTime());
  }, 0);

  // Return average in hours
  return Math.round((totalTime / completedBookings.length) / (1000 * 60 * 60));
}

/**
 * Check if booking is overdue
 */
export function isBookingOverdue(booking: Booking): boolean {
  if (booking.status === 'Ready' || booking.status === 'Cancelled') return false;

  const reportTime = calculateReportTime(booking.tests);
  return new Date() > reportTime;
}

/**
 * Format age group
 */
export function getAgeGroup(age: number): string {
  if (age < 13) return 'Child';
  if (age < 20) return 'Teen';
  if (age < 60) return 'Adult';
  return 'Senior';
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: string): string {
  return priority === 'Urgent' ? '#FF6B6B' : '#4ECDC4';
}

/**
 * Sound notification
 */
export function playNotificationSound(): void {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

/**
 * Keyboard shortcut handler
 */
export function handleKeyboardShortcut(event: KeyboardEvent, callback: (key: string) => void): void {
  if (event.key === 'F2') {
    event.preventDefault();
    callback('newToken');
  } else if (event.key === 'F3') {
    event.preventDefault();
    callback('scan');
  } else if (event.key === 'F5') {
    event.preventDefault();
    callback('refresh');
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;

  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}
