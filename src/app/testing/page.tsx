'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  AlertTitle,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Paper,
  Tooltip,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Stack,
  Radio,
  RadioGroup,
  FormLabel,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import {
  PlayArrow as StartIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as ApproveIcon,
  QrCodeScanner as ScanIcon,
  CloudUpload as ImportIcon,
  Save as SaveIcon,
  Send as SubmitIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  NotificationImportant as CriticalIcon,
  AccessTime as TimeIcon,
  Science as TestIcon,
  Assignment as ReportIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  TestResult,
  TestStatus,
  TestPriority,
  ParameterValue,
  QCStatus,
  ParameterFlag,
  PARAMETER_FLAGS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  QC_STATUS_COLORS,
  MachineType,
  MACHINE_TYPES,
  ResultFormData,
  CriticalValueNotification,
  Sample,
  Patient,
  TestParameter,
} from '@/types/testing';
import { TEST_CONFIGS } from '@/config/tests';
import { TestConfig, TEST_CONFIGS as NEW_TEST_CONFIGS } from '@/config/testConfigs';
import {
  calculateFlag,
  isCritical,
  calculateTAT,
  formatParameterValue,
  formatNormalRange,
  autoCalculate,
  generateInterpretation,
  formatTime,
  formatDateTime,
} from '@/utils/testingHelpers';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TestingPage() {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [pendingTests, setPendingTests] = useState<TestResult[]>([]);
  const [inProgressTests, setInProgressTests] = useState<TestResult[]>([]);
  const [completedTests, setCompletedTests] = useState<TestResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  
  const [resultFormData, setResultFormData] = useState<ResultFormData>({
    testedBy: '',
    testDate: new Date().toISOString().split('T')[0],
    testTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    machineUsed: 'Manual',
    batchNumber: '',
    dilutionFactor: 1,
    parameterValues: {},
    qcData: {
      status: 'Passed',
      calibrationValid: true,
    },
    interpretation: '',
    remarks: '',
    verificationChecklist: {
      parametersEntered: false,
      valuesCrossChecked: false,
      qcPassed: false,
      unitsVerified: false,
      criticalNotified: false,
      patientVerified: false,
    },
  });
  
  const [enterResultsDialogOpen, setEnterResultsDialogOpen] = useState(false);
  const [viewResultsDialogOpen, setViewResultsDialogOpen] = useState(false);
  const [criticalAlertDialogOpen, setCriticalAlertDialogOpen] = useState(false);
  const [machineImportDialogOpen, setMachineImportDialogOpen] = useState(false);
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [bulkSelectedTests, setBulkSelectedTests] = useState<string[]>([]);
  
  const [pendingFilters, setPendingFilters] = useState({ search: '', priority: '' });
  const [completedFilters, setCompletedFilters] = useState({ search: '', qcStatus: '', criticalOnly: false });
  
  const [stats, setStats] = useState({
    ready: 0,
    inProgress: 0,
    completed: 0,
    critical: 0,
    pendingQC: 0,
  });
  
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  
  const [currentCriticalAlert, setCurrentCriticalAlert] = useState<CriticalValueNotification | null>(null);

  // Dummy data
  const generateDummyPatient = (id: number): Patient => ({
    id: `PAT${String(id).padStart(5, '0')}`,
    name: `Patient ${id}`,
    age: 20 + Math.floor(Math.random() * 60),
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    mobile: `98765${String(10000 + id).slice(-5)}`,
    patientID: `PID${id}`,
  });

  const generateDummySample = (id: number): Sample => ({
    id: `SAMP${String(id).padStart(5, '0')}`,
    sampleID: `NXA${1000 + id}`,
    tokenNumber: `T${100 + id}`,
    collectionDate: new Date().toISOString().split('T')[0],
    collectionTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    collectedBy: 'Collector ' + (id % 3 + 1),
    sampleType: 'Blood',
    sampleQuality: 'Good',
  });

  const getDummyPendingTests = (): TestResult[] => {
    const tests: TestResult[] = [];
    const testTypes = ['CBC', 'BLOOD_SUGAR', 'LIPID_PROFILE', 'LFT', 'KFT', 'THYROID'];
    const priorities: TestPriority[] = ['Normal', 'Urgent', 'STAT'];
    
    for (let i = 1; i <= 30; i++) {
      const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
      tests.push({
        id: `TEST${String(i).padStart(5, '0')}`,
        testResultID: `TR${String(i).padStart(5, '0')}`,
        sample: generateDummySample(i),
        patient: generateDummyPatient(i),
        test: TEST_CONFIGS[testType],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: 'Pending',
        hasCriticalValues: false,
        parameterValues: [],
      });
    }
    return tests;
  };

  const getDummyInProgressTests = (): TestResult[] => {
    const tests: TestResult[] = [];
    for (let i = 1; i <= 6; i++) {
      tests.push({
        id: `TEST${String(100 + i).padStart(5, '0')}`,
        testResultID: `TR${String(100 + i).padStart(5, '0')}`,
        sample: generateDummySample(100 + i),
        patient: generateDummyPatient(100 + i),
        test: TEST_CONFIGS['CBC'],
        priority: 'Normal',
        status: 'InProgress',
        hasCriticalValues: false,
        parameterValues: [],
        startedAt: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        testedBy: 'Tech ' + (i % 3 + 1),
      });
    }
    return tests;
  };

  const getDummyCompletedTests = (): TestResult[] => {
    const tests: TestResult[] = [];
    const qcStatuses: QCStatus[] = ['Passed', 'Borderline', 'Failed'];
    
    for (let i = 1; i <= 35; i++) {
      tests.push({
        id: `TEST${String(200 + i).padStart(5, '0')}`,
        testResultID: `TR${String(200 + i).padStart(5, '0')}`,
        sample: generateDummySample(200 + i),
        patient: generateDummyPatient(200 + i),
        test: TEST_CONFIGS['CBC'],
        priority: 'Normal',
        status: 'Completed',
        hasCriticalValues: Math.random() > 0.85,
        parameterValues: [],
        testedBy: 'Tech ' + (i % 5 + 1),
        completedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        qcStatus: qcStatuses[Math.floor(Math.random() * qcStatuses.length)],
      });
    }
    return tests;
  };

  useEffect(() => {
    setPendingTests(getDummyPendingTests());
    setInProgressTests(getDummyInProgressTests());
    setCompletedTests(getDummyCompletedTests());
  }, []);

  useEffect(() => {
    setStats({
      ready: pendingTests.length,
      inProgress: inProgressTests.length,
      completed: completedTests.length,
      critical: completedTests.filter(t => t.hasCriticalValues).length,
      pendingQC: completedTests.filter(t => t.qcStatus !== 'Passed').length,
    });
  }, [pendingTests, inProgressTests, completedTests]);

  const handleStartTesting = (test: TestResult) => {
    setSelectedTest(test);
    const initialValues: Record<string, number | string> = {};
    test.test.parameters.forEach(param => {
      if (!param.isCalculated) {
        initialValues[param.id] = '';
      }
    });
    setResultFormData({
      ...resultFormData,
      parameterValues: initialValues,
      testedBy: 'Current User',
    });
    setEnterResultsDialogOpen(true);
  };

  const handleParameterChange = (parameterId: string, value: string) => {
    const updatedValues = { ...resultFormData.parameterValues, [parameterId]: value };
    
    if (selectedTest) {
      const numericValues: Record<string, number> = {};
      Object.entries(updatedValues).forEach(([key, val]) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (!Number.isNaN(num) && num !== undefined) {
          numericValues[key] = num;
        }
      });
      numericValues.age = selectedTest.patient.age;
      numericValues.gender = selectedTest.patient.gender === 'Female' ? 1 : 0;

      selectedTest.test.parameters.forEach((param) => {
        if (param.isCalculated && param.formula) {
          const calculated = autoCalculate(param.formula, numericValues);
          if (calculated !== null && !Number.isNaN(calculated)) {
            updatedValues[param.id] = calculated;
            numericValues[param.id] = calculated;
          }
        }
      });
    }
    
    setResultFormData({ ...resultFormData, parameterValues: updatedValues });
    
    if (selectedTest && value) {
      const numValue = parseFloat(value);
      const param = selectedTest.test.parameters.find(p => p.id === parameterId);
      
      if (param && !isNaN(numValue) && isCritical(numValue, param.criticalLow, param.criticalHigh)) {
        setCurrentCriticalAlert({
          parameterId: param.id,
          parameterName: param.name,
          value: numValue,
          notifiedTo: '',
          notificationMethod: [],
          notificationTime: new Date().toISOString(),
          response: '',
          acknowledgedBy: '',
        });
        setCriticalAlertDialogOpen(true);
      }
    }
  };

  const handleSaveResult = () => {
    if (!selectedTest) return;
    
    const checklist = resultFormData.verificationChecklist;
    if (!checklist.parametersEntered || !checklist.qcPassed || !checklist.patientVerified) {
      setSnackbar({ open: true, message: 'Complete all verification items', severity: 'error' });
      return;
    }
    
    const parameterValues: ParameterValue[] = Object.entries(resultFormData.parameterValues)
      .filter(([key, value]) => value !== '')
      .map(([id, value]) => {
        const param = selectedTest.test.parameters.find(p => p.id === id);
        if (!param) return null;
        
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const flag = calculateFlag(numValue, param.normalRange, selectedTest.patient.gender);
        
        return {
          parameterId: id,
          parameterName: param.name,
          value: numValue,
          unit: param.unit,
          normalRange: formatNormalRange(param.normalRange, selectedTest.patient.gender),
          flag,
          isCritical: isCritical(numValue, param.criticalLow, param.criticalHigh),
        };
      })
      .filter(Boolean) as ParameterValue[];

    let interpretation = resultFormData.interpretation;
    if (!interpretation) {
      interpretation = generateInterpretation(parameterValues);
    }
    
    const updatedTest: TestResult = {
      ...selectedTest,
      status: 'Completed',
      parameterValues,
      interpretation,
      remarks: resultFormData.remarks,
      completedAt: new Date().toISOString(),
      testedBy: resultFormData.testedBy,
      machineUsed: resultFormData.machineUsed,
      qcStatus: resultFormData.qcData.status,
      qcData: resultFormData.qcData,
    };
    
    setPendingTests(prev => prev.filter(t => t.id !== selectedTest.id));
    setCompletedTests(prev => [updatedTest, ...prev]);
    setEnterResultsDialogOpen(false);
    setSnackbar({ open: true, message: 'Results saved successfully', severity: 'success' });
  };

  const handleViewResults = (test: TestResult) => {
    setSelectedTest(test);
    setViewResultsDialogOpen(true);
  };

  const handleMachineImport = () => {
    setMachineImportDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Simulate file processing
      setTimeout(() => {
        const mockData = [
          { sampleID: 'NXA1001', test: 'CBC', results: { WBC: 7.5, RBC: 4.8, Hemoglobin: 14.2 } },
          { sampleID: 'NXA1002', test: 'CBC', results: { WBC: 8.2, RBC: 5.1, Hemoglobin: 15.1 } },
          { sampleID: 'NXA1003', test: 'Blood Sugar', results: { Fasting: 98, PP: 142 } },
        ];
        setImportData(mockData);
        setSnackbar({ open: true, message: `${mockData.length} results imported from ${file.name}`, severity: 'success' });
      }, 1000);
    }
  };

  const handleBulkImport = () => {
    if (importData.length === 0) {
      setSnackbar({ open: true, message: 'No data to import', severity: 'error' });
      return;
    }
    // Process imported data
    const processed = importData.map(item => {
      const test = pendingTests.find(t => t.sample.sampleID === item.sampleID);
      if (test) {
        return {
          ...test,
          status: 'Completed' as TestStatus,
          parameterValues: Object.entries(item.results).map(([key, value]) => ({
            parameterId: key,
            parameterName: key,
            value: value as number,
            unit: '',
            normalRange: '',
            flag: 'Normal' as ParameterFlag,
            isCritical: false,
          })),
          testedBy: 'Machine Import',
          completedAt: new Date().toISOString(),
          qcStatus: 'Passed' as QCStatus,
        };
      }
      return null;
    }).filter(Boolean) as TestResult[];

    setPendingTests(prev => prev.filter(t => !processed.find(p => p.id === t.id)));
    setCompletedTests(prev => [...processed, ...prev]);
    setMachineImportDialogOpen(false);
    setImportData([]);
    setImportFile(null);
    setSnackbar({ open: true, message: `${processed.length} results imported successfully`, severity: 'success' });
  };

  const handleBulkApprove = () => {
    if (bulkSelectedTests.length === 0) {
      setSnackbar({ open: true, message: 'Please select tests to approve', severity: 'error' });
      return;
    }
    const updated = completedTests.map(t => 
      bulkSelectedTests.includes(t.id) ? { ...t, status: 'Approved' as TestStatus } : t
    );
    setCompletedTests(updated);
    setBulkSelectedTests([]);
    setBulkApproveDialogOpen(false);
    setSnackbar({ open: true, message: `${bulkSelectedTests.length} tests approved`, severity: 'success' });
  };

  const handleExportResults = (format: 'excel' | 'csv' | 'pdf') => {
    const data = completedTests.map(t => ({
      'Sample ID': t.sample.sampleID,
      'Token': t.sample.tokenNumber,
      'Patient': t.patient.name,
      'Test': t.test.testName,
      'Tested By': t.testedBy,
      'Completed At': formatDateTime(t.completedAt || ''),
      'QC Status': t.qcStatus,
    }));
    console.log(`Exporting ${data.length} results as ${format}`);
    setSnackbar({ open: true, message: `Exported ${data.length} results as ${format.toUpperCase()}`, severity: 'success' });
    setExportDialogOpen(false);
  };

  const handlePrintResult = (test: TestResult) => {
    console.log('Printing result for:', test.sample.sampleID);
    setSnackbar({ open: true, message: 'Sending to printer...', severity: 'info' });
  };

  const filteredPendingTests = useMemo(() => {
    let filtered = [...pendingTests];
    if (pendingFilters.search) {
      const search = pendingFilters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.sample.sampleID.toLowerCase().includes(search) ||
        t.patient.name.toLowerCase().includes(search)
      );
    }
    if (pendingFilters.priority) {
      filtered = filtered.filter(t => t.priority === pendingFilters.priority);
    }
    return filtered;
  }, [pendingTests, pendingFilters]);

  const filteredCompletedTests = useMemo(() => {
    let filtered = [...completedTests];
    if (completedFilters.search) {
      const search = completedFilters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.sample.sampleID.toLowerCase().includes(search) ||
        t.patient.name.toLowerCase().includes(search)
      );
    }
    if (completedFilters.qcStatus) {
      filtered = filtered.filter(t => t.qcStatus === completedFilters.qcStatus);
    }
    if (completedFilters.criticalOnly) {
      filtered = filtered.filter(t => t.hasCriticalValues);
    }
    return filtered;
  }, [completedTests, completedFilters]);

  const pendingColumns: GridColDef<TestResult>[] = [
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" sx={{ bgcolor: PRIORITY_COLORS[params.value as TestPriority], color: 'white' }} />
      ),
    },
    { field: 'sampleId', headerName: 'Sample ID', width: 120, valueGetter: (_value: any, row: TestResult) => row?.sample?.sampleID ?? '' },
    { field: 'token', headerName: 'Token', width: 80, valueGetter: (_value: any, row: TestResult) => row?.sample?.tokenNumber ?? '' },
    { field: 'patient', headerName: 'Patient', width: 150, valueGetter: (_value: any, row: TestResult) => row?.patient?.name ?? '' },
    { field: 'test', headerName: 'Test', width: 180, valueGetter: (_value: any, row: TestResult) => row?.test?.testName ?? '' },
    { field: 'category', headerName: 'Category', width: 130, valueGetter: (_value: any, row: TestResult) => row?.test?.category ?? '' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Start Testing">
            <IconButton size="small" color="primary" onClick={() => handleStartTesting(params.row)}>
              <StartIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const inProgressColumns: GridColDef<TestResult>[] = [
    { field: 'sampleId', headerName: 'Sample', width: 120, valueGetter: (_value: any, row: TestResult) => row?.sample?.sampleID ?? '' },
    { field: 'patient', headerName: 'Patient', width: 150, valueGetter: (_value: any, row: TestResult) => row?.patient?.name ?? '' },
    { field: 'test', headerName: 'Test', width: 180, valueGetter: (_value: any, row: TestResult) => row?.test?.testName ?? '' },
    { field: 'testedBy', headerName: 'Started By', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Button size="small" variant="contained" startIcon={<EditIcon />} onClick={() => handleStartTesting(params.row)}>
          Resume
        </Button>
      ),
    },
  ];

  const completedColumns: GridColDef<TestResult>[] = [
    { field: 'sampleId', headerName: 'Sample', width: 120, valueGetter: (_value: any, row: TestResult) => row?.sample?.sampleID ?? '' },
    { field: 'patient', headerName: 'Patient', width: 150, valueGetter: (_value: any, row: TestResult) => row?.patient?.name ?? '' },
    { field: 'test', headerName: 'Test', width: 180, valueGetter: (_value: any, row: TestResult) => row?.test?.testName ?? '' },
    { field: 'testedBy', headerName: 'Tested By', width: 120 },
    {
      field: 'completedAt',
      headerName: 'Completed',
      width: 150,
      valueGetter: (_value: any, row: TestResult) => row?.completedAt ? formatDateTime(row.completedAt) : '-',
    },
    {
      field: 'qcStatus',
      headerName: 'QC',
      width: 100,
      renderCell: (params) => params.value ? (
        <Chip label={params.value} size="small" sx={{ bgcolor: QC_STATUS_COLORS[params.value as QCStatus], color: 'white' }} />
      ) : null,
    },
    {
      field: 'hasCriticalValues',
      headerName: 'Critical',
      width: 90,
      renderCell: (params) => params.value ? <WarningIcon color="error" /> : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" color="primary" onClick={() => handleViewResults(params.row)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
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
            Testing & Machine Entry
          </Typography>
          <Box>
            <Button variant="outlined" startIcon={<ImportIcon />} sx={{ mr: 1 }} onClick={handleMachineImport}>
              Machine Import
            </Button>
            <Button variant="outlined" startIcon={<ScanIcon />} sx={{ mr: 1 }}>Scan</Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => {
              setPendingTests(getDummyPendingTests());
              setInProgressTests(getDummyInProgressTests());
              setCompletedTests(getDummyCompletedTests());
              setSnackbar({ open: true, message: 'Data refreshed', severity: 'success' });
            }}>Refresh</Button>
            <Button variant="outlined" startIcon={<ExportIcon />} sx={{ ml: 1 }} onClick={() => setExportDialogOpen(true)}>
              Export
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: '#2196F3', color: 'white', cursor: 'pointer' }} onClick={() => setActiveTab(0)}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">{stats.ready}</Typography>
                <Typography variant="body2">Ready</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: '#FF9800', color: 'white', cursor: 'pointer' }} onClick={() => setActiveTab(1)}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">{stats.inProgress}</Typography>
                <Typography variant="body2">In Progress</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: '#4CAF50', color: 'white', cursor: 'pointer' }} onClick={() => setActiveTab(2)}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">{stats.completed}</Typography>
                <Typography variant="body2">Completed</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: '#F44336', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">{stats.critical}</Typography>
                <Typography variant="body2">Critical</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: '#9C27B0', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">{stats.pendingQC}</Typography>
                <Typography variant="body2">Pending QC</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label={`Pending (${filteredPendingTests.length})`} />
            <Tab label={`In Progress (${inProgressTests.length})`} />
            <Tab label={`Completed (${filteredCompletedTests.length})`} />
          </Tabs>
        </Paper>

        <TabPanel value={activeTab} index={0}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={pendingFilters.search}
                  onChange={(e) => setPendingFilters({ ...pendingFilters, search: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select value={pendingFilters.priority} label="Priority" onChange={(e) => setPendingFilters({ ...pendingFilters, priority: e.target.value })}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Normal">Normal</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                    <MenuItem value="STAT">STAT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
          <Paper sx={{ height: 600 }}>
            <DataGrid rows={filteredPendingTests} columns={pendingColumns} checkboxSelection pageSizeOptions={[10, 25, 50]} />
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Paper sx={{ height: 600 }}>
            <DataGrid rows={inProgressTests} columns={inProgressColumns} pageSizeOptions={[10, 25]} />
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" label="Search" value={completedFilters.search} onChange={(e) => setCompletedFilters({ ...completedFilters, search: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>QC Status</InputLabel>
                  <Select value={completedFilters.qcStatus} label="QC Status" onChange={(e) => setCompletedFilters({ ...completedFilters, qcStatus: e.target.value })}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Passed">Passed</MenuItem>
                    <MenuItem value="Borderline">Borderline</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={<Checkbox checked={completedFilters.criticalOnly} onChange={(e) => setCompletedFilters({ ...completedFilters, criticalOnly: e.target.checked })} />}
                  label="Critical Only"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  size="small"
                  startIcon={<ApproveIcon />}
                  disabled={bulkSelectedTests.length === 0}
                  onClick={() => setBulkApproveDialogOpen(true)}
                >
                  Approve ({bulkSelectedTests.length})
                </Button>
              </Grid>
            </Grid>
          </Paper>
          <Paper sx={{ height: 600 }}>
            <DataGrid
              rows={filteredCompletedTests}
              columns={completedColumns}
              checkboxSelection
              pageSizeOptions={[10, 25, 50]}
              onRowSelectionModelChange={(newSelection) => {
                setBulkSelectedTests(Array.from(newSelection as any));
              }}
            />
          </Paper>
        </TabPanel>

        <Dialog open={enterResultsDialogOpen} onClose={() => setEnterResultsDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Enter Test Results</Typography>
              <IconButton onClick={() => setEnterResultsDialogOpen(false)}><CloseIcon /></IconButton>
            </Box>
            {selectedTest && (
              <Typography variant="body2" color="text.secondary">
                {selectedTest.sample.sampleID} | {selectedTest.patient.name} | {selectedTest.test.testName}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers>
            {selectedTest && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Testing Details</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Tested By" value={resultFormData.testedBy} onChange={(e) => setResultFormData({ ...resultFormData, testedBy: e.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Machine</InputLabel>
                        <Select value={resultFormData.machineUsed} label="Machine" onChange={(e) => setResultFormData({ ...resultFormData, machineUsed: e.target.value as MachineType })}>
                          {MACHINE_TYPES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Parameters</Typography>
                  <Grid container spacing={2}>
                    {selectedTest.test.parameters.map((param) => {
                      const value = resultFormData.parameterValues[param.id] || '';
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      const flag = !isNaN(numValue) ? calculateFlag(numValue, param.normalRange, selectedTest.patient.gender) : 'Normal';

                      return (
                        <Grid size={{ xs: 12, md: 6 }} key={param.id}>
                          <Box sx={{ p: 2, border: '1px solid', borderColor: PARAMETER_FLAGS[flag].color, borderRadius: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label={param.name}
                              value={value}
                              onChange={(e) => handleParameterChange(param.id, e.target.value)}
                              disabled={param.isCalculated}
                              InputProps={{
                                endAdornment: <Typography variant="caption">{param.unit}</Typography>,
                              }}
                            />
                            <Typography variant="caption">
                              Normal: {formatNormalRange(param.normalRange, selectedTest.patient.gender)}
                            </Typography>
                            {value && <Chip label={flag} size="small" sx={{ bgcolor: PARAMETER_FLAGS[flag].color, color: 'white', ml: 1 }} />}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Verification</Typography>
                  <FormControlLabel
                    control={<Checkbox checked={resultFormData.verificationChecklist.parametersEntered} onChange={(e) => setResultFormData({ ...resultFormData, verificationChecklist: { ...resultFormData.verificationChecklist, parametersEntered: e.target.checked } })} />}
                    label="Parameters entered *"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={resultFormData.verificationChecklist.qcPassed} onChange={(e) => setResultFormData({ ...resultFormData, verificationChecklist: { ...resultFormData.verificationChecklist, qcPassed: e.target.checked } })} />}
                    label="QC passed *"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={resultFormData.verificationChecklist.patientVerified} onChange={(e) => setResultFormData({ ...resultFormData, verificationChecklist: { ...resultFormData.verificationChecklist, patientVerified: e.target.checked } })} />}
                    label="Patient verified *"
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEnterResultsDialogOpen(false)}>Cancel</Button>
            <Button variant="outlined" startIcon={<SaveIcon />}>Draft</Button>
            <Button variant="contained" startIcon={<SubmitIcon />} onClick={handleSaveResult}>Submit</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={viewResultsDialogOpen} onClose={() => setViewResultsDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Test Results</Typography>
              <IconButton onClick={() => setViewResultsDialogOpen(false)}><CloseIcon /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedTest && selectedTest.parameterValues && selectedTest.parameterValues.length > 0 && (
              <Box>
                {selectedTest.parameterValues.map((result) => (
                  <Box key={result.parameterId} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body2">{result.parameterName}</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2" fontWeight="bold">{result.value} {result.unit}</Typography>
                      <Typography variant="caption" color="text.secondary">({result.normalRange})</Typography>
                      <Chip label={result.flag} size="small" sx={{ bgcolor: PARAMETER_FLAGS[result.flag || 'Normal'].color, color: 'white' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={criticalAlertDialogOpen} onClose={() => setCriticalAlertDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#f44336', color: 'white' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <WarningIcon />
              <Typography variant="h6">CRITICAL VALUE</Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {currentCriticalAlert && (
              <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Critical Value Alert</AlertTitle>
                  Immediate notification required
                </Alert>
                <Typography variant="body2"><strong>Parameter:</strong> {currentCriticalAlert.parameterName}</Typography>
                <Typography variant="body2" color="error"><strong>Value:</strong> {currentCriticalAlert.value}</Typography>
                <TextField fullWidth label="Notified To" sx={{ mt: 2, mb: 2 }} />
                <FormControlLabel control={<Checkbox required />} label="I confirm notification" />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" color="error" onClick={() => { setCriticalAlertDialogOpen(false); setSnackbar({ open: true, message: 'Alert logged', severity: 'success' }); }}>
              Acknowledge
            </Button>
          </DialogActions>
        </Dialog>

        {/* Machine Import Dialog */}
        <Dialog open={machineImportDialogOpen} onClose={() => setMachineImportDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Machine Results Import</Typography>
              <IconButton onClick={() => setMachineImportDialogOpen(false)}><CloseIcon /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Select Machine Type</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Machine</InputLabel>
                <Select defaultValue="" label="Machine">
                  <MenuItem value="Sysmex XN-1000">Sysmex XN-1000 (Hematology)</MenuItem>
                  <MenuItem value="Roche Cobas">Roche Cobas c311 (Chemistry)</MenuItem>
                  <MenuItem value="Abbott Architect">Abbott Architect i2000SR (Immunoassay)</MenuItem>
                  <MenuItem value="BioMerieux">BioMerieux VIDAS (Serology)</MenuItem>
                  <MenuItem value="Manual">Manual Entry</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Upload Results File</Typography>
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv,.xls,.xlsx,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button variant="contained" component="span" startIcon={<ImportIcon />}>
                    Choose File
                  </Button>
                </label>
                {importFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected: {importFile.name}
                  </Typography>
                )}
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Supported formats: CSV, XLS, XLSX, TXT
                </Typography>
              </Box>
            </Box>

            {importData.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Preview ({importData.length} results)</Typography>
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', p: 2 }}>
                  {importData.map((item, index) => (
                    <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < importData.length - 1 ? '1px solid #eee' : 'none' }}>
                      <Typography variant="body2"><strong>Sample:</strong> {item.sampleID}</Typography>
                      <Typography variant="body2"><strong>Test:</strong> {item.test}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Results: {Object.keys(item.results).length} parameters
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setMachineImportDialogOpen(false);
              setImportData([]);
              setImportFile(null);
            }}>
              Cancel
            </Button>
            <Button variant="contained" startIcon={<ImportIcon />} onClick={handleBulkImport} disabled={importData.length === 0}>
              Import {importData.length} Results
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Approve Dialog */}
        <Dialog open={bulkApproveDialogOpen} onClose={() => setBulkApproveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Bulk Approve Results</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom>
              You are about to approve {bulkSelectedTests.length} test results. This action will:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <li>Mark results as approved</li>
              <li>Make them available for report generation</li>
              <li>Send notification to referring doctors (if configured)</li>
            </Box>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please ensure all QC checks are passed before approving.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkApproveDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="primary" startIcon={<ApproveIcon />} onClick={handleBulkApprove}>
              Approve {bulkSelectedTests.length} Results
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Export Results</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom>
              Export {completedTests.length} completed test results
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button variant="outlined" fullWidth onClick={() => handleExportResults('excel')} startIcon={<ExportIcon />}>
                Export as Excel
              </Button>
              <Button variant="outlined" fullWidth onClick={() => handleExportResults('csv')} startIcon={<ExportIcon />}>
                Export as CSV
              </Button>
              <Button variant="outlined" fullWidth onClick={() => handleExportResults('pdf')} startIcon={<PrintIcon />}>
                Export as PDF
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
