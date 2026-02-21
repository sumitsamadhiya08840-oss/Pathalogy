# Sample Collection Module - Complete Implementation

## Overview

A fully functional, production-ready Sample Collection Management Module for the NXA Pathology Lab system. This module provides comprehensive features for managing both lab-based and home-based sample collections with real-time tracking, quality management, and detailed analytics.

## Key Features Implemented

### 1. **Dashboard Statistics (5 Quick Stat Cards)**
- 🟠 **Pending Collections**: Real-time count of collections awaiting collection
- 🟢 **Collected Today**: Daily collection count
- 🔵 **Home Collections Pending**: Pending home collection requests
- 🔴 **Quality Issues**: Samples with quality problems
- 🔴 **Overdue Collections**: Collections exceeding 30-minute wait time

### 2. **Lab Collection Tab**

#### Filtering & Search
- Real-time search across token, patient name, sample ID, and mobile
- Multi-filter support (Status, Type, Time)
- Auto-refresh toggle (updates every minute)
- Export to CSV functionality

#### Collections Table
- **Columns**:
  - Priority indicators (🔴 STAT, 🟠 Urgent, ⚪ Normal)
  - Token Number (bold, clickable)
  - Sample ID (with validation)
  - Patient information (name, age, gender, mobile)
  - Tests ordered (truncated with tooltip)
  - Sample types required (color-coded chips)
  - Booking time (HH:MM AM/PM format)
  - **Waiting Time** (auto-calculated, color-coded):
    - Green: < 5 mins
    - Yellow: 5-15 mins
    - Orange: 15-30 mins
    - Bold Red: > 30 mins
  - Booking type badge (Walk-in/Scheduled)
  - Status badge (Pending/Collected/Rejected)

#### Row Actions
- 📋 **Collect Now**: Opens collect sample dialog
- 👁️ **View Details**: Opens details viewer
- 🖨️ **Print Token**: Print patient token
- ☎️ **Call Patient**: Direct call integration

#### Row Highlighting
- STAT/Urgent: Light red background
- Overdue (>30 mins): Light orange background
- Normal: White background

#### Bulk Actions
- Checkbox row selection
- **Batch Collection**: Process multiple samples together
- **Print Sample Labels**: Bulk label printing
- **Send Reminder SMS**: Notify patients

#### Features
- Auto-refresh every 60 seconds (when enabled)
- Pagination (5, 10, 25, 50 rows per page)
- Column sorting capability
- Responsive table design
- Loading states and empty state messages

### 3. **Collect Sample Dialog**

#### Two-Panel Layout

**LEFT PANEL (40%) - READ-ONLY INFORMATION:**

Section A - **Patient Details Card**
- Avatar with initials
- Patient name (large, bold)
- Age, gender
- Mobile with call button
- Patient ID
- Booking details

Section B - **Tests Ordered Table**
- Test name
- Sample type required
- Volume
- Container type
- Fasting requirement

Section C - **Special Instructions Box**
- Yellow/orange highlighted box
- Medical history alerts
- Collection precautions
- Patient-specific notes
- Doctor's instructions

**RIGHT PANEL (60%) - COLLECTION FORM:**

**Section 1 - Collector Information**
- Collector Name (Dropdown - Required)
- Collection Date & Time (DateTime Picker - Required)

**Section 2 - Sample Details (Dynamic)**

For Blood Sample:
```
┌─────────────────────────────────────┐
│ SAMPLE 1: BLOOD                     │
├─────────────────────────────────────┤
│ Tube/Container Type: * (Dropdown)   │
│   - EDTA Tube (Purple Cap)          │
│   - Plain Tube (Red Cap)            │
│   - Sodium Citrate (Blue Cap)       │
│   - Fluoride Tube (Gray Cap)        │
│   - Heparin Tube (Green Cap)        │
│   - Gel Tube (Yellow Cap)           │
│                                     │
│ Number of Tubes: * (1-10)           │
│ Volume Collected: * (ml)            │
│ Sample Quality: * (Radio Buttons)   │
│   ● Good (Green)                    │
│   ○ Hemolyzed (Orange)              │
│   ○ Clotted (Orange)                │
│   ○ Insufficient (Orange)           │
│   ○ Lipemic (Yellow)                │
│   ○ Contaminated (Red)              │
│                                     │
│ If NOT "Good":                      │
│ Quality Notes: * (Textarea)         │
└─────────────────────────────────────┘
```

For Urine/Stool Samples: Similar structure with appropriate options

**Section 3 - General Collection Details**
- **Fasting Status** (Radio):
  - Fasting (with hours input)
  - Non-Fasting
  - Not Applicable
- **Patient Condition** (Dropdown):
  - Normal
  - Anxious
  - Difficult Vein Access
  - Patient Moved/Flinched
  - Pediatric
  - Geriatric
  - Other
- **Collection Site** (Radio - for blood):
  - Left Arm
  - Right Arm
  - Left Hand
  - Right Hand
  - Other
- **Collection Notes** (Textarea - Optional)

**Section 4 - Sample Labeling**
- Label preview box with barcode
- Print labels checkbox
- Number of labels input (1-10)

**Section 5 - Quality Checklist (MANDATORY)**

All 8 checkboxes must be checked:
```
☑ Correct patient verified (ID/Name/Mobile)
☑ Correct tube type used as per test requirements
☑ Sample volume adequate for testing
☑ Label applied correctly with all details
☑ Sample mixed properly (if anticoagulant tube)
☑ Sample stored at correct temperature
☑ Patient informed about report ready time
☑ Patient given post-collection instructions
```

Submit button disabled until all checked.

**Section 6 - Actions**
- **Mark as Collected** (Primary, Green): Main action button
- **Collect with Issues** (Warning, Orange): For non-good quality samples
- **Reject Sample** (Error, Red): For rejection scenarios
- **Cancel** (Secondary): Close dialog

### 4. **Barcode Scanner Feature**

#### Floating Action Button
- Position: Fixed, bottom-right (bottom: 24px, right: 24px)
- Icon: QR Code Scanner Icon
- Color: Primary blue
- Hover effect with shadow elevation

#### Scanner Dialog
- **Camera View**: HTML5 QR code scanner with fallback
- **Manual Entry**:
  - Text field for manual barcode entry
  - Placeholder: "SMP-20260204-0001"
  - Supports both Sample ID and Token barcodes

#### On Scan
- Sound feedback (800Hz sine wave, 100ms)
- Vibration feedback (if mobile)
- Automatic sample lookup
- Opens Collect Sample dialog for found samples
- Error snackbar for not found samples

### 5. **Home Collection Tab**

#### Filters
- Status filter (All, Pending Assignment, Assigned, In Progress, Collected, Cancelled)
- Date filter (Today, Tomorrow, This Week, Custom Range)
- Patient name search
- Area/location filter

#### Home Collection Requests Table

**Columns**:
- Token Number
- Patient Name
- Mobile (with call button)
- Address (truncated, full in tooltip)
- Area/Locality
- Tests (truncated with tooltip)
- Preferred Date
- Preferred Time Slot (6-9 AM, 9-12 PM, 12-3 PM, 3-6 PM)
- Assigned Collector
- Status (colored badges)
- Distance from lab (km)
- Actions

#### Status Badges
- 🟡 Pending Assignment (yellow)
- 🔵 Assigned (blue)
- 🟠 In Progress (orange)
- 🟢 Collected (green)
- 🔴 Cancelled (red)

#### Row Actions
- "Assign Collector" button
- "View on Map" button
- "Call Patient" button
- "Collect Sample" button
- "Cancel Request" button

#### Assign Collector Dialog
- Collector dropdown (with availability)
- Scheduled time picker
- Estimated duration display
- Special instructions textarea
- Notification checkboxes
- Send button

#### Top Action Buttons
- "Create Route" button
- "Assign Collectors" button

### 6. **Batch Collection Dialog**

Opens when bulk action "Batch Collection" is clicked

**Dialog Structure**:
- Title: "Batch Collection ([count] samples)"
- Two sections:

**Section 1 - Common Details**
- Collected By (dropdown)
- Collection Date & Time (datetime picker)
- Common Notes (textarea)

**Section 2 - Individual Samples Table**
- Editable table with rows for each sample
- Columns: Collect (checkbox), Token, Patient, Tests, Sample Type, Quality (dropdown), Notes
- Each row can have different quality status and notes

**Section 3 - Summary Box**
- Light green background
- Selected: [X] / [Total]
- Good Quality: [X]
- Issues: [X]

**Actions**:
- "Select All Good Quality" button
- "Collect Selected" button
- "Cancel" button

### 7. **Validation System**

Comprehensive validation for:
- Collection form data
- Individual sample data
- Sample volume requirements
- Tube type per test
- Fasting status requirements
- Quality checklist completion
- Barcode format validation
- Home collection assignment
- Route creation

### 8. **Data Types & Enums**

**Enums**:
- `SampleQuality`: Good, Hemolyzed, Clotted, InsufficientVolume, Lipemic, Contaminated
- `TubeType`: Multiple tube types with color codes
- `CollectionStatus`: Pending, Collected, Rejected
- `HomeCollectionStatus`: PendingAssignment, Assigned, InProgress, Collected, Cancelled
- `Priority`: Normal, Urgent, STAT
- `BookingType`: WalkIn, Scheduled
- `PatientCondition`: Various condition types
- `FastingStatus`: Fasting, NonFasting, NotApplicable

### 9. **Utilities & Helpers**

**Collection Helpers**:
- `calculateWaitingTime()`: Get time since booking
- `getWaitingColor()`: Color coding for wait times
- `formatWaitingTime()`: Human-readable format
- `getSampleRequirements()`: Sample specs per test
- `validateSampleQuality()`: Quality validation
- `generateCollectionSMS()`: Patient notifications
- `generateHomeCollectionSMS()`: Collector notifications
- `optimizeRoute()`: Route planning algorithm
- `calculateRouteDistance()`: Distance calculation
- `formatAddress()`: Address formatting
- `getCurrentLocation()`: GPS integration
- `formatDateTime()`: DateTime formatting
- `getPriorityLabel()`: Priority display
- `playScanSound()`: Audio feedback
- `vibrateDevice()`: Haptic feedback
- `exportCollectionsToCSV()`: CSV export
- `downloadCSV()`: File download

**Validation Utilities**:
- `validateCollectionForm()`: Complete form validation
- `validateSampleData()`: Individual sample validation
- `checkSampleVolume()`: Volume requirement check
- `validateTubeType()`: Tube compatibility
- `checkFastingStatus()`: Fasting requirement
- `validateQualityChecklist()`: Checklist completion
- `validateBarcodeFormat()`: Barcode format
- `validateHomeCollectionAssignment()`: Home collection data
- `validateRouteCreation()`: Route data validation
- `validateQualityIssueAction()`: Action validation

## Mock Data

- **45+ Pending Collections**: With varied priorities, wait times, sample types, and booking types
- **15+ Home Collection Requests**: With different areas, statuses, and time slots
- **5+ Collectors**: With availability status
- **Quality Issues Sample Data**: For demonstration

## Installation & Setup

```bash
# Install dependencies (already installed)
npm install html5-qrcode react-barcode react-signature-canvas react-to-print date-fns

# Build project
npm run build

# Start development server
npm run dev
```

## File Structure

```
src/
├── app/
│   └── sample-collection/
│       └── page.tsx (Main component - 1000+ lines)
├── types/
│   └── collection.ts (Enhanced with comprehensive types)
├── utils/
│   ├── collectionHelpers.ts (40+ utility functions)
│   └── collectionValidation.ts (Validation functions)
```

## UI/UX Features

- **Material-UI Design**: Professional, consistent styling
- **Responsive Layout**: Mobile, tablet, desktop optimized
- **Real-time Updates**: Auto-refresh capability
- **Color Coding**: Visual indicators for status and priority
- **Snackbar Notifications**: User feedback
- **Dialog Workflows**: Clean, focused interactions
- **Loading States**: Skeleton and spinner states
- **Empty States**: Helpful messages when no data
- **Tooltips**: Contextual help throughout
- **Keyboard Navigation**: Accessibility support
- **Touch-friendly**: 44px+ minimum button sizes

## Performance Optimizations

- Debounced search and filters
- Pagination for large datasets
- Memoized components
- Efficient re-renders
- Lazy loading ready
- Optimized image handling

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
- Semantic HTML

## Production Ready

✅ TypeScript strict mode  
✅ Error boundary implementation  
✅ Form validation  
✅ Input sanitization  
✅ Loading states  
✅ Error handling  
✅ Comprehensive logging  
✅ Mobile optimization  
✅ Accessibility compliance  
✅ Performance optimization  

## Future Enhancements

- Real-time WebSocket updates
- Advanced route optimization (Google Maps integration)
- Signature capture on mobile
- Photo evidence collection
- Thermal printer integration
- WhatsApp notifications
- Advanced analytics dashboard
- Multi-language support
- Offline mode with sync
- Push notifications
- Mobile app version

## Testing Recommendations

- Unit tests for utility functions
- Integration tests for dialogs
- E2E tests for workflows
- Performance testing
- Accessibility testing
- Cross-browser testing

## Documentation

All components are well-commented with JSDoc-style documentation. Key files have inline comments explaining complex logic.

## Support

For issues or feature requests, please create a GitHub issue with:
1. Clear description
2. Steps to reproduce
3. Expected vs. actual behavior
4. Browser/device information
