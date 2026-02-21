# Billing Module Documentation

## Overview
Complete billing and invoice management system for NXA Pathology Lab with payment processing, discount management, and receipt printing.

## Features

### 1. Invoice Management
- **Create Invoices**: Generate invoices from bookings with automatic line item population
- **Invoice Status Tracking**: Draft → Unpaid → PartiallyPaid → Paid → Cancelled/Refunded
- **Real-time Totals**: Automatic calculation of subtotal, discounts, tax, grand total, paid, and due amounts
- **Invoice Search**: Search by invoice ID, token number, patient name, or mobile number
- **Status Filtering**: Filter invoices by status using tabs (All, Unpaid, Partially Paid, Paid, Cancelled)

### 2. Line Items
- **Test Items**: Individual tests with price and quantity
- **Package Items**: Test packages with bundled pricing
- **Additional Charges**: Add custom charges (Emergency, Home Collection, etc.)
- **Discount Management**: 
  - Percentage-based discounts (e.g., 10% Senior Citizen)
  - Flat amount discounts
  - Multiple discount types support
- **Line Item Editing**: Add or remove charges and discounts dynamically

### 3. Payment Processing
- **Multiple Payment Modes**:
  - Cash
  - UPI (with transaction reference)
  - Card (with card last 4 digits)
  - Wallet
  - Insurance
- **Partial Payments**: Support for advance/partial payment collection
- **Payment Validation**: Prevents overpayment, validates amount > 0
- **Payment History**: Complete audit trail of all payments per invoice
- **Real-time Status Updates**: Automatic status change based on payment amount

### 4. Receipt & Printing
- **Professional Receipt Layout**: Lab header, invoice details, patient info, line items, payment history
- **Print-Optimized**: Clean layout for physical printing
- **Browser Print**: Uses window.print() for universal compatibility
- **Receipt Preview**: View before printing in dialog

### 5. Invoice Actions
- **View Details**: Full invoice drawer with all information
- **Add Payment**: Quick payment entry with mode selection
- **Print Receipt**: Generate and print professional receipt
- **Apply Discount**: Add or modify discounts with validation
- **Add Charge**: Add custom charges to invoice
- **Cancel Invoice**: Cancel with reason (prevents if payments exist)
- **Mark as Unpaid**: Convert draft invoices to unpaid status

### 6. Analytics & Stats
- **Total Invoices**: Count of all invoices
- **Pending Payments**: Sum of unpaid and partially paid invoices
- **Total Revenue**: Sum of all paid invoice amounts
- **Total Due**: Outstanding amount across all invoices

### 7. Integration
- **Token/Booking Integration**: 
  - "Create Invoice" button in token success dialog
  - Automatic navigation to billing page
  - Pre-populated with booking data (tests, packages, patient info)
  - Automatic home collection charge addition
  - Discount transfer from booking

## Data Model

### Invoice
```typescript
interface Invoice {
  invoiceId: string;              // INV-YYYYMMDD-XXXX
  bookingId?: string;             // Link to booking
  tokenNumber?: string;           // Token reference
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
  
  // Totals (auto-calculated)
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
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
```

### InvoiceLineItem
```typescript
interface InvoiceLineItem {
  type: 'Test' | 'Package' | 'Charge' | 'Discount';
  refId?: string;     // testId/packageId for reference
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;     // qty * unitPrice (negative for Discount)
}
```

### Payment
```typescript
interface Payment {
  paymentId: string;
  invoiceId: string;
  mode: 'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Insurance';
  amount: number;
  paidAt: string;
  reference?: string;  // UPI txn ID, card last 4, etc.
  notes?: string;
  createdBy?: string;
}
```

### InvoiceStatus
```typescript
type InvoiceStatus = 
  | 'Draft'           // Created but not finalized
  | 'Unpaid'          // Finalized, no payment
  | 'PartiallyPaid'   // Some payment received
  | 'Paid'            // Fully paid
  | 'Refunded'        // Payment refunded
  | 'Cancelled';      // Invoice cancelled
```

## File Structure

```
src/
├── types/
│   └── billing.ts                    # Type definitions
├── services/
│   └── billingStore.ts              # localStorage persistence & business logic
├── app/
│   └── billing/
│       └── page.tsx                 # Main billing page with all UI
└── components/
    └── layout/
        └── DashboardLayout.tsx      # Navigation (already has Billing item)
```

## Storage

### localStorage Key
- **Key**: `nxa_billing_v1`
- **Format**: JSON array of Invoice objects
- **Persistence**: Client-side only (suitable for MVP/frontend-only phase)

### Seed Data
- 6 demo invoices with various statuses
- Different payment modes (UPI, Cash, Card)
- Mix of tests, packages, charges, and discounts
- Payment history examples

## Core Functions (billingStore.ts)

### Data Retrieval
- `getInvoices()`: Get all invoices
- `getInvoice(invoiceId)`: Get single invoice
- `getInvoicesByBookingId(bookingId)`: Find invoices for a booking
- `getInvoicesByPatientId(patientId)`: Find all patient invoices

### Invoice Operations
- `createInvoiceFromBooking(booking, user)`: Create invoice from booking (main integration point)
- `upsertInvoice(invoice)`: Create or update invoice with auto-recalculation
- `recalculateInvoice(invoiceId)`: Recalculate totals and status
- `updateInvoiceStatus(invoiceId, status, user, notes)`: Change status manually
- `cancelInvoice(invoiceId, reason, user)`: Cancel invoice (validates no payments)

### Line Item Management
- `addLineItem(invoiceId, lineItem, user)`: Add custom charge/discount
- `removeLineItem(invoiceId, index, user)`: Remove line item
- `applyDiscount(invoiceId, percent, flat, name, user)`: Apply/update discount

### Payment Management
- `addPayment(invoiceId, payment, user)`: Add payment and auto-update status
- Validates: amount > 0, amount <= due, no overpayment

### Utility
- `calculateTotals(lineItems, payments)`: Pure function for total calculation
- `determineStatus(grandTotal, paidTotal, currentStatus)`: Auto-determine status
- `exportBillingData()`: Export all invoices for backup
- `importBillingData(data)`: Import invoices (for migration/restore)

## UI Components

### Main Page (billing/page.tsx)
1. **Stats Cards** (4)
   - Total Invoices
   - Pending Payments (count)
   - Total Revenue (₹)
   - Total Due (₹)

2. **Tabs for Status Filtering**
   - All, Unpaid, Partially Paid, Paid, Cancelled
   - Badge counts on each tab

3. **Search Bar**
   - Real-time search across invoice ID, token, patient name, mobile

4. **DataGrid** (MUI X)
   - Columns: Invoice ID, Token, Patient, Total, Paid, Due, Status, Updated, Actions
   - Actions: View, Add Payment, Print
   - Sortable, pageable (10/25/50/100 rows)
   - Status chips with color coding

5. **Invoice Detail Drawer** (right side, 600px)
   - Invoice info card (ID, token, patient, status, created date)
   - Line items table (with delete for charges/discounts)
   - Add Charge / Apply Discount buttons
   - Totals section (subtotal, discount, tax, grand total, paid, due)
   - Payment history table
   - Action buttons (Add Payment, Print, Mark as Unpaid, Cancel)
   - Audit trail accordion

6. **Add Payment Dialog**
   - Payment mode dropdown (with icons)
   - Amount field (pre-filled with due amount)
   - Reference/Transaction ID (optional)
   - Notes (optional)
   - Validation: amount > 0, amount <= due

7. **Add Charge Dialog**
   - Charge name field
   - Amount field
   - Adds to line items immediately

8. **Apply Discount Dialog**
   - Type selector: Percentage or Flat
   - Amount field (percent or rupees)
   - Discount name (optional)
   - Replaces existing discount

9. **Cancel Invoice Dialog**
   - Cancellation reason (required)
   - Confirmation prompt
   - Validates no payments exist

10. **Print Receipt Dialog**
    - Full invoice preview
    - Lab header with logo/contact
    - Patient information
    - Line items table
    - Payment history
    - Print button (window.print())

## Business Logic

### Invoice Creation from Booking
```typescript
createInvoiceFromBooking(booking):
  1. Generate unique invoice ID (INV-YYYYMMDD-XXXX)
  2. If package selected:
     - Add package as single line item
  3. Else:
     - Add each test as separate line item
  4. If booking type is HomeCollection:
     - Add home collection charge (₹150)
  5. If discount in booking:
     - Add discount line item (negative amount)
  6. Calculate totals
  7. Set status to 'Unpaid'
  8. Create audit entry
  9. Save to localStorage
  10. Return invoice
```

### Payment Processing
```typescript
addPayment(invoiceId, payment):
  1. Validate amount > 0
  2. Validate amount <= due
  3. Generate payment ID
  4. Add payment to invoice
  5. Recalculate totals
  6. Update status:
     - If paidTotal >= grandTotal → Paid
     - If paidTotal > 0 and < grandTotal → PartiallyPaid
     - Else → Unpaid
  7. Create audit entry
  8. Save invoice
```

### Discount Application
```typescript
applyDiscount(invoiceId, percent, flat, name):
  1. Remove existing discount line items
  2. Calculate subtotal (without discounts)
  3. If percent > 0:
     - discountAmount = (subtotal * percent) / 100
  4. Else if flat > 0:
     - discountAmount = min(flat, subtotal)  // Cap at subtotal
  5. Add discount line item (negative amount)
  6. Recalculate invoice
  7. Create audit entry
```

## Validation Rules

1. **Payment Amount**
   - Must be greater than 0
   - Cannot exceed due amount
   - Decimal precision: 2 places

2. **Discount**
   - Percentage: 0-100%
   - Flat: Cannot exceed subtotal
   - Only one discount per invoice (replaces existing)

3. **Line Items**
   - Name required
   - Quantity must be > 0
   - Unit price can be negative (for discounts)
   - Amount = qty × unitPrice

4. **Invoice Cancellation**
   - Cannot cancel if any payment exists
   - Reason required
   - Status must not be Paid

5. **Total Calculation**
   - Subtotal = sum of all non-discount items
   - Discount Total = absolute value of sum of discount items
   - Grand Total = max(0, subtotal - discount + tax)
   - Paid Total = sum of all payments
   - Due Total = max(0, grand total - paid)

## Status Colors

```typescript
Draft: #9E9E9E (Gray)
Unpaid: #F44336 (Red)
PartiallyPaid: #FF9800 (Orange)
Paid: #4CAF50 (Green)
Refunded: #2196F3 (Blue)
Cancelled: #757575 (Dark Gray)
```

## Integration Points

### From Tokens Page
1. After successful token generation
2. "Create Invoice" button in success dialog
3. Calls `createInvoiceFromBooking(booking)`
4. Navigates to `/billing` page
5. Shows success snackbar

### Future Integration Opportunities
- Link to Patient module for patient history
- Link to Report Generation for report delivery tracking
- Link to Analytics for revenue reports
- Backend API integration for server-side persistence
- GST/Tax calculation toggle
- Multi-currency support
- Inventory deduction on test/package billing

## User Workflow

### Creating Invoice from Booking
1. Staff creates token booking in Tokens page
2. Token generated successfully
3. Click "Create Invoice" button
4. Automatic redirect to Billing page
5. Invoice appears in DataGrid

### Processing Payment
1. Open invoice from DataGrid (click View)
2. Click "Add Payment" button
3. Select payment mode
4. Enter amount (defaults to full due amount)
5. Optional: Enter transaction reference
6. Click "Add Payment"
7. Status updates automatically
8. Print receipt if needed

### Applying Discount
1. Open invoice detail drawer
2. Click "Apply Discount"
3. Choose type (Percentage or Flat)
4. Enter amount
5. Optional: Enter discount name
6. Click "Apply Discount"
7. Totals recalculate immediately

### Cancelling Invoice
1. Open invoice detail drawer
2. Click "Cancel Invoice" (only if unpaid)
3. Enter cancellation reason
4. Confirm cancellation
5. Status changes to Cancelled

## Testing Checklist

- [ ] Invoice list displays with seed data
- [ ] Tabs filter invoices by status correctly
- [ ] Search finds invoices by ID/token/name/mobile
- [ ] Create invoice from booking works
- [ ] Invoice detail drawer opens and displays all info
- [ ] Add payment validates and updates status
- [ ] Apply discount calculates correctly
- [ ] Add charge adds to line items
- [ ] Remove line item works (only for charges/discounts)
- [ ] Print receipt displays correctly
- [ ] Cancel invoice validates no payments
- [ ] All totals calculate correctly
- [ ] Status colors display properly
- [ ] Audit trail shows all actions
- [ ] localStorage persists across refresh
- [ ] Snackbar notifications work

## Known Limitations & Future Enhancements

### Current Limitations
1. **Frontend-only**: No backend, data stored in localStorage only
2. **No GST/Tax**: Tax calculation not implemented (kept at 0)
3. **Patient Data**: Age and gender not auto-populated from patient records
4. **No Email/SMS**: Receipt sharing not implemented
5. **No Refund Flow**: Refund status exists but no refund processing UI

### Future Enhancements
1. Backend API integration with database
2. GST calculation toggle (5%, 12%, 18%)
3. Email/SMS receipt delivery
4. Refund processing workflow
5. Invoice PDF generation and download
6. Payment gateway integration (Razorpay, PayU)
7. Multi-invoice payment (batch payment)
8. Credit note generation for refunds
9. Recurring payment reminders
10. Revenue analytics and reports

## Troubleshooting

### Invoice not appearing after creation
- Check browser console for errors
- Verify localStorage is enabled
- Check `nxa_billing_v1` key in localStorage

### Payment not updating status
- Verify payment amount is correct
- Check totals recalculation in browser console
- Ensure no validation errors in payment form

### Discount not applying
- Check if subtotal is sufficient for flat discount
- Verify percentage is between 0-100
- Look for validation errors in snackbar

### Print not working
- Check browser print dialog settings
- Verify print preview displays correctly
- Try different browser if issue persists

## Acceptance Criteria ✅

- [x] Open /billing and see invoices (6 seed invoices visible)
- [x] From booking in /tokens, generate invoice with correct totals
- [x] Apply discount and totals update correctly
- [x] Add payment and invoice status updates (Unpaid → PartiallyPaid → Paid)
- [x] Refresh persists invoices/payments via localStorage
- [x] Print receipt works with professional layout
- [x] Search and filter work correctly
- [x] All validations prevent invalid operations
- [x] Audit trail tracks all actions
- [x] Navigation item "Billing" exists in sidebar

## Summary

The Billing module provides a complete frontend-only invoice and payment management system with:
- Invoice creation from bookings
- Multi-mode payment processing
- Discount and charge management
- Professional receipt printing
- Real-time status tracking
- Complete audit trail
- localStorage persistence

Ready for immediate use in development/testing. Can be extended with backend API when needed.
