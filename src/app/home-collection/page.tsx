'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Tabs,
  Tab,
  Grid,
  Avatar,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Skeleton,
  Paper,
  Stack,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  LocalShipping as TruckIcon,
  PersonAdd as AssignIcon,
  CheckCircle as CollectedIcon,
  Science as LabIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Map as MapIcon,
  PhotoCamera as PhotoIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Navigation as NavigationIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { 
  HomePickup, 
  HomeCollectionStatus, 
  Collector,
  AssignCollectorFormData,
  CollectSampleFormData,
  DeliverToLabFormData,
  CancelPickupFormData,
} from '@/types/homeCollection';
import { HOME_COLLECTION_STATUS_COLORS, TIME_WINDOWS, CANCEL_REASONS } from '@/types/homeCollection';
import {
  getHomePickups,
  getCollectors,
  getActiveCollectors,
  assignCollector,
  startRoute,
  markCollected,
  markDeliveredToLab,
  cancelPickup,
} from '@/services/homeCollectionStore';
import { useAuth } from '@/contexts/AuthContext';

type FilterTab = 'All' | HomeCollectionStatus;

export default function HomeCollectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.name || 'Staff';

  // State
  const [pickups, setPickups] = useState<HomePickup[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [selectedPickup, setSelectedPickup] = useState<HomePickup | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form states
  const [assignFormData, setAssignFormData] = useState<AssignCollectorFormData>({
    collectorId: '',
    estimatedTime: '',
    specialInstructions: '',
  });

  const [collectFormData, setCollectFormData] = useState<CollectSampleFormData>({
    collectedTime: new Date().toISOString().slice(0, 16),
    receiverName: '',
    otpVerified: false,
    photoDataUrl: '',
    notes: '',
  });

  const [deliverFormData, setDeliverFormData] = useState<DeliverToLabFormData>({
    deliveredTime: new Date().toISOString().slice(0, 16),
    receivedBy: '',
    notes: '',
  });

  const [cancelFormData, setCancelFormData] = useState<CancelPickupFormData>({
    reason: '',
    notes: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setPickups(getHomePickups());
      setCollectors(getCollectors());
      setLastUpdated(new Date());
      setLoading(false);
    }, 300);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      pending: pickups.filter(p => p.status === 'Pending').length,
      assigned: pickups.filter(p => p.status === 'Assigned').length,
      enRoute: pickups.filter(p => p.status === 'EnRoute').length,
      collectedToday: pickups.filter(p => 
        p.status === 'Collected' && 
        new Date(p.collectedAt || '').toDateString() === today
      ).length,
      deliveredToday: pickups.filter(p => 
        p.status === 'DeliveredToLab' && 
        new Date(p.deliveredAt || '').toDateString() === today
      ).length,
    };
  }, [pickups]);

  // Filtered pickups
  const filteredPickups = useMemo(() => {
    let filtered = pickups;

    // Filter by tab
    if (filterTab !== 'All') {
      filtered = filtered.filter(p => p.status === filterTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.patientName.toLowerCase().includes(query) ||
        p.patientMobile.includes(query) ||
        p.bookingId.toLowerCase().includes(query) ||
        p.pickupId.toLowerCase().includes(query) ||
        p.sampleId.toLowerCase().includes(query) ||
        p.address.area.toLowerCase().includes(query) ||
        p.address.city.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [pickups, filterTab, searchQuery]);

  // Actions
  const handleAssignCollector = () => {
    if (!selectedPickup || !assignFormData.collectorId) return;

    const collector = collectors.find(c => c.collectorId === assignFormData.collectorId);
    if (!collector) return;

    assignCollector(
      selectedPickup.pickupId,
      collector.collectorId,
      collector.name,
      userName,
      assignFormData.specialInstructions
    );

    setSnackbar({
      open: true,
      message: `Collector ${collector.name} assigned successfully!`,
      severity: 'success',
    });

    loadData();
    setAssignDialogOpen(false);
    resetForms();
  };

  const handleStartRoute = (pickup: HomePickup) => {
    if (!pickup.collectorId) return;

    startRoute(pickup.pickupId, userName);

    setSnackbar({
      open: true,
      message: `${pickup.collectorName} started route to ${pickup.patientName}`,
      severity: 'info',
    });

    loadData();
  };

  const handleMarkCollected = () => {
    if (!selectedPickup) return;

    markCollected(
      selectedPickup.pickupId,
      {
        photoDataUrl: collectFormData.photoDataUrl,
        otpVerified: collectFormData.otpVerified,
        receiverName: collectFormData.receiverName,
        collectedTime: collectFormData.collectedTime,
      },
      userName,
      collectFormData.notes
    );

    setSnackbar({
      open: true,
      message: 'Sample marked as collected!',
      severity: 'success',
    });

    loadData();
    setCollectDialogOpen(false);
    resetForms();
  };

  const handleMarkDelivered = () => {
    if (!selectedPickup) return;

    markDeliveredToLab(
      selectedPickup.pickupId,
      userName,
      deliverFormData.receivedBy,
      deliverFormData.notes
    );

    setSnackbar({
      open: true,
      message: 'Sample delivered to lab successfully!',
      severity: 'success',
    });

    loadData();
    setDeliverDialogOpen(false);
    resetForms();
  };

  const handleCancelPickup = () => {
    if (!selectedPickup || !cancelFormData.reason) return;

    cancelPickup(
      selectedPickup.pickupId,
      cancelFormData.reason,
      userName,
      cancelFormData.notes
    );

    setSnackbar({
      open: true,
      message: 'Pickup cancelled',
      severity: 'info',
    });

    loadData();
    setCancelDialogOpen(false);
    resetForms();
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCollectFormData(prev => ({
        ...prev,
        photoDataUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const openInMaps = (pickup: HomePickup) => {
    const { lat, lng, line, area, city, pincode } = pickup.address;
    let url: string;

    if (lat && lng) {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const address = `${line}, ${area}, ${city}, ${pincode}`;
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }

    window.open(url, '_blank');
  };

  const resetForms = () => {
    setAssignFormData({
      collectorId: '',
      estimatedTime: '',
      specialInstructions: '',
    });
    setCollectFormData({
      collectedTime: new Date().toISOString().slice(0, 16),
      receiverName: '',
      otpVerified: false,
      photoDataUrl: '',
      notes: '',
    });
    setDeliverFormData({
      deliveredTime: new Date().toISOString().slice(0, 16),
      receivedBy: '',
      notes: '',
    });
    setCancelFormData({
      reason: '',
      notes: '',
    });
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'bookingId',
      headerName: 'Token',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'pickupId',
      headerName: 'Pickup ID',
      width: 160,
    },
    {
      field: 'sampleId',
      headerName: 'Sample ID',
      width: 160,
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      width: 160,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.row.patientName}</Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.patientMobile}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'testName',
      headerName: 'Test',
      width: 150,
    },
    {
      field: 'address',
      headerName: 'Area / City',
      width: 150,
      valueGetter: (value: any, row: HomePickup) => `${row.address.area}, ${row.address.city}`,
    },
    {
      field: 'preferredSlot',
      headerName: 'Slot',
      width: 140,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{new Date(params.row.preferredSlot.date).toLocaleDateString()}</Typography>
          <Typography variant="caption" color="textSecondary">{params.row.preferredSlot.timeWindow}</Typography>
        </Box>
      ),
    },
    {
      field: 'collectorName',
      headerName: 'Collector',
      width: 130,
      renderCell: (params) => params.value || <Chip label="Not Assigned" size="small" color="default" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: HOME_COLLECTION_STATUS_COLORS[params.value as HomeCollectionStatus],
            color: 'white',
          }}
        />
      ),
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleTimeString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 280,
      sortable: false,
      renderCell: (params) => {
        const pickup = params.row as HomePickup;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {pickup.status === 'Pending' && (
              <Tooltip title="Assign Collector">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    setSelectedPickup(pickup);
                    setAssignDialogOpen(true);
                  }}
                >
                  <AssignIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {pickup.status === 'Assigned' && (
              <Tooltip title="Start Route">
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => handleStartRoute(pickup)}
                >
                  <NavigationIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(pickup.status === 'Assigned' || pickup.status === 'EnRoute') && (
              <Tooltip title="Mark Collected">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => {
                    setSelectedPickup(pickup);
                    setCollectDialogOpen(true);
                  }}
                >
                  <CollectedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {pickup.status === 'Collected' && (
              <Tooltip title="Deliver to Lab">
                <IconButton
                  size="small"
                  sx={{ color: '#00897B' }}
                  onClick={() => {
                    setSelectedPickup(pickup);
                    setDeliverDialogOpen(true);
                  }}
                >
                  <LabIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {['Pending', 'Assigned', 'EnRoute'].includes(pickup.status) && (
              <Tooltip title="Cancel Pickup">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setSelectedPickup(pickup);
                    setCancelDialogOpen(true);
                  }}
                >
                   <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Open in Maps">
              <IconButton
                size="small"
                color="info"
                onClick={() => openInMaps(pickup)}
              >
                <MapIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedPickup(pickup);
                  setViewDialogOpen(true);
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Home Collection Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>

        {/* Stats Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Box key={i} sx={{ flex: '1 1 calc(20% - 24px)', minWidth: 200 }}>
                <Skeleton variant="rectangular" height={120} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 calc(20% - 24px)', minWidth: 200 }}>
              <Card
                elevation={3}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, height: '100%' }}
                onClick={() => setFilterTab('Pending')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Pending
                      </Typography>
                      <Typography variant="h4">{stats.pending}</Typography>
                    </Box>
                    <Box sx={{ color: HOME_COLLECTION_STATUS_COLORS.Pending }}>
                      <TimeIcon sx={{ fontSize: 40 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 calc(20% - 24px)', minWidth: 200 }}>
              <Card
                elevation={3}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, height: '100%' }}
                onClick={() => setFilterTab('Assigned')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Assigned
                      </Typography>
                      <Typography variant="h4">{stats.assigned}</Typography>
                    </Box>
                    <Box sx={{ color: HOME_COLLECTION_STATUS_COLORS.Assigned }}>
                      <AssignIcon sx={{ fontSize: 40 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 calc(20% - 24px)', minWidth: 200 }}>
              <Card
                elevation={3}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, height: '100%' }}
                onClick={() => setFilterTab('EnRoute')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        En Route
                      </Typography>
                      <Typography variant="h4">{stats.enRoute}</Typography>
                    </Box>
                    <Box sx={{ color: HOME_COLLECTION_STATUS_COLORS.EnRoute }}>
                      <TruckIcon sx={{ fontSize: 40 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 calc(20% - 24px)', minWidth: 200 }}>
              <Card
                elevation={3}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, height: '100%' }}
                onClick={() => setFilterTab('Collected')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Collected Today
                      </Typography>
                      <Typography variant="h4">{stats.collectedToday}</Typography>
                    </Box>
                    <Box sx={{ color: HOME_COLLECTION_STATUS_COLORS.Collected }}>
                      <CollectedIcon sx={{ fontSize: 40 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 calc(20% - 24px)', minWidth: 200 }}>
              <Card
                elevation={3}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, height: '100%' }}
                onClick={() => setFilterTab('DeliveredToLab')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Delivered Today
                      </Typography>
                      <Typography variant="h4">{stats.deliveredToday}</Typography>
                    </Box>
                    <Box sx={{ color: HOME_COLLECTION_STATUS_COLORS.DeliveredToLab }}>
                      <LabIcon sx={{ fontSize: 40 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Filters and Search */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Tabs value={filterTab} onChange={(e, val) => setFilterTab(val)}>
                <Tab label="All" value="All" />
                <Tab label="Pending" value="Pending" />
                <Tab label="Assigned" value="Assigned" />
                <Tab label="En Route" value="EnRoute" />
                <Tab label="Collected" value="Collected" />
                <Tab label="Delivered" value="DeliveredToLab" />
                <Tab label="Cancelled" value="Cancelled" />
              </Tabs>
              <TextField
                size="small"
                placeholder="Search patient, mobile, token, pickup ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* DataGrid */}
        <Card elevation={2}>
          <CardContent>
            <DataGrid
              rows={filteredPickups}
              columns={columns}
              getRowId={(row) => row.pickupId}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              pageSizeOptions={[25, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
              autoHeight
              loading={loading}
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Assign Collector Dialog */}
        <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Collector</DialogTitle>
          <DialogContent>
            {selectedPickup && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="info">
                  Assigning collector for <strong>{selectedPickup.patientName}</strong>
                  <br />
                  Token: {selectedPickup.bookingId} | Sample: {selectedPickup.sampleId}
                </Alert>
              </Box>
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Collector *</InputLabel>
              <Select
                value={assignFormData.collectorId}
                label="Select Collector *"
                onChange={(e) => setAssignFormData({ ...assignFormData, collectorId: e.target.value })}
              >
                {getActiveCollectors().map((collector) => (
                  <MenuItem key={collector.collectorId} value={collector.collectorId}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Box>
                        <Typography variant="body2">{collector.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {collector.phone} | Vehicle: {collector.vehicleNumber}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${collector.currentAssignments} active`}
                        size="small"
                        color={collector.currentAssignments < 3 ? 'success' : 'warning'}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Estimated Time (optional)"
              type="time"
              value={assignFormData.estimatedTime}
              onChange={(e) => setAssignFormData({ ...assignFormData, estimatedTime: e.target.value })}
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Special Instructions (optional)"
              multiline
              rows={3}
              value={assignFormData.specialInstructions}
              onChange={(e) => setAssignFormData({ ...assignFormData, specialInstructions: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAssignCollector}
              disabled={!assignFormData.collectorId}
            >
              Assign Collector
            </Button>
          </DialogActions>
        </Dialog>

        {/* Mark Collected Dialog */}
        <Dialog open={collectDialogOpen} onClose={() => setCollectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Mark Sample as Collected</DialogTitle>
          <DialogContent>
            {selectedPickup && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="success">
                  Marking collected for <strong>{selectedPickup.patientName}</strong>
                  <br />
                  Collector: {selectedPickup.collectorName}
                </Alert>
              </Box>
            )}
            <TextField
              fullWidth
              label="Collection Time *"
              type="datetime-local"
              value={collectFormData.collectedTime}
              onChange={(e) => setCollectFormData({ ...collectFormData, collectedTime: e.target.value })}
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Receiver Name *"
              value={collectFormData.receiverName}
              onChange={(e) => setCollectFormData({ ...collectFormData, receiverName: e.target.value })}
              sx={{ mt: 2 }}
              helperText="Person who handed over the sample"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={collectFormData.otpVerified}
                  onChange={(e) => setCollectFormData({ ...collectFormData, otpVerified: e.target.checked })}
                />
              }
              label="OTP Verified"
              sx={{ mt: 2 }}
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoIcon />}
                fullWidth
              >
                Upload Collection Photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoUpload}
                />
              </Button>
              {collectFormData.photoDataUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={collectFormData.photoDataUrl}
                    alt="Collection proof"
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                  />
                </Box>
              )}
            </Box>
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={collectFormData.notes}
              onChange={(e) => setCollectFormData({ ...collectFormData, notes: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCollectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleMarkCollected}
              disabled={!collectFormData.receiverName}
            >
              Mark Collected
            </Button>
          </DialogActions>
        </Dialog>

        {/* Deliver to Lab Dialog */}
        <Dialog open={deliverDialogOpen} onClose={() => setDeliverDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Deliver Sample to Lab</DialogTitle>
          <DialogContent>
            {selectedPickup && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="info">
                  Delivering sample to lab for <strong>{selectedPickup.patientName}</strong>
                  <br />
                  Sample ID: {selectedPickup.sampleId}
                </Alert>
              </Box>
            )}
            <TextField
              fullWidth
              label="Delivery Time *"
              type="datetime-local"
              value={deliverFormData.deliveredTime}
              onChange={(e) => setDeliverFormData({ ...deliverFormData, deliveredTime: e.target.value })}
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Received By (Lab Staff Name) *"
              value={deliverFormData.receivedBy}
              onChange={(e) => setDeliverFormData({ ...deliverFormData, receivedBy: e.target.value })}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={deliverFormData.notes}
              onChange={(e) => setDeliverFormData({ ...deliverFormData, notes: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeliverDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleMarkDelivered}
              disabled={!deliverFormData.receivedBy}
              sx={{ bgcolor: '#00897B', '&:hover': { bgcolor: '#00695C' } }}
            >
              Deliver to Lab
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Pickup Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Pickup</DialogTitle>
          <DialogContent>
            {selectedPickup && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="warning">
                  Cancelling pickup for <strong>{selectedPickup.patientName}</strong>
                  <br />
                  Token: {selectedPickup.bookingId}
                </Alert>
              </Box>
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Cancel Reason *</InputLabel>
              <Select
                value={cancelFormData.reason}
                label="Cancel Reason *"
                onChange={(e) => setCancelFormData({ ...cancelFormData, reason: e.target.value })}
              >
                {CANCEL_REASONS.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={3}
              value={cancelFormData.notes}
              onChange={(e) => setCancelFormData({ ...cancelFormData, notes: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>Back</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCancelPickup}
              disabled={!cancelFormData.reason}
            >
              Cancel Pickup
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Pickup Details</DialogTitle>
          <DialogContent>
            {selectedPickup && (
              <Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 280 }}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Patient Information
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedPickup.patientName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Mobile:</strong> {selectedPickup.patientMobile}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Test:</strong> {selectedPickup.testName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Priority:</strong> {selectedPickup.priority}
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 280 }}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Booking Details
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        <strong>Token:</strong> {selectedPickup.bookingId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Pickup ID:</strong> {selectedPickup.pickupId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Sample ID:</strong> {selectedPickup.sampleId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong>{' '}
                        <Chip
                          label={selectedPickup.status}
                          size="small"
                          sx={{
                            bgcolor: HOME_COLLECTION_STATUS_COLORS[selectedPickup.status],
                            color: 'white',
                          }}
                        />
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Address
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        {selectedPickup.address.line}
                        <br />
                        {selectedPickup.address.area}, {selectedPickup.address.city} - {selectedPickup.address.pincode}
                      </Typography>
                      {selectedPickup.address.landmark && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          <strong>Landmark:</strong> {selectedPickup.address.landmark}
                        </Typography>
                      )}
                      <Button
                        size="small"
                        startIcon={<MapIcon />}
                        onClick={() => openInMaps(selectedPickup)}
                        sx={{ mt: 1 }}
                      >
                        Open in Maps
                      </Button>
                    </Paper>
                  </Box>
                  {selectedPickup.collectorName && (
                    <Box sx={{ width: '100%' }}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Collector Information
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="body2">
                          <strong>Name:</strong> {selectedPickup.collectorName}
                        </Typography>
                        {selectedPickup.assignedAt && (
                          <Typography variant="body2">
                            <strong>Assigned At:</strong> {new Date(selectedPickup.assignedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  )}
                  {selectedPickup.proof?.photoDataUrl && (
                    <Box sx={{ width: '100%' }}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Collection Proof
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <img
                            src={selectedPickup.proof.photoDataUrl}
                            alt="Collection proof"
                            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                          />
                        </Box>
                        {selectedPickup.proof.receiverName && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Received By:</strong> {selectedPickup.proof.receiverName}
                          </Typography>
                        )}
                        {selectedPickup.proof.otpVerified && (
                          <Chip label="OTP Verified" color="success" size="small" sx={{ mt: 1 }} />
                        )}
                      </Paper>
                    </Box>
                  )}
                  {selectedPickup.audit.length > 0 && (
                    <Box sx={{ width: '100%' }}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Audit Trail
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Stack spacing={1}>
                          {selectedPickup.audit.map((entry, idx) => (
                            <Box key={idx}>
                              <Typography variant="body2">
                                <strong>{entry.action}</strong> by {entry.by}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(entry.at).toLocaleString()}
                              </Typography>
                              {entry.notes && (
                                <Typography variant="caption" display="block">
                                  {entry.notes}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        {snackbar.open && (
          <Alert
            severity={snackbar.severity}
            sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        )}
      </Box>
    </DashboardLayout>
  );
}
