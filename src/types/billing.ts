// Billing & Invoice Management Types

export type PaymentMode = 
  | 'Cash' 
  | 'UPI' 
  | 'Card' 
  | 'Wallet' 
  | 'Insurance';

export type InvoiceStatus = 
  | 'Draft' 
  | 'Unpaid' 
  | 'PartiallyPaid' 
  | 'Paid' 
  | 'Refunded' 
  | 'Cancelled';

export type LineItemType = 
  | 'Test' 
  | 'Package' 
  | 'Charge' 
  | 'Discount';

export interface InvoiceLineItem {
  type: LineItemType;
  refId?: string; // testId/packageId
  name: string;
  qty: number;
  unitPrice: number;
  amount: number; // qty * unitPrice, negative for Discount
}

export interface Payment {
  paymentId: string;
  invoiceId: string;
  mode: PaymentMode;
  amount: number;
  paidAt: string;
  reference?: string; // UPI txn id, card last 4 digits, etc.
  notes?: string;
  createdBy?: string;
}

export interface InvoiceAudit {
  at: string;
  by: string;
  action: string;
  notes?: string;
}

export interface Invoice {
  invoiceId: string;
  bookingId?: string;
  tokenNumber?: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  patientAge?: number;
  patientGender?: string;
  createdAt: string;
  updatedAt: string;
  status: InvoiceStatus;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Totals
  subtotal: number;
  discountTotal: number;
  taxTotal: number; // 0 for now, can be extended for GST
  grandTotal: number;
  paidTotal: number;
  dueTotal: number;
  
  // Payments
  payments: Payment[];
  
  // Audit trail
  audit: InvoiceAudit[];
  
  // Metadata
  notes?: string;
  createdBy?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// Status color mapping
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  Draft: '#9E9E9E',
  Unpaid: '#F44336',
  PartiallyPaid: '#FF9800',
  Paid: '#4CAF50',
  Refunded: '#2196F3',
  Cancelled: '#757575',
};

// Payment mode icons
export const PAYMENT_MODE_ICONS: Record<PaymentMode, string> = {
  Cash: 'AttachMoney',
  UPI: 'QrCode',
  Card: 'CreditCard',
  Wallet: 'AccountBalanceWallet',
  Insurance: 'HealthAndSafety',
};
