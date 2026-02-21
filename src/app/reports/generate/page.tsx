'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DescriptionIcon,
  Draw as SignatureIcon,
  Edit as EditIcon,
  FileUpload as FileUploadIcon,
  Print as PrintIcon,
  Publish as PublishIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getBookings } from '@/services/bookingStore';
import {
  addAuditEvent,
  getReports,
  publishReport,
  upsertReport,
} from '@/services/reportStore';
import { getCompletedTests } from '@/services/testingStore';
import { Booking } from '@/types/token';
import { ParameterValue, TestResult } from '@/types/testing';
import {
  Report,
  ReportCriticalFlag,
  ReportStatus,
  SignatureType,
} from '@/types/reportGeneration';

interface QueueRow {
  id: string;
  token: string;
  sampleId: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  bookingId: string;
  packageId?: string;
  tests: TestResult[];
  critical: boolean;
  status: ReportStatus | 'ReadyToGenerate';
  updatedAt: string;
  reportId?: string;
  hasQcIssue: boolean;
  bookingDate?: string;
}

type StatusFilter = 'All' | 'ReadyToGenerate' | ReportStatus;

const REPORT_EDITOR_TABS = ['Summary', 'Results', 'Meta'];

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getStatusColor = (status: QueueRow['status']) => {
  switch (status) {
    case 'Draft':
      return 'warning';
    case 'PendingSignature':
      return 'info';
    case 'Published':
      return 'success';
    case 'Amended':
      return 'secondary';
    case 'Cancelled':
      return 'default';
    default:
      return 'primary';
  }
};

const formatDateTime = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const getCriticalFlags = (tests: TestResult[]): ReportCriticalFlag[] => {
  const flags: ReportCriticalFlag[] = [];

  tests.forEach((test) => {
    test.parameterValues.forEach((parameter: ParameterValue) => {
      if (parameter.isCritical || parameter.flag === 'Critical') {
        flags.push({
          testId: test.id,
          parameter: parameter.parameterName,
          value: String(parameter.value),
        });
      }
    });
  });

  return flags;
};

const buildReportPreviewHTML = (report: Report, row: QueueRow): string => {
  const testsHtml = row.tests
    .map(
      (test) => `
        <h3 style="margin-top:16px;">${test.test.testName}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd;padding:6px;text-align:left;">Parameter</th>
              <th style="border:1px solid #ddd;padding:6px;text-align:left;">Value</th>
              <th style="border:1px solid #ddd;padding:6px;text-align:left;">Unit</th>
              <th style="border:1px solid #ddd;padding:6px;text-align:left;">Range</th>
              <th style="border:1px solid #ddd;padding:6px;text-align:left;">Flag</th>
            </tr>
          </thead>
          <tbody>
            ${test.parameterValues
              .map(
                (parameter) => `
                  <tr>
                    <td style="border:1px solid #ddd;padding:6px;">${parameter.parameterName}</td>
                    <td style="border:1px solid #ddd;padding:6px;">${parameter.value}</td>
                    <td style="border:1px solid #ddd;padding:6px;">${parameter.unit}</td>
                    <td style="border:1px solid #ddd;padding:6px;">${parameter.normalRange}</td>
                    <td style="border:1px solid #ddd;padding:6px;">${parameter.flag || '-'}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      `
    )
    .join('');

  return `
    <html>
      <head>
        <title>${report.reportId}</title>
      </head>
      <body style="font-family:Arial, sans-serif; margin:24px;">
        <h2>NXA Pathology Lab</h2>
        <p><strong>Report ID:</strong> ${report.reportId}</p>
        <p><strong>Token:</strong> ${row.token}</p>
        <p><strong>Sample ID:</strong> ${row.sampleId}</p>
        <p><strong>Patient:</strong> ${row.patientName}</p>
        <p><strong>Status:</strong> ${report.status}</p>
        <p><strong>Pathologist:</strong> ${report.pathologist.name || '-'}</p>
        <p><strong>Registration:</strong> ${report.pathologist.registrationNo || '-'}</p>
        <p><strong>Remarks:</strong> ${report.remarks || '-'}</p>
        ${testsHtml}
      </body>
    </html>
  `;
};

export default function ReportGeneratePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const currentUser = user?.name || user?.id || 'lab_staff';

  const [completedTests, setCompletedTests] = useState<TestResult[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState(0);
  const [selectedRow, setSelectedRow] = useState<QueueRow | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [criticalHandled, setCriticalHandled] = useState(false);
  const [criticalHandledNote, setCriticalHandledNote] = useState('');

  const [qcOverrideDialogOpen, setQcOverrideDialogOpen] = useState(false);
  const [qcOverrideReason, setQcOverrideReason] = useState('');
  const [pendingGenerateRow, setPendingGenerateRow] = useState<QueueRow | null>(null);

  const [publishConfirmRow, setPublishConfirmRow] = useState<QueueRow | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signTarget, setSignTarget] = useState<QueueRow | null>(null);
  const [signType, setSignType] = useState<SignatureType>('Typed');
  const [signName, setSignName] = useState('');
  const [signRegistrationNo, setSignRegistrationNo] = useState('');
  const [signImageDataUrl, setSignImageDataUrl] = useState<string | undefined>(undefined);

  const uploadPdfInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSignatureInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfUploadTarget, setPdfUploadTarget] = useState<QueueRow | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const refreshData = () => {
    setCompletedTests(getCompletedTests());
    setBookings(getBookings());
    setReports(getReports());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const status = searchParams.get('status') as StatusFilter | null;
    const sample = searchParams.get('sampleId');

    if (status) {
      setStatusFilter(status);
    }

    if (sample) {
      setSearchQuery(sample);
    }
  }, [searchParams]);

  const queueRows = useMemo<QueueRow[]>(() => {
    const groupedBySample = new Map<string, TestResult[]>();

    completedTests
      .filter((test) => test.status === 'Completed')
      .forEach((test) => {
        const key = test.sample.sampleID;
        const existing = groupedBySample.get(key) || [];
        existing.push(test);
        groupedBySample.set(key, existing);
      });

    const rows: QueueRow[] = [];

    groupedBySample.forEach((tests, sampleId) => {
      const first = tests[0];
      const report = reports.find((entry) => entry.sampleId === sampleId);
      const booking = bookings.find(
        (entry) =>
          entry.sample.sampleID === sampleId ||
          entry.tokenNumber === first.sample.tokenNumber ||
          entry.bookingID === first.sample.tokenNumber
      );

      rows.push({
        id: sampleId,
        token: first.sample.tokenNumber,
        sampleId,
        patientId: booking?.patientID || first.patient.id,
        patientName: booking?.patientName || first.patient.name,
        patientMobile: booking?.patientMobile || first.patient.mobile,
        bookingId: booking?.bookingID || first.sample.tokenNumber,
        packageId: booking?.selectedPackage?.id,
        tests,
        critical: tests.some((item) => item.hasCriticalValues),
        status: report?.status || 'ReadyToGenerate',
        updatedAt:
          report?.updatedAt ||
          tests
            .map((item) => item.completedAt || item.startedAt || new Date().toISOString())
            .sort()
            .reverse()[0],
        reportId: report?.reportId,
        hasQcIssue: tests.some((item) => item.qcStatus && item.qcStatus !== 'Passed'),
        bookingDate: booking?.bookingDate,
      });
    });

    return rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [completedTests, bookings, reports]);

  const filteredRows = useMemo(() => {
    let rows = [...queueRows];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      rows = rows.filter((row) =>
        [
          row.patientName,
          row.patientMobile,
          row.token,
          row.sampleId,
          row.reportId || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    if (statusFilter !== 'All') {
      rows = rows.filter((row) => row.status === statusFilter);
    }

    if (criticalOnly) {
      rows = rows.filter((row) => row.critical);
    }

    if (dateFrom || dateTo) {
      rows = rows.filter((row) => {
        const baseDate = row.bookingDate || row.updatedAt;
        if (!baseDate) return false;

        const value = new Date(baseDate);
        if (Number.isNaN(value.getTime())) return false;

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (value < fromDate) return false;
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (value > toDate) return false;
        }

        return true;
      });
    }

    return rows;
  }, [queueRows, searchQuery, statusFilter, criticalOnly, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();

    return {
      readyToGenerate: queueRows.filter((row) => row.status === 'ReadyToGenerate').length,
      draft: queueRows.filter((row) => row.status === 'Draft').length,
      pendingSignature: queueRows.filter((row) => row.status === 'PendingSignature').length,
      publishedToday: queueRows.filter(
        (row) =>
          row.status === 'Published' && new Date(row.updatedAt).toDateString() === today
      ).length,
    };
  }, [queueRows]);

  const getReportByRow = (row: QueueRow): Report | undefined =>
    reports.find((entry) => entry.sampleId === row.sampleId);

  const createNewReport = (row: QueueRow): Report => {
    const now = new Date().toISOString();
    const criticalFlags = getCriticalFlags(row.tests);

    return {
      reportId: `RPT-${Date.now()}`,
      bookingId: row.bookingId,
      sampleId: row.sampleId,
      patientId: row.patientId,
      testIds: row.tests.map((test) => test.id),
      packageId: row.packageId,
      createdAt: now,
      updatedAt: now,
      status: 'Draft',
      generatedBy: currentUser,
      pathologist: {
        name: '',
      },
      signatureType: 'Typed',
      remarks: '',
      testRemarks: {},
      criticalFlags,
      criticalHandled: false,
      criticalHandledNote: '',
      pdf: {
        mode: 'AutoGenerated',
      },
      audit: [
        {
          at: now,
          by: currentUser,
          action: 'Created',
          notes: 'Draft initialized from completed testing results',
        },
      ],
    };
  };

  const openEditor = (row: QueueRow) => {
    if (row.hasQcIssue) {
      setPendingGenerateRow(row);
      setQcOverrideReason('');
      setQcOverrideDialogOpen(true);
      return;
    }

    const existing = getReportByRow(row);
    const report = existing ? { ...existing } : createNewReport(row);

    setSelectedRow(row);
    setEditingReport(report);
    setCriticalHandled(Boolean(report.criticalHandled));
    setCriticalHandledNote(report.criticalHandledNote || '');
    setEditorOpen(true);
    setEditorTab(0);
  };

  const proceedGenerateAfterQcOverride = () => {
    if (!pendingGenerateRow || !qcOverrideReason.trim()) {
      showSnackbar('QC override reason is required', 'error');
      return;
    }

    const existing = getReportByRow(pendingGenerateRow);
    const report = existing ? { ...existing } : createNewReport(pendingGenerateRow);

    report.audit.push({
      at: new Date().toISOString(),
      by: currentUser,
      action: 'Edited',
      notes: `QC override: ${qcOverrideReason.trim()}`,
    });
    report.updatedAt = new Date().toISOString();

    setSelectedRow(pendingGenerateRow);
    setEditingReport(report);
    setCriticalHandled(Boolean(report.criticalHandled));
    setCriticalHandledNote(report.criticalHandledNote || '');

    setQcOverrideDialogOpen(false);
    setPendingGenerateRow(null);
    setEditorOpen(true);
  };

  const persistReport = (report: Report, action: 'save' | 'ready') => {
    const nextReport: Report = {
      ...report,
      updatedAt: new Date().toISOString(),
      generatedBy: report.generatedBy || currentUser,
      criticalHandled,
      criticalHandledNote,
    };

    if (action === 'ready') {
      if (!nextReport.pathologist.name.trim()) {
        showSnackbar('Pathologist name is required before Pending Signature', 'error');
        return;
      }

      if (nextReport.criticalFlags.length > 0 && (!criticalHandled || !criticalHandledNote.trim())) {
        showSnackbar('Critical handled checkbox and note are required', 'error');
        return;
      }

      nextReport.status = 'PendingSignature';
      nextReport.pathologist.signedAt = new Date().toISOString();
      nextReport.audit.push({
        at: new Date().toISOString(),
        by: currentUser,
        action: 'Signed',
        notes: 'Marked ready for signature',
      });
    } else {
      if (!nextReport.audit.some((item) => item.action === 'Created')) {
        nextReport.audit.push({
          at: new Date().toISOString(),
          by: currentUser,
          action: 'Created',
        });
      }
      nextReport.status = 'Draft';
      nextReport.audit.push({
        at: new Date().toISOString(),
        by: currentUser,
        action: 'Edited',
        notes: 'Draft saved',
      });
    }

    upsertReport(nextReport);
    refreshData();
    setEditingReport(nextReport);
    showSnackbar(action === 'ready' ? 'Moved to Pending Signature' : 'Draft saved', 'success');

    if (action === 'ready') {
      setEditorOpen(false);
    }
  };

  const handleUploadPdfClick = (row: QueueRow) => {
    setPdfUploadTarget(row);
    uploadPdfInputRef.current?.click();
  };

  const handleUploadPdfSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !pdfUploadTarget) {
      return;
    }

    const dataUrl = await toDataUrl(file);
    const existing = getReportByRow(pdfUploadTarget);
    const report = existing || createNewReport(pdfUploadTarget);

    report.pdf = {
      mode: 'Uploaded',
      fileName: file.name,
      dataUrl,
    };
    report.updatedAt = new Date().toISOString();

    report.audit.push({
      at: new Date().toISOString(),
      by: currentUser,
      action: 'Edited',
      notes: `PDF uploaded: ${file.name}`,
    });

    upsertReport(report);
    refreshData();
    showSnackbar('PDF uploaded and attached to report', 'success');
    event.target.value = '';
  };

  const openSignDialog = (row: QueueRow) => {
    const existing = getReportByRow(row);
    if (!existing) {
      showSnackbar('Create draft before signing', 'warning');
      return;
    }

    setSignTarget(row);
    setSignType(existing.signatureType || 'Typed');
    setSignName(existing.pathologist.name || '');
    setSignRegistrationNo(existing.pathologist.registrationNo || '');
    setSignImageDataUrl(existing.signatureImageDataUrl);
    setSignDialogOpen(true);
  };

  const applySign = () => {
    if (!signTarget) return;

    const existing = getReportByRow(signTarget);
    if (!existing) {
      showSnackbar('Draft not found', 'error');
      return;
    }

    if (!signName.trim()) {
      showSnackbar('Pathologist name is required for signing', 'error');
      return;
    }

    if (existing.criticalFlags.length > 0 && !existing.criticalHandled) {
      showSnackbar('Critical flags must be handled before signing', 'error');
      return;
    }

    const updated: Report = {
      ...existing,
      signatureType: signType,
      signatureImageDataUrl: signType === 'UploadedImage' ? signImageDataUrl : undefined,
      pathologist: {
        ...existing.pathologist,
        name: signName,
        registrationNo: signRegistrationNo || undefined,
        signedAt: new Date().toISOString(),
      },
      status: 'PendingSignature',
      updatedAt: new Date().toISOString(),
      audit: [
        ...existing.audit,
        {
          at: new Date().toISOString(),
          by: currentUser,
          action: 'Signed',
          notes: `Signature type: ${signType}`,
        },
      ],
    };

    upsertReport(updated);
    refreshData();
    setSignDialogOpen(false);
    showSnackbar('Report signed and moved to Pending Signature', 'success');
  };

  const handleSignatureFilePick = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await toDataUrl(file);
    setSignImageDataUrl(dataUrl);
    event.target.value = '';
  };

  const handlePublish = (row: QueueRow) => {
    if (row.status === 'Draft') {
      setPublishConfirmRow(row);
      return;
    }

    if (row.status !== 'PendingSignature') {
      showSnackbar('Only Pending Signature reports can be published', 'warning');
      return;
    }

    const published = publishReport(row.reportId || '', currentUser, 'User notified');
    if (!published) {
      showSnackbar('Unable to publish report', 'error');
      return;
    }

    refreshData();
    showSnackbar('Report published. User notified. Doctor notification is future scope.', 'success');
  };

  const confirmDraftPublishOverride = () => {
    if (!publishConfirmRow) return;

    const report = getReportByRow(publishConfirmRow);
    if (!report) {
      showSnackbar('Report not found', 'error');
      return;
    }

    const published = publishReport(
      report.reportId,
      currentUser,
      'Published from Draft with override confirm. User notified.'
    );

    if (!published) {
      showSnackbar('Publish failed', 'error');
      return;
    }

    refreshData();
    setPublishConfirmRow(null);
    showSnackbar('Draft published with override. User notified.', 'success');
  };

  const handlePreview = (row: QueueRow) => {
    const report = getReportByRow(row);
    if (!report) {
      showSnackbar('Create draft before preview', 'warning');
      return;
    }

    const html = buildReportPreviewHTML(report, row);
    const updated = {
      ...report,
      pdf: {
        mode: report.pdf.mode || 'AutoGenerated',
        fileName: report.pdf.fileName || `${report.reportId}.html`,
        dataUrl:
          report.pdf.dataUrl ||
          `data:text/html;base64,${btoa(unescape(encodeURIComponent(html)))}`,
      },
      updatedAt: new Date().toISOString(),
    };

    upsertReport(updated);
    refreshData();
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const printPreview = () => {
    if (!previewHtml) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(previewHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleResend = (row: QueueRow) => {
    const report = getReportByRow(row);
    if (!report) {
      showSnackbar('Report not found', 'error');
      return;
    }

    addAuditEvent(report.reportId, currentUser, 'Resent', 'Mock re-send notification');
    refreshData();
    showSnackbar('Notification re-sent (mock)', 'success');
  };

  const columns: GridColDef<QueueRow>[] = [
    { field: 'token', headerName: 'Token', width: 120 },
    { field: 'sampleId', headerName: 'Sample ID', width: 150 },
    {
      field: 'patientName',
      headerName: 'Patient',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {params.row.patientName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.patientMobile}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'tests',
      headerName: 'Tests',
      width: 90,
      valueGetter: (_value, row) => row.tests.length,
    },
    {
      field: 'critical',
      headerName: 'Critical',
      width: 110,
      renderCell: (params) => (
        <Chip
          size="small"
          color={params.value ? 'error' : 'default'}
          label={params.value ? 'Yes' : 'No'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 170,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === 'ReadyToGenerate' ? 'Ready to Generate' : params.value}
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      width: 170,
      valueGetter: (_value, row) => formatDateTime(row.updatedAt),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 400,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={params.row.reportId ? 'Edit Draft' : 'Generate Draft'}>
            <IconButton size="small" color="primary" onClick={() => openEditor(params.row)}>
              {params.row.reportId ? <EditIcon /> : <AddIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload PDF">
            <IconButton size="small" onClick={() => handleUploadPdfClick(params.row)}>
              <FileUploadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sign">
            <IconButton size="small" onClick={() => openSignDialog(params.row)}>
              <SignatureIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Publish">
            <IconButton size="small" color="success" onClick={() => handlePublish(params.row)}>
              <PublishIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview">
            <IconButton size="small" onClick={() => handlePreview(params.row)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Re-send notification">
            <IconButton size="small" onClick={() => handleResend(params.row)}>
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Report Generation
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Ready to Generate</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.readyToGenerate}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Draft</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.draft}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Pending Signature</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.pendingSignature}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Published Today</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.publishedToday}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Search"
                  placeholder="patient/mobile/token/sample/report"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="ReadyToGenerate">Ready to Generate</MenuItem>
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="PendingSignature">Pending Signature</MenuItem>
                    <MenuItem value="Published">Published</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="From"
                  InputLabelProps={{ shrink: true }}
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="To"
                  InputLabelProps={{ shrink: true }}
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={criticalOnly}
                      onChange={(event) => setCriticalOnly(event.target.checked)}
                    />
                  }
                  label="Critical only"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ height: 620 }}>
              <DataGrid rows={filteredRows} columns={columns} pageSizeOptions={[10, 25, 50]} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <input
        ref={uploadPdfInputRef}
        type="file"
        accept="application/pdf,.html,.htm"
        hidden
        onChange={handleUploadPdfSelected}
      />

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          {editingReport?.reportId || 'Report Draft'}
          {selectedRow && (
            <Typography variant="body2" color="text.secondary">
              {selectedRow.patientName} • {selectedRow.sampleId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {editingReport && selectedRow && (
            <>
              <Tabs
                value={editorTab}
                onChange={(_event, value) => setEditorTab(value)}
                sx={{ mb: 2 }}
              >
                {REPORT_EDITOR_TABS.map((tab) => (
                  <Tab key={tab} label={tab} />
                ))}
              </Tabs>

              {editorTab === 0 && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Patient & Booking Summary
                        </Typography>
                        <Typography variant="body2">Patient: {selectedRow.patientName}</Typography>
                        <Typography variant="body2">Mobile: {selectedRow.patientMobile}</Typography>
                        <Typography variant="body2">Token: {selectedRow.token}</Typography>
                        <Typography variant="body2">Sample: {selectedRow.sampleId}</Typography>
                        <Typography variant="body2">Booking ID: {selectedRow.bookingId}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 8 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Report Meta
                        </Typography>
                        <TextField
                          fullWidth
                          label="Overall remarks"
                          multiline
                          minRows={3}
                          value={editingReport.remarks || ''}
                          onChange={(event) =>
                            setEditingReport({
                              ...editingReport,
                              remarks: event.target.value,
                            })
                          }
                          sx={{ mb: 2 }}
                        />
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Pathologist name"
                              value={editingReport.pathologist.name}
                              onChange={(event) =>
                                setEditingReport({
                                  ...editingReport,
                                  pathologist: {
                                    ...editingReport.pathologist,
                                    name: event.target.value,
                                  },
                                })
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Registration no"
                              value={editingReport.pathologist.registrationNo || ''}
                              onChange={(event) =>
                                setEditingReport({
                                  ...editingReport,
                                  pathologist: {
                                    ...editingReport.pathologist,
                                    registrationNo: event.target.value,
                                  },
                                })
                              }
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {editorTab === 1 && (
                <Stack spacing={2}>
                  {selectedRow.tests.map((test) => (
                    <Card key={test.id} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {test.test.testName}
                        </Typography>
                        <Box sx={{ maxHeight: 220, overflow: 'auto', mb: 1 }}>
                          {test.parameterValues.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No parameter values available.
                            </Typography>
                          )}
                          {test.parameterValues.map((parameter) => (
                            <Box
                              key={parameter.parameterId}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr',
                                gap: 1,
                                py: 0.75,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Typography variant="body2">{parameter.parameterName}</Typography>
                              <Typography variant="body2">{parameter.value}</Typography>
                              <Typography variant="body2">{parameter.unit}</Typography>
                              <Typography variant="body2">{parameter.normalRange}</Typography>
                              <Chip
                                size="small"
                                color={parameter.isCritical ? 'error' : parameter.flag === 'High' || parameter.flag === 'Low' ? 'warning' : 'default'}
                                label={parameter.flag || 'Normal'}
                              />
                            </Box>
                          ))}
                        </Box>
                        <TextField
                          fullWidth
                          label="Remarks for this test"
                          value={editingReport.testRemarks?.[test.id] || ''}
                          onChange={(event) =>
                            setEditingReport({
                              ...editingReport,
                              testRemarks: {
                                ...(editingReport.testRemarks || {}),
                                [test.id]: event.target.value,
                              },
                            })
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}

              {editorTab === 2 && (
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Signature Type</InputLabel>
                    <Select
                      value={editingReport.signatureType}
                      label="Signature Type"
                      onChange={(event) =>
                        setEditingReport({
                          ...editingReport,
                          signatureType: event.target.value as SignatureType,
                        })
                      }
                    >
                      <MenuItem value="Typed">Typed name</MenuItem>
                      <MenuItem value="UploadedImage">Uploaded image</MenuItem>
                      <MenuItem value="Digital">Digital (future)</MenuItem>
                    </Select>
                  </FormControl>

                  {editingReport.signatureType === 'UploadedImage' && (
                    <Box>
                      <Button
                        variant="outlined"
                        startIcon={<FileUploadIcon />}
                        onClick={() => uploadSignatureInputRef.current?.click()}
                      >
                        Upload Signature Image
                      </Button>
                      <input
                        ref={uploadSignatureInputRef}
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          const dataUrl = await toDataUrl(file);
                          setEditingReport({
                            ...editingReport,
                            signatureImageDataUrl: dataUrl,
                          });
                          event.target.value = '';
                        }}
                      />
                      {editingReport.signatureImageDataUrl && (
                        <Box sx={{ mt: 1 }}>
                          <img
                            src={editingReport.signatureImageDataUrl}
                            alt="signature"
                            style={{ maxHeight: 80 }}
                          />
                        </Box>
                      )}
                    </Box>
                  )}

                  {editingReport.criticalFlags.length > 0 && (
                    <Alert severity="warning">
                      This report contains {editingReport.criticalFlags.length} critical flags.
                    </Alert>
                  )}

                  {editingReport.criticalFlags.length > 0 && (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={criticalHandled}
                            onChange={(event) => setCriticalHandled(event.target.checked)}
                          />
                        }
                        label="Critical values handled"
                      />
                      <TextField
                        fullWidth
                        label="Critical handling note"
                        value={criticalHandledNote}
                        onChange={(event) => setCriticalHandledNote(event.target.value)}
                      />
                    </>
                  )}
                </Stack>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => {
              if (!editingReport || !selectedRow) return;
              const html = buildReportPreviewHTML(editingReport, selectedRow);
              setPreviewHtml(html);
              setPreviewOpen(true);
            }}
          >
            Print to PDF
          </Button>
          <Button
            variant="contained"
            onClick={() => editingReport && persistReport(editingReport, 'save')}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => editingReport && persistReport(editingReport, 'ready')}
          >
            Mark Ready for Signature
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={qcOverrideDialogOpen}
        onClose={() => setQcOverrideDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>QC Override Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            One or more completed tests have QC status not Passed. Provide reason to continue.
          </Typography>
          <TextField
            fullWidth
            label="Override reason"
            multiline
            minRows={3}
            value={qcOverrideReason}
            onChange={(event) => setQcOverrideReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQcOverrideDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={proceedGenerateAfterQcOverride}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={signDialogOpen} onClose={() => setSignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sign Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Signature Type</InputLabel>
              <Select
                value={signType}
                label="Signature Type"
                onChange={(event) => setSignType(event.target.value as SignatureType)}
              >
                <MenuItem value="Typed">Typed name</MenuItem>
                <MenuItem value="UploadedImage">Uploaded image</MenuItem>
                <MenuItem value="Digital">Digital (future)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Pathologist name"
              value={signName}
              onChange={(event) => setSignName(event.target.value)}
            />
            <TextField
              fullWidth
              label="Registration no"
              value={signRegistrationNo}
              onChange={(event) => setSignRegistrationNo(event.target.value)}
            />
            {signType === 'UploadedImage' && (
              <Box>
                <Button variant="outlined" onClick={() => uploadSignatureInputRef.current?.click()}>
                  Upload Signature
                </Button>
                <input
                  ref={uploadSignatureInputRef}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureFilePick}
                />
                {signImageDataUrl && (
                  <Box sx={{ mt: 1 }}>
                    <img src={signImageDataUrl} alt="sign" style={{ maxHeight: 80 }} />
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applySign}>
            Sign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(publishConfirmRow)} onClose={() => setPublishConfirmRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish Draft with Override?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            This report is still Draft. Publish override will skip strict Pending Signature flow.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishConfirmRow(null)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={confirmDraftPublishOverride}>
            Publish Override
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              minHeight: 400,
              p: 1,
              bgcolor: 'grey.50',
            }}
          >
            <iframe
              title="report-preview"
              srcDoc={previewHtml}
              style={{ width: '100%', height: 520, border: 'none' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button startIcon={<PrintIcon />} variant="contained" onClick={printPreview}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
