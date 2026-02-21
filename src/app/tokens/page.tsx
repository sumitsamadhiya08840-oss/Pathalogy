'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import Barcode from 'react-barcode' assert { type: 'module' };
import { useReactToPrint } from 'react-to-print';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Autocomplete,
  TextareaAutosize,
  Divider,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  Container,
  LinearProgress,
  Badge,
  Tooltip,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  FormGroup,
  Slider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  QrCode2 as QrCodeIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PhoneAndroid as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  CameraAlt as CameraIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import type {
  Booking,
  Patient,
  BookingTest,
  BookingFormData,
  BookingType,
  BookingPackage,
  TokenStatus,
  TimelineEvent,
  TimeSlot,
  DiscountReason,
} from '@/types/token';
import {
  TIME_SLOTS,
  BOOKING_TYPES,
  TOKEN_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  BOOKING_TYPE_LABELS,
  DISCOUNT_REASONS,
} from '@/types/token';
import { validateBookingForm } from '@/utils/tokenValidation';
import {
  generateTokenNumber,
  generateSampleID,
  generateBookingID,
  calculateReportTime,
  formatReportTime,
  generateSMSTemplate,
  sendSMS,
  getTimeDuration,
  createTimelineEvent,
  calculateTotalAmount,
  getUniqueSampleTypes,
  requiresFasting,
  getCollectionInstructions,
  formatTestsList,
  formatTestsForSMS,
  getAvailableTimeSlots,
  getTimeSlotStartTime,
  getTimeSlotEndTime,
  generatePrintHTML,
  exportBookingsToCSV,
  getBookingStatistics,
  formatPrice,
  playNotificationSound,
  calculateAverageTAT,
  isBookingOverdue,
  debounce,
} from '@/utils/tokenHelpers';

type DialogType = 'none' | 'tokenDetails' | 'quickAddPatient' | 'printSettings' | 'scanning';

export default function TokensPage() {
  // Main state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Form states
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    bookingType: 'WalkIn',
    collectionNow: true,
    priority: 'Normal',
    selectedTests: [],
    discountPercent: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Patient state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // Tests and packages
  const [availableTests, setAvailableTests] = useState<BookingTest[]>([]);
  const [availablePackages, setAvailablePackages] = useState<BookingPackage[]>([]);
  const [selectedTests, setSelectedTests] = useState<BookingTest[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<BookingPackage | undefined>(undefined);

  // Dialogs and modals
  const [openDialog, setOpenDialog] = useState<DialogType>('none');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [generatedToken, setGeneratedToken] = useState<any>(null);
  const [showTokenSuccess, setShowTokenSuccess] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TokenStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<BookingType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRangeFilter, setTimeRangeFilter] = useState('AllDay');

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  // Initialize with dummy data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setPatients(getDummyPatients());
      setAvailableTests(getDummyTests());
      setAvailablePackages(getDummyPackages());
      setBookings(getDummyBookings());
      setLoading(false);
    }, 1000);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery) return patients.slice(0, 10);
    const query = patientSearchQuery.toLowerCase();
    return patients.filter(
      p => p.name.toLowerCase().includes(query) || p.mobile.includes(query) || p.patientID.includes(query)
    );
  }, [patientSearchQuery, patients]);

  // Calculate booking amounts
  const calculateAmounts = useCallback(() => {
    const tests = selectedPackage ? selectedPackage.tests : selectedTests;
    const baseAmount = tests.reduce((sum, t) => sum + t.price, 0);
    const discount = (baseAmount * (formData.discountPercent || 0)) / 100;
    return {
      baseAmount,
      discount,
      finalAmount: baseAmount - discount,
    };
  }, [selectedPackage, selectedTests, formData.discountPercent]);

  const amounts = calculateAmounts();

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientID: patient.id,
      patientName: patient.name,
    }));
    setPatientSearchQuery('');
    setCurrentStep(1); // Move to test selection
    showSnackbar(`Patient ${patient.name} selected`, 'success');
  };

  // Handle test selection
  const handleSelectTest = (test: BookingTest) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      }
      return [...prev, test];
    });
  };

  // Handle package selection
  const handleSelectPackage = (pkg: BookingPackage) => {
    if (selectedPackage?.id === pkg.id) {
      setSelectedPackage(undefined);
      setSelectedTests([]);
    } else {
      setSelectedPackage(pkg);
      setSelectedTests(pkg.tests);
    }
  };

  // Remove test from selection
  const handleRemoveTest = (testId: string) => {
    setSelectedTests(prev => prev.filter(t => t.id !== testId));
    setSelectedPackage(undefined);
  };

  // Generate token
  const handleGenerateToken = async () => {
    const validation = validateBookingForm(formData as BookingFormData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      showSnackbar('Please fix form errors', 'error');
      return;
    }

    if (!selectedPatient) {
      showSnackbar('Please select a patient', 'error');
      return;
    }

    if (selectedTests.length === 0) {
      showSnackbar('Please select at least one test', 'error');
      return;
    }

    // Generate token data
    const now = new Date();
    const tokenNumber = generateTokenNumber(now);
    const sampleID = generateSampleID(now);
    const bookingID = generateBookingID();
    const reportTime = calculateReportTime(selectedTests);
    const sampleTypes = getUniqueSampleTypes(selectedTests);

    const booking: Booking = {
      id: `booking_${Date.now()}`,
      bookingID,
      tokenNumber,
      patientID: selectedPatient.id,
      patientName: selectedPatient.name,
      patientMobile: selectedPatient.mobile,
      bookingType: formData.bookingType as BookingType,
      bookingDate: now.toISOString().split('T')[0],
      bookingTime: now.toTimeString().split(' ')[0],
      tests: selectedTests,
      selectedPackage,
      totalTests: selectedTests.length,
      totalAmount: amounts.baseAmount,
      discountPercent: formData.discountPercent || 0,
      discountReason: formData.discountReason,
      finalAmount: amounts.finalAmount,
      paymentStatus: 'Pending',
      status: 'Pending' as TokenStatus,
      sample: {
        id: `sample_${Date.now()}`,
        sampleID,
        tokenID: tokenNumber,
        patientID: selectedPatient.id,
        sampleType: sampleTypes.join(', '),
        collectedAt: undefined,
        collectedBy: undefined,
        status: 'Pending',
        barcode: sampleID,
        qrCode: undefined,
      },
      referredBy: formData.referredBy,
      specialInstructions: formData.specialInstructions,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      homeCollectionAddress: formData.homeCollectionAddress,
      preferredDate: formData.preferredDate,
      preferredTimeSlot: formData.preferredTimeSlot,
      sendReminder: formData.sendReminder || false,
      collectionNow: formData.collectionNow || false,
      priority: formData.priority as 'Normal' | 'Urgent',
      timeline: [createTimelineEvent('Pending', 'Token generated and booking created', 'System')],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'Current User',
      notes: '',
    };

    // Add to bookings list
    setBookings(prev => [booking, ...prev]);

    // Generate QR and Barcode data (mock)
    const qrData = `${tokenNumber}|${selectedPatient.id}|${sampleID}`;

    // Send SMS
    const smsText = generateSMSTemplate(
      selectedPatient.name,
      tokenNumber,
      formatTestsForSMS(selectedTests),
      BOOKING_TYPE_LABELS[formData.bookingType as BookingType],
      formData.appointmentTime || new Date().toTimeString().split(' ')[0],
      sampleID,
      formatReportTime(reportTime)
    );

    await sendSMS(selectedPatient.mobile, smsText);

    // Play notification
    playNotificationSound();

    // Show success
    setGeneratedToken({
      booking,
      qrCode: qrData,
      barcode: sampleID,
      reportTime: formatReportTime(reportTime),
      instructions: getCollectionInstructions(selectedTests),
    });

    setShowTokenSuccess(true);
    showSnackbar('Token generated successfully!', 'success');

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setCurrentStep(0);
    setFormData({
      bookingType: 'WalkIn',
      collectionNow: true,
      priority: 'Normal',
      selectedTests: [],
      discountPercent: 0,
    });
    setSelectedPatient(null);
    setSelectedTests([]);
    setSelectedPackage(undefined);
    setFormErrors({});
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (statusFilter !== 'All') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      result = result.filter(b => b.bookingType === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        b =>
          b.tokenNumber.toLowerCase().includes(query) ||
          b.patientName.toLowerCase().includes(query) ||
          b.patientMobile.includes(query) ||
          b.sample.sampleID.toLowerCase().includes(query)
      );
    }

    return result;
  }, [bookings, statusFilter, typeFilter, searchQuery]);

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'tokenNumber',
      headerName: 'Token Number',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ cursor: 'pointer', color: 'primary.main' }}
          onClick={() => {
            setSelectedBooking(params.row);
            setOpenDialog('tokenDetails');
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'sample.sampleID',
      headerName: 'Sample ID',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2">{params.row.sample.sampleID}</Typography>
        </Box>
      ),
    },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      width: 160,
    },
    {
      field: 'patientMobile',
      headerName: 'Mobile',
      width: 130,
    },
    {
      field: 'tests',
      headerName: 'Tests',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={formatTestsList(params.row.tests)}>
          <Typography variant="body2" noWrap>
            {formatTestsList(params.row.tests).substring(0, 40)}
            {formatTestsList(params.row.tests).length > 40 ? '...' : ''}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'bookingType',
      headerName: 'Type',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={BOOKING_TYPE_LABELS[params.value as BookingType]}
          color="primary"
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'bookingTime',
      headerName: 'Time',
      width: 100,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={STATUS_LABELS[params.value as TokenStatus]}
          sx={{
            backgroundColor: STATUS_COLORS[params.value as TokenStatus],
            color: 'white',
          }}
          size="small"
        />
      ),
    },
    {
      field: 'finalAmount',
      headerName: 'Amount',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatPrice(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setSelectedBooking(params.row);
                setOpenDialog('tokenDetails');
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" color="info">
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Token & Sample Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportBookingsToCSV(filteredBookings)}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setCurrentStep(0);
              }}
            >
              New Booking
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, value) => setActiveTab(value)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Create Booking`} value={0} />
            <Tab label={`Today's Tokens (${bookings.length})`} value={1} />
            <Tab label="Sample Tracking" value={2} />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            {/* Create New Booking Section */}
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Create New Booking
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {/* Stepper */}
                <Stepper activeStep={currentStep} orientation="vertical">
                  {/* Step 1: Patient Selection */}
                  <Step key={0} completed={!!selectedPatient}>
                    <StepLabel>Select Patient</StepLabel>
                    <StepContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Autocomplete
                          freeSolo
                          options={filteredPatients}
                          getOptionLabel={(p) => typeof p === 'string' ? p : `${p.name} - ${p.mobile}`}
                          inputValue={patientSearchQuery}
                          onInputChange={(e, value) => setPatientSearchQuery(value)}
                          onChange={(e, patient) => {
                            if (patient && typeof patient !== 'string') {
                              handleSelectPatient(patient);
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Search Patient"
                              placeholder="By name, mobile, or patient ID"
                              error={!!formErrors.patient}
                              helperText={formErrors.patient || 'Search by name, mobile number, or patient ID'}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {option.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Age: {option.age} | Mobile: {option.mobile} | ID: {option.patientID}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        />

                        <Button variant="text" size="small">
                          + Add New Patient
                        </Button>

                        {selectedPatient && (
                          <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Name
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {selectedPatient.name}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Age/Gender
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPatient.age} / {selectedPatient.gender}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Mobile
                                </Typography>
                                <Typography variant="body2">{selectedPatient.mobile}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="textSecondary">
                                  Patient ID
                                </Typography>
                                <Typography variant="body2">{selectedPatient.patientID}</Typography>
                              </Box>
                            </Box>
                          </Card>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                          <Button
                            variant="contained"
                            onClick={() => setCurrentStep(1)}
                            disabled={!selectedPatient}
                          >
                            Next: Select Tests
                          </Button>
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>

                  {/* Step 2: Test Selection */}
                  <Step key={1} completed={selectedTests.length > 0}>
                    <StepLabel>Select Tests</StepLabel>
                    <StepContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Tests Autocomplete */}
                        <Autocomplete
                          multiple
                          options={availableTests}
                          getOptionLabel={t => `${t.testName} - ${formatPrice(t.price)}`}
                          value={selectedTests}
                          onChange={(e, value) => setSelectedTests(value)}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Select Tests"
                              placeholder="Search and add tests"
                              error={!!formErrors.tests}
                              helperText={formErrors.tests}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {option.testName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Sample: {option.sampleType} | Report: {option.reportTime}
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {formatPrice(option.price)}
                              </Typography>
                            </Box>
                          )}
                        />

                        {/* Package Selection (alternative) */}
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            OR Select a Package:
                          </Typography>
                          <FormControl fullWidth size="small">
                            <InputLabel>Packages</InputLabel>
                            <Select
                              value={selectedPackage?.id || ''}
                              label="Packages"
                              onChange={e => {
                                const pkg = availablePackages.find(p => p.id === e.target.value);
                                if (pkg) {
                                  handleSelectPackage(pkg);
                                }
                              }}
                            >
                              <MenuItem value="">None</MenuItem>
                              {availablePackages.map(pkg => (
                                <MenuItem key={pkg.id} value={pkg.id}>
                                  {pkg.packageName} - {formatPrice(pkg.price)}
                                  {pkg.discountPercent > 0 && ` (${pkg.discountPercent}% off)`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        {/* Selected Tests Summary */}
                        {selectedTests.length > 0 && (
                          <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Selected Tests ({selectedTests.length})
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Test Name</TableCell>
                                  <TableCell align="right">Price</TableCell>
                                  <TableCell align="center">Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {selectedTests.map(test => (
                                  <TableRow key={test.id}>
                                    <TableCell>{test.testName}</TableCell>
                                    <TableCell align="right">{formatPrice(test.price)}</TableCell>
                                    <TableCell align="center">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveTest(test.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
                              Total: <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{formatPrice(amounts.baseAmount)}</span>
                            </Typography>
                          </Card>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                          <Button
                            onClick={() => setCurrentStep(2)}
                            variant="contained"
                            disabled={selectedTests.length === 0}
                          >
                            Next: Booking Details
                          </Button>
                          <Button onClick={() => setCurrentStep(0)}>Back</Button>
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>

                  {/* Step 3: Booking Details */}
                  <Step key={2}>
                    <StepLabel>Booking Details</StepLabel>
                    <StepContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Booking Type */}
                        <FormControl>
                          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                            Booking Type
                          </Typography>
                          <RadioGroup
                            row
                            value={formData.bookingType || 'WalkIn'}
                            onChange={e => setFormData(prev => ({ ...prev, bookingType: e.target.value as BookingType }))}
                          >
                            <FormControlLabel value="WalkIn" control={<Radio />} label="Walk-in" />
                            <FormControlLabel value="Scheduled" control={<Radio />} label="Scheduled" />
                            <FormControlLabel value="HomeCollection" control={<Radio />} label="Home Collection" />
                          </RadioGroup>
                        </FormControl>

                        {/* Walk-in options */}
                        {formData.bookingType === 'WalkIn' && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.collectionNow || false}
                                  onChange={e => setFormData(prev => ({ ...prev, collectionNow: e.target.checked }))}
                                />
                              }
                              label="Collect Sample Now"
                            />
                            <FormControl>
                              <Typography variant="subtitle2" gutterBottom>
                                Priority
                              </Typography>
                              <RadioGroup
                                row
                                value={formData.priority || 'Normal'}
                                onChange={e =>
                                  setFormData(prev => ({ ...prev, priority: e.target.value as 'Normal' | 'Urgent' }))
                                }
                              >
                                <FormControlLabel value="Normal" control={<Radio />} label="Normal" />
                                <FormControlLabel value="Urgent" control={<Radio />} label="Urgent" />
                              </RadioGroup>
                            </FormControl>
                          </Box>
                        )}

                        {/* Scheduled options */}
                        {formData.bookingType === 'Scheduled' && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                              label="Appointment Date"
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              value={formData.appointmentDate || ''}
                              onChange={e => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                              error={!!formErrors.appointmentDate}
                              helperText={formErrors.appointmentDate}
                            />
                            <FormControl fullWidth>
                              <InputLabel>Appointment Time</InputLabel>
                              <Select
                                value={formData.appointmentTime || ''}
                                label="Appointment Time"
                                onChange={e => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                              >
                                {getAvailableTimeSlots().map(slot => (
                                  <MenuItem key={slot.slot} value={getTimeSlotStartTime(slot.slot)}>
                                    {slot.slot} ({slot.available - slot.booked} available)
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.sendReminder || false}
                                  onChange={e => setFormData(prev => ({ ...prev, sendReminder: e.target.checked }))}
                                />
                              }
                              label="Send Appointment Reminder SMS"
                            />
                          </Box>
                        )}

                        {/* Home Collection options */}
                        {formData.bookingType === 'HomeCollection' && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                              label="Address"
                              multiline
                              rows={2}
                              fullWidth
                              value={formData.homeCollectionAddress || ''}
                              onChange={e => setFormData(prev => ({ ...prev, homeCollectionAddress: e.target.value }))}
                              error={!!formErrors.homeCollectionAddress}
                              helperText={formErrors.homeCollectionAddress || selectedPatient?.address}
                            />
                            <TextField
                              label="Preferred Date"
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              value={formData.preferredDate || ''}
                              onChange={e => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                              error={!!formErrors.preferredDate}
                              helperText={formErrors.preferredDate}
                            />
                            <FormControl fullWidth>
                              <InputLabel>Time Slot</InputLabel>
                              <Select
                                value={formData.preferredTimeSlot || ''}
                                label="Time Slot"
                                onChange={e => setFormData(prev => ({ ...prev, preferredTimeSlot: e.target.value as TimeSlot }))}
                              >
                                {TIME_SLOTS.map(slot => (
                                  <MenuItem key={slot} value={slot}>
                                    {slot}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                          <Button onClick={() => setCurrentStep(3)} variant="contained">
                            Next: Additional Options
                          </Button>
                          <Button onClick={() => setCurrentStep(1)}>Back</Button>
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>

                  {/* Step 4: Additional Options */}
                  <Step key={3}>
                    <StepLabel>Additional Options</StepLabel>
                    <StepContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Referred By */}
                        <Autocomplete
                          freeSolo
                          options={[]}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Referred By Doctor (Optional)"
                              placeholder="Doctor name"
                            />
                          )}
                        />

                        {/* Special Instructions */}
                        <TextField
                          label="Special Instructions (Optional)"
                          multiline
                          rows={3}
                          fullWidth
                          placeholder="Any special instructions or medical conditions"
                          value={formData.specialInstructions || ''}
                          onChange={e => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                        />

                        {/* Discount */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            label="Discount %"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.5 }}
                            value={formData.discountPercent || 0}
                            onChange={e => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                            sx={{ width: 120 }}
                          />
                          {(formData.discountPercent ?? 0) > 0 && (
                            <FormControl sx={{ flex: 1 }}>
                              <InputLabel>Discount Reason</InputLabel>
                              <Select
                                value={formData.discountReason || ''}
                                label="Discount Reason"
                                onChange={e => setFormData(prev => ({ ...prev, discountReason: e.target.value as DiscountReason }))}
                              >
                                {DISCOUNT_REASONS.map(reason => (
                                  <MenuItem key={reason} value={reason}>
                                    {reason}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </Box>

                        {/* Final Amount */}
                        <Card sx={{ bgcolor: 'success.light', p: 2 }}>
                          <Stack gap={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" color="textSecondary">
                                Base Amount
                              </Typography>
                              <Typography variant="body2">{formatPrice(amounts.baseAmount)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" color="textSecondary">
                                Discount
                              </Typography>
                              <Typography variant="body2" color="error">
                                -{formatPrice(amounts.discount)}
                              </Typography>
                            </Box>
                            <Divider />
                            <Typography variant="h6" fontWeight="bold">
                              Final Amount: {formatPrice(amounts.finalAmount)}
                            </Typography>
                          </Stack>
                        </Card>

                        <Box sx={{ display: 'flex', gap: 2, pt: 2, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button onClick={() => setCurrentStep(2)}>Back</Button>
                            <Button variant="outlined" onClick={resetForm}>
                              Clear Form
                            </Button>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="contained" color="success" onClick={handleGenerateToken} size="large">
                              Generate Token
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>
                </Stepper>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab 2: Today's Tokens */}
        {activeTab === 1 && (
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Today's Bookings ({filteredBookings.length})
                </Typography>

                {/* Filters */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    placeholder="Search token, patient, mobile..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={e => setStatusFilter(e.target.value as any)}
                    >
                      <MenuItem value="All">All Status</MenuItem>
                      {TOKEN_STATUSES.map(status => (
                        <MenuItem key={status} value={status}>
                          {STATUS_LABELS[status as TokenStatus]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={typeFilter}
                      label="Type"
                      onChange={e => setTypeFilter(e.target.value as any)}
                    >
                      <MenuItem value="All">All Types</MenuItem>
                      {BOOKING_TYPES.map(type => (
                        <MenuItem key={type} value={type}>
                          {BOOKING_TYPE_LABELS[type as BookingType]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* DataGrid */}
              <DataGrid
                rows={filteredBookings}
                columns={columns}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                autoHeight
                loading={loading}
                sx={{
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Sample Tracking */}
        {activeTab === 2 && (
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Sample Tracking & Status
              </Typography>

              {/* Kanban Board */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                {(['Pending', 'Collected', 'Testing', 'Ready'] as TokenStatus[]).map((status) => {
                  const statusBookings = filteredBookings.filter(b => b.status === status);
                  return (
                    <Box key={status}>
                      <Card
                        sx={{
                          backgroundColor: STATUS_COLORS[status],
                          opacity: 0.1,
                          minHeight: 400,
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {STATUS_LABELS[status]} ({statusBookings.length})
                          </Typography>
                          <Stack gap={1}>
                            {statusBookings.slice(0, 5).map(booking => (
                              <Card key={booking.id} sx={{ p: 1, cursor: 'pointer' }}>
                                <Typography variant="caption" fontWeight="bold">
                                  {booking.tokenNumber}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {booking.patientName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {booking.totalTests} tests
                                </Typography>
                              </Card>
                            ))}
                            {statusBookings.length > 5 && (
                              <Typography variant="caption" color="textSecondary">
                                +{statusBookings.length - 5} more
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Box>
              {/* Statistics */}
              <Card sx={{ mt: 3, bgcolor: 'info.light', p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Statistics
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Average TAT
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {calculateAverageTAT(filteredBookings)} hours
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Total Bookings
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {filteredBookings.length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Total Revenue
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatPrice(filteredBookings.reduce((sum, b) => sum + b.finalAmount, 0))}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Overdue
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="error">
                      {filteredBookings.filter(isBookingOverdue).length}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Token Success Dialog */}
      <Dialog
        open={showTokenSuccess}
        onClose={() => setShowTokenSuccess(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ✓ Token Generated Successfully
          <IconButton
            onClick={() => setShowTokenSuccess(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {generatedToken && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Token Number Display */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                  {generatedToken.booking.tokenNumber}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, my: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      QR Code
                    </Typography>
                    <QRCode value={generatedToken.qrCode} size={150} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Sample ID
                    </Typography>
                    <Barcode value={generatedToken.barcode} width={2} height={100} />
                  </Box>
                </Box>
              </Box>

              {/* Details */}
              <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Patient
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {generatedToken.booking.patientName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Tests
                    </Typography>
                    <Typography variant="body2">
                      {generatedToken.booking.totalTests}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Amount
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatPrice(generatedToken.booking.finalAmount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Report Ready
                    </Typography>
                    <Typography variant="body2">
                      {generatedToken.reportTime}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* Timeline */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Status Timeline
                </Typography>
                <Timeline>
                  {generatedToken.booking.timeline.map((event: TimelineEvent, index: number) => (
                    <TimelineItem key={event.id}>
                      <TimelineSeparator>
                        <TimelineDot sx={{ bgcolor: STATUS_COLORS[event.status as TokenStatus] }} />
                        {index < generatedToken.booking.timeline.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography fontWeight="bold">{event.status}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {event.timestamp}
                        </Typography>
                        <Typography variant="body2">{event.description}</Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              handlePrint();
              setShowTokenSuccess(false);
            }}
            variant="contained"
            startIcon={<PrintIcon />}
          >
            Print Token
          </Button>
          <Button
            onClick={() => {
              showSnackbar('SMS sent successfully!', 'success');
              setShowTokenSuccess(false);
            }}
            variant="outlined"
            startIcon={<PhoneIcon />}
          >
            Send SMS
          </Button>
          <Button
            onClick={() => {
              showSnackbar('WhatsApp message sent!', 'success');
              setShowTokenSuccess(false);
            }}
            variant="outlined"
            startIcon={<WhatsAppIcon />}
          >
            Send WhatsApp
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowTokenSuccess(false);
            }}
            variant="outlined"
          >
            Create Another
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Template */}
      <Box sx={{ display: 'none' }}>
        <Box ref={printRef}>
          {generatedToken && (
            <Box sx={{ p: 4, bgcolor: 'white' }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h3" fontWeight="bold">
                  🏥
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  NXA PATHOLOGY LAB
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  123 Medical Street | Contact: 1234567890
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', my: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  TOKEN NUMBER
                </Typography>
                <Typography variant="h2" fontWeight="bold">
                  {generatedToken.booking.tokenNumber}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <QRCode value={generatedToken.qrCode} size={150} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Barcode value={generatedToken.barcode} width={2} height={100} />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2">
                <strong>Patient:</strong> {generatedToken.booking.patientName}
              </Typography>
              <Typography variant="body2">
                <strong>Mobile:</strong> {generatedToken.booking.patientMobile}
              </Typography>
              <Typography variant="body2">
                <strong>Sample ID:</strong> {generatedToken.booking.sample.sampleID}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" gutterBottom>
                <strong>Tests Ordered:</strong>
              </Typography>
              {generatedToken.booking.tests.map((test: BookingTest, idx: number) => (
                <Typography key={idx} variant="body2">
                  • {test.testName}
                </Typography>
              ))}

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> {formatPrice(generatedToken.booking.finalAmount)}
              </Typography>
              <Typography variant="body2">
                <strong>Report Ready:</strong> {generatedToken.reportTime}
              </Typography>

              {generatedToken.instructions.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Collection Instructions:
                  </Typography>
                  {generatedToken.instructions.map((instruction: string, idx: number) => (
                    <Typography key={idx} variant="body2">
                      • {instruction}
                    </Typography>
                  ))}
                </>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                Thank you for choosing NXA Pathology Lab
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

// Dummy Data Functions
function getDummyPatients(): Patient[] {
  const names = ['Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Neha Verma', 'Vikram Joshi', 'Anjali Desai'];
  return names.map((name, i) => ({
    id: `patient_${i}`,
    name,
    age: 25 + Math.floor(Math.random() * 50),
    gender: ['Male', 'Female'][Math.floor(Math.random() * 2)] as 'Male' | 'Female',
    mobile: `9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
    patientID: `PAT${String(1000 + i).padStart(5, '0')}`,
    address: `${i + 1}, Medical Lane, City`,
    totalBookings: Math.floor(Math.random() * 10) + 1,
  }));
}

function getDummyTests(): BookingTest[] {
  const tests = [
    { testName: 'Complete Blood Count', price: 500, sampleType: 'Blood', reportTime: '4 Hours', fastingRequired: false },
    { testName: 'Thyroid Profile', price: 800, sampleType: 'Blood', reportTime: '24 Hours', fastingRequired: true },
    { testName: 'Lipid Profile', price: 600, sampleType: 'Blood', reportTime: '4 Hours', fastingRequired: true },
    { testName: 'Liver Function Test', price: 700, sampleType: 'Blood', reportTime: '24 Hours', fastingRequired: true },
    { testName: 'Kidney Function Test', price: 650, sampleType: 'Blood', reportTime: '24 Hours', fastingRequired: false },
    { testName: 'Blood Sugar', price: 250, sampleType: 'Blood', reportTime: '2 Hours', fastingRequired: true },
  ];

  return tests.map((test, i) => ({
    id: `test_${i}`,
    testCode: `TST${String(1000 + i).padStart(5, '0')}`,
    testName: test.testName,
    price: test.price,
    sampleType: test.sampleType,
    reportTime: test.reportTime,
    fastingRequired: test.fastingRequired,
    containerType: 'EDTA Tube',
  }));
}

function getDummyPackages(): BookingPackage[] {
  const tests = getDummyTests();
  return [
    {
      id: 'pkg_1',
      packageCode: 'PKG-001',
      packageName: 'Full Body Checkup',
      tests: tests.slice(0, 4),
      price: 2200,
      discountPercent: 20,
      savingsAmount: 800,
    },
    {
      id: 'pkg_2',
      packageCode: 'PKG-002',
      packageName: 'Diabetes Screening',
      tests: tests.slice(2, 5),
      price: 1400,
      discountPercent: 15,
      savingsAmount: 300,
    },
  ];
}

function getDummyBookings(): Booking[] {
  const patients = getDummyPatients();
  const tests = getDummyTests();

  return Array.from({ length: 15 }, (_, i) => {
    const patient = patients[i % patients.length];
    const selectedTests = tests.slice(0, 2 + Math.floor(Math.random() * 3));
    const now = new Date();

    return {
      id: `booking_${i}`,
      bookingID: `BKG-${String(10000 + i).padStart(5, '0')}`,
      tokenNumber: `TOK-${now.toISOString().split('T')[0].replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
      patientID: patient.id,
      patientName: patient.name,
      patientMobile: patient.mobile,
      bookingType: ['WalkIn', 'Scheduled', 'HomeCollection'][i % 3] as BookingType,
      bookingDate: now.toISOString().split('T')[0],
      bookingTime: `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${String(i * 10 % 60).padStart(2, '0')}`,
      tests: selectedTests,
      totalTests: selectedTests.length,
      totalAmount: selectedTests.reduce((sum, t) => sum + t.price, 0),
      discountPercent: i % 5 === 0 ? 10 : 0,
      discountReason: i % 5 === 0 ? 'Promotional' : undefined,
      finalAmount: selectedTests.reduce((sum, t) => sum + t.price, 0) * (i % 5 === 0 ? 0.9 : 1),
      paymentStatus: 'Paid' as const,
      status: ['Pending', 'Collected', 'Testing', 'Ready'][Math.floor(Math.random() * 4)] as TokenStatus,
      sample: {
        id: `sample_${i}`,
        sampleID: `SMP-${now.toISOString().split('T')[0].replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
        tokenID: `TOK-${now.toISOString().split('T')[0].replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
        patientID: patient.id,
        sampleType: selectedTests[0].sampleType,
        status: ['Pending', 'Collected', 'Testing', 'Ready'][Math.floor(Math.random() * 4)] as TokenStatus,
        barcode: `SMP-${now.toISOString().split('T')[0].replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
      },
      priority: i % 3 === 0 ? 'Urgent' : 'Normal',
      timeline: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: 'User',
    };
  });
}
