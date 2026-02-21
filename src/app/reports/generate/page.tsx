'use client';

// Report Generation Module - Main Page
// Comprehensive report generation system for pathologists and lab staff

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  IconButton,
  Badge,
  Snackbar,
  Alert,
  Slider,
  Autocomplete,
  Tooltip,
  CircularProgress,
  Menu,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  Switch,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import SignatureCanvas from 'react-signature-canvas';
import {
  Assignment as AssignmentIcon,
  Drafts as DraftsIcon,
  Publish as PublishIcon,
  Draw as DrawIcon,
  ReportProblem as ReportProblemIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  GetApp as GetAppIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Send as SendIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  TestResult,
  ReportData,
  Pathologist,
  DraftReport,
  PublishedReport,
  QuickStats,
  ReportFilters,
  Priority,
  ReportSettings,
  DeliveryOptions,
  ValidationResult,
  RemarksTemplate,
  Parameter,
} from '@/types/report';
import {
  generateReportID,
  generateAutoInterpretation,
  validateReport,
  calculateTATStatus,
  formatDate,
  getPriorityColor,
  getPriorityIcon,
} from '@/utils/reportHelpers';
import { generateReportPDF } from '@/utils/pdfGenerator';
import { sendReportNotifications, printReport } from '@/services/notifications';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Dummy data for development
const generateDummyTestResults = (): TestResult[] => {
  const departments = ['Hematology', 'Biochemistry', 'Microbiology', 'Serology', 'Immunology'];
  const tests = [
    { name: 'Complete Blood Count (CBC)', dept: 'Hematology' },
    { name: 'Liver Function Test (LFT)', dept: 'Biochemistry' },
    { name: 'Kidney Function Test (KFT)', dept: 'Biochemistry' },
    { name: 'Lipid Profile', dept: 'Biochemistry' },
    { name: 'Thyroid Profile', dept: 'Biochemistry' },
    { name: 'Blood Sugar (Fasting)', dept: 'Biochemistry' },
    { name: 'HbA1c', dept: 'Biochemistry' },
    { name: 'Urine Routine', dept: 'Biochemistry' },
    { name: 'Culture & Sensitivity', dept: 'Microbiology' },
    { name: 'HIV', dept: 'Serology' },
    { name: 'HBsAg', dept: 'Serology' },
  ];

  const firstNames = ['Rajesh', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anita', 'Sanjay', 'Pooja', 'Rahul', 'Kavita'];
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Verma', 'Gupta', 'Reddy', 'Iyer', 'Mehta', 'Shah'];

  const results: TestResult[] = [];

  for (let i = 0; i < 35; i++) {
    const test = tests[Math.floor(Math.random() * tests.length)];
    const priority: Priority = Math.random() > 0.8 ? 'Critical' : Math.random() > 0.6 ? 'Urgent' : 'Normal';
    const hasCritical = priority === 'Critical' || Math.random() > 0.9;

    const collectionDate = new Date();
    collectionDate.setHours(collectionDate.getHours() - Math.floor(Math.random() * 24));

    const tatDeadline = new Date(collectionDate);
    tatDeadline.setHours(tatDeadline.getHours() + (priority === 'Critical' ? 2 : priority === 'Urgent' ? 6 : 24));

    const testCompleted = new Date(collectionDate);
    testCompleted.setHours(testCompleted.getHours() + 2 + Math.random() * 4);

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    // Generate parameters based on test type
    let parameters: Parameter[] = [];
    if (test.name.includes('CBC')) {
      parameters = [
        { name: 'Hemoglobin', result: (12 + Math.random() * 5).toFixed(1), unit: 'g/dL', normalRange: '13.0 - 17.0 (M)', flag: Math.random() > 0.7 ? 'L' : undefined, category: 'Red Blood Cells' },
        { name: 'RBC Count', result: (4 + Math.random() * 1.5).toFixed(2), unit: 'million/µL', normalRange: '4.5 - 5.5 (M)', flag: '', category: 'Red Blood Cells' },
        { name: 'WBC Count', result: Math.floor(4000 + Math.random() * 10000), unit: 'cells/µL', normalRange: '4,000 - 11,000', flag: hasCritical ? 'HH' : Math.random() > 0.8 ? 'H' : '', isCritical: hasCritical, category: 'White Blood Cells' },
        { name: 'Platelet Count', result: (1.5 + Math.random() * 3).toFixed(1), unit: 'lakhs/µL', normalRange: '1.5 - 4.5', flag: '', category: 'Platelets' },
      ];
    } else if (test.name.includes('LFT')) {
      parameters = [
        { name: 'Total Bilirubin', result: (0.3 + Math.random() * 1).toFixed(2), unit: 'mg/dL', normalRange: '0.3 - 1.2', flag: undefined },
        { name: 'SGOT (AST)', result: Math.floor(15 + Math.random() * 40), unit: 'U/L', normalRange: '15 - 40', flag: undefined },
        { name: 'SGPT (ALT)', result: Math.floor(10 + Math.random() * 45), unit: 'U/L', normalRange: '10 - 40', flag: Math.random() > 0.8 ? 'H' : undefined },
        { name: 'Alkaline Phosphatase', result: Math.floor(40 + Math.random() * 90), unit: 'U/L', normalRange: '40 - 130', flag: undefined },
      ];
    } else {
      parameters = [
        { name: 'Test Parameter 1', result: (50 + Math.random() * 50).toFixed(1), unit: 'units', normalRange: '40 - 100', flag: undefined },
        { name: 'Test Parameter 2', result: (30 + Math.random() * 40).toFixed(1), unit: 'units', normalRange: '20 - 60', flag: undefined },
      ];
    }

    results.push({
      id: `test-${i + 1}`,
      sampleId: `SMP-20260205-${String(i + 1).padStart(4, '0')}`,
      tokenNumber: `TOK-20260205-${String(i + 1).padStart(4, '0')}`,
      patientId: `PAT-${String(1000 + i).padStart(6, '0')}`,
      patientName: `${firstName} ${lastName}`,
      age: 20 + Math.floor(Math.random() * 60),
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      testName: test.name,
      department: test.dept,
      testCompletedTime: testCompleted,
      tatDeadline: tatDeadline,
      priority: priority,
      hasCriticalValues: hasCritical,
      assignedPathologist: Math.random() > 0.5 ? undefined : ['Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Amit Verma'][Math.floor(Math.random() * 3)],
      reportStatus: 'Ready',
      referredBy: Math.random() > 0.3 ? ['Dr. Shah', 'Dr. Mehta', 'Dr. Gupta', 'Dr. Singh'][Math.floor(Math.random() * 4)] : undefined,
      mobile: `98765${String(10000 + Math.floor(Math.random() * 90000))}`,
      email: Math.random() > 0.4 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : undefined,
      collectionDate: collectionDate,
      sampleType: ['EDTA Whole Blood', 'Serum', 'Plasma', 'Urine'][Math.floor(Math.random() * 4)],
      fastingStatus: Math.random() > 0.5 ? 'Fasting' : 'Non-Fasting',
      parameters: parameters,
    });
  }

  return results;
};

const pathologists: Pathologist[] = [
  { id: 'path-1', name: 'Dr. Rajesh Kumar', qualification: 'MBBS, MD (Pathology)', registrationNumber: 'MCI-12345' },
  { id: 'path-2', name: 'Dr. Priya Sharma', qualification: 'MBBS, MD (Pathology)', registrationNumber: 'MCI-12346' },
  { id: 'path-3', name: 'Dr. Amit Verma', qualification: 'MBBS, MD (Pathology)', registrationNumber: 'MCI-12347' },
  { id: 'path-4', name: 'Dr. Neha Patel', qualification: 'MBBS, MD (Pathology)', registrationNumber: 'MCI-12348' },
  { id: 'path-5', name: 'Dr. Vikram Singh', qualification: 'MBBS, MD (Pathology)', registrationNumber: 'MCI-12349' },
];

const remarksTemplates: RemarksTemplate[] = [
  { id: '1', category: 'Normal Results', title: 'All Normal', content: 'All parameters are within normal limits. No significant abnormality detected.', useCount: 245 },
  { id: '2', category: 'Mild Abnormalities', title: 'Mild Abnormality', content: 'Mild abnormality detected in some parameters. Clinical correlation is advised. Follow-up testing may be recommended.', useCount: 120 },
  { id: '3', category: 'Significant Findings', title: 'Significant Findings', content: 'Significant findings noted. Immediate clinical correlation is strongly recommended. Please consult with the treating physician.', useCount: 85 },
  { id: '4', category: 'Critical Results', title: 'Critical Values', content: 'Critical values detected. Immediate medical attention is recommended. Patient/physician has been notified as per protocol.', useCount: 42 },
  { id: '5', category: 'Follow-up', title: 'Recommend Follow-up', content: 'Follow-up testing is recommended after 2-4 weeks. Please correlate with clinical findings and treatment response.', useCount: 95 },
];

export default function ReportGenerationPage() {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [testResults, setTestResults] = useState<TestResult[]>(generateDummyTestResults());
  const [draftReports, setDraftReports] = useState<DraftReport[]>([]);
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    department: 'All',
    testCategory: 'All',
    priority: 'All',
    dateRange: { start: null, end: null },
    pathologist: 'All',
    sortBy: 'TAT',
  });

  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [currentReportData, setCurrentReportData] = useState<Partial<ReportData> | null>(null);

  // Generate report dialog states
  const [reportTab, setReportTab] = useState<number>(0);
  const [interpretation, setInterpretation] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [criticalComments, setCriticalComments] = useState<string>('');
  const [selectedPathologist, setSelectedPathologist] = useState<Pathologist | null>(null);
  const [signatureType, setSignatureType] = useState<'digital' | 'drawn' | 'none'>('none');
  const [signatureData, setSignatureData] = useState<string>('');
  const [certificationAccepted, setCertificationAccepted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Report settings
  const [reportSettings, setReportSettings] = useState<ReportSettings>({
    includeGraphs: false,
    includePreviousResults: false,
    includeReferenceImages: false,
    includeQCStatement: true,
    includeMethodology: true,
    showNABLLogo: true,
    showRegistrationNumbers: true,
    showPageNumbers: true,
    language: 'English',
    watermark: { enabled: false, text: 'DUPLICATE', opacity: 30 },
  });

  // Delivery options
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>({
    notifyPatient: { sms: true, email: true, whatsapp: false },
    notifyDoctor: false,
    doctorEmail: '',
    uploadToPortal: true,
    uploadToABDM: false,
    print: { enabled: false, copies: 1, printer: undefined },
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadExternalDialogOpen, setUploadExternalDialogOpen] = useState(false);
  const [externalReportFile, setExternalReportFile] = useState<File | null>(null);
  const [externalReportName, setExternalReportName] = useState<string>('');
  const [externalReportNotes, setExternalReportNotes] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // New feature states
  const [bulkGenerateDialogOpen, setBulkGenerateDialogOpen] = useState(false);
  const [reportTemplateDialogOpen, setReportTemplateDialogOpen] = useState(false);
  const [scheduleReportDialogOpen, setScheduleReportDialogOpen] = useState(false);
  const [reportHistoryDialogOpen, setReportHistoryDialogOpen] = useState(false);
  const [bulkPublishDialogOpen, setBulkPublishDialogOpen] = useState(false);
  const [exportReportDialogOpen, setExportReportDialogOpen] = useState(false);
  const [templatePreviewDialogOpen, setTemplatePreviewDialogOpen] = useState(false);

  // Bulk operations state
  const [selectedTemplate, setSelectedTemplate] = useState<'standard' | 'detailed' | 'summary'>('standard');
  const [scheduleDate, setScheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | 'docx'>('pdf');
  const [bulkPublishFormat, setBulkPublishFormat] = useState<'pdf' | 'email' | 'print'>('pdf');
  const [reportHistory, setReportHistory] = useState<PublishedReport[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');

  // Signature canvas ref
  const signatureCanvasRef = useRef<SignatureCanvas>(null);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, fetch fresh data from API
      console.log('Auto-refreshing data...');
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate quick stats
  const quickStats: QuickStats = useMemo(() => {
    return {
      readyForReport: testResults.filter(t => t.reportStatus === 'Ready').length,
      draftReports: draftReports.length,
      publishedToday: publishedReports.filter(r => {
        const today = new Date();
        const pubDate = new Date(r.publishedTime);
        return pubDate.toDateString() === today.toDateString();
      }).length,
      pendingSignature: testResults.filter(t => t.reportStatus === 'Review').length,
      criticalReports: testResults.filter(t => t.hasCriticalValues).length,
    };
  }, [testResults, draftReports, publishedReports]);

  // Filtered test results
  const filteredTestResults = useMemo(() => {
    return testResults.filter(test => {
      if (filters.search && !test.patientName.toLowerCase().includes(filters.search.toLowerCase()) &&
          !test.sampleId.toLowerCase().includes(filters.search.toLowerCase()) &&
          !test.tokenNumber.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.department !== 'All' && test.department !== filters.department) {
        return false;
      }
      if (filters.priority !== 'All' && test.priority !== filters.priority) {
        return false;
      }
      if (filters.pathologist !== 'All') {
        if (filters.pathologist === 'Assigned to Me' && !test.assignedPathologist) {
          return false;
        }
        if (filters.pathologist === 'Unassigned' && test.assignedPathologist) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'TAT') {
        return new Date(a.tatDeadline).getTime() - new Date(b.tatDeadline).getTime();
      } else if (filters.sortBy === 'Priority') {
        const priorityOrder = { Critical: 0, Urgent: 1, Normal: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        return a.patientName.localeCompare(b.patientName);
      }
    });
  }, [testResults, filters]);

  // Handlers
  const handleGenerateReport = useCallback((test: TestResult) => {
    setSelectedTest(test);
    setGenerateDialogOpen(true);
    setReportTab(0);

    // Initialize report data
    const reportId = generateReportID();
    const autoInterp = generateAutoInterpretation(test.parameters);

    setInterpretation(autoInterp);
    setClinicalNotes('');
    setCriticalComments(test.hasCriticalValues ? 'Clinical correlation recommended. Immediate physician notification done.' : '');
    setSelectedPathologist(pathologists[0]);
    setSignatureType('none');
    setSignatureData('');
    setCertificationAccepted(false);

    setCurrentReportData({
      reportId,
      testResult: test,
      interpretation: autoInterp,
      clinicalNotes: '',
      criticalComments: test.hasCriticalValues ? 'Clinical correlation recommended. Immediate physician notification done.' : '',
      pathologist: pathologists[0],
      signatureType: 'none',
      signatureData: '',
      template: 'Standard',
      settings: reportSettings,
      deliveryOptions: deliveryOptions,
      certificationAccepted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, [reportSettings, deliveryOptions]);

  const handleSaveDraft = useCallback(() => {
    if (!selectedTest || !currentReportData) return;

    const draft: DraftReport = {
      reportId: currentReportData.reportId!,
      sampleId: selectedTest.sampleId,
      tokenNumber: selectedTest.tokenNumber,
      patientName: selectedTest.patientName,
      testName: selectedTest.testName,
      savedBy: selectedPathologist?.name || 'Current User',
      lastModified: new Date(),
      status: 'Draft',
      reportData: {
        ...currentReportData,
        interpretation,
        clinicalNotes,
        criticalComments,
        pathologist: selectedPathologist || undefined,
        signatureType,
        signatureData,
        certificationAccepted,
      },
    };

    setDraftReports([...draftReports, draft]);
    setSnackbar({ open: true, message: 'Report saved as draft successfully!', severity: 'success' });
    setGenerateDialogOpen(false);
  }, [selectedTest, currentReportData, interpretation, clinicalNotes, criticalComments, selectedPathologist, signatureType, signatureData, certificationAccepted, draftReports]);

  const handleValidateReport = useCallback(() => {
    if (!currentReportData) return;

    const completeReport: ReportData = {
      ...currentReportData as ReportData,
      interpretation,
      clinicalNotes,
      criticalComments,
      pathologist: selectedPathologist || undefined,
      signatureType,
      signatureData,
      certificationAccepted,
      settings: reportSettings,
      deliveryOptions,
    };

    const result = validateReport(completeReport);
    setValidationResult(result);
    setValidationDialogOpen(true);
  }, [currentReportData, interpretation, clinicalNotes, criticalComments, selectedPathologist, signatureType, signatureData, certificationAccepted, reportSettings, deliveryOptions]);

  const handlePreviewPDF = useCallback(async () => {
    if (!currentReportData) return;

    setLoading(true);
    try {
      const completeReport: ReportData = {
        ...currentReportData as ReportData,
        interpretation,
        clinicalNotes,
        criticalComments,
        pathologist: selectedPathologist || undefined,
        signatureType,
        signatureData,
        certificationAccepted,
        settings: reportSettings,
        deliveryOptions,
      };

      const blob = await generateReportPDF(completeReport);
      setPdfBlob(blob);
      setPdfPreviewOpen(true);

      // Open PDF in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({ open: true, message: 'Error generating PDF preview', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentReportData, interpretation, clinicalNotes, criticalComments, selectedPathologist, signatureType, signatureData, certificationAccepted, reportSettings, deliveryOptions]);

  const handlePublishReport = useCallback(async () => {
    if (!currentReportData || !selectedTest) return;

    // Validate first
    const completeReport: ReportData = {
      ...currentReportData as ReportData,
      interpretation,
      clinicalNotes,
      criticalComments,
      pathologist: selectedPathologist || undefined,
      signatureType,
      signatureData,
      certificationAccepted,
      settings: reportSettings,
      deliveryOptions,
    };

    const validation = validateReport(completeReport);
    if (!validation.valid) {
      setValidationResult(validation);
      setValidationDialogOpen(true);
      return;
    }

    setLoading(true);
    try {
      // Generate PDF
      const blob = await generateReportPDF(completeReport);

      // Send notifications
      const deliveryResults = await sendReportNotifications(deliveryOptions, completeReport, blob);

      // Print if requested
      if (deliveryOptions.print.enabled) {
        await printReport(blob, deliveryOptions.print.copies, deliveryOptions.print.printer);
      }

      // Create published report
      const published: PublishedReport = {
        reportId: currentReportData.reportId!,
        sampleId: selectedTest.sampleId,
        tokenNumber: selectedTest.tokenNumber,
        patientName: selectedTest.patientName,
        testName: selectedTest.testName,
        department: selectedTest.department,
        publishedBy: selectedPathologist?.name || 'Current User',
        publishedTime: new Date(),
        hasCriticalValues: selectedTest.hasCriticalValues,
        deliveryStatus: {
          sms: deliveryResults.sms.success ? 'Sent' : 'Failed',
          email: deliveryResults.email.success ? 'Sent' : 'Failed',
          whatsapp: deliveryResults.whatsapp.success ? 'Sent' : 'Failed',
          portal: deliveryResults.portal.success ? 'Sent' : 'Failed',
        },
        viewCount: 0,
        downloadCount: 0,
      };

      setPublishedReports([...publishedReports, published]);

      // Remove from pending
      setTestResults(testResults.filter(t => t.id !== selectedTest.id));

      setSnackbar({
        open: true,
        message: `Report published successfully! Notifications sent via ${Object.entries(deliveryResults).filter(([_, v]) => v.success).map(([k]) => k.toUpperCase()).join(', ')}`,
        severity: 'success',
      });

      setGenerateDialogOpen(false);
    } catch (error) {
      console.error('Error publishing report:', error);
      setSnackbar({ open: true, message: 'Error publishing report', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentReportData, selectedTest, interpretation, clinicalNotes, criticalComments, selectedPathologist, signatureType, signatureData, certificationAccepted, reportSettings, deliveryOptions, publishedReports, testResults]);

  const handleUseAutoInterpretation = useCallback(() => {
    if (selectedTest) {
      const autoInterp = generateAutoInterpretation(selectedTest.parameters);
      setInterpretation(autoInterp);
      setSnackbar({ open: true, message: 'Auto-interpretation applied', severity: 'success' });
    }
  }, [selectedTest]);

  const handleInsertTemplate = useCallback((template: RemarksTemplate) => {
    setInterpretation(template.content);
    setSnackbar({ open: true, message: `Template "${template.title}" applied`, severity: 'success' });
  }, []);

  const handleClearSignature = useCallback(() => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  }, []);

  const handleSaveSignature = useCallback(() => {
    if (signatureCanvasRef.current) {
      const dataUrl = signatureCanvasRef.current.toDataURL();
      setSignatureData(dataUrl);
      setSnackbar({ open: true, message: 'Signature saved', severity: 'success' });
    }
  }, []);

  // Bulk Generation Handler
  const handleBulkGenerate = useCallback(() => {
    const selectedTestIds = Array.from(selectedRows.ids || []);
    const testsToGenerate = testResults.filter(t => selectedTestIds.includes(t.id));
    
    if (testsToGenerate.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one test', severity: 'warning' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newDrafts = testsToGenerate.map(test => ({
        reportId: generateReportID(),
        sampleId: test.sampleId,
        tokenNumber: test.tokenNumber,
        patientName: test.patientName,
        testName: test.testName,
        savedBy: 'Current User',
        lastModified: new Date(),
        status: 'Draft' as const,
        reportData: {
          reportId: generateReportID(),
          testResult: test,
          interpretation: generateAutoInterpretation(test.parameters),
          clinicalNotes: '',
          criticalComments: test.hasCriticalValues ? 'Critical values detected - immediate physician notification done.' : '',
          pathologist: undefined,
          signatureType: 'none' as const,
          signatureData: '',
          template: selectedTemplate,
          settings: reportSettings,
          deliveryOptions: deliveryOptions,
          certificationAccepted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })) as unknown as DraftReport[];

      setDraftReports([...draftReports, ...newDrafts]);
      setBulkGenerateDialogOpen(false);
      setSelectedRows({ type: 'include', ids: new Set() });
      setLoading(false);
      setSnackbar({
        open: true,
        message: `${newDrafts.length} reports generated successfully!`,
        severity: 'success'
      });
    }, 2000);
  }, [selectedRows, testResults, draftReports, selectedTemplate, reportSettings, deliveryOptions]);

  // Bulk Publish Handler
  const handleBulkPublish = useCallback(async () => {
    const selectedDraftIds = Array.from(selectedRows.ids || []);
    const draftsToPubish = draftReports.filter(d => selectedDraftIds.includes(d.reportId));

    if (draftsToPubish.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one draft report', severity: 'warning' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newPublished = draftsToPubish.map(draft => ({
        ...draft,
        status: 'Published' as const,
        publishedTime: new Date(),
        deliveryStatus: 'Sent' as const,
        department: 'Pathology',
        publishedBy: 'Current User',
        hasCriticalValues: false,
        viewCount: 0,
        downloadCount: 0,
      })) as unknown as PublishedReport[];

      setPublishedReports([...publishedReports, ...newPublished]);
      setDraftReports(draftReports.filter(d => !selectedDraftIds.includes(d.reportId)));
      setBulkPublishDialogOpen(false);
      setSelectedRows({ type: 'include', ids: new Set() });
      setLoading(false);
      setSnackbar({
        open: true,
        message: `${newPublished.length} reports published successfully!`,
        severity: 'success'
      });
    }, 2000);
  }, [selectedRows, draftReports, publishedReports]);

  // Export Reports Handler
  const handleExportReports = useCallback(() => {
    const selectedIds = Array.from(selectedRows.ids || []);
    let reportsToExport: any[] = [];

    if (exportFormat === 'pdf') {
      reportsToExport = publishedReports.filter(r => selectedIds.includes(r.reportId));
      if (reportsToExport.length === 0) {
        setSnackbar({ open: true, message: 'Please select reports to export', severity: 'warning' });
        return;
      }
      // In production, generate PDF files
      setSnackbar({
        open: true,
        message: `${reportsToExport.length} PDF reports ready for download`,
        severity: 'success'
      });
    } else if (exportFormat === 'excel' || exportFormat === 'csv') {
      reportsToExport = publishedReports.filter(r => selectedIds.includes(r.reportId));
      // In production, generate Excel/CSV files
      setSnackbar({
        open: true,
        message: `Exported ${reportsToExport.length} reports as ${exportFormat.toUpperCase()}`,
        severity: 'success'
      });
    } else if (exportFormat === 'docx') {
      reportsToExport = publishedReports.filter(r => selectedIds.includes(r.reportId));
      // In production, generate DOCX files
      setSnackbar({
        open: true,
        message: `Exported ${reportsToExport.length} reports as DOCX`,
        severity: 'success'
      });
    }

    setExportReportDialogOpen(false);
    setSelectedRows({ type: 'include', ids: new Set() });
  }, [selectedRows, publishedReports, exportFormat]);

  // Schedule Report Generation Handler
  const handleScheduleReportGeneration = useCallback(() => {
    const selectedTestIds = Array.from(selectedRows.ids || []);
    if (selectedTestIds.length === 0) {
      setSnackbar({ open: true, message: 'Please select tests to schedule', severity: 'warning' });
      return;
    }

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    setSnackbar({
      open: true,
      message: `${selectedTestIds.length} reports scheduled for generation on ${formatDate(scheduledDateTime)}`,
      severity: 'success'
    });
    setScheduleReportDialogOpen(false);
    setSelectedRows({ type: 'include', ids: new Set() });
  }, [selectedRows, scheduleDate, scheduleTime]);

  // View Report History Handler
  const handleViewReportHistory = useCallback(() => {
    let filtered = publishedReports;

    if (historyFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = publishedReports.filter(r => new Date(r.publishedTime) >= weekAgo);
    } else if (historyFilter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = publishedReports.filter(r => new Date(r.publishedTime) >= monthAgo);
    } else if (historyFilter === 'quarter') {
      const quarterAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      filtered = publishedReports.filter(r => new Date(r.publishedTime) >= quarterAgo);
    }

    setReportHistory(filtered);
    setReportHistoryDialogOpen(true);
  }, [publishedReports, historyFilter]);

  // Download Draft as Template
  const handleDownloadAsTemplate = useCallback(() => {
    if (selectedTest) {
      const templateData = {
        testName: selectedTest.testName,
        department: selectedTest.department,
        parameters: selectedTest.parameters,
        generatedAt: new Date().toISOString(),
      };
      const dataStr = JSON.stringify(templateData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `template-${selectedTest.testName}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSnackbar({ open: true, message: 'Template downloaded', severity: 'success' });
    }
  }, [selectedTest]);

  // Print Reports Handler
  const handlePrintReports = useCallback(() => {
    const selectedIds = Array.from(selectedRows.ids || []);
    const reportsToPrint = publishedReports.filter(r => selectedIds.includes(r.reportId));

    if (reportsToPrint.length === 0) {
      setSnackbar({ open: true, message: 'Please select reports to print', severity: 'warning' });
      return;
    }

    window.print();
    setSnackbar({
      open: true,
      message: `${reportsToPrint.length} reports sent to printer`,
      severity: 'success'
    });
  }, [selectedRows, publishedReports]);

  // Archive Report Handler
  const handleArchiveReports = useCallback(() => {
    const selectedIds = Array.from(selectedRows.ids || []);
    const reportsToArchive = publishedReports.filter(r => selectedIds.includes(r.reportId));

    if (reportsToArchive.length === 0) {
      setSnackbar({ open: true, message: 'Please select reports to archive', severity: 'warning' });
      return;
    }

    setPublishedReports(publishedReports.filter(r => !selectedIds.includes(r.reportId)));
    setSnackbar({
      open: true,
      message: `${reportsToArchive.length} reports archived successfully`,
      severity: 'success'
    });
  }, [selectedRows, publishedReports]);

  // DataGrid columns for Ready for Report
  const readyColumns: GridColDef<TestResult>[] = [
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={`${getPriorityIcon(params.row.priority)} ${params.row.priority}`}
          color={getPriorityColor(params.row.priority)}
          size="small"
        />
      ),
    },
    {
      field: 'sampleId',
      headerName: 'Sample ID',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    { field: 'tokenNumber', headerName: 'Token', width: 180 },
    { field: 'patientName', headerName: 'Patient Name', width: 180 },
    {
      field: 'age',
      headerName: 'Age / Gender',
      width: 140,
      valueGetter: (_value, row) => `${row.age}Y / ${row.gender?.[0] || ''}`,
    },
    { field: 'testName', headerName: 'Test Name', width: 200 },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'testCompletedTime',
      headerName: 'Completed',
      width: 150,
      valueGetter: (_value, row) => formatDate(row.testCompletedTime),
    },
    {
      field: 'tatDeadline',
      headerName: 'TAT Status',
      width: 140,
      renderCell: (params) => {
        const tat = calculateTATStatus(params.row.tatDeadline);
        return (
          <Chip
            label={tat.status}
            color={tat.color}
            size="small"
          />
        );
      },
    },
    {
      field: 'hasCriticalValues',
      headerName: 'Critical',
      width: 100,
      renderCell: (params) => params.value ? (
        <Badge badgeContent="!" color="error">
          <WarningIcon color="error" />
        </Badge>
      ) : null,
    },
    {
      field: 'assignedPathologist',
      headerName: 'Pathologist',
      width: 150,
      valueGetter: (_value, row) => row.assignedPathologist || 'Unassigned',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleGenerateReport(params.row)}
        >
          Generate
        </Button>
      ),
    },
  ];

  // DataGrid columns for Draft Reports
  const draftColumns: GridColDef<DraftReport>[] = [
    { field: 'sampleId', headerName: 'Sample ID', width: 180 },
    { field: 'tokenNumber', headerName: 'Token', width: 180 },
    { field: 'patientName', headerName: 'Patient Name', width: 180 },
    { field: 'testName', headerName: 'Test Name', width: 200 },
    { field: 'savedBy', headerName: 'Saved By', width: 150 },
    {
      field: 'lastModified',
      headerName: 'Last Modified',
      width: 180,
      valueGetter: (_value, row) => formatDate(row.lastModified),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color="warning" size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Draft">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => {
                setSelectedTest({
                  ...params.row.reportData.testResult,
                  id: params.row.reportId,
                } as any);
                setCurrentReportData(params.row.reportData);
                setInterpretation((params.row.reportData.interpretation as string) || '');
                setClinicalNotes((params.row.reportData.clinicalNotes as string) || '');
                setCriticalComments((params.row.reportData.criticalComments as string) || '');
                setGenerateDialogOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Draft">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => {
                setDraftReports(draftReports.filter(d => d.reportId !== params.row.reportId));
                setSnackbar({
                  open: true,
                  message: 'Draft report deleted',
                  severity: 'success'
                });
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // DataGrid columns for Published Reports
  const publishedColumns: GridColDef<PublishedReport>[] = [
    { field: 'reportId', headerName: 'Report ID', width: 180 },
    { field: 'sampleId', headerName: 'Sample ID', width: 180 },
    { field: 'patientName', headerName: 'Patient Name', width: 180 },
    { field: 'testName', headerName: 'Test Name', width: 200 },
    { field: 'publishedBy', headerName: 'Published By', width: 150 },
    {
      field: 'publishedTime',
      headerName: 'Published',
      width: 180,
      valueGetter: (_value, row) => formatDate(row.publishedTime),
    },
    {
      field: 'hasCriticalValues',
      headerName: 'Critical',
      width: 100,
      renderCell: (params) => params.value ? (
        <Badge badgeContent="!" color="error">
          <WarningIcon color="error" />
        </Badge>
      ) : null,
    },
    {
      field: 'deliveryStatus',
      headerName: 'Delivery',
      width: 120,
      renderCell: (params) => {
        const sent = Object.values(params.value).filter(s => s === 'Sent').length;
        const total = Object.values(params.value).length;
        return <Chip label={`${sent}/${total}`} size="small" color={sent === total ? 'success' : 'warning'} />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Report">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => {
                setPdfPreviewOpen(true);
                setSnackbar({
                  open: true,
                  message: 'Opening report preview...',
                  severity: 'info'
                });
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => {
                setSnackbar({
                  open: true,
                  message: `Report "${params.row.testName}" downloaded`,
                  severity: 'success'
                });
              }}
            >
              <GetAppIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => {
                window.print();
                setSnackbar({
                  open: true,
                  message: 'Report sent to printer',
                  severity: 'success'
                });
              }}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Resend Report">
            <IconButton 
              size="small" 
              color="secondary"
              onClick={() => {
                setSnackbar({
                  open: true,
                  message: `Report resent to patient and doctor`,
                  severity: 'success'
                });
              }}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout>
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          Report Generation
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mr: 2 }}
            onClick={() => setBulkGenerateDialogOpen(true)}
          >
            Bulk Generate
          </Button>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            sx={{ mr: 2 }}
            onClick={() => setBulkPublishDialogOpen(true)}
          >
            Bulk Publish
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            sx={{ mr: 2 }}
            onClick={() => setExportReportDialogOpen(true)}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            sx={{ mr: 2 }}
            onClick={handlePrintReports}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            sx={{ mr: 2 }}
            onClick={() => setScheduleReportDialogOpen(true)}
          >
            Schedule
          </Button>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            sx={{ mr: 2 }}
            onClick={handleViewReportHistory}
          >
            History
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadExternalDialogOpen(true)}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => setActiveTab(0)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {quickStats.readyForReport}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready for Report
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => setActiveTab(1)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DraftsIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {quickStats.draftReports}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draft Reports
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => setActiveTab(2)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PublishIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {quickStats.publishedToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Published Today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DrawIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {quickStats.pendingSignature}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Signature
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReportProblemIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {quickStats.criticalReports}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Reports
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(_e, newValue) => setActiveTab(newValue)}>
          <Tab label="Ready for Report" />
          <Tab label="Draft Reports" />
          <Tab label="Published Today" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {/* Ready for Report Tab */}
          {activeTab === 0 && (
            <Box>
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search token, patient, sample ID..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={filters.department}
                      label="Department"
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                      <MenuItem value="All">All Departments</MenuItem>
                      <MenuItem value="Hematology">Hematology</MenuItem>
                      <MenuItem value="Biochemistry">Biochemistry</MenuItem>
                      <MenuItem value="Microbiology">Microbiology</MenuItem>
                      <MenuItem value="Serology">Serology</MenuItem>
                      <MenuItem value="Immunology">Immunology</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={filters.priority}
                      label="Priority"
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value as Priority | 'All' })}
                    >
                      <MenuItem value="All">All Priorities</MenuItem>
                      <MenuItem value="Normal">Normal</MenuItem>
                      <MenuItem value="Urgent">Urgent</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Pathologist</InputLabel>
                    <Select
                      value={filters.pathologist}
                      label="Pathologist"
                      onChange={(e) => setFilters({ ...filters, pathologist: e.target.value })}
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="Assigned to Me">Assigned to Me</MenuItem>
                      <MenuItem value="Unassigned">Unassigned</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={filters.sortBy}
                      label="Sort By"
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'TAT' | 'Priority' | 'PatientName' })}
                    >
                      <MenuItem value="TAT">TAT</MenuItem>
                      <MenuItem value="Priority">Priority</MenuItem>
                      <MenuItem value="PatientName">Patient Name</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* DataGrid */}
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={filteredTestResults}
                  columns={readyColumns}
                  getRowId={(row) => row.id}
                  checkboxSelection
                  rowSelectionModel={selectedRows}
                  onRowSelectionModelChange={setSelectedRows}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  getRowClassName={(params) =>
                    params.row.priority === 'Critical' ? 'critical-row' :
                    params.row.priority === 'Urgent' ? 'urgent-row' : ''
                  }
                  sx={{
                    '& .critical-row': {
                      bgcolor: 'error.50',
                    },
                    '& .urgent-row': {
                      bgcolor: 'warning.50',
                    },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Draft Reports Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Draft Reports ({draftReports.length})
              </Typography>
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={draftReports}
                  columns={draftColumns}
                  getRowId={(row) => row.reportId}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Published Reports Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Published Reports Today ({publishedReports.length})
              </Typography>
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={publishedReports}
                  columns={publishedColumns}
                  getRowId={(row) => row.reportId}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Generate Report Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              Generate Report - {selectedTest?.patientName} ({selectedTest?.sampleId})
            </Typography>
            <IconButton onClick={() => setGenerateDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Left Panel - Live Preview */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, height: '80vh', overflow: 'auto', bgcolor: '#f5f5f5' }} elevation={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Report Preview
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}>
                      <ZoomOutIcon />
                    </IconButton>
                    <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                      {zoomLevel}%
                    </Typography>
                    <IconButton size="small" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 25))}>
                      <ZoomInIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Report Preview Content */}
                <Paper sx={{ p: 3, transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', width: `${10000 / zoomLevel}%` }}>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center', mb: 3, borderBottom: 2, pb: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      NXA PATHOLOGY LAB
                    </Typography>
                    <Typography variant="body2">
                      123 Medical Street, City, State - 400001
                    </Typography>
                    <Typography variant="body2">
                      Phone: +91-1234567890 | Email: lab@nxapath.com | Website: www.nxapath.com
                    </Typography>
                    <Typography variant="body2">
                      NABL Reg: NAB-123456 | License: LAB/2024/0001
                    </Typography>
                  </Box>

                  {/* Report Title */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                      LABORATORY REPORT
                    </Typography>
                    <Typography variant="body2">
                      Report ID: {currentReportData?.reportId}
                    </Typography>
                    <Typography variant="body2">
                      Report Date: {formatDate(new Date())}
                    </Typography>
                  </Box>

                  {/* Patient Information */}
                  {selectedTest && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        PATIENT INFORMATION
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 3, fontSize: '0.875rem' }}>
                        <Box><strong>Patient Name:</strong> {selectedTest.patientName}</Box>
                        <Box><strong>Patient ID:</strong> {selectedTest.patientId}</Box>
                        <Box><strong>Age / Gender:</strong> {selectedTest.age} Years / {selectedTest.gender}</Box>
                        <Box><strong>Sample ID:</strong> {selectedTest.sampleId}</Box>
                        <Box><strong>Referred By Dr.:</strong> {selectedTest.referredBy || 'Self'}</Box>
                        <Box><strong>Token No:</strong> {selectedTest.tokenNumber}</Box>
                        <Box><strong>Mobile:</strong> {selectedTest.mobile}</Box>
                        <Box><strong>Collection Date:</strong> {formatDate(selectedTest.collectionDate)}</Box>
                      </Box>

                      {/* Test Information */}
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        TEST INFORMATION
                      </Typography>
                      <Box sx={{ mb: 3, fontSize: '0.875rem' }}>
                        <Box><strong>Test Name:</strong> {selectedTest.testName}</Box>
                        <Box><strong>Department:</strong> {selectedTest.department}</Box>
                        <Box><strong>Sample Type:</strong> {selectedTest.sampleType}</Box>
                        <Box><strong>Fasting Status:</strong> {selectedTest.fastingStatus}</Box>
                      </Box>

                      {/* Results Table */}
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        INVESTIGATION RESULTS
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>PARAMETER</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>RESULT</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>UNIT</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>NORMAL RANGE</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>FLAG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTest.parameters.map((param, idx) => (
                              <tr key={idx}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{param.name}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>{param.result}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{param.unit}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{param.normalRange}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', color: param.flag ? '#dc143c' : 'inherit', fontWeight: param.flag ? 'bold' : 'normal' }}>
                                  {param.flag ? `${param.flag} ${param.flag.includes('H') ? '↑' : '↓'}` : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>

                      {/* Critical Values Alert */}
                      {selectedTest.hasCriticalValues && (
                        <Box sx={{ p: 2, mb: 3, border: '2px solid #dc143c', backgroundColor: '#fff0f0', borderRadius: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" color="error" sx={{ mb: 1 }}>
                            ⚠️ CRITICAL VALUE ALERT
                          </Typography>
                          {selectedTest.parameters.filter(p => p.isCritical || p.flag === 'HH' || p.flag === 'LL').map((param, idx) => (
                            <Typography key={idx} variant="body2">
                              {param.name}: {param.result} {param.unit} ({param.flag === 'HH' ? 'Critical High' : param.flag === 'LL' ? 'Critical Low' : param.flag})
                            </Typography>
                          ))}
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {criticalComments || 'Immediate clinical correlation recommended.'}
                          </Typography>
                        </Box>
                      )}

                      {/* Interpretation */}
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        INTERPRETATION / REMARKS
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                        {interpretation || 'No specific comments'}
                      </Typography>

                      {/* Methodology */}
                      {reportSettings.includeMethodology && (
                        <>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            METHOD / TECHNOLOGY
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 3 }}>
                            Test performed on: Automated Hematology Analyzer<br />
                            Methodology: Standard laboratory protocols as per guidelines
                          </Typography>
                        </>
                      )}

                      {/* QC Statement */}
                      {reportSettings.includeQCStatement && (
                        <>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            QUALITY CONTROL
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 3 }}>
                            Internal Quality Control: Passed<br />
                            External Quality Assurance: Enrolled
                          </Typography>
                        </>
                      )}

                      {/* Footer with Signature */}
                      <Box sx={{ mt: 5, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Grid container>
                          <Grid size={6}>
                            <Typography variant="body2">
                              <strong>Tested By:</strong> Lab Technician
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(selectedTest.testCompletedTime)}
                            </Typography>
                          </Grid>
                          <Grid size={6} sx={{ textAlign: 'right' }}>
                            {selectedPathologist && (
                              <>
                                {signatureData && signatureType !== 'none' && (
                                  <Box sx={{ mb: 1 }}>
                                    <img src={signatureData} alt="Signature" style={{ maxWidth: 150, maxHeight: 60 }} />
                                  </Box>
                                )}
                                <Typography variant="body2" fontWeight="bold">
                                  {selectedPathologist.name}
                                </Typography>
                                <Typography variant="body2">
                                  {selectedPathologist.qualification}
                                </Typography>
                                <Typography variant="body2">
                                  Reg. No: {selectedPathologist.registrationNumber}
                                </Typography>
                              </>
                            )}
                          </Grid>
                        </Grid>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, fontStyle: 'italic' }}>
                          {signatureType === 'none' ? 'This is a computer-generated report. Signature not required.' : 'This report is verified and approved by the pathologist.'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Paper>
              </Paper>
            </Grid>

            {/* Right Panel - Edit Controls */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, height: '80vh', overflow: 'auto' }} elevation={3}>
                <Tabs value={reportTab} onChange={(_e, newValue) => setReportTab(newValue)}>
                  <Tab label="Report Data" />
                  <Tab label="Interpretation" />
                  <Tab label="Signature" />
                  <Tab label="Settings" />
                  <Tab label="Delivery" />
                </Tabs>

                <Box sx={{ mt: 2 }}>
                  {/* Tab 1 - Report Data */}
                  {reportTab === 0 && selectedTest && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Patient & Test Information
                      </Typography>
                      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                        <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                          Patient Details
                        </Typography>
                        <Typography variant="body2">Name: {selectedTest.patientName}</Typography>
                        <Typography variant="body2">Age/Gender: {selectedTest.age} Years / {selectedTest.gender}</Typography>
                        <Typography variant="body2">Patient ID: {selectedTest.patientId}</Typography>
                        <Typography variant="body2">Mobile: {selectedTest.mobile}</Typography>
                        <Typography variant="body2">Email: {selectedTest.email || 'Not provided'}</Typography>
                      </Paper>

                      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                        <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                          Sample Details
                        </Typography>
                        <Typography variant="body2">Sample ID: {selectedTest.sampleId}</Typography>
                        <Typography variant="body2">Token: {selectedTest.tokenNumber}</Typography>
                        <Typography variant="body2">Collection: {formatDate(selectedTest.collectionDate)}</Typography>
                        <Typography variant="body2">Sample Type: {selectedTest.sampleType}</Typography>
                      </Paper>

                      <Paper sx={{ p: 2 }} variant="outlined">
                        <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                          Test Results
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Test: {selectedTest.testName} ({selectedTest.department})
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Parameters: {selectedTest.parameters.length}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Abnormal Values: {selectedTest.parameters.filter(p => p.flag).length}
                        </Typography>
                        {selectedTest.hasCriticalValues && (
                          <Chip
                            label="Has Critical Values"
                            color="error"
                            size="small"
                            icon={<WarningIcon />}
                          />
                        )}
                      </Paper>
                    </Box>
                  )}

                  {/* Tab 2 - Interpretation */}
                  {reportTab === 1 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Interpretation & Remarks
                      </Typography>

                      {/* Auto-Interpretation */}
                      <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }} variant="outlined">
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                          Auto-Interpretation
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
                          {selectedTest && generateAutoInterpretation(selectedTest.parameters)}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleUseAutoInterpretation}
                        >
                          Use Auto-Interpretation
                        </Button>
                      </Paper>

                      {/* Templates */}
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Insert Template</InputLabel>
                        <Select
                          value=""
                          label="Insert Template"
                          onChange={(e) => {
                            const template = remarksTemplates.find(t => t.id === e.target.value);
                            if (template) handleInsertTemplate(template);
                          }}
                        >
                          <MenuItem value="">Select a template...</MenuItem>
                          {remarksTemplates.map((template) => (
                            <MenuItem key={template.id} value={template.id}>
                              {template.title} ({template.category})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Pathologist Remarks */}
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        label="Pathologist Remarks"
                        value={interpretation}
                        onChange={(e) => setInterpretation(e.target.value)}
                        sx={{ mb: 2 }}
                        helperText={`${interpretation.length} characters`}
                      />

                      {/* Critical Value Comments */}
                      {selectedTest?.hasCriticalValues && (
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Critical Value Comments (Mandatory)"
                          value={criticalComments}
                          onChange={(e) => setCriticalComments(e.target.value)}
                          required
                          error={!criticalComments}
                          helperText={!criticalComments ? 'Required for critical values' : ''}
                          sx={{ mb: 2 }}
                        />
                      )}

                      {/* Clinical Notes (Internal) */}
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Clinical Notes (Internal - Not Printed)"
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        sx={{ mb: 2 }}
                        helperText="For internal record only"
                      />
                    </Box>
                  )}

                  {/* Tab 3 - Signature */}
                  {reportTab === 2 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Pathologist & Signature
                      </Typography>

                      {/* Pathologist Selection */}
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <Autocomplete
                          value={selectedPathologist}
                          onChange={(_e, newValue) => setSelectedPathologist(newValue)}
                          options={pathologists}
                          getOptionLabel={(option) => `${option.name} (${option.qualification})`}
                          renderInput={(params) => <TextField {...params} label="Select Pathologist" />}
                        />
                      </FormControl>

                      {/* Signature Type */}
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Signature Options
                      </Typography>
                      <RadioGroup value={signatureType} onChange={(e) => setSignatureType(e.target.value as any)}>
                        <FormControlLabel
                          value="digital"
                          control={<Radio />}
                          label="Digital Signature (Pre-uploaded)"
                        />
                        {signatureType === 'digital' && (
                          <Box sx={{ ml: 4, mb: 2 }}>
                            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                              Upload Signature
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setSignatureData(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </Button>
                            {signatureData && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption">Preview:</Typography>
                                <Box sx={{ border: 1, borderColor: 'divider', p: 1, mt: 1 }}>
                                  <img src={signatureData} alt="Signature" style={{ maxWidth: 200, maxHeight: 80 }} />
                                </Box>
                              </Box>
                            )}
                          </Box>
                        )}

                        <FormControlLabel
                          value="drawn"
                          control={<Radio />}
                          label="Draw Signature"
                        />
                        {signatureType === 'drawn' && (
                          <Box sx={{ ml: 4, mb: 2 }}>
                            <Paper variant="outlined" sx={{ p: 1 }}>
                              <SignatureCanvas
                                ref={signatureCanvasRef}
                                canvasProps={{
                                  width: 400,
                                  height: 150,
                                  className: 'signature-canvas',
                                  style: { border: '1px solid #ccc' },
                                }}
                              />
                            </Paper>
                            <Box sx={{ mt: 1 }}>
                              <Button size="small" onClick={handleClearSignature} startIcon={<DeleteIcon />}>
                                Clear
                              </Button>
                              <Button size="small" onClick={handleSaveSignature} startIcon={<SaveIcon />} sx={{ ml: 1 }}>
                                Save Signature
                              </Button>
                            </Box>
                          </Box>
                        )}

                        <FormControlLabel
                          value="none"
                          control={<Radio />}
                          label="No Signature (Computer-generated report)"
                        />
                      </RadioGroup>

                      {/* Certification */}
                      <Box sx={{ mt: 3 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={certificationAccepted}
                              onChange={(e) => setCertificationAccepted(e.target.checked)}
                            />
                          }
                          label="I certify that this report is accurate and verified"
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Tab 4 - Settings */}
                  {reportTab === 3 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Report Settings
                      </Typography>

                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Report Template</InputLabel>
                        <Select value="Standard" label="Report Template">
                          <MenuItem value="Standard">Standard Template</MenuItem>
                          <MenuItem value="Detailed">Detailed Template</MenuItem>
                          <MenuItem value="Minimal">Minimal Template</MenuItem>
                          <MenuItem value="Branded">Branded Template</MenuItem>
                        </Select>
                      </FormControl>

                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Include in Report
                      </Typography>
                      <FormControlLabel
                        control={<Checkbox checked={reportSettings.includeGraphs} onChange={(e) => setReportSettings({ ...reportSettings, includeGraphs: e.target.checked })} />}
                        label="Include Graphs/Charts"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={reportSettings.includePreviousResults} onChange={(e) => setReportSettings({ ...reportSettings, includePreviousResults: e.target.checked })} />}
                        label="Include Previous Results"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={reportSettings.includeQCStatement} onChange={(e) => setReportSettings({ ...reportSettings, includeQCStatement: e.target.checked })} />}
                        label="Include QC Statement"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={reportSettings.includeMethodology} onChange={(e) => setReportSettings({ ...reportSettings, includeMethodology: e.target.checked })} />}
                        label="Include Methodology"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={reportSettings.showNABLLogo} onChange={(e) => setReportSettings({ ...reportSettings, showNABLLogo: e.target.checked })} />}
                        label="Show NABL Logo"
                      />

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Watermark
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={reportSettings.watermark?.enabled}
                            onChange={(e) => setReportSettings({
                              ...reportSettings,
                              watermark: { ...reportSettings.watermark!, enabled: e.target.checked },
                            })}
                          />
                        }
                        label="Add Watermark"
                      />
                      {reportSettings.watermark?.enabled && (
                        <Box sx={{ ml: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Watermark Text"
                            value={reportSettings.watermark.text}
                            onChange={(e) => setReportSettings({
                              ...reportSettings,
                              watermark: { ...reportSettings.watermark!, text: e.target.value },
                            })}
                            sx={{ mb: 2 }}
                          />
                          <Typography variant="caption">Opacity: {reportSettings.watermark.opacity}%</Typography>
                          <Slider
                            value={reportSettings.watermark.opacity}
                            onChange={(_e, newValue) => setReportSettings({
                              ...reportSettings,
                              watermark: { ...reportSettings.watermark!, opacity: newValue as number },
                            })}
                            min={10}
                            max={100}
                            step={10}
                          />
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Tab 5 - Delivery */}
                  {reportTab === 4 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Delivery Options
                      </Typography>

                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Notify Patient
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deliveryOptions.notifyPatient.sms}
                            onChange={(e) => setDeliveryOptions({
                              ...deliveryOptions,
                              notifyPatient: { ...deliveryOptions.notifyPatient, sms: e.target.checked },
                            })}
                          />
                        }
                        label={`Send SMS to ${selectedTest?.mobile || 'patient'}`}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deliveryOptions.notifyPatient.email}
                            onChange={(e) => setDeliveryOptions({
                              ...deliveryOptions,
                              notifyPatient: { ...deliveryOptions.notifyPatient, email: e.target.checked },
                            })}
                          />
                        }
                        label={`Send Email to ${selectedTest?.email || 'patient (if available)'}`}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deliveryOptions.notifyPatient.whatsapp}
                            onChange={(e) => setDeliveryOptions({
                              ...deliveryOptions,
                              notifyPatient: { ...deliveryOptions.notifyPatient, whatsapp: e.target.checked },
                            })}
                          />
                        }
                        label="Send WhatsApp Message"
                      />

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Notify Doctor
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deliveryOptions.notifyDoctor}
                            onChange={(e) => setDeliveryOptions({ ...deliveryOptions, notifyDoctor: e.target.checked })}
                          />
                        }
                        label="Send report to referring doctor"
                      />
                      {deliveryOptions.notifyDoctor && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Doctor Email"
                          value={deliveryOptions.doctorEmail}
                          onChange={(e) => setDeliveryOptions({ ...deliveryOptions, doctorEmail: e.target.value })}
                          sx={{ ml: 4, mb: 2 }}
                        />
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Portal Upload
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deliveryOptions.uploadToPortal}
                            onChange={(e) => setDeliveryOptions({ ...deliveryOptions, uploadToPortal: e.target.checked })}
                          />
                        }
                        label="Upload to Patient Portal"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deliveryOptions.uploadToABDM}
                            onChange={(e) => setDeliveryOptions({ ...deliveryOptions, uploadToABDM: e.target.checked })}
                          />
                        }
                        label="Upload to ABDM (Ayushman Bharat)"
                      />

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Print Options
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={deliveryOptions.print.enabled}
                            onChange={(e) => setDeliveryOptions({
                              ...deliveryOptions,
                              print: { ...deliveryOptions.print, enabled: e.target.checked },
                            })}
                          />
                        }
                        label="Print immediately after publish"
                      />
                      {deliveryOptions.print.enabled && (
                        <Box sx={{ ml: 4 }}>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Copies</InputLabel>
                            <Select
                              value={deliveryOptions.print.copies}
                              label="Copies"
                              onChange={(e) => setDeliveryOptions({
                                ...deliveryOptions,
                                print: { ...deliveryOptions.print, copies: e.target.value as number },
                              })}
                            >
                              <MenuItem value={1}>1 Copy</MenuItem>
                              <MenuItem value={2}>2 Copies</MenuItem>
                              <MenuItem value={3}>3 Copies</MenuItem>
                              <MenuItem value={4}>4 Copies</MenuItem>
                              <MenuItem value={5}>5 Copies</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveDraft} variant="outlined" startIcon={<SaveIcon />}>
            Save as Draft
          </Button>
          <Button onClick={handlePreviewPDF} variant="outlined" startIcon={<VisibilityIcon />} disabled={loading}>
            Preview PDF
          </Button>
          <Button onClick={handleValidateReport} variant="outlined" startIcon={<CheckCircleIcon />}>
            Validate Report
          </Button>
          <Button
            onClick={handlePublishReport}
            variant="contained"
            size="large"
            startIcon={<PublishIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Publish Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={validationDialogOpen} onClose={() => setValidationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Validation</DialogTitle>
        <DialogContent>
          {validationResult && (
            <Box>
              <Typography variant="h6" color={validationResult.valid ? 'success.main' : 'error.main'} sx={{ mb: 2 }}>
                {validationResult.valid ? '✓ Validation Passed' : '✗ Validation Failed'}
              </Typography>

              {validationResult.errors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="error">
                    Errors:
                  </Typography>
                  <List dense>
                    {validationResult.errors.map((error, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <CancelIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {validationResult.warnings.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                    Warnings:
                  </Typography>
                  <List dense>
                    {validationResult.warnings.map((warning, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Upload External Report Dialog */}
      <Dialog 
        open={uploadExternalDialogOpen} 
        onClose={() => setUploadExternalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon />
          Upload External Report
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* File Upload Area */}
            <Box
              sx={{
                border: '2px dashed',
                borderColor: externalReportFile ? 'success.main' : 'primary.main',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: externalReportFile ? 'success.lighter' : 'action.hover',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.selected',
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setExternalReportFile(file);
                    setExternalReportName(file.name);
                  }
                }}
                style={{ display: 'none' }}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {externalReportFile ? 'File Selected ✓' : 'Click to Upload or Drag & Drop'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {externalReportFile ? externalReportName : 'PDF, JPG, or PNG (Max 10MB)'}
              </Typography>
              {externalReportFile && (
                <Button
                  size="small"
                  color="error"
                  sx={{ mt: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExternalReportFile(null);
                    setExternalReportName('');
                  }}
                >
                  Remove File
                </Button>
              )}
            </Box>

            {/* Report Name */}
            <TextField
              label="Report Name"
              value={externalReportName}
              onChange={(e) => setExternalReportName(e.target.value)}
              placeholder="e.g., CT Scan Report - Feb 2026"
              fullWidth
              size="small"
            />

            {/* Test Type (if applicable) */}
            <FormControl fullWidth size="small">
              <InputLabel>Test Type (Optional)</InputLabel>
              <Select
                label="Test Type (Optional)"
                defaultValue=""
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="radiology">Radiology</MenuItem>
                <MenuItem value="cardiology">Cardiology</MenuItem>
                <MenuItem value="ultrasound">Ultrasound</MenuItem>
                <MenuItem value="ecg">ECG</MenuItem>
                <MenuItem value="pathology">Pathology</MenuItem>
              </Select>
            </FormControl>

            {/* Notes */}
            <TextField
              label="Additional Notes"
              value={externalReportNotes}
              onChange={(e) => setExternalReportNotes(e.target.value)}
              placeholder="Enter any relevant notes about this report..."
              multiline
              rows={3}
              fullWidth
              size="small"
            />

            {/* Information Alert */}
            <Alert severity="info">
              <Typography variant="body2">
                External reports will be attached to the patient's file and included in the final report.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadExternalDialogOpen(false);
              setExternalReportFile(null);
              setExternalReportName('');
              setExternalReportNotes('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (externalReportFile) {
                setSnackbar({
                  open: true,
                  message: `Report "${externalReportName}" uploaded successfully!`,
                  severity: 'success'
                });
                setUploadExternalDialogOpen(false);
                setExternalReportFile(null);
                setExternalReportName('');
                setExternalReportNotes('');
              } else {
                setSnackbar({
                  open: true,
                  message: 'Please select a file to upload',
                  severity: 'warning'
                });
              }
            }}
            disabled={!externalReportFile}
          >
            Upload Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Generate Reports Dialog */}
      <Dialog open={bulkGenerateDialogOpen} onClose={() => setBulkGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon /> Bulk Generate Reports
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {Array.from(selectedRows.ids || []).length} test(s) selected
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Report Template</InputLabel>
              <Select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value as any)} label="Report Template">
                <MenuItem value="standard">Standard Template</MenuItem>
                <MenuItem value="detailed">Detailed Template</MenuItem>
                <MenuItem value="summary">Summary Template</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Include Previous Results"
            />
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Include QC Statement"
            />
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Add Auto-Interpretation"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkGenerateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkGenerate} disabled={loading}>
            {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : ''} Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Publish Reports Dialog */}
      <Dialog open={bulkPublishDialogOpen} onClose={() => setBulkPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SendIcon /> Bulk Publish Reports
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {Array.from(selectedRows.ids || []).length} draft(s) selected
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Publish Format</InputLabel>
              <Select value={bulkPublishFormat} onChange={(e) => setBulkPublishFormat(e.target.value as any)} label="Publish Format">
                <MenuItem value="pdf">PDF to Email</MenuItem>
                <MenuItem value="email">Email (Direct)</MenuItem>
                <MenuItem value="print">Print</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Notify Patient"
            />
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Notify Referring Doctor"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Upload to Patient Portal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkPublishDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkPublish} disabled={loading}>
            {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : ''} Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Reports Dialog */}
      <Dialog open={exportReportDialogOpen} onClose={() => setExportReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <GetAppIcon /> Export Reports
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {Array.from(selectedRows.ids || []).length} report(s) selected
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} label="Export Format">
                <MenuItem value="pdf">PDF Files</MenuItem>
                <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                <MenuItem value="csv">CSV File</MenuItem>
                <MenuItem value="docx">Word Document</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              <Typography variant="body2">
                Reports will be exported and downloaded to your device.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportReportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleExportReports}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Report Generation Dialog */}
      <Dialog open={scheduleReportDialogOpen} onClose={() => setScheduleReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon /> Schedule Report Generation
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {Array.from(selectedRows.ids || []).length} test(s) will be scheduled
            </Typography>

            <TextField
              label="Schedule Date"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Schedule Time"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Alert severity="info">
              <Typography variant="body2">
                Reports will be automatically generated at the scheduled time.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleReportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScheduleReportGeneration}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report History Dialog */}
      <Dialog open={reportHistoryDialogOpen} onClose={() => setReportHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon /> Report History
          </Box>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Time Period</InputLabel>
            <Select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value as any)} label="Time Period">
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="quarter">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {reportHistory.length === 0 ? (
            <Typography color="text.secondary">No reports found for the selected period.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 400, overflow: 'auto' }}>
              {reportHistory.map((report) => (
                <Paper key={report.reportId} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {report.patientName} - {report.testName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Published: {formatDate(new Date(report.publishedTime))}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Published"
                    color="success"
                    variant="outlined"
                  />
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
