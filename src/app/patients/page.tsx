'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Divider,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Badge,
  Tooltip,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  FileDownload as FileDownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  ConfirmationNumber as ConfirmationNumberIcon,
  Print as PrintIcon,
  GetApp as GetAppIcon,
  AddCircle as AddCircleIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { Patient, OnlineBooking, SearchTabType, PatientFormData } from '@/types/patient';
import { BLOOD_GROUPS, INDIAN_STATES, CHRONIC_CONDITIONS } from '@/types/patient';
import {
  validatePatientForm,
} from '@/utils/patientValidation';
import {
  generatePatientId,
  formatPatientName,
  getAvatarInitials,
  formatPhoneNumber,
  generateToken,
  exportToExcel,
  printPatientCard,
  formatDate,
  getStatusColor,
  debounce,
  searchPatientsByName,
  searchPatientsByMobile,
  searchPatientsByToken,
  searchPatientsByHealthId,
  filterByAgeRange,
  filterByGender,
  filterByRegistrationDate,
  filterByVisitStatus,
} from '@/utils/patientHelpers';
import type { FormLabel } from '@mui/material';

export default function PatientsPage() {
  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [onlineBookings, setOnlineBookings] = useState<OnlineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTab, setSearchTab] = useState<SearchTabType>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Dialog states
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [patientDetailsDialogOpen, setPatientDetailsDialogOpen] = useState(false);
  const [onlineBookingsDialogOpen, setOnlineBookingsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter states
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    ageFrom: '',
    ageTo: '',
    gender: '',
    registrationDateFrom: '',
    registrationDateTo: '',
    visitStatus: '',
  });

  // Form state
  const [formData, setFormData] = useState<PatientFormData>({
    fullName: '',
    age: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    mobileNumber: '',
    alternateMobile: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: '',
    aadharNumber: '',
    healthId: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactMobile: '',
    allergies: '',
    chronicConditions: [],
    currentMedications: '',
    previousSurgeries: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setPatients(getDummyPatients());
      setOnlineBookings(getDummyOnlineBookings());
      setSearchResults(getDummyPatients());
      setLoading(false);
    }, 1000);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Debounced search
  const handleSearch = useCallback(
    debounce((query: string) => {
      let results: Patient[] = patients;

      if (query) {
        switch (searchTab) {
          case 'name':
            results = searchPatientsByName(results, query);
            break;
          case 'mobile':
            results = searchPatientsByMobile(results, query);
            break;
          case 'token':
            results = searchPatientsByToken(results, query);
            break;
          case 'healthId':
            results = searchPatientsByHealthId(results, query);
            break;
        }
      }

      // Apply advanced filters
      if (filters.ageFrom) {
        results = filterByAgeRange(results, parseInt(filters.ageFrom), undefined);
      }
      if (filters.ageTo) {
        results = filterByAgeRange(results, undefined, parseInt(filters.ageTo));
      }
      if (filters.gender) {
        results = filterByGender(results, filters.gender);
      }
      if (filters.registrationDateFrom || filters.registrationDateTo) {
        results = filterByRegistrationDate(results, filters.registrationDateFrom, filters.registrationDateTo);
      }
      if (filters.visitStatus) {
        results = filterByVisitStatus(results, filters.visitStatus);
      }

      setSearchResults(results);
    }, 300),
    [patients, searchTab, filters]
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, searchTab, filters, handleSearch]);

  // Handle form input changes
  const handleFormChange = (field: keyof PatientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate and save patient
  const handleSavePatient = () => {
    const validation = validatePatientForm(formData);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    if (isEditMode && selectedPatient) {
      // Update existing patient
      const updatedPatient: Patient = {
        ...selectedPatient,
        fullName: formatPatientName(formData.fullName),
        age: parseInt(formData.age),
        dateOfBirth: formData.dateOfBirth,
        gender: (formData.gender as 'Male' | 'Female' | 'Other') || 'Other',
        bloodGroup: (formData.bloodGroup as any) || undefined,
        mobileNumber: formData.mobileNumber,
        alternateMobile: formData.alternateMobile || undefined,
        email: formData.email || undefined,
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2 || undefined,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
        },
        identification: {
          aadharNumber: formData.aadharNumber || undefined,
          healthId: formData.healthId || undefined,
        },
        emergencyContact: {
          name: formData.emergencyContactName || undefined,
          relationship: (formData.emergencyContactRelationship as any) || undefined,
          mobileNumber: formData.emergencyContactMobile || undefined,
        },
        medicalInfo: {
          allergies: formData.allergies || undefined,
          chronicConditions: formData.chronicConditions,
          currentMedications: formData.currentMedications || undefined,
          previousSurgeries: formData.previousSurgeries || undefined,
        },
      };

      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      setSearchResults(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      showSnackbar(`Patient ${updatedPatient.fullName} updated successfully!`, 'success');
    } else {
      // Add new patient
      const newPatient: Patient = {
        id: generatePatientId(),
        patientId: generatePatientId(),
        fullName: formatPatientName(formData.fullName),
        age: parseInt(formData.age),
        dateOfBirth: formData.dateOfBirth,
        gender: (formData.gender as 'Male' | 'Female' | 'Other') || 'Other',
        bloodGroup: (formData.bloodGroup as any) || undefined,
        mobileNumber: formData.mobileNumber,
        alternateMobile: formData.alternateMobile || undefined,
        email: formData.email || undefined,
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2 || undefined,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
        },
        identification: {
          aadharNumber: formData.aadharNumber || undefined,
          healthId: formData.healthId || undefined,
        },
        emergencyContact: {
          name: formData.emergencyContactName || undefined,
          relationship: (formData.emergencyContactRelationship as any) || undefined,
          mobileNumber: formData.emergencyContactMobile || undefined,
        },
        medicalInfo: {
          allergies: formData.allergies || undefined,
          chronicConditions: formData.chronicConditions,
          currentMedications: formData.currentMedications || undefined,
          previousSurgeries: formData.previousSurgeries || undefined,
        },
        registrationDate: new Date().toISOString().split('T')[0],
        totalVisits: 0,
        status: 'Active',
        visitHistory: [],
      };

      setPatients(prev => [...prev, newPatient]);
      setSearchResults(prev => [...prev, newPatient]);
      showSnackbar(`Patient ${newPatient.fullName} registered successfully with ID: ${newPatient.patientId}`, 'success');
    }
    
    setAddPatientDialogOpen(false);
    setIsEditMode(false);
    setSelectedPatient(null);
    setFormData({
      fullName: '',
      age: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      mobileNumber: '',
      alternateMobile: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pinCode: '',
      aadharNumber: '',
      healthId: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactMobile: '',
      allergies: '',
      chronicConditions: [],
      currentMedications: '',
      previousSurgeries: '',
    });
    setFormErrors({});
  };

  // Handle import online booking
  const handleImportOnlineBooking = (booking: OnlineBooking) => {
    const newPatient: Patient = {
      id: generatePatientId(),
      patientId: generatePatientId(),
      fullName: formatPatientName(booking.patientName),
      age: 35,
      dateOfBirth: '',
      gender: 'Other',
      mobileNumber: booking.mobileNumber,
      email: booking.email,
      address: { line1: '', city: '', state: '', pinCode: '' },
      identification: {},
      emergencyContact: {},
      medicalInfo: {},
      registrationDate: new Date().toISOString().split('T')[0],
      totalVisits: 0,
      status: 'Active',
      visitHistory: [],
    };

    setPatients(prev => [...prev, newPatient]);
    setSearchResults(prev => [...prev, newPatient]);

    setOnlineBookings(prev =>
      prev.map(b => (b.id === booking.id ? { ...b, status: 'Imported' as const } : b))
    );

    showSnackbar(
      `Booking for ${booking.patientName} imported successfully. Token: ${generateToken()}`,
      'success'
    );
  };

  // DataGrid columns
  const patientColumns: GridColDef[] = [
    {
      field: 'patientId',
      headerName: 'Patient ID',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'fullName',
      headerName: 'Name',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {getAvatarInitials(params.value)}
          </Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'age',
      headerName: 'Age / Gender',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.row.age} / {params.row.gender[0]}
        </Typography>
      ),
    },
    {
      field: 'mobileNumber',
      headerName: 'Mobile',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">{formatPhoneNumber(params.value)}</Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" noWrap>
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'city',
      headerName: 'City',
      width: 120,
      valueGetter: (_value, row) => row.address?.city || '—',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'totalVisits',
      headerName: 'Total Visits',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value || 0} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getStatusColor(params.value as string)} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setSelectedPatient(params.row);
                setPatientDetailsDialogOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Patient">
            <IconButton 
              size="small" 
              color="info"
              onClick={() => {
                setSelectedPatient(params.row);
                setFormData({
                  fullName: params.row.fullName,
                  age: params.row.age.toString(),
                  dateOfBirth: params.row.dateOfBirth,
                  gender: params.row.gender,
                  bloodGroup: params.row.bloodGroup || '',
                  mobileNumber: params.row.mobileNumber,
                  alternateMobile: params.row.alternateMobile || '',
                  email: params.row.email || '',
                  addressLine1: params.row.address.line1,
                  addressLine2: params.row.address.line2 || '',
                  city: params.row.address.city,
                  state: params.row.address.state,
                  pinCode: params.row.address.pinCode,
                  aadharNumber: params.row.identification?.aadharNumber || '',
                  healthId: params.row.identification?.healthId || '',
                  emergencyContactName: params.row.emergencyContact?.name || '',
                  emergencyContactRelationship: params.row.emergencyContact?.relationship || '',
                  emergencyContactMobile: params.row.emergencyContact?.mobileNumber || '',
                  allergies: params.row.medicalInfo?.allergies || '',
                  chronicConditions: params.row.medicalInfo?.chronicConditions || [],
                  currentMedications: params.row.medicalInfo?.currentMedications || '',
                  previousSurgeries: params.row.medicalInfo?.previousSurgeries || '',
                });
                setIsEditMode(true);
                setAddPatientDialogOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const onlineBookingColumns: GridColDef[] = [
    { field: 'bookingId', headerName: 'Booking ID', width: 140 },
    { field: 'patientName', headerName: 'Patient Name', width: 180 },
    { field: 'mobileNumber', headerName: 'Mobile', width: 130, renderCell: (p: GridRenderCellParams) => formatPhoneNumber(p.value) },
    { field: 'testBooked', headerName: 'Test Booked', width: 180 },
    {
      field: 'paymentStatus',
      headerName: 'Payment',
      width: 120,
      renderCell: (p: GridRenderCellParams) => <Chip label={p.value} color={getStatusColor(p.value as string)} size="small" />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => handleImportOnlineBooking(p.row)}
            disabled={p.row.status === 'Imported'}
          >
            {p.row.status === 'Imported' ? 'Imported' : 'Import'}
          </Button>
        </Box>
      ),
    },
  ];

  const pendingBookingsCount = onlineBookings.filter(b => b.status === 'Pending').length;

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4"
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Patient Registration & Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Badge badgeContent={pendingBookingsCount} color="error">
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setOnlineBookingsDialogOpen(true)}
              >
                Import Online Bookings
              </Button>
            </Badge>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setIsEditMode(false);
                setSelectedPatient(null);
                setAddPatientDialogOpen(true);
              }}
            >
              Add New Patient
            </Button>
          </Box>
        </Box>

        {/* Search Section */}
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Tabs value={searchTab} onChange={(e, value) => setSearchTab(value as SearchTabType)} sx={{ mb: 2 }}>
              <Tab label="Search by Name" value="name" />
              <Tab label="Search by Mobile" value="mobile" icon={<PhoneIcon />} iconPosition="start" />
              <Tab label="Search by Token" value="token" icon={<ConfirmationNumberIcon />} iconPosition="start" />
              <Tab label="Search by Health ID" value="healthId" icon={<BadgeIcon />} iconPosition="start" />
            </Tabs>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder={
                  searchTab === 'name'
                    ? 'Search by patient name...'
                    : searchTab === 'mobile'
                      ? 'Enter mobile number...'
                      : searchTab === 'token'
                        ? 'Enter token...'
                        : 'Enter Health ID...'
                }
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
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ ageFrom: '', ageTo: '', gender: '', registrationDateFrom: '', registrationDateTo: '', visitStatus: '' });
                }}
              >
                Clear
              </Button>
            </Box>

            {/* Advanced Filters */}
            <Accordion expanded={advancedFiltersOpen} onChange={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Advanced Filters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 150px' }}>
                    <TextField
                      label="Age From"
                      type="number"
                      size="small"
                      fullWidth
                      value={filters.ageFrom}
                      onChange={e => setFilters(prev => ({ ...prev, ageFrom: e.target.value }))}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 150px' }}>
                    <TextField
                      label="Age To"
                      type="number"
                      size="small"
                      fullWidth
                      value={filters.ageTo}
                      onChange={e => setFilters(prev => ({ ...prev, ageTo: e.target.value }))}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 150px' }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={filters.gender}
                        label="Gender"
                        onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>

        {/* Search Results */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Search Results ({searchResults.length} patients found)
              </Typography>
              <Button
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  exportToExcel(searchResults);
                  showSnackbar('Patients exported to Excel', 'success');
                }}
                variant="outlined"
                size="small"
              >
                Export Excel
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : searchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No patients found</Typography>
              </Box>
            ) : (
              <DataGrid
                rows={searchResults}
                columns={patientColumns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25, page: 0 },
                  },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                autoHeight
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Add/Edit Patient Dialog */}
      <Dialog 
        open={addPatientDialogOpen} 
        onClose={() => {
          setAddPatientDialogOpen(false);
          setIsEditMode(false);
          setSelectedPatient(null);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'Edit Patient' : 'Add New Patient'}
          <IconButton
            onClick={() => {
              setAddPatientDialogOpen(false);
              setIsEditMode(false);
              setSelectedPatient(null);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Section 1: Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Basic Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Full Name"
                  required
                  fullWidth
                  value={formData.fullName}
                  onChange={e => handleFormChange('fullName', e.target.value)}
                  error={!!formErrors.fullName}
                  helperText={formErrors.fullName}
                />
                <TextField
                  label="Age"
                  type="number"
                  required
                  fullWidth
                  value={formData.age}
                  onChange={e => handleFormChange('age', e.target.value)}
                  error={!!formErrors.age}
                  helperText={formErrors.age}
                />
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={formData.dateOfBirth}
                  onChange={e => handleFormChange('dateOfBirth', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl required fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender}
                    label="Gender"
                    onChange={e => handleFormChange('gender', e.target.value)}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    value={formData.bloodGroup}
                    label="Blood Group"
                    onChange={e => handleFormChange('bloodGroup', e.target.value)}
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <MenuItem key={bg} value={bg}>
                        {bg}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* Section 2: Contact Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Mobile Number"
                    required
                    fullWidth
                    value={formData.mobileNumber}
                    onChange={e => handleFormChange('mobileNumber', e.target.value)}
                    error={!!formErrors.mobileNumber}
                    helperText={formErrors.mobileNumber || '10 digits'}
                  />
                  <TextField
                    label="Alternate Mobile"
                    fullWidth
                    value={formData.alternateMobile}
                    onChange={e => handleFormChange('alternateMobile', e.target.value)}
                  />
                </Box>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={e => handleFormChange('email', e.target.value)}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
                <TextField
                  label="Address Line 1"
                  required
                  fullWidth
                  value={formData.addressLine1}
                  onChange={e => handleFormChange('addressLine1', e.target.value)}
                  error={!!formErrors.addressLine1}
                  helperText={formErrors.addressLine1}
                />
                <TextField
                  label="Address Line 2"
                  fullWidth
                  value={formData.addressLine2}
                  onChange={e => handleFormChange('addressLine2', e.target.value)}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="City"
                    required
                    fullWidth
                    value={formData.city}
                    onChange={e => handleFormChange('city', e.target.value)}
                    error={!!formErrors.city}
                    helperText={formErrors.city}
                  />
                  <FormControl required fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      value={formData.state}
                      label="State"
                      onChange={e => handleFormChange('state', e.target.value)}
                    >
                      {INDIAN_STATES.map(state => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="PIN Code"
                    required
                    fullWidth
                    value={formData.pinCode}
                    onChange={e => handleFormChange('pinCode', e.target.value)}
                    error={!!formErrors.pinCode}
                    helperText={formErrors.pinCode || '6 digits'}
                  />
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Section 3: Medical Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Medical Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Known Allergies"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.allergies}
                  onChange={e => handleFormChange('allergies', e.target.value)}
                />
                <TextField
                  label="Current Medications"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.currentMedications}
                  onChange={e => handleFormChange('currentMedications', e.target.value)}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddPatientDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePatient} variant="contained">
            Save Patient
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Details Dialog */}
      <Dialog open={patientDetailsDialogOpen} onClose={() => setPatientDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Patient Details
          <IconButton
            onClick={() => setPatientDetailsDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPatient && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                  {getAvatarInitials(selectedPatient.fullName)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedPatient.fullName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedPatient.patientId}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Age / Gender
                  </Typography>
                  <Typography>{selectedPatient.age} / {selectedPatient.gender}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Blood Group
                  </Typography>
                  <Typography>{selectedPatient.bloodGroup || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Mobile
                  </Typography>
                  <Typography>{formatPhoneNumber(selectedPatient.mobileNumber)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Email
                  </Typography>
                  <Typography>{selectedPatient.email || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    City
                  </Typography>
                  <Typography>{selectedPatient.address.city}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    State
                  </Typography>
                  <Typography>{selectedPatient.address.state}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Total Visits
                  </Typography>
                  <Typography>
                    <Chip 
                      label={selectedPatient.totalVisits || 0} 
                      size="small" 
                      color="primary" 
                    />
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Registration Date
                  </Typography>
                  <Typography>{formatDate(selectedPatient.registrationDate)}</Typography>
                </Box>
                <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                  <Typography variant="caption" color="textSecondary">
                    Full Address
                  </Typography>
                  <Typography>
                    {selectedPatient.address.line1}
                    {selectedPatient.address.line2 && `, ${selectedPatient.address.line2}`}, {selectedPatient.address.city}, {selectedPatient.address.state} - {selectedPatient.address.pinCode}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientDetailsDialogOpen(false)}>Close</Button>
          {selectedPatient && (
            <Button
              onClick={() => printPatientCard(selectedPatient)}
              startIcon={<PrintIcon />}
              variant="outlined"
            >
              Print Card
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Online Bookings Import Dialog */}
      <Dialog open={onlineBookingsDialogOpen} onClose={() => setOnlineBookingsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Import Online Bookings
          <IconButton
            onClick={() => setOnlineBookingsDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={onlineBookings}
              columns={onlineBookingColumns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              autoHeight
              disableRowSelectionOnClick
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

// Dummy data functions
function getDummyPatients(): Patient[] {
  const patients: Patient[] = [];

  const firstNames = ['Rajesh', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Meena', 'Rahul', 'Kavita', 'Suresh', 'Anjali'];
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Verma', 'Singh', 'Gupta', 'Mehta', 'Desai', 'Reddy', 'Joshi'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Gurgaon'];

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const age = Math.floor(Math.random() * 60) + 20;

    patients.push({
      id: `pat_${i + 1}`,
      patientId: `PAT-${String(i + 1).padStart(6, '0')}`,
      fullName: `${firstName} ${lastName}`,
      age,
      dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - age)).toISOString().split('T')[0],
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      bloodGroup: ['A+', 'B+', 'O+'][Math.floor(Math.random() * 3)] as any,
      mobileNumber: `98765432${String(i).padStart(2, '0')}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      address: {
        line1: `${i + 100} Main Street`,
        city: cities[Math.floor(Math.random() * cities.length)],
        state: 'Maharashtra',
        pinCode: `40000${String(i).padStart(1, '0')}`,
      },
      identification: {},
      emergencyContact: {},
      medicalInfo: {},
      registrationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalVisits: Math.floor(Math.random() * 10),
      status: 'Active',
      visitHistory: [],
    });
  }

  return patients;
}

function getDummyOnlineBookings(): OnlineBooking[] {
  const bookings: OnlineBooking[] = [];
  const firstNames = ['Arun', 'Neha', 'Vikas', 'Pooja', 'Ramesh', 'Deepa', 'Kiran', 'Sneha', 'Manoj', 'Ravi'];
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Verma', 'Singh', 'Gupta', 'Mehta', 'Desai', 'Reddy', 'Joshi'];
  const tests = ['Complete Blood Count', 'Lipid Profile', 'Thyroid Function', 'Blood Sugar'];

  for (let i = 0; i < 10; i++) {
    bookings.push({
      id: `booking_${i + 1}`,
      bookingId: `BK-${String(i + 1).padStart(4, '0')}`,
      patientName: `${firstNames[i]} ${lastNames[i]}`,
      mobileNumber: `98765432${String(i).padStart(2, '0')}`,
      email: `${firstNames[i].toLowerCase()}@example.com`,
      testBooked: tests[Math.floor(Math.random() * tests.length)],
      bookingTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      paymentStatus: Math.random() > 0.3 ? 'Paid' : 'Pending',
      paymentAmount: Math.floor(Math.random() * 5000) + 500,
      status: 'Pending',
    });
  }

  return bookings;
}
