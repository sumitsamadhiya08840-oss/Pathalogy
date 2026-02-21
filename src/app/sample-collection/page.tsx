'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Badge,
  LinearProgress,
  Autocomplete,
  TablePagination,
  InputLabel,
  ListItemText,
  InputAdornment,
} from '@mui/material';

import {
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Warning as WarningIcon,
  Alarm as AlarmIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Phone as PhoneIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Close as CloseIcon,
  RefreshRounded as RefreshIcon,
  DashboardCustomize as DashboardCustomizeIcon,
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CallReceived as CallReceivedIcon,
  Verified as VerifiedIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon,
  Map as MapIcon,
  Navigation as NavigationIcon,
  Send as SendIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
} from '@mui/icons-material';

import { Collection, HomeCollection, CollectionStatus, HomeCollectionStatus, Priority } from '@/types/collection';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  calculateWaitingTime,
  calculateWaitingMinutes,
  formatDateTime,
  formatAddress,
  generateCollectionSMS,
  generateCollectorSMS,
} from '@/utils/collectionHelpers';

// Helper functions for missing utilities
const getWaitingColor = (minutes: number): string => {
  if (minutes < 5) return '#4CAF50'; // Green
  if (minutes < 15) return '#FFC107'; // Yellow
  if (minutes < 30) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

const getPriorityLabel = (priority: string): string => {
  switch (priority.toUpperCase()) {
    case 'STAT':
      return '🔴 STAT';
    case 'URGENT':
      return '🟠 Urgent';
    case 'NORMAL':
    default:
      return '⚪ Normal';
  }
};

const exportCollectionsToCSV = (collections: Collection[]): string => {
  const headers = [
    'Token Number',
    'Sample ID',
    'Patient Name',
    'Mobile',
    'Tests',
    'Booking Time',
    'Status',
    'Waiting Time (mins)'
  ];

  const rows = collections.map(c => [
    c.tokenNumber,
    c.sampleID,
    (c as any).patient?.name || 'N/A',
    (c as any).patient?.mobile || 'N/A',
    Array.isArray(c.tests) ? c.tests.map((t: any) => t.testName).join('; ') : '',
    new Date(c.bookingTime).toLocaleString(),
    c.status,
    (c as any).waitingMinutes || 0
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

const downloadCSV = (content: string, filename: string = 'collections.csv'): void => {
  if (typeof window === 'undefined') return;
  
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// ============= MOCK DATA GENERATORS =============

const generateMockCollections = (count: number): Collection[] => {
  const testOptions = ['CBC', 'Blood Sugar', 'Lipid Profile', 'Urine Routine', 'Liver Function', 'Kidney Function', 'Thyroid'];
  const collections: Collection[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const bookingTime = new Date(now.getTime() - Math.random() * 120 * 60000); // 0-120 mins ago
    const bookingTimeStr = bookingTime.toISOString();
    const waitingMinutes = Math.floor((now.getTime() - bookingTime.getTime()) / 60000);
    const priority = Math.random() > 0.85 ? 'STAT' : Math.random() > 0.7 ? 'Urgent' : 'Normal';

    collections.push({
      id: `coll-${i + 1}`,
      tokenNumber: `TKN-${String(i + 1).padStart(4, '0')}`,
      sampleID: `SMP-20260204-${String(i + 1).padStart(4, '0')}`,
      bookingID: `BOOK-${i + 1}`,
      patient: {
        id: `pat-${i + 1}`,
        name: `Patient ${i + 1}`,
        age: Math.floor(Math.random() * 80) + 18,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        mobile: `98${String(Math.floor(Math.random() * 1000000000)).padStart(8, '0')}`,
        patientID: `PAT-${i + 1}`,
      },
      tests: testOptions.slice(0, Math.floor(Math.random() * 3) + 1) as any,
      sampleRequirements: [],
      bookingType: Math.random() > 0.3 ? 'Walk-in' : 'Scheduled',
      bookingTime: bookingTimeStr,
      bookingDate: bookingTime.toLocaleDateString(),
      status: (Math.random() > 0.8 ? 'Collected' : 'Pending Collection') as any,
      priority: priority as any,
      type: 'Lab',
      // Add waitingMinutes as a property dynamically
      ...{ waitingMinutes },
    } as any);
  }

  return collections;
};

const generateMockHomeCollections = (count: number): HomeCollection[] => {
  const areas = ['Andheri', 'Dadar', 'Bandra', 'Powai', 'Colaba', 'Juhu', 'Kemps Corner', 'Mulund'];
  const statuses = ['Pending Assignment', 'Assigned', 'In Progress', 'Collected', 'Cancelled'];
  const timeSlots = ['6-9 AM', '9-12 PM', '12-3 PM', '3-6 PM'];

  const collections: HomeCollection[] = [];

  for (let i = 0; i < count; i++) {
    const preferredDate = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60000);
    
    collections.push({
      id: `home-${i + 1}`,
      tokenNumber: `HOME-${String(i + 1).padStart(4, '0')}`,
      sampleID: `SMP-HOME-${i + 1}`,
      bookingID: `BOOK-HOME-${i + 1}`,
      patient: {
        id: `pat-home-${i + 1}`,
        name: `Home Patient ${i + 1}`,
        age: Math.floor(Math.random() * 80) + 18,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        mobile: `98${String(Math.floor(Math.random() * 1000000000)).padStart(8, '0')}`,
        patientID: `PAT-HOME-${i + 1}`,
      },
      tests: ['CBC', 'Blood Sugar'] as any,
      sampleRequirements: [],
      area: areas[Math.floor(Math.random() * areas.length)],
      address: `${i + 1}, Example Street, City`,
      locality: 'City',
      preferredDate: preferredDate.toISOString(),
      preferredTimeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)] as any,
      homeCollectionStatus: statuses[Math.floor(Math.random() * statuses.length)] as any,
      bookingTime: new Date().toISOString(),
      bookingDate: new Date().toLocaleDateString(),
      bookingType: 'Scheduled',
      status: 'Pending' as any,
      priority: 'Normal' as any,
      type: 'Home',
    } as any);
  }

  return collections;
};

// ============= COMPONENTS =============

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  onClick?: () => void;
}> = ({ icon, label, count, color, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 3 } : {},
      backgroundColor: color === '#4CAF50' ? '#f1f8e9' : color === '#FF9800' ? '#fff3e0' : color === '#2196F3' ? '#e3f2fd' : '#ffebee',
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ fontSize: 32, opacity: 0.8 }}>{icon}</Box>
        <Box>
          <Typography color="textSecondary" variant="body2" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>
            {count}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Collect Sample Dialog Component
const CollectSampleDialog: React.FC<{
  open: boolean;
  collection: Collection | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}> = ({ open, collection, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    collectorName: '',
    quality: 'Good',
    tubeType: 'EDTA Tube',
    numberOfTubes: 1,
    volume: '',
    notes: '',
    printLabels: true,
    labelsCount: 1,
    fasting: 'NotApplicable',
    patientCondition: 'Normal',
    collectionSite: 'LeftArm',
    checklist: {
      patientVerified: false,
      tubeCorrect: false,
      volumeAdequate: false,
      labelApplied: false,
      sampleMixed: false,
      temperatureCorrect: false,
      patientInformed: false,
      instructionsGiven: false,
    },
  });

  const allChecked = Object.values(formData.checklist).every(v => v === true);

  const handleChecklistChange = (key: keyof typeof formData.checklist) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [key]: !prev.checklist[key],
      }
    }));
  };

  const handleSubmit = () => {
    if (!formData.collectorName || !formData.volume) {
      alert('Please fill all required fields');
      return;
    }

    if (!allChecked) {
      alert('Please complete all quality checks');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon />
        Collect Sample - {collection?.tokenNumber}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {/* Patient Info Card */}
          <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 50, height: 50, bgcolor: '#2196F3' }}>
                  {collection?.patient?.name?.[0]}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {collection?.patient?.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {collection?.patient?.age}Y / {collection?.patient?.gender} | Token: {collection?.tokenNumber}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {collection?.patient?.mobile}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Divider />

          {/* Collection Form */}
          <TextField
            fullWidth
            label="Collector Name"
            value={formData.collectorName}
            onChange={(e) => setFormData(prev => ({ ...prev, collectorName: e.target.value }))}
            required
            size="small"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mb: 2 }}>
            <Select
              fullWidth
              value={formData.tubeType}
              onChange={(e) => setFormData(prev => ({ ...prev, tubeType: e.target.value }))}
              size="small"
            >
              <MenuItem value="EDTA Tube">EDTA Tube (Purple)</MenuItem>
              <MenuItem value="Plain Tube">Plain Tube (Red)</MenuItem>
              <MenuItem value="Fluoride Tube">Fluoride Tube (Gray)</MenuItem>
            </Select>
            <TextField
              fullWidth
              label="Number of Tubes"
              type="number"
              value={formData.numberOfTubes}
              onChange={(e) => setFormData(prev => ({ ...prev, numberOfTubes: parseInt(e.target.value) }))}
              size="small"
              inputProps={{ min: 1, max: 10 }}
            />
          </Box>

          <TextField
            fullWidth
            label="Volume Collected (ml)"
            type="number"
            value={formData.volume}
            onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
            required
            size="small"
          />

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 1 }}>Sample Quality</FormLabel>
            <RadioGroup
              value={formData.quality}
              onChange={(e) => setFormData(prev => ({ ...prev, quality: e.target.value }))}
              row
            >
              <FormControlLabel value="Good" control={<Radio />} label="✅ Good" />
              <FormControlLabel value="Hemolyzed" control={<Radio />} label="⚠️ Hemolyzed" />
              <FormControlLabel value="Clotted" control={<Radio />} label="⚠️ Clotted" />
              <FormControlLabel value="Contaminated" control={<Radio />} label="❌ Contaminated" />
            </RadioGroup>
          </FormControl>

          {formData.quality !== 'Good' && (
            <TextField
              fullWidth
              label="Quality Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Explain the quality issue"
              required
              size="small"
            />
          )}

          <Select
            fullWidth
            value={formData.fasting}
            onChange={(e) => setFormData(prev => ({ ...prev, fasting: e.target.value }))}
            size="small"
          >
            <MenuItem value="Fasting">Fasting</MenuItem>
            <MenuItem value="NonFasting">Non-Fasting</MenuItem>
            <MenuItem value="NotApplicable">Not Applicable</MenuItem>
          </Select>

          <Select
            fullWidth
            value={formData.patientCondition}
            onChange={(e) => setFormData(prev => ({ ...prev, patientCondition: e.target.value }))}
            size="small"
          >
            <MenuItem value="Normal">Normal</MenuItem>
            <MenuItem value="Anxious">Anxious</MenuItem>
            <MenuItem value="DifficultVeinAccess">Difficult Vein Access</MenuItem>
            <MenuItem value="Pediatric">Pediatric</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>

          {/* Quality Checklist */}
          <Alert severity="info" icon={<VerifiedIcon />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Quality Checklist (All required)
            </Typography>
            <FormGroup>
              {Object.entries(formData.checklist).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={value}
                      onChange={() => handleChecklistChange(key as any)}
                      size="small"
                    />
                  }
                  label={key.replace(/([A-Z])/g, ' $1').trim()}
                  sx={{ fontSize: '0.9rem' }}
                />
              ))}
            </FormGroup>
          </Alert>

          {/* Label Printing */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.printLabels}
                onChange={(e) => setFormData(prev => ({ ...prev, printLabels: e.target.checked }))}
              />
            }
            label="Print Labels Now"
          />
          {formData.printLabels && (
            <TextField
              fullWidth
              label="Number of Labels"
              type="number"
              value={formData.labelsCount}
              onChange={(e) => setFormData(prev => ({ ...prev, labelsCount: parseInt(e.target.value) }))}
              inputProps={{ min: 1, max: 10 }}
              size="small"
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          disabled={!formData.collectorName || !formData.volume || !allChecked}
        >
          Mark as Collected
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Barcode Scanner Dialog
const BarcodeScannerDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}> = ({ open, onClose, onScan }) => {
  const [manualInput, setManualInput] = useState('');

  const handleManualScan = () => {
    if (manualInput.trim()) {
      onScan(manualInput);
      setManualInput('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeScannerIcon />
        Scan Sample Barcode
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Alert severity="info">
            Camera scanning requires browser permission. Use manual entry as fallback.
          </Alert>

          <TextField
            fullWidth
            label="Or Enter Sample ID Manually"
            placeholder="SMP-20260204-0001"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleManualScan();
              }
            }}
            autoFocus
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleManualScan} variant="contained" color="primary">
          Process
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============= MAIN COMPONENT =============

// Assign Collector Dialog Component
function AssignCollectorDialog({
  open,
  collection,
  onClose,
  onAssign,
}: {
  open: boolean;
  collection: HomeCollection | null;
  onClose: () => void;
  onAssign: (assignmentData: any) => void;
}) {
  const [selectedCollector, setSelectedCollector] = React.useState('');
  const [scheduledDate, setScheduledDate] = React.useState(
    collection?.preferredDate || new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = React.useState('09:00');
  const [specialInstructions, setSpecialInstructions] = React.useState('');
  const [notifyPatient, setNotifyPatient] = React.useState(true);
  const [notifyCollector, setNotifyCollector] = React.useState(true);

  // Mock collectors
  const collectors = [
    { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', available: true, activeCollections: 2 },
    { id: '2', name: 'Priya Sharma', phone: '+91 98765 43211', available: true, activeCollections: 1 },
    { id: '3', name: 'Amit Singh', phone: '+91 98765 43212', available: false, activeCollections: 5 },
    { id: '4', name: 'Neha Patel', phone: '+91 98765 43213', available: true, activeCollections: 0 },
  ];

  const handleAssign = () => {
    if (!selectedCollector) {
      alert('Please select a collector');
      return;
    }

    const collector = collectors.find(c => c.id === selectedCollector);
    
    onAssign({
      collector,
      scheduledDate,
      scheduledTime,
      specialInstructions,
      notifyPatient,
      notifyCollector,
    });

    // Mock notifications
    if (notifyPatient) {
      console.log(`SMS sent to patient: Your sample will be collected on ${scheduledDate} at ${scheduledTime}`);
    }
    if (notifyCollector) {
      console.log(`SMS sent to collector: New collection assigned at ${collection?.address}`);
    }

    // Reset form
    setSelectedCollector('');
    setSpecialInstructions('');
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Assign Collector
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Collection Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Collection Details</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Typography variant="body2">
              <strong>Token:</strong> {collection.tokenNumber}
            </Typography>
            <Typography variant="body2">
              <strong>Patient:</strong> {collection.patient?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Phone:</strong> {collection.patient?.mobile}
            </Typography>
            <Typography variant="body2">
              <strong>Area:</strong> {(collection as any).area || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ gridColumn: '1 / -1' }}>
              <strong>Address:</strong> {collection.address}
            </Typography>
          </Box>
        </Box>

        {/* Collector Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Collector</InputLabel>
          <Select
            value={selectedCollector}
            onChange={(e) => setSelectedCollector(e.target.value)}
            label="Select Collector"
          >
            {collectors.map((collector) => (
              <MenuItem key={collector.id} value={collector.id} disabled={!collector.available}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">{collector.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {collector.phone} • {collector.activeCollections} active
                    </Typography>
                  </Box>
                  {!collector.available && (
                    <Chip label="Unavailable" size="small" color="error" />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date and Time */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField
            label="Scheduled Date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Scheduled Time"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>

        {/* Special Instructions */}
        <TextField
          label="Special Instructions"
          multiline
          rows={3}
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Any special instructions for the collector..."
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Notifications */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Notifications</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyPatient}
                onChange={(e) => setNotifyPatient(e.target.checked)}
              />
            }
            label="Send SMS to Patient"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyCollector}
                onChange={(e) => setNotifyCollector(e.target.checked)}
              />
            }
            label="Send SMS to Collector"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAssign} variant="contained" startIcon={<SendIcon />}>
          Assign Collector
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Route Planning Dialog Component
function RouteDialog({
  open,
  onClose,
  homeCollections,
}: {
  open: boolean;
  onClose: () => void;
  homeCollections: HomeCollection[];
}) {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [selectedCollector, setSelectedCollector] = React.useState('all');
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = React.useState<string[]>([]);
  const [routeCollections, setRouteCollections] = React.useState<HomeCollection[]>([]);

  // Extract unique areas and collectors
  const areas = React.useMemo(() => {
    const areaSet = new Set<string>();
    homeCollections.forEach(c => {
      const area = (c as any).area;
      if (area) areaSet.add(area);
    });
    return Array.from(areaSet);
  }, [homeCollections]);

  const collectors = [
    { id: 'all', name: 'All Collectors' },
    { id: '1', name: 'Rajesh Kumar' },
    { id: '2', name: 'Priya Sharma' },
    { id: '3', name: 'Amit Singh' },
    { id: '4', name: 'Neha Patel' },
  ];

  // Filter collections for route planning
  const availableCollections = React.useMemo(() => {
    return homeCollections.filter(c => {
      const matchDate = selectedDate === new Date(c.bookingDate).toISOString().split('T')[0];
      const matchCollector = selectedCollector === 'all' || c.assignedCollector?.id === selectedCollector;
      const matchArea = selectedAreas.length === 0 || selectedAreas.includes((c as any).area);
      const notInRoute = !routeCollections.find(rc => rc.id === c.id);
      return matchDate && matchCollector && matchArea && notInRoute;
    });
  }, [homeCollections, selectedDate, selectedCollector, selectedAreas, routeCollections]);

  const handleAddToRoute = (collectionId: string) => {
    const collection = availableCollections.find(c => c.id === collectionId);
    if (collection) {
      setRouteCollections(prev => [...prev, collection]);
    }
  };

  const handleRemoveFromRoute = (index: number) => {
    setRouteCollections(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setRouteCollections(prev => {
      const newRoute = [...prev];
      [newRoute[index - 1], newRoute[index]] = [newRoute[index], newRoute[index - 1]];
      return newRoute;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === routeCollections.length - 1) return;
    setRouteCollections(prev => {
      const newRoute = [...prev];
      [newRoute[index], newRoute[index + 1]] = [newRoute[index + 1], newRoute[index]];
      return newRoute;
    });
  };

  const handleSaveRoute = () => {
    if (routeCollections.length === 0) {
      alert('Please add at least one collection to the route');
      return;
    }
    // Save route logic here
    console.log('Route saved:', routeCollections);
    alert(`Route with ${routeCollections.length} collections saved successfully`);
    onClose();
  };

  // Calculate route stats
  const routeStats = React.useMemo(() => {
    const count = routeCollections.length;
    const estimatedDistance = count * 3.5; // Mock: 3.5 km per collection
    const estimatedTime = count * 25; // Mock: 25 minutes per collection
    return { count, estimatedDistance: estimatedDistance.toFixed(1), estimatedTime };
  }, [routeCollections]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth fullScreen>
      <DialogTitle>
        Create Collection Route
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Left Panel - Route Builder */}
        <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>Filters</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Collector</InputLabel>
                <Select
                  value={selectedCollector}
                  onChange={(e) => setSelectedCollector(e.target.value)}
                  label="Collector"
                >
                  {collectors.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Areas</InputLabel>
                <Select
                  multiple
                  value={selectedAreas}
                  onChange={(e) => setSelectedAreas(e.target.value as string[])}
                  label="Areas"
                  renderValue={(selected) => selected.join(', ')}
                >
                  {areas.map(area => (
                    <MenuItem key={area} value={area}>
                      <Checkbox checked={selectedAreas.includes(area)} />
                      <ListItemText primary={area} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Available Collections */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Available Collections ({availableCollections.length})
            </Typography>
            {availableCollections.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                No collections available
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {availableCollections.map(collection => (
                  <Paper key={collection.id} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {collection.tokenNumber} - {collection.patient?.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {(collection as any).area || 'N/A'}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="primary" onClick={() => handleAddToRoute(collection.id)}>
                      <AddIcon />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>

          {/* Route List */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Route ({routeCollections.length} stops)
            </Typography>
            {routeCollections.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                Add collections to build route
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {routeCollections.map((collection, index) => (
                  <Paper key={collection.id} sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={index + 1} size="small" color="primary" sx={{ minWidth: 32 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {collection.tokenNumber} - {collection.patient?.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(collection as any).area || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <IconButton size="small" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                          <UpIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleMoveDown(index)} disabled={index === routeCollections.length - 1}>
                          <DownIcon />
                        </IconButton>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => handleRemoveFromRoute(index)}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>

          {/* Route Summary */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'primary.50' }}>
            <Typography variant="subtitle2" gutterBottom>Route Summary</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Typography variant="body2">
                <strong>Collections:</strong> {routeStats.count}
              </Typography>
              <Typography variant="body2">
                <strong>Est. Distance:</strong> {routeStats.estimatedDistance} km
              </Typography>
              <Typography variant="body2">
                <strong>Est. Time:</strong> {routeStats.estimatedTime} min
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Panel - Map View */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
          <Box sx={{ textAlign: 'center' }}>
            <MapIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Map View
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Map integration will be available here
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
              Route will be displayed with numbered markers
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSaveRoute} 
          variant="contained" 
          startIcon={<NavigationIcon />}
          disabled={routeCollections.length === 0}
        >
          Save Route
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SampleCollectionPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingCollections, setPendingCollections] = useState<Collection[]>([]);
  const [collectedSamples, setCollectedSamples] = useState<Collection[]>([]);
  const [homeCollections, setHomeCollections] = useState<HomeCollection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [openCollectDialog, setOpenCollectDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openAssignCollectorDialog, setOpenAssignCollectorDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);
  const [openCollectedDialog, setOpenCollectedDialog] = useState(false);
  const [openQualityIssuesDialog, setOpenQualityIssuesDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | HomeCollection | null>(null);
  const [openScannerDialog, setOpenScannerDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Home collection filters
  const [homeStatusFilter, setHomeStatusFilter] = useState('all');
  const [homeDateFilter, setHomeDateFilter] = useState('all');
  const [homeAreaFilter, setHomeAreaFilter] = useState('all');
  const [homeCollectorFilter, setHomeCollectorFilter] = useState('all');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);

  // Initialize mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const collections = generateMockCollections(45);
      const homeCollectionsList = generateMockHomeCollections(15);
      setPendingCollections(collections);
      setHomeCollections(homeCollectionsList);
      setLoading(false);
    }, 500);
  }, []);

  // Waiting time update - every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCollections((prev) =>
        prev.map((c) => ({
          ...c,
          waitingMinutes: Math.floor((new Date().getTime() - new Date(c.bookingTime).getTime()) / 60000),
        }))
      );
    }, 60000); // Update every 1 minute

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh data - every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Refresh data
      const collections = generateMockCollections(45);
      const homeCollectionsList = generateMockHomeCollections(15);
      setPendingCollections(collections);
      setHomeCollections(homeCollectionsList);
      setLastUpdated(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter collections
  const filteredCollections = pendingCollections.filter((c) => {
    const query = searchQuery.toLowerCase();
    const patientName = (c as any).patient?.name || '';
    const mobile = (c as any).patient?.mobile || '';
    const matchesSearch =
      c.tokenNumber.toLowerCase().includes(query) ||
      patientName.toLowerCase().includes(query) ||
      c.sampleID.toLowerCase().includes(query) ||
      mobile.includes(query);

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.bookingType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Filter home collections with all filters
  const filteredHomeCollections = React.useMemo(() => {
    return homeCollections.filter((c) => {
      // Status filter
      if (homeStatusFilter !== 'all' && (c as any).homeCollectionStatus !== homeStatusFilter) {
        return false;
      }

      // Date filter
      if (homeDateFilter !== 'all') {
        const collectionDate = new Date(c.preferredDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (homeDateFilter === 'Today') {
          const isToday = collectionDate.toDateString() === today.toDateString();
          if (!isToday) return false;
        } else if (homeDateFilter === 'Tomorrow') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow = collectionDate.toDateString() === tomorrow.toDateString();
          if (!isTomorrow) return false;
        } else if (homeDateFilter === 'This Week') {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          if (collectionDate < today || collectionDate > weekFromNow) return false;
        } else if (homeDateFilter === 'Custom Range') {
          if (customDateFrom && collectionDate < customDateFrom) return false;
          if (customDateTo && collectionDate > customDateTo) return false;
        }
      }

      // Area filter
      if (homeAreaFilter !== 'all' && c.area !== homeAreaFilter) {
        return false;
      }

      // Collector filter
      if (homeCollectorFilter !== 'all') {
        if (!c.assignedCollector || c.assignedCollector.id !== homeCollectorFilter) {
          return false;
        }
      }

      // Search filter
      if (homeSearchQuery) {
        const query = homeSearchQuery.toLowerCase();
        const patientName = c.patient?.name?.toLowerCase() || '';
        const mobile = c.patient?.mobile || '';
        const address = c.address?.toLowerCase() || '';
        const token = c.tokenNumber?.toLowerCase() || '';
        
        const matchesSearch = 
          patientName.includes(query) ||
          mobile.includes(query) ||
          address.includes(query) ||
          token.includes(query);
        
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [homeCollections, homeStatusFilter, homeDateFilter, homeAreaFilter, homeCollectorFilter, homeSearchQuery, customDateFrom, customDateTo]);

  // Get unique areas for filter
  const uniqueAreas = React.useMemo(() => {
    return Array.from(new Set(homeCollections.map(c => c.area).filter(Boolean)));
  }, [homeCollections]);

  // Get unique collectors for filter
  const uniqueCollectors = React.useMemo(() => {
    const collectors = homeCollections
      .map(c => c.assignedCollector)
      .filter(Boolean) as any[];
    const unique = Array.from(new Map(collectors.map(c => [c.id, c])).values());
    return unique;
  }, [homeCollections]);

  // Calculate dynamic stats
  const stats = React.useMemo(() => {
    const today = new Date().toDateString();
    return {
      pending: pendingCollections.filter(c => c.status === 'Pending Collection').length,
      today: collectedSamples.filter(c => new Date(c.bookingDate).toDateString() === today).length,
      homeCollectionsPending: homeCollections.filter(c => 
        (c as any).homeCollectionStatus === HomeCollectionStatus.PendingAssignment || 
        (c as any).homeCollectionStatus === HomeCollectionStatus.Assigned
      ).length,
      qualityIssues: pendingCollections.filter(c => 
        c.qualityIssues && c.qualityIssues.length > 0 && 
        c.qualityIssues.some(q => q.status === 'Open')
      ).length,
      overdue: pendingCollections.filter(c => ((c as any).waitingMinutes || 0) > 30).length,
    };
  }, [pendingCollections, collectedSamples, homeCollections]);

  const handleCollectClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setOpenCollectDialog(true);
  };

  const handleViewDetails = (collection: Collection | HomeCollection) => {
    setSelectedCollection(collection);
    setOpenDetailDialog(true);
  };

  // Stats card click handlers
  const handlePendingClick = () => {
    setStatusFilter('Pending Collection');
    setActiveTab(0);
  };

  const handleCollectedTodayClick = () => {
    setOpenCollectedDialog(true);
  };

  const handleHomeCollectionsClick = () => {
    setActiveTab(1);
  };

  const handleQualityIssuesClick = () => {
    setOpenQualityIssuesDialog(true);
  };

  const handleOverdueClick = () => {
    setStatusFilter('Pending Collection');
    setActiveTab(0);
    // Filter will show overdue in red already
  };

  // Assign collector handler
  const handleAssignCollector = (collection: HomeCollection) => {
    setSelectedCollection(collection);
    setOpenAssignCollectorDialog(true);
  };

  // View on map handler
  const handleViewOnMap = (collection: HomeCollection) => {
    const address = encodeURIComponent(collection.address || '');
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(url, '_blank');
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      const collections = generateMockCollections(45);
      const homeCollectionsList = generateMockHomeCollections(15);
      setPendingCollections(collections);
      setHomeCollections(homeCollectionsList);
      setLastUpdated(new Date());
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Data refreshed successfully',
        severity: 'success',
      });
    }, 500);
  };

  const handleCollectSubmit = (data: any) => {
    if (selectedCollection) {
      // Add to collected samples
      setCollectedSamples((prev) => [...prev, selectedCollection as Collection]);
      // Remove from pending
      setPendingCollections((prev) =>
        prev.filter((c) => c.id !== selectedCollection?.id)
      );
      setSnackbar({
        open: true,
        message: `Sample ${selectedCollection?.tokenNumber} marked as collected successfully`,
        severity: 'success',
      });
      setOpenCollectDialog(false);
    }
  };

  const handleSelectCollection = (id: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCollections(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCollections.size === filteredCollections.length) {
      setSelectedCollections(new Set());
    } else {
      setSelectedCollections(new Set(filteredCollections.map((c) => c.id)));
    }
  };

  const handleExportCSV = () => {
    const csv = exportCollectionsToCSV(filteredCollections);
    downloadCSV(csv, `collections-${new Date().toISOString().split('T')[0]}.csv`);
    setSnackbar({
      open: true,
      message: 'Collections exported to CSV successfully',
      severity: 'success',
    });
  };

  const handleScan = (barcode: string) => {
    const collection = pendingCollections.find(
      (c) => c.sampleID.includes(barcode) || c.tokenNumber.includes(barcode)
    );

    if (collection) {
      handleCollectClick(collection);
      setSnackbar({
        open: true,
        message: `Found: ${collection.patient?.name || 'Patient'}`,
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Sample not found in pending collections',
        severity: 'warning',
      });
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography>Loading collections...</Typography>
            </Stack>
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  const displayedCollections = filteredCollections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 0.5,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Sample Collection Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage and track all sample collections from patients
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!autoRefresh && (
            <Tooltip title="Refresh Data">
              <IconButton color="primary" onClick={handleManualRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="textSecondary" display="block">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-Refresh"
              sx={{ m: 0 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <Box onClick={handlePendingClick} sx={{ cursor: 'pointer' }}>
          <StatsCard
            icon={<HourglassEmptyIcon />}
            label="Pending Collections"
            count={stats.pending}
            color="#FF9800"
          />
        </Box>
        <Box onClick={handleCollectedTodayClick} sx={{ cursor: 'pointer' }}>
          <StatsCard
            icon={<CheckCircleIcon />}
            label="Collected Today"
            count={stats.today}
            color="#4CAF50"
          />
        </Box>
        <Box onClick={handleHomeCollectionsClick} sx={{ cursor: 'pointer' }}>
          <StatsCard
            icon={<LocalShippingIcon />}
            label="Home Pending"
            count={stats.homeCollectionsPending}
            color="#2196F3"
          />
        </Box>
        <Box onClick={handleQualityIssuesClick} sx={{ cursor: 'pointer' }}>
          <StatsCard
            icon={<WarningIcon />}
            label="Quality Issues"
            count={stats.qualityIssues}
            color="#F44336"
          />
        </Box>
        <Box onClick={handleOverdueClick} sx={{ cursor: 'pointer' }}>
          <StatsCard
            icon={<AlarmIcon />}
            label="Overdue (>30m)"
            count={stats.overdue}
            color="#F44336"
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="collection tabs"
        >
          <Tab label="Lab Collection" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Home Collection" id="tab-1" aria-controls="tabpanel-1" />
        </Tabs>
      </Paper>

      {/* LAB COLLECTION TAB */}
      <TabPanel value={activeTab} index={0}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 2fr' }, gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                placeholder="Search by token, name, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                size="small"
              />
              <Select
                fullWidth
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                size="small"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Pending Collection">Pending</MenuItem>
                <MenuItem value="Collected">Collected</MenuItem>
              </Select>
              <Select
                fullWidth
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
                size="small"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Walk-in">Walk-in</MenuItem>
                <MenuItem value="Scheduled">Scheduled</MenuItem>
              </Select>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Scan barcode">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={() => setOpenScannerDialog(true)}
                  >
                    Scan
                  </Button>
                </Tooltip>
                <Tooltip title="Export to CSV">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                  >
                    Export
                  </Button>
                </Tooltip>
                <Tooltip title="Auto-refresh every minute">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Auto"
                    sx={{ m: 0 }}
                  />
                </Tooltip>
              </Stack>
            </Box>
        </Paper>

        {/* Collections Table */}
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedCollections.size > 0 &&
                      selectedCollections.size < filteredCollections.length
                    }
                    checked={
                      filteredCollections.length > 0 &&
                      selectedCollections.size === filteredCollections.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Token</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sample ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Age/Gender</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tests</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Wait Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCollections.map((collection) => (
                <TableRow
                  key={collection.id}
                  hover
                  sx={{
                    backgroundColor:
                      collection.priority === 'STAT'
                        ? '#ffebee'
                        : ((collection as any).waitingMinutes || 0) > 30
                        ? '#fff3e0'
                        : 'white',
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCollections.has(collection.id)}
                      onChange={() => handleSelectCollection(collection.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      {getPriorityLabel(collection.priority)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {collection.tokenNumber}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{collection.sampleID}</Typography>
                  </TableCell>
                  <TableCell>{collection.patient?.name}</TableCell>
                  <TableCell>
                    {collection.patient?.age}/{collection.patient?.gender}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Call patient">
                      <IconButton
                        size="small"
                        href={`tel:${collection.patient?.mobile}`}
                        sx={{ p: 0.5 }}
                      >
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={Array.isArray(collection.tests) ? collection.tests.join(', ') : ''}>
                      <Typography variant="body2">
                        {Array.isArray(collection.tests) && collection.tests.slice(0, 2).join(', ')}
                        {Array.isArray(collection.tests) && collection.tests.length > 2 && ` +${collection.tests.length - 2}`}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: getWaitingColor((collection as any).waitingMinutes || 0),
                      }}
                    >
                      {(collection as any).waitingMinutes || 0} min
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={collection.status}
                      size="small"
                      color={collection.status === 'Collected' ? 'success' : 'warning'}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={collection.bookingType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Collect Sample">
                        <IconButton
                          size="small"
                          onClick={() => handleCollectClick(collection)}
                          color="primary"
                          sx={{ p: 0.5 }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          sx={{ p: 0.5 }}
                          onClick={() => handleViewDetails(collection)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Token">
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredCollections.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">
              No collections found matching your criteria
            </Typography>
          </Box>
        ) : (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredCollections.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TabPanel>

      {/* HOME COLLECTION TAB */}
      <TabPanel value={activeTab} index={1}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2, mb: 2 }}>
            {/* Status Filter */}
            <Select
              fullWidth
              value={homeStatusFilter}
              onChange={(e) => setHomeStatusFilter(e.target.value)}
              size="small"
              displayEmpty
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value={HomeCollectionStatus.PendingAssignment}>Pending Assignment</MenuItem>
              <MenuItem value={HomeCollectionStatus.Assigned}>Assigned</MenuItem>
              <MenuItem value={HomeCollectionStatus.InProgress}>In Progress</MenuItem>
              <MenuItem value={HomeCollectionStatus.Collected}>Collected</MenuItem>
              <MenuItem value={HomeCollectionStatus.Cancelled}>Cancelled</MenuItem>
            </Select>

            {/* Date Filter */}
            <Select
              fullWidth
              value={homeDateFilter}
              onChange={(e) => setHomeDateFilter(e.target.value)}
              size="small"
              displayEmpty
            >
              <MenuItem value="all">All Dates</MenuItem>
              <MenuItem value="Today">Today</MenuItem>
              <MenuItem value="Tomorrow">Tomorrow</MenuItem>
              <MenuItem value="This Week">This Week</MenuItem>
              <MenuItem value="Custom Range">Custom Range</MenuItem>
            </Select>

            {/* Area Filter */}
            <Select
              fullWidth
              value={homeAreaFilter}
              onChange={(e) => setHomeAreaFilter(e.target.value)}
              size="small"
              displayEmpty
            >
              <MenuItem value="all">All Areas</MenuItem>
              {uniqueAreas.map((area) => (
                <MenuItem key={area} value={area}>{area}</MenuItem>
              ))}
            </Select>

            {/* Collector Filter */}
            <Select
              fullWidth
              value={homeCollectorFilter}
              onChange={(e) => setHomeCollectorFilter(e.target.value)}
              size="small"
              displayEmpty
            >
              <MenuItem value="all">All Collectors</MenuItem>
              {uniqueCollectors.map((collector: any) => (
                <MenuItem key={collector.id} value={collector.id}>
                  {collector.name}
                </MenuItem>
              ))}
            </Select>

            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search patient, mobile, address..."
              value={homeSearchQuery}
              onChange={(e) => setHomeSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Custom Date Range */}
          {homeDateFilter === 'Custom Range' && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="From Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setCustomDateFrom(e.target.value ? new Date(e.target.value) : null)}
                fullWidth
              />
              <TextField
                label="To Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setCustomDateTo(e.target.value ? new Date(e.target.value) : null)}
                fullWidth
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Typography variant="body2" color="textSecondary" sx={{ flex: 1, alignSelf: 'center' }}>
              Showing {filteredHomeCollections.length} of {homeCollections.length} results
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenRouteDialog(true)}>
              Create Route
            </Button>
            <Button variant="outlined" startIcon={<EditIcon />}>
              Bulk Assign
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Token</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Area</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Time Slot</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Collector</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHomeCollections.map((collection) => (
                <TableRow key={collection.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{collection.tokenNumber}</TableCell>
                  <TableCell>{collection.patient?.name}</TableCell>
                  <TableCell>
                    <Tooltip title="Call patient">
                      <IconButton size="small" href={`tel:${collection.patient?.mobile}`} sx={{ p: 0.5 }}>
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{collection.area}</TableCell>
                  <TableCell>
                    {new Date(collection.preferredDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{collection.preferredTimeSlot}</TableCell>
                  <TableCell>
                    <Chip
                      label={collection.homeCollectionStatus}
                      size="small"
                      color={
                        collection.homeCollectionStatus === HomeCollectionStatus.Collected
                          ? 'success'
                          : collection.homeCollectionStatus === HomeCollectionStatus.Cancelled
                          ? 'error'
                          : 'warning'
                      }
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    {collection.assignedCollector ? (
                      <Typography variant="body2">{collection.assignedCollector.name}</Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Not Assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {(collection as any).homeCollectionStatus === HomeCollectionStatus.PendingAssignment ? (
                        <Tooltip title="Assign Collector">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleAssignCollector(collection)}
                            sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                          >
                            Assign
                          </Button>
                        </Tooltip>
                      ) : (
                        collection.assignedCollector && (
                          <Chip 
                            label={collection.assignedCollector.name} 
                            size="small" 
                            color="success"
                            variant="outlined"
                          />
                        )
                      )}
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          sx={{ p: 0.5 }}
                          onClick={() => handleViewDetails(collection)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View on Map">
                        <IconButton 
                          size="small" 
                          color="info"
                          sx={{ p: 0.5 }}
                          onClick={() => handleViewOnMap(collection)}
                        >
                          <CallReceivedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Dialogs */}
      <CollectSampleDialog
        open={openCollectDialog}
        collection={selectedCollection}
        onClose={() => setOpenCollectDialog(false)}
        onSubmit={handleCollectSubmit}
      />

      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Collection Details</DialogTitle>
        <DialogContent dividers>
          {selectedCollection ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Token</Typography>
                <Typography variant="body1">{selectedCollection.tokenNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Sample ID</Typography>
                <Typography variant="body1">{selectedCollection.sampleID}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Patient</Typography>
                <Typography variant="body1">{selectedCollection.patient?.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedCollection.patient?.age}/{selectedCollection.patient?.gender}
                </Typography>
                <Typography variant="body2">{selectedCollection.patient?.mobile}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={selectedCollection.status} size="small" color={selectedCollection.status === 'Collected' ? 'success' : 'warning'} />
                <Chip label={selectedCollection.bookingType} size="small" variant="outlined" />
                <Chip label={`Priority: ${selectedCollection.priority}`} size="small" variant="outlined" />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Booking</Typography>
                <Typography variant="body2">{selectedCollection.bookingDate}</Typography>
                <Typography variant="body2">{selectedCollection.bookingTime}</Typography>
              </Box>
              {Array.isArray(selectedCollection.tests) && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Tests</Typography>
                  <Typography variant="body2">{selectedCollection.tests.join(', ')}</Typography>
                </Box>
              )}
              {'homeCollectionStatus' in selectedCollection && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Home Collection</Typography>
                    <Typography variant="body2">Status: {selectedCollection.homeCollectionStatus}</Typography>
                    <Typography variant="body2">Area: {selectedCollection.area}</Typography>
                    <Typography variant="body2">Address: {selectedCollection.address}</Typography>
                    <Typography variant="body2">Preferred: {selectedCollection.preferredDate} • {selectedCollection.preferredTimeSlot}</Typography>
                  </Box>
                </>
              )}
            </Stack>
          ) : (
            <Typography>No collection selected.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <BarcodeScannerDialog
        open={openScannerDialog}
        onClose={() => setOpenScannerDialog(false)}
        onScan={handleScan}
      />

      {/* Assign Collector Dialog */}
      <AssignCollectorDialog
        open={openAssignCollectorDialog}
        collection={selectedCollection as HomeCollection}
        onClose={() => setOpenAssignCollectorDialog(false)}
        onAssign={(assignmentData) => {
          // Update home collection with assignment
          setHomeCollections(prev =>
            prev.map(c =>
              c.id === selectedCollection?.id
                ? {
                    ...c,
                    homeCollectionStatus: HomeCollectionStatus.Assigned,
                    assignedCollector: assignmentData.collector,
                    scheduledDate: assignmentData.scheduledDate,
                    scheduledTime: assignmentData.scheduledTime,
                    assignedAt: new Date().toISOString(),
                  } as any
                : c
            )
          );
          setSnackbar({
            open: true,
            message: `Collector ${assignmentData.collector.name} assigned successfully`,
            severity: 'success',
          });
          setOpenAssignCollectorDialog(false);
        }}
      />

      {/* Collected Samples Dialog */}
      <Dialog 
        open={openCollectedDialog} 
        onClose={() => setOpenCollectedDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Collected Samples Today
          <IconButton
            onClick={() => setOpenCollectedDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {collectedSamples.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">No samples collected today</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Token</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Tests</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {collectedSamples.map((sample) => (
                    <TableRow key={sample.id}>
                      <TableCell>{sample.tokenNumber}</TableCell>
                      <TableCell>{sample.patient?.name}</TableCell>
                      <TableCell>
                        {Array.isArray(sample.tests) ? sample.tests.join(', ') : ''}
                      </TableCell>
                      <TableCell>{sample.collectedAt || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Quality Issues Dialog */}
      <Dialog 
        open={openQualityIssuesDialog} 
        onClose={() => setOpenQualityIssuesDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Quality Issues
          <IconButton
            onClick={() => setOpenQualityIssuesDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pendingCollections.filter(c => c.qualityIssues && c.qualityIssues.length > 0).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">No quality issues found</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Token</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingCollections
                    .filter(c => c.qualityIssues && c.qualityIssues.length > 0)
                    .map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>{collection.tokenNumber}</TableCell>
                        <TableCell>{collection.patient?.name}</TableCell>
                        <TableCell>
                          {collection.qualityIssues?.map(q => q.description).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={collection.qualityIssues?.[0]?.status || 'Pending'} 
                            size="small"
                            color="warning"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Route Planning Dialog */}
      <RouteDialog
        open={openRouteDialog}
        onClose={() => setOpenRouteDialog(false)}
        homeCollections={homeCollections}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as any}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button - Scan */}
      <Tooltip title="Scan Sample" placement="left">
        <Button
          variant="contained"
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            borderRadius: '50%',
            width: 60,
            height: 60,
            minWidth: 0,
            zIndex: 1000,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 5,
            },
          }}
          onClick={() => setOpenScannerDialog(true)}
        >
          <QrCodeScannerIcon sx={{ fontSize: 28 }} />
        </Button>
      </Tooltip>
      </Container>
    </DashboardLayout>
  );
}
