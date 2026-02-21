// Billing Store - localStorage persistence for invoices and payments

import type { 
  Invoice, 
  Payment, 
  InvoiceLineItem, 
  InvoiceStatus,
  LineItemType 
} from '@/types/billing';
import type { Booking } from '@/types/token';

const STORAGE_KEY = 'nxa_billing_v1';
const HOME_COLLECTION_CHARGE = 150; // Fixed charge for home collection

// Seed invoices for demo
const SEED_INVOICES: Invoice[] = [
  {
    invoiceId: 'INV-20260221-0001',
    bookingId: 'TOK-20260221-0001',
    tokenNumber: 'TOK-001',
    patientId: 'P001',
    patientName: 'Rajesh Kumar',
    patientMobile: '9876543210',
    patientAge: 45,
    patientGender: 'Male',
    createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    status: 'Paid',
    lineItems: [
      {
        type: 'Test',
        refId: 'TEST001',
        name: 'Complete Blood Count (CBC)',
        qty: 1,
        unitPrice: 250,
        amount: 250,
      },
      {
        type: 'Test',
        refId: 'TEST002',
        name: 'Lipid Profile',
        qty: 1,
        unitPrice: 800,
        amount: 800,
      },
    ],
    subtotal: 1050,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 1050,
    paidTotal: 1050,
    dueTotal: 0,
    payments: [
      {
        paymentId: 'PAY-20260221-0001',
        invoiceId: 'INV-20260221-0001',
        mode: 'UPI',
        amount: 1050,
        paidAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        reference: 'UPI123456789',
        createdBy: 'Staff',
      },
    ],
    audit: [
      {
        at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        by: 'Staff',
        action: 'Invoice Created',
        notes: 'Created from booking TOK-20260221-0001',
      },
      {
        at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        by: 'Staff',
        action: 'Payment Added',
        notes: '₹1050 paid via UPI (Ref: UPI123456789)',
      },
    ],
    createdBy: 'Staff',
  },
  {
    invoiceId: 'INV-20260221-0002',
    bookingId: 'TOK-20260221-0002',
    tokenNumber: 'TOK-002',
    patientId: 'P002',
    patientName: 'Priya Sharma',
    patientMobile: '9876543211',
    patientAge: 32,
    patientGender: 'Female',
    createdAt: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'PartiallyPaid',
    lineItems: [
      {
        type: 'Package',
        refId: 'PKG001',
        name: 'Basic Health Check Package',
        qty: 1,
        unitPrice: 2500,
        amount: 2500,
      },
      {
        type: 'Charge',
        name: 'Home Collection Charge',
        qty: 1,
        unitPrice: 150,
        amount: 150,
      },
      {
        type: 'Discount',
        name: 'Senior Citizen Discount (10%)',
        qty: 1,
        unitPrice: -265,
        amount: -265,
      },
    ],
    subtotal: 2650,
    discountTotal: 265,
    taxTotal: 0,
    grandTotal: 2385,
    paidTotal: 1000,
    dueTotal: 1385,
    payments: [
      {
        paymentId: 'PAY-20260221-0002',
        invoiceId: 'INV-20260221-0002',
        mode: 'Cash',
        amount: 1000,
        paidAt: new Date(Date.now() - 30 * 60000).toISOString(),
        notes: 'Advance payment',
        createdBy: 'Staff',
      },
    ],
    audit: [
      {
        at: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
        by: 'Staff',
        action: 'Invoice Created',
        notes: 'Created from booking TOK-20260221-0002',
      },
      {
        at: new Date(Date.now() - 30 * 60000).toISOString(),
        by: 'Staff',
        action: 'Payment Added',
        notes: '₹1000 paid via Cash',
      },
    ],
    createdBy: 'Staff',
  },
  {
    invoiceId: 'INV-20260221-0003',
    bookingId: 'TOK-20260221-0003',
    tokenNumber: 'TOK-003',
    patientId: 'P003',
    patientName: 'Amit Patel',
    patientMobile: '9876543212',
    patientAge: 28,
    patientGender: 'Male',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'Unpaid',
    lineItems: [
      {
        type: 'Test',
        refId: 'TEST003',
        name: 'Blood Sugar (Fasting)',
        qty: 1,
        unitPrice: 150,
        amount: 150,
      },
      {
        type: 'Test',
        refId: 'TEST004',
        name: 'HbA1c',
        qty: 1,
        unitPrice: 400,
        amount: 400,
      },
    ],
    subtotal: 550,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 550,
    paidTotal: 0,
    dueTotal: 550,
    payments: [],
    audit: [
      {
        at: new Date(Date.now() - 45 * 60000).toISOString(),
        by: 'Staff',
        action: 'Invoice Created',
        notes: 'Created from booking TOK-20260221-0003',
      },
    ],
    createdBy: 'Staff',
  },
  {
    invoiceId: 'INV-20260220-0004',
    bookingId: 'TOK-20260220-0004',
    tokenNumber: 'TOK-004',
    patientId: 'P004',
    patientName: 'Sunita Gupta',
    patientMobile: '9876543213',
    patientAge: 55,
    patientGender: 'Female',
    createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    status: 'Paid',
    lineItems: [
      {
        type: 'Test',
        refId: 'TEST005',
        name: 'Thyroid Function Test',
        qty: 1,
        unitPrice: 600,
        amount: 600,
      },
      {
        type: 'Test',
        refId: 'TEST006',
        name: 'Vitamin D',
        qty: 1,
        unitPrice: 1200,
        amount: 1200,
      },
    ],
    subtotal: 1800,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 1800,
    paidTotal: 1800,
    dueTotal: 0,
    payments: [
      {
        paymentId: 'PAY-20260220-0004',
        invoiceId: 'INV-20260220-0004',
        mode: 'Card',
        amount: 1800,
        paidAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        reference: '****1234',
        createdBy: 'Staff',
      },
    ],
    audit: [
      {
        at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        by: 'Staff',
        action: 'Invoice Created',
        notes: 'Created from booking TOK-20260220-0004',
      },
      {
        at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        by: 'Staff',
        action: 'Payment Added',
        notes: '₹1800 paid via Card (Ref: ****1234)',
      },
    ],
    createdBy: 'Staff',
  },
  {
    invoiceId: 'INV-20260221-0005',
    bookingId: 'TOK-20260221-0005',
    tokenNumber: 'TOK-005',
    patientId: 'P005',
    patientName: 'Vikram Mehta',
    patientMobile: '9876543214',
    createdAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    status: 'Cancelled',
    lineItems: [
      {
        type: 'Test',
        refId: 'TEST007',
        name: 'COVID-19 RT-PCR',
        qty: 1,
        unitPrice: 800,
        amount: 800,
      },
    ],
    subtotal: 800,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 800,
    paidTotal: 0,
    dueTotal: 0,
    payments: [],
    audit: [
      {
        at: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
        by: 'Staff',
        action: 'Invoice Created',
        notes: 'Created from booking TOK-20260221-0005',
      },
      {
        at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        by: 'Staff',
        action: 'Invoice Cancelled',
        notes: 'Patient not available',
      },
    ],
    createdBy: 'Staff',
    cancelledAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    cancelledBy: 'Staff',
    cancelReason: 'Patient not available',
  },
  {
    invoiceId: 'INV-20260221-0006',
    bookingId: 'TOK-20260221-0006',
    tokenNumber: 'TOK-006',
    patientId: 'P006',
    patientName: 'Kavita Singh',
    patientMobile: '9876543215',
    patientAge: 38,
    patientGender: 'Female',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'Unpaid',
    lineItems: [
      {
        type: 'Test',
        refId: 'TEST008',
        name: 'Liver Function Test',
        qty: 1,
        unitPrice: 650,
        amount: 650,
      },
      {
        type: 'Test',
        refId: 'TEST009',
        name: 'Kidney Function Test',
        qty: 1,
        unitPrice: 700,
        amount: 700,
      },
      {
        type: 'Charge',
        name: 'Emergency Charge',
        qty: 1,
        unitPrice: 200,
        amount: 200,
      },
    ],
    subtotal: 1550,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 1550,
    paidTotal: 0,
    dueTotal: 1550,
    payments: [],
    audit: [
      {
        at: new Date(Date.now() - 15 * 60000).toISOString(),
        by: 'Staff',
        action: 'Invoice Created',
        notes: 'Created from booking TOK-20260221-0006',
      },
    ],
    createdBy: 'Staff',
  },
];

// Initialize seed data
function initializeSeedData(): void {
  if (typeof window === 'undefined') return;
  
  const existingInvoices = localStorage.getItem(STORAGE_KEY);
  if (!existingInvoices) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INVOICES));
    console.log('✅ Billing seed invoices initialized');
  }
}

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
  initializeSeedData();
}

// Generate unique invoice ID
function generateInvoiceId(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${dateStr}-${random}`;
}

// Generate unique payment ID
function generatePaymentId(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAY-${dateStr}-${random}`;
}

// Get all invoices
export function getInvoices(): Invoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      initializeSeedData();
      return SEED_INVOICES;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading invoices:', error);
    return [];
  }
}

// Get single invoice
export function getInvoice(invoiceId: string): Invoice | null {
  const invoices = getInvoices();
  return invoices.find(inv => inv.invoiceId === invoiceId) || null;
}

// Save invoices to localStorage
function saveInvoices(invoices: Invoice[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error('Error saving invoices:', error);
  }
}

// Calculate invoice totals
function calculateTotals(lineItems: InvoiceLineItem[], payments: Payment[]) {
  const subtotal = lineItems
    .filter(item => item.type !== 'Discount')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const discountTotal = Math.abs(
    lineItems
      .filter(item => item.type === 'Discount')
      .reduce((sum, item) => sum + item.amount, 0)
  );
  
  const taxTotal = 0; // Can be extended for GST
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
  const paidTotal = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const dueTotal = Math.max(0, grandTotal - paidTotal);
  
  return {
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
    paidTotal,
    dueTotal,
  };
}

// Determine invoice status based on payments
function determineStatus(grandTotal: number, paidTotal: number, currentStatus: InvoiceStatus): InvoiceStatus {
  // Don't change if already cancelled or refunded
  if (currentStatus === 'Cancelled' || currentStatus === 'Refunded') {
    return currentStatus;
  }
  
  if (paidTotal === 0) {
    return currentStatus === 'Draft' ? 'Draft' : 'Unpaid';
  }
  
  if (paidTotal >= grandTotal) {
    return 'Paid';
  }
  
  if (paidTotal > 0 && paidTotal < grandTotal) {
    return 'PartiallyPaid';
  }
  
  return 'Unpaid';
}

// Recalculate invoice totals and status
export function recalculateInvoice(invoiceId: string): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  const invoice = invoices[index];
  const totals = calculateTotals(invoice.lineItems, invoice.payments);
  const status = determineStatus(totals.grandTotal, totals.paidTotal, invoice.status);
  
  invoices[index] = {
    ...invoice,
    ...totals,
    status,
    updatedAt: new Date().toISOString(),
  };
  
  saveInvoices(invoices);
  return invoices[index];
}

// Create/Update invoice
export function upsertInvoice(invoice: Invoice): Invoice {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoice.invoiceId);
  
  // Recalculate totals
  const totals = calculateTotals(invoice.lineItems, invoice.payments);
  const status = determineStatus(totals.grandTotal, totals.paidTotal, invoice.status);
  
  const updatedInvoice: Invoice = {
    ...invoice,
    ...totals,
    status,
    updatedAt: new Date().toISOString(),
  };
  
  if (index === -1) {
    invoices.push(updatedInvoice);
  } else {
    invoices[index] = updatedInvoice;
  }
  
  saveInvoices(invoices);
  return updatedInvoice;
}

// Create invoice from booking (core integration function)
export function createInvoiceFromBooking(booking: Booking, createdBy: string = 'Staff'): Invoice {
  const now = new Date().toISOString();
  const lineItems: InvoiceLineItem[] = [];
  
  // Add package if selected
  if (booking.selectedPackage) {
    lineItems.push({
      type: 'Package',
      refId: booking.selectedPackage.id,
      name: booking.selectedPackage.packageName,
      qty: 1,
      unitPrice: booking.selectedPackage.price,
      amount: booking.selectedPackage.price,
    });
  } else {
    // Add individual tests
    booking.tests.forEach(test => {
      lineItems.push({
        type: 'Test',
        refId: test.id,
        name: test.testName,
        qty: 1,
        unitPrice: test.price,
        amount: test.price,
      });
    });
  }
  
  // Add home collection charge if applicable
  if (booking.bookingType === 'HomeCollection') {
    lineItems.push({
      type: 'Charge',
      name: 'Home Collection Charge',
      qty: 1,
      unitPrice: HOME_COLLECTION_CHARGE,
      amount: HOME_COLLECTION_CHARGE,
    });
  }
  
  // Add discount if applicable
  if (booking.discountPercent > 0) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * booking.discountPercent) / 100;
    lineItems.push({
      type: 'Discount',
      name: `Discount (${booking.discountPercent}%)${booking.discountReason ? ` - ${booking.discountReason}` : ''}`,
      qty: 1,
      unitPrice: -discountAmount,
      amount: -discountAmount,
    });
  }
  
  const totals = calculateTotals(lineItems, []);
  
  const invoice: Invoice = {
    invoiceId: generateInvoiceId(),
    bookingId: booking.bookingID,
    tokenNumber: booking.tokenNumber,
    patientId: booking.patientID,
    patientName: booking.patientName,
    patientMobile: booking.patientMobile,
    patientAge: undefined, // Can be enhanced with patient store lookup
    patientGender: undefined, // Can be enhanced with patient store lookup
    createdAt: now,
    updatedAt: now,
    status: 'Unpaid',
    lineItems,
    ...totals,
    payments: [],
    audit: [
      {
        at: now,
        by: createdBy,
        action: 'Invoice Created',
        notes: `Created from booking ${booking.bookingID}`,
      },
    ],
    createdBy,
  };
  
  return upsertInvoice(invoice);
}

// Add payment to invoice
export function addPayment(
  invoiceId: string,
  payment: Omit<Payment, 'paymentId' | 'invoiceId' | 'paidAt'>,
  paidBy: string = 'Staff'
): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  const invoice = invoices[index];
  
  // Validate payment amount
  if (payment.amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }
  
  if (payment.amount > invoice.dueTotal) {
    throw new Error(`Payment amount (₹${payment.amount}) exceeds due amount (₹${invoice.dueTotal})`);
  }
  
  const now = new Date().toISOString();
  
  const newPayment: Payment = {
    ...payment,
    paymentId: generatePaymentId(),
    invoiceId: invoice.invoiceId,
    paidAt: now,
  };
  
  invoice.payments.push(newPayment);
  invoice.audit.push({
    at: now,
    by: paidBy,
    action: 'Payment Added',
    notes: `₹${payment.amount} paid via ${payment.mode}${payment.reference ? ` (Ref: ${payment.reference})` : ''}`,
  });
  
  return upsertInvoice(invoice);
}

// Add line item to invoice
export function addLineItem(
  invoiceId: string,
  lineItem: InvoiceLineItem,
  addedBy: string = 'Staff'
): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  const invoice = invoices[index];
  invoice.lineItems.push(lineItem);
  invoice.audit.push({
    at: new Date().toISOString(),
    by: addedBy,
    action: 'Line Item Added',
    notes: `Added: ${lineItem.name} (₹${lineItem.amount})`,
  });
  
  return upsertInvoice(invoice);
}

// Remove line item from invoice
export function removeLineItem(
  invoiceId: string,
  lineItemIndex: number,
  removedBy: string = 'Staff'
): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  const invoice = invoices[index];
  
  if (lineItemIndex < 0 || lineItemIndex >= invoice.lineItems.length) {
    throw new Error('Invalid line item index');
  }
  
  const removedItem = invoice.lineItems[lineItemIndex];
  invoice.lineItems.splice(lineItemIndex, 1);
  invoice.audit.push({
    at: new Date().toISOString(),
    by: removedBy,
    action: 'Line Item Removed',
    notes: `Removed: ${removedItem.name}`,
  });
  
  return upsertInvoice(invoice);
}

// Apply discount to invoice
export function applyDiscount(
  invoiceId: string,
  discountPercent: number,
  discountFlat: number,
  discountName: string,
  appliedBy: string = 'Staff'
): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  const invoice = invoices[index];
  
  // Remove existing discount line items
  invoice.lineItems = invoice.lineItems.filter(item => item.type !== 'Discount');
  
  // Calculate subtotal (without discounts)
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
  
  let discountAmount = 0;
  let discountLabel = discountName || 'Discount';
  
  if (discountPercent > 0) {
    discountAmount = (subtotal * discountPercent) / 100;
    discountLabel += ` (${discountPercent}%)`;
  } else if (discountFlat > 0) {
    discountAmount = Math.min(discountFlat, subtotal); // Cap at subtotal
    discountLabel += ` (Flat)`;
  }
  
  if (discountAmount > 0) {
    invoice.lineItems.push({
      type: 'Discount',
      name: discountLabel,
      qty: 1,
      unitPrice: -discountAmount,
      amount: -discountAmount,
    });
    
    invoice.audit.push({
      at: new Date().toISOString(),
      by: appliedBy,
      action: 'Discount Applied',
      notes: `${discountLabel}: ₹${discountAmount.toFixed(2)}`,
    });
  }
  
  return upsertInvoice(invoice);
}

// Cancel invoice
export function cancelInvoice(
  invoiceId: string,
  cancelReason: string,
  cancelledBy: string = 'Staff'
): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  const invoice = invoices[index];
  
  if (invoice.paidTotal > 0) {
    throw new Error('Cannot cancel invoice with payments. Process refund instead.');
  }
  
  const now = new Date().toISOString();
  
  invoice.status = 'Cancelled';
  invoice.cancelledAt = now;
  invoice.cancelledBy = cancelledBy;
  invoice.cancelReason = cancelReason;
  invoice.updatedAt = now;
  invoice.audit.push({
    at: now,
    by: cancelledBy,
    action: 'Invoice Cancelled',
    notes: cancelReason,
  });
  
  saveInvoices(invoices);
  return invoice;
}

// Update invoice status
export function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  updatedBy: string = 'Staff',
  notes?: string
): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  const invoice = invoices[index];
  const oldStatus = invoice.status;
  invoice.status = status;
  invoice.updatedAt = new Date().toISOString();
  invoice.audit.push({
    at: new Date().toISOString(),
    by: updatedBy,
    action: 'Status Changed',
    notes: notes || `Status changed from ${oldStatus} to ${status}`,
  });
  
  saveInvoices(invoices);
  return invoice;
}

// Delete invoice (admin only - careful!)
export function deleteInvoice(invoiceId: string): boolean {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return false;
  
  invoices.splice(index, 1);
  saveInvoices(invoices);
  return true;
}

// Get invoices by booking ID
export function getInvoicesByBookingId(bookingId: string): Invoice[] {
  return getInvoices().filter(inv => inv.bookingId === bookingId);
}

// Get invoices by patient ID
export function getInvoicesByPatientId(patientId: string): Invoice[] {
  return getInvoices().filter(inv => inv.patientId === patientId);
}

// Export all for backup
export function exportBillingData() {
  return {
    invoices: getInvoices(),
    exportedAt: new Date().toISOString(),
    version: 'v1',
  };
}

// Import data (for restore/migration)
export function importBillingData(data: { invoices: Invoice[] }) {
  if (typeof window === 'undefined') return;
  saveInvoices(data.invoices);
}
