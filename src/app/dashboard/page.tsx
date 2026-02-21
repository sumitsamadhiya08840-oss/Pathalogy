'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Snackbar,
  Alert,
  Switch,
  FormGroup,
  Tooltip,
  Skeleton,
  Autocomplete,
  TextareaAutosize,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  CalendarToday as CalendarTodayIcon,
  DirectionsWalk as DirectionsWalkIcon,
  HourglassEmpty as HourglassEmptyIcon,
  AssignmentLate as AssignmentLateIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  PersonAdd as PersonAddIcon,
  LocalHospital as LocalHospitalIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Science as ScienceIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  Map as MapIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type {
  Appointment,
  HomeCollection,
  HomeCollectionFilter,
  AppointmentStatusFilter,
  PatientFormData,
  SampleCollectionFormData,
  Collector,
} from '@/types/dashboard';
import {
  filterAppointments,
  calculateStats,
  formatCurrency,
  getStatusColor,
  validateMobileNumber,
  validateEmail,
  generateToken,
  formatDateTime,
  exportToCSV,
} from '@/utils/dashboard';

export default function DashboardPage() {
  const router = useRouter();

  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [homeCollections, setHomeCollections] = useState<HomeCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filter states
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>('All');
  const [homeCollectionFilter, setHomeCollectionFilter] = useState<HomeCollectionFilter>('All');

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [assignCollectorDialogOpen, setAssignCollectorDialogOpen] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Selected data states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedHomeCollection, setSelectedHomeCollection] = useState<HomeCollection | null>(null);
  const [selectedReportToken, setSelectedReportToken] = useState<string>('');

  // Form data states
  const [patientFormData, setPatientFormData] = useState<PatientFormData>({
    name: '',
    age: '',
    gender: '',
    mobile: '',
    email: '',
    address: '',
  });

  const [sampleFormData, setSampleFormData] = useState<SampleCollectionFormData>({
    patientId: '',
    patientName: '',
    token: '',
    sampleType: '',
    collectedBy: '',
    collectionTime: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const [assignCollectorData, setAssignCollectorData] = useState({
    collectorId: '',
    estimatedTime: '',
    specialInstructions: '',
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Collectors data
  const collectors: Collector[] = [
    { id: '1', name: 'Sunil Kumar', mobile: '9876543210', available: true, currentAssignments: 2 },
    { id: '2', name: 'Rakesh Sharma', mobile: '9876543211', available: true, currentAssignments: 3 },
    { id: '3', name: 'Amit Singh', mobile: '9876543212', available: true, currentAssignments: 1 },
    { id: '4', name: 'Vijay Patel', mobile: '9876543213', available: false, currentAssignments: 5 },
  ];

  // Staff names for sample collection
  const staffNames = ['Dr. Sharma', 'Lab Tech - Rajesh', 'Lab Tech - Priya', 'Nurse - Sunita'];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAppointments(getDummyAppointments());
      setHomeCollections(getDummyHomeCollections());
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Statistics calculation
  const stats = calculateStats(appointments);
  const todaysRevenue = 45250;

  // Patient registration handler
  const handleRegisterPatient = () => {
    // Validate form
    if (!patientFormData.name || !patientFormData.age || !patientFormData.gender || !patientFormData.mobile) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    if (!validateMobileNumber(patientFormData.mobile)) {
      showSnackbar('Invalid mobile number. Must be 10 digits starting with 6-9', 'error');
      return;
    }

    if (patientFormData.email && !validateEmail(patientFormData.email)) {
      showSnackbar('Invalid email address', 'error');
      return;
    }

    // Success
    showSnackbar(`Patient ${patientFormData.name} registered successfully!`, 'success');
    setRegisterDialogOpen(false);
    setPatientFormData({ name: '', age: '', gender: '', mobile: '', email: '', address: '' });
    loadData();
  };

  // Sample collection handler
  const handleCollectSample = () => {
    if (!sampleFormData.patientName || !sampleFormData.sampleType || !sampleFormData.collectedBy) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    // Update appointment status
    const updatedAppointments = appointments.map(apt =>
      apt.token === sampleFormData.token
        ? { ...apt, status: 'Collected' as const, collectedBy: sampleFormData.collectedBy, collectionTime: sampleFormData.collectionTime }
        : apt
    );
    setAppointments(updatedAppointments);

    showSnackbar(`Sample collected successfully for ${sampleFormData.patientName}`, 'success');
    setSampleDialogOpen(false);
    setSampleFormData({
      patientId: '',
      patientName: '',
      token: '',
      sampleType: '',
      collectedBy: '',
      collectionTime: new Date().toISOString().slice(0, 16),
      notes: '',
    });
  };

  // Open sample collection dialog with pre-filled data
  const openSampleDialog = (appointment?: Appointment) => {
    if (appointment) {
      setSampleFormData({
        patientId: appointment.id,
        patientName: appointment.patientName,
        token: appointment.token,
        sampleType: '',
        collectedBy: '',
        collectionTime: new Date().toISOString().slice(0, 16),
        notes: '',
      });
    }
    setSampleDialogOpen(true);
  };

  // Cancel appointment handler
  const handleCancelAppointment = (appointment: Appointment) => {
    const updatedAppointments = appointments.map(apt =>
      apt.id === appointment.id ? { ...apt, status: 'Cancelled' as const } : apt
    );
    setAppointments(updatedAppointments);
    showSnackbar(`Appointment ${appointment.token} cancelled`, 'info');
    setConfirmDialogOpen(false);
  };

  // Assign collector handler
  const handleAssignCollector = () => {
    if (!assignCollectorData.collectorId) {
      showSnackbar('Please select a collector', 'error');
      return;
    }

    const collector = collectors.find(c => c.id === assignCollectorData.collectorId);
    if (selectedHomeCollection && collector) {
      const updatedCollections = homeCollections.map(hc =>
        hc.id === selectedHomeCollection.id
          ? {
              ...hc,
              status: 'Assigned' as const,
              collectorName: collector.name,
              collectorId: collector.id,
              specialInstructions: assignCollectorData.specialInstructions,
            }
          : hc
      );
      setHomeCollections(updatedCollections);
      showSnackbar(`Collector ${collector.name} assigned successfully`, 'success');
      setAssignCollectorDialogOpen(false);
      setAssignCollectorData({ collectorId: '', estimatedTime: '', specialInstructions: '' });
    }
  };

  // Mark collected handler
  const handleMarkCollected = (homeCollection: HomeCollection) => {
    const updatedCollections = homeCollections.map(hc =>
      hc.id === homeCollection.id
        ? { ...hc, status: 'Collected' as const, collectionTime: new Date().toISOString() }
        : hc
    );
    setHomeCollections(updatedCollections);
    showSnackbar('Sample marked as collected', 'success');
  };

  // Export appointments to CSV
  const handleExportAppointments = () => {
    const exportData = filteredAppointments.map(apt => ({
      Token: apt.token,
      'Patient Name': apt.patientName,
      'Test Name': apt.testName,
      Time: apt.time,
      Status: apt.status,
      'Collected By': apt.collectedBy || 'N/A',
    }));
    exportToCSV(exportData, `appointments_${new Date().toISOString().split('T')[0]}.csv`);
    showSnackbar('Appointments exported successfully', 'success');
  };

  // View route on Google Maps
  const handleViewRoute = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  // Filtered appointments
  const filteredAppointments = filterAppointments(appointments, appointmentSearch, statusFilter);

  // Filtered home collections
  const filteredHomeCollections =
    homeCollectionFilter === 'All'
      ? homeCollections
      : homeCollections.filter(hc => hc.status === homeCollectionFilter);

  // Appointments ready for reports
  const readyForReports = appointments.filter(apt => apt.status === 'Testing' || apt.status === 'Ready');

  // Appointment columns
  const appointmentColumns: GridColDef[] = [
    {
      field: 'token',
      headerName: 'Token',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => {
            setSelectedAppointment(params.row);
            setDetailsDialogOpen(true);
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    { field: 'patientName', headerName: 'Patient Name', width: 180 },
    { field: 'testName', headerName: 'Test Name', width: 200 },
    { field: 'time', headerName: 'Time', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getStatusColor(params.value as string)} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSelectedAppointment(params.row);
              setDetailsDialogOpen(true);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="success"
            onClick={() => openSampleDialog(params.row)}
            disabled={params.row.status !== 'Booked'}
          >
            <ScienceIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setSelectedAppointment(params.row);
              setConfirmDialogOpen(true);
            }}
            disabled={params.row.status === 'Cancelled'}
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Home Collection columns
  const homeCollectionColumns: GridColDef[] = [
    { field: 'token', headerName: 'Token', width: 160 },
    { field: 'patientName', headerName: 'Patient Name', width: 170 },
    {
      field: 'address',
      headerName: 'Address',
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.row.fullAddress} arrow>
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{params.value}</Box>
        </Tooltip>
      ),
    },
    { field: 'scheduledTime', headerName: 'Scheduled Time', width: 140 },
    {
      field: 'collectorName',
      headerName: 'Collector',
      width: 140,
      renderCell: (params: GridRenderCellParams) => params.value || 'Not Assigned',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getStatusColor(params.value as string)} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setSelectedHomeCollection(params.row);
              setAssignCollectorDialogOpen(true);
            }}
            disabled={params.row.status === 'Collected'}
          >
            Assign
          </Button>
          <IconButton size="small" color="primary" onClick={() => handleViewRoute(params.row.fullAddress)}>
            <MapIcon fontSize="small" />
          </IconButton>
          {params.row.status === 'Assigned' && (
            <IconButton size="small" color="success" onClick={() => handleMarkCollected(params.row)}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Box>
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
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
                label="Auto-refresh"
              />
            </FormGroup>
            <IconButton onClick={loadData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Statistics Cards */}
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3, mb: 4 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="rectangular" height={120} />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3, mb: 4 }}>
            <Card
              elevation={3}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
              onClick={() => router.push('/bookings')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Today&apos;s Bookings
                    </Typography>
                    <Typography variant="h4">{stats.todaysBookings}</Typography>
                  </Box>
                  <Box sx={{ color: '#1976d2' }}>
                    <CalendarTodayIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={3}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
              onClick={() => setRegisterDialogOpen(true)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Walk-in Patients
                    </Typography>
                    <Typography variant="h4">{stats.walkInPatients}</Typography>
                  </Box>
                  <Box sx={{ color: '#2e7d32' }}>
                    <DirectionsWalkIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={3}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
              onClick={() => setSampleDialogOpen(true)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Pending Samples
                    </Typography>
                    <Typography variant="h4">{stats.pendingSamples}</Typography>
                  </Box>
                  <Box sx={{ color: '#ed6c02' }}>
                    <HourglassEmptyIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={3}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
              onClick={() => setReportDialogOpen(true)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Pending Reports
                    </Typography>
                    <Typography variant="h4">{stats.pendingReports}</Typography>
                  </Box>
                  <Box sx={{ color: '#d32f2f' }}>
                    <AssignmentLateIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={3}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
              onClick={() => setRevenueDialogOpen(true)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      Today&apos;s Revenue
                    </Typography>
                    <Typography variant="h4">{formatCurrency(todaysRevenue)}</Typography>
                  </Box>
                  <Box sx={{ color: '#9c27b0' }}>
                    <CurrencyRupeeIcon sx={{ fontSize: 40 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Quick Actions */}
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={() => setRegisterDialogOpen(true)}
                size="large"
              >
                Register Walk-in Patient
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<LocalHospitalIcon />}
                onClick={() => setSampleDialogOpen(true)}
                size="large"
              >
                Collect Sample
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<DescriptionIcon />}
                onClick={() => setReportDialogOpen(true)}
                size="large"
              >
                Generate Report
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6">Today&apos;s Appointments</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search appointments..."
                  value={appointmentSearch}
                  onChange={e => setAppointmentSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value as AppointmentStatusFilter)}>
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Booked">Booked</MenuItem>
                    <MenuItem value="Collected">Collected</MenuItem>
                    <MenuItem value="Testing">Testing</MenuItem>
                    <MenuItem value="Ready">Ready</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
                <Button startIcon={<FileDownloadIcon />} onClick={handleExportAppointments} variant="outlined">
                  Export CSV
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : filteredAppointments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No appointments found</Typography>
              </Box>
            ) : (
              <DataGrid
                rows={filteredAppointments}
                columns={appointmentColumns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
              />
            )}
          </CardContent>
        </Card>

        {/* Home Collection */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6">Home Collection - Today</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['All', 'Pending', 'Assigned', 'Collected'] as HomeCollectionFilter[]).map(filter => (
                  <Chip
                    key={filter}
                    label={filter}
                    onClick={() => setHomeCollectionFilter(filter)}
                    color={homeCollectionFilter === filter ? 'primary' : 'default'}
                    variant={homeCollectionFilter === filter ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : filteredHomeCollections.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No home collections found</Typography>
              </Box>
            ) : (
              <DataGrid
                rows={filteredHomeCollections}
                columns={homeCollectionColumns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Patient Registration Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Register Walk-in Patient
          <IconButton
            onClick={() => setRegisterDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Patient Name"
              required
              fullWidth
              value={patientFormData.name}
              onChange={e => setPatientFormData({ ...patientFormData, name: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Age"
                required
                type="number"
                value={patientFormData.age}
                onChange={e => setPatientFormData({ ...patientFormData, age: e.target.value })}
                sx={{ flex: 1 }}
              />
              <FormControl required sx={{ flex: 1 }}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={patientFormData.gender}
                  label="Gender"
                  onChange={e => setPatientFormData({ ...patientFormData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Mobile Number"
              required
              fullWidth
              value={patientFormData.mobile}
              onChange={e => setPatientFormData({ ...patientFormData, mobile: e.target.value })}
              helperText="10 digits starting with 6-9"
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={patientFormData.email}
              onChange={e => setPatientFormData({ ...patientFormData, email: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={patientFormData.address}
              onChange={e => setPatientFormData({ ...patientFormData, address: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRegisterPatient} variant="contained">
            Register Patient
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sample Collection Dialog */}
      <Dialog open={sampleDialogOpen} onClose={() => setSampleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Collect Sample
          <IconButton
            onClick={() => setSampleDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Autocomplete
              options={appointments.filter(apt => apt.status === 'Booked')}
              getOptionLabel={option => `${option.patientName} - ${option.token}`}
              value={appointments.find(apt => apt.token === sampleFormData.token) || null}
              onChange={(e, value) => {
                if (value) {
                  setSampleFormData({
                    ...sampleFormData,
                    patientId: value.id,
                    patientName: value.patientName,
                    token: value.token,
                  });
                }
              }}
              renderInput={params => <TextField {...params} label="Search Patient" required />}
            />
            <TextField
              label="Token Number"
              fullWidth
              value={sampleFormData.token}
              InputProps={{ readOnly: true }}
            />
            <FormControl required fullWidth>
              <InputLabel>Sample Type</InputLabel>
              <Select
                value={sampleFormData.sampleType}
                label="Sample Type"
                onChange={e => setSampleFormData({ ...sampleFormData, sampleType: e.target.value as 'Blood' | 'Urine' | 'Stool' })}
              >
                <MenuItem value="Blood">Blood</MenuItem>
                <MenuItem value="Urine">Urine</MenuItem>
                <MenuItem value="Stool">Stool</MenuItem>
              </Select>
            </FormControl>
            <FormControl required fullWidth>
              <InputLabel>Collected By</InputLabel>
              <Select
                value={sampleFormData.collectedBy}
                label="Collected By"
                onChange={e => setSampleFormData({ ...sampleFormData, collectedBy: e.target.value })}
              >
                {staffNames.map(name => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Collection Time"
              type="datetime-local"
              fullWidth
              value={sampleFormData.collectionTime}
              onChange={e => setSampleFormData({ ...sampleFormData, collectionTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={sampleFormData.notes}
              onChange={e => setSampleFormData({ ...sampleFormData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSampleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCollectSample} variant="contained" color="success">
            Collect Sample
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Generate Report
          <IconButton
            onClick={() => setReportDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Select a sample ready for report generation:
          </Typography>
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <RadioGroup value={selectedReportToken} onChange={e => setSelectedReportToken(e.target.value)}>
              {readyForReports.length === 0 ? (
                <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No samples ready for reports
                </Typography>
              ) : (
                readyForReports.map(apt => (
                  <FormControlLabel
                    key={apt.id}
                    value={apt.token}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {apt.token}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {apt.patientName} - {apt.testName}
                        </Typography>
                      </Box>
                    }
                  />
                ))
              )}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedReportToken) {
                router.push(`/reports/generate?token=${selectedReportToken}`);
              } else {
                showSnackbar('Please select a sample', 'warning');
              }
            }}
            variant="contained"
            disabled={!selectedReportToken}
          >
            Proceed to Report Generation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Appointment Details
          <IconButton
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAppointment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Token Number
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedAppointment.token}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Patient Information
                </Typography>
                <Typography variant="body1">{selectedAppointment.patientName}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Age: {selectedAppointment.patientAge} | Mobile: {selectedAppointment.patientMobile}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Test Details
                </Typography>
                <Typography variant="body1">{selectedAppointment.testName}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Appointment Time
                </Typography>
                <Typography variant="body1">{selectedAppointment.time}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Booking Time
                </Typography>
                <Typography variant="body1">{selectedAppointment.bookingTime}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip label={selectedAppointment.status} color={getStatusColor(selectedAppointment.status)} />
                </Box>
              </Box>
              {selectedAppointment.collectedBy && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Sample Collection
                    </Typography>
                    <Typography variant="body2">Collected by: {selectedAppointment.collectedBy}</Typography>
                    <Typography variant="body2">Time: {selectedAppointment.collectionTime}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Collector Dialog */}
      <Dialog open={assignCollectorDialogOpen} onClose={() => setAssignCollectorDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Collector
          <IconButton
            onClick={() => setAssignCollectorDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {selectedHomeCollection && (
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 1 }}>
                <Typography variant="body2">
                  <strong>Patient:</strong> {selectedHomeCollection.patientName}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {selectedHomeCollection.fullAddress}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {selectedHomeCollection.scheduledTime}
                </Typography>
              </Box>
            )}
            <FormControl required fullWidth>
              <InputLabel>Select Collector</InputLabel>
              <Select
                value={assignCollectorData.collectorId}
                label="Select Collector"
                onChange={e => setAssignCollectorData({ ...assignCollectorData, collectorId: e.target.value })}
              >
                {collectors
                  .filter(c => c.available)
                  .map(collector => (
                    <MenuItem key={collector.id} value={collector.id}>
                      {collector.name} - {collector.currentAssignments} assignments
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              label="Estimated Time"
              type="time"
              fullWidth
              value={assignCollectorData.estimatedTime}
              onChange={e => setAssignCollectorData({ ...assignCollectorData, estimatedTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Special Instructions"
              fullWidth
              multiline
              rows={3}
              value={assignCollectorData.specialInstructions}
              onChange={e => setAssignCollectorData({ ...assignCollectorData, specialInstructions: e.target.value })}
              placeholder="Any special instructions for the collector..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignCollectorDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignCollector} variant="contained">
            Assign Collector
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revenue Breakdown Dialog */}
      <Dialog open={revenueDialogOpen} onClose={() => setRevenueDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Today&apos;s Revenue Breakdown
          <IconButton
            onClick={() => setRevenueDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Lab Tests</Typography>
              <Typography fontWeight="bold">₹38,500</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Home Collections</Typography>
              <Typography fontWeight="bold">₹5,250</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Reports</Typography>
              <Typography fontWeight="bold">₹1,500</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="h6">Total Revenue</Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(todaysRevenue)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevenueDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel appointment {selectedAppointment?.token}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>No</Button>
          <Button
            onClick={() => selectedAppointment && handleCancelAppointment(selectedAppointment)}
            variant="contained"
            color="error"
          >
            Yes, Cancel
          </Button>
        </DialogActions>
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
function getDummyAppointments(): Appointment[] {
  return [
    { id: '1', token: 'TOK-20260204-0001', patientName: 'Rajesh Kumar', patientAge: 45, patientMobile: '9876543210', testName: 'Complete Blood Count', time: '09:00 AM', bookingTime: '08:15 AM', status: 'Booked' },
    { id: '2', token: 'TOK-20260204-0002', patientName: 'Priya Sharma', patientAge: 32, patientMobile: '9876543211', testName: 'Lipid Profile', time: '09:30 AM', bookingTime: '08:30 AM', status: 'Collected', collectedBy: 'Lab Tech - Rajesh', collectionTime: '09:35 AM' },
    { id: '3', token: 'TOK-20260204-0003', patientName: 'Amit Patel', patientAge: 28, patientMobile: '9876543212', testName: 'Thyroid Function Test', time: '10:00 AM', bookingTime: '09:00 AM', status: 'Testing' },
    { id: '4', token: 'TOK-20260204-0004', patientName: 'Sunita Verma', patientAge: 55, patientMobile: '9876543213', testName: 'HbA1c', time: '10:30 AM', bookingTime: '09:15 AM', status: 'Ready' },
    { id: '5', token: 'TOK-20260204-0005', patientName: 'Vikram Singh', patientAge: 38, patientMobile: '9876543214', testName: 'Liver Function Test', time: '11:00 AM', bookingTime: '09:30 AM', status: 'Booked' },
    { id: '6', token: 'TOK-20260204-0006', patientName: 'Meena Gupta', patientAge: 42, patientMobile: '9876543215', testName: 'Urine Routine', time: '11:30 AM', bookingTime: '10:00 AM', status: 'Collected', collectedBy: 'Nurse - Sunita', collectionTime: '11:35 AM' },
    { id: '7', token: 'TOK-20260204-0007', patientName: 'Rahul Mehta', patientAge: 50, patientMobile: '9876543216', testName: 'Kidney Function Test', time: '12:00 PM', bookingTime: '10:15 AM', status: 'Testing' },
    { id: '8', token: 'TOK-20260204-0008', patientName: 'Kavita Desai', patientAge: 35, patientMobile: '9876543217', testName: 'Vitamin D', time: '12:30 PM', bookingTime: '10:30 AM', status: 'Booked' },
    { id: '9', token: 'TOK-20260204-0009', patientName: 'Suresh Reddy', patientAge: 60, patientMobile: '9876543218', testName: 'Blood Sugar Fasting', time: '01:00 PM', bookingTime: '11:00 AM', status: 'Ready' },
    { id: '10', token: 'TOK-20260204-0010', patientName: 'Anjali Joshi', patientAge: 29, patientMobile: '9876543219', testName: 'Complete Blood Count', time: '01:30 PM', bookingTime: '11:15 AM', status: 'Collected', collectedBy: 'Lab Tech - Priya', collectionTime: '01:35 PM' },
    { id: '11', token: 'TOK-20260204-0011', patientName: 'Ramesh Nair', patientAge: 47, patientMobile: '9876543220', testName: 'Cholesterol Test', time: '02:00 PM', bookingTime: '11:30 AM', status: 'Booked' },
    { id: '12', token: 'TOK-20260204-0012', patientName: 'Deepa Iyer', patientAge: 33, patientMobile: '9876543221', testName: 'Hemoglobin Test', time: '02:30 PM', bookingTime: '12:00 PM', status: 'Testing' },
    { id: '13', token: 'TOK-20260204-0013', patientName: 'Arun Kumar', patientAge: 52, patientMobile: '9876543222', testName: 'Blood Pressure Check', time: '03:00 PM', bookingTime: '12:15 PM', status: 'Booked' },
    { id: '14', token: 'TOK-20260204-0014', patientName: 'Pooja Kapoor', patientAge: 26, patientMobile: '9876543223', testName: 'Pregnancy Test', time: '03:30 PM', bookingTime: '12:30 PM', status: 'Collected', collectedBy: 'Nurse - Sunita', collectionTime: '03:35 PM' },
    { id: '15', token: 'TOK-20260204-0015', patientName: 'Manoj Tiwari', patientAge: 41, patientMobile: '9876543224', testName: 'Allergy Test', time: '04:00 PM', bookingTime: '01:00 PM', status: 'Booked' },
  ];
}

function getDummyHomeCollections(): HomeCollection[] {
  return [
    { id: '1', token: 'HC-20260204-0001', patientName: 'Ramesh Agarwal', patientMobile: '9876543225', address: 'A-101, Green Valley...', fullAddress: 'A-101, Green Valley Apartments, Sector 15, Noida', scheduledTime: '08:00 AM', collectorName: 'Sunil Kumar', collectorId: '1', status: 'Assigned' },
    { id: '2', token: 'HC-20260204-0002', patientName: 'Geeta Malhotra', patientMobile: '9876543226', address: 'B-205, Sunrise Heights...', fullAddress: 'B-205, Sunrise Heights, MG Road, Gurgaon', scheduledTime: '09:00 AM', collectorName: null, collectorId: null, status: 'Pending' },
    { id: '3', token: 'HC-20260204-0003', patientName: 'Manoj Tiwari', patientMobile: '9876543227', address: 'C-45, Lake View Colony...', fullAddress: 'C-45, Lake View Colony, Near City Mall, Delhi', scheduledTime: '10:00 AM', collectorName: 'Rakesh Sharma', collectorId: '2', status: 'Collected', collectionTime: '10:15 AM' },
    { id: '4', token: 'HC-20260204-0004', patientName: 'Deepa Nair', patientMobile: '9876543228', address: 'D-78, Palm Grove...', fullAddress: 'D-78, Palm Grove, Whitefield, Bangalore', scheduledTime: '11:00 AM', collectorName: null, collectorId: null, status: 'Pending' },
    { id: '5', token: 'HC-20260204-0005', patientName: 'Kiran Bose', patientMobile: '9876543229', address: 'E-12, Royal Residency...', fullAddress: 'E-12, Royal Residency, JP Nagar, Bangalore', scheduledTime: '12:00 PM', collectorName: 'Sunil Kumar', collectorId: '1', status: 'Assigned' },
    { id: '6', token: 'HC-20260204-0006', patientName: 'Arun Rao', patientMobile: '9876543230', address: 'F-90, Silver Oaks...', fullAddress: 'F-90, Silver Oaks, Electronic City, Bangalore', scheduledTime: '02:00 PM', collectorName: 'Rakesh Sharma', collectorId: '2', status: 'Collected', collectionTime: '02:10 PM' },
    { id: '7', token: 'HC-20260204-0007', patientName: 'Pooja Iyer', patientMobile: '9876543231', address: 'G-23, Brigade Gateway...', fullAddress: 'G-23, Brigade Gateway, Rajaji Nagar, Bangalore', scheduledTime: '03:00 PM', collectorName: null, collectorId: null, status: 'Pending' },
    { id: '8', token: 'HC-20260204-0008', patientName: 'Vijay Chopra', patientMobile: '9876543232', address: 'H-56, Prestige Park View...', fullAddress: 'H-56, Prestige Park View, Koramangala, Bangalore', scheduledTime: '04:00 PM', collectorName: 'Sunil Kumar', collectorId: '1', status: 'Assigned' },
    { id: '9', token: 'HC-20260204-0009', patientName: 'Sneha Kapoor', patientMobile: '9876543233', address: 'I-34, DLF Phase 3...', fullAddress: 'I-34, DLF Phase 3, Gurgaon', scheduledTime: '05:00 PM', collectorName: null, collectorId: null, status: 'Pending' },
    { id: '10', token: 'HC-20260204-0010', patientName: 'Ravi Shankar', patientMobile: '9876543234', address: 'J-89, Cyber City...', fullAddress: 'J-89, Cyber City, Hitech City, Hyderabad', scheduledTime: '06:00 PM', collectorName: 'Amit Singh', collectorId: '3', status: 'Assigned' },
  ];
}
