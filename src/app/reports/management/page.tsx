/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Divider,
  Stack,
  Badge
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Today as TodayIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ReportProblem as ReportProblemIcon,
  Error as ErrorIcon,
  CloudDownload as CloudDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Update as UpdateIcon,
  NoteAdd as NoteAddIcon,
  Share as ShareIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  BarChart as BarChartIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Create as CreateIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Report, StatsData } from '@/types/reportManagement';
import reportManagementData from '@/data/reportManagementData';

export default function ReportManagementPage() {
  // State Management
  const [allReports, setAllReports] = useState<Report[]>(reportManagementData);
  const [filteredReports, setFilteredReports] = useState<Report[]>(reportManagementData);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedReports, setSelectedReports] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set()
  });

  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [patientSearch, setPatientSearch] = useState('');
  const [testFilter, setTestFilter] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [pathologistFilter, setPathologistFilter] = useState('All');
  const [downloadStatusFilter, setDownloadStatusFilter] = useState('All');
  const [reportTypeFilter, setReportTypeFilter] = useState('All');
  const [criticalOnlyFilter, setCriticalOnlyFilter] = useState(false);

  // Dialog states
  const [viewReportDialog, setViewReportDialog] = useState(false);
  const [editReportDialog, setEditReportDialog] = useState(false);
  const [resendDialog, setResendDialog] = useState(false);
  const [auditLogDialog, setAuditLogDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);

  // UI states
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [actionMenu, setActionMenu] = useState<{ anchorEl: null | HTMLElement; report: Report | null }>({
    anchorEl: null,
    report: null
  });
  const [viewTab, setViewTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Stats
  const [statsData, setStatsData] = useState<StatsData>({
    totalReports: 0,
    todayReports: 0,
    pendingReports: 0,
    criticalReports: 0,
    deliveryFailed: 0,
    notDownloaded: 0
  });

  // Calculate stats
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setStatsData({
      totalReports: allReports.length,
      todayReports: allReports.filter(r => {
        const reportDate = new Date(r.publishedAt);
        reportDate.setHours(0, 0, 0, 0);
        return reportDate.getTime() === today.getTime();
      }).length,
      pendingReports: allReports.filter(r => r.status === 'Pending').length,
      criticalReports: allReports.filter(r => r.hasCriticalValues && !r.criticalAcknowledged).length,
      deliveryFailed: allReports.filter(r =>
        r.deliveryStatus.sms === 'Failed' || r.deliveryStatus.email === 'Failed'
      ).length,
      notDownloaded: allReports.filter(r => r.downloadCount === 0 && new Date(r.publishedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000).length
    });
  }, [allReports]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allReports];

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(r => new Date(r.publishedAt) >= dateRange.from!);
    }
    if (dateRange.to) {
      const endDate = new Date(dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.publishedAt) <= endDate);
    }

    // Patient search
    if (patientSearch) {
      const query = patientSearch.toLowerCase();
      filtered = filtered.filter(r =>
        r.patientName.toLowerCase().includes(query) ||
        r.patientId.toLowerCase().includes(query) ||
        r.mobile.includes(query) ||
        r.sampleId.toLowerCase().includes(query) ||
        r.reportId.toLowerCase().includes(query)
      );
    }

    // Test filter
    if (testFilter !== 'All') {
      filtered = filtered.filter(r => r.testName === testFilter);
    }

    // Doctor filter
    if (doctorFilter !== 'All') {
      filtered = filtered.filter(r => {
        if (doctorFilter === 'Self') return !r.referredByDoctor;
        return r.referredByDoctor === doctorFilter;
      });
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Delivery status filter
    if (deliveryStatusFilter !== 'All') {
      filtered = filtered.filter(r => {
        if (deliveryStatusFilter === 'Delivered') {
          return r.deliveryStatus.sms === 'Delivered' || r.deliveryStatus.email === 'Delivered';
        }
        if (deliveryStatusFilter === 'Failed') {
          return r.deliveryStatus.sms === 'Failed' || r.deliveryStatus.email === 'Failed';
        }
        if (deliveryStatusFilter === 'Pending') {
          return r.deliveryStatus.sms === 'Pending' || r.deliveryStatus.email === 'Pending';
        }
        return true;
      });
    }

    // Department filter
    if (departmentFilter !== 'All') {
      filtered = filtered.filter(r => r.department === departmentFilter);
    }

    // Pathologist filter
    if (pathologistFilter !== 'All') {
      filtered = filtered.filter(r => r.pathologist === pathologistFilter);
    }

    // Download status filter
    if (downloadStatusFilter !== 'All') {
      filtered = filtered.filter(r => {
        if (downloadStatusFilter === 'Downloaded') return r.downloadCount > 0;
        if (downloadStatusFilter === 'Not Downloaded') return r.downloadCount === 0;
        if (downloadStatusFilter === 'Multiple') return r.downloadCount > 2;
        return true;
      });
    }

    // Report type filter
    if (reportTypeFilter !== 'All') {
      filtered = filtered.filter(r => {
        if (reportTypeFilter === 'Auto-Generated') return !r.isRevision;
        if (reportTypeFilter === 'Revised') return r.isRevision;
        if (reportTypeFilter === 'With Addendum') return r.hasAddendum;
        return true;
      });
    }

    // Critical only filter
    if (criticalOnlyFilter) {
      filtered = filtered.filter(r => r.hasCriticalValues);
    }

    setFilteredReports(filtered);
  }, [allReports, dateRange, patientSearch, testFilter, doctorFilter, statusFilter, deliveryStatusFilter, departmentFilter, pathologistFilter, downloadStatusFilter, reportTypeFilter, criticalOnlyFilter]);

  // Get unique values for filters
  const uniqueTests = useMemo(() => Array.from(new Set(allReports.map(r => r.testName))).sort(), [allReports]);
  const uniqueDoctors = useMemo(() => Array.from(new Set(allReports.map(r => r.referredByDoctor).filter(Boolean))).sort(), [allReports]);
  const uniqueDepartments = useMemo(() => Array.from(new Set(allReports.map(r => r.department))).sort(), [allReports]);
  const uniquePathologists = useMemo(() => Array.from(new Set(allReports.map(r => r.pathologist))).sort(), [allReports]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
        // In production, fetch new data here
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Handlers
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
      showSnackbar('Data refreshed successfully', 'success');
    }, 500);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setViewReportDialog(true);
  };

  const handleDownloadReport = (report: Report) => {
    console.log('Downloading report:', report.reportId);
    showSnackbar(`Downloading ${report.reportId}`, 'success');
    // Update download count
    setAllReports(prev => prev.map(r => r.id === report.id ? { ...r, downloadCount: r.downloadCount + 1 } : r));
  };

  const handlePrintReport = (report: Report) => {
    console.log('Printing report:', report.reportId);
    showSnackbar(`Printing ${report.reportId}`, 'success');
    // Update print count
    setAllReports(prev => prev.map(r => r.id === report.id ? { ...r, printCount: r.printCount + 1 } : r));
  };

  const handleResendNotifications = (report: Report) => {
    setSelectedReport(report);
    setResendDialog(true);
  };

  const handleViewAuditLog = (report: Report) => {
    setSelectedReport(report);
    setAuditLogDialog(true);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDatePreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'Today':
        setDateRange({ from: startOfDay(today), to: endOfDay(today) });
        break;
      case 'Yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ from: startOfDay(yesterday), to: endOfDay(yesterday) });
        break;
      case 'Last 7 Days':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case 'Last 30 Days':
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case 'This Month':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case 'Last Month':
        const lastMonth = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      default:
        setDateRange({ from: null, to: null });
    }
  };

  const handleClearFilters = () => {
    setDateRange({ from: null, to: null });
    setPatientSearch('');
    setTestFilter('All');
    setDoctorFilter('All');
    setStatusFilter('All');
    setDeliveryStatusFilter('All');
    setDepartmentFilter('All');
    setPathologistFilter('All');
    setDownloadStatusFilter('All');
    setReportTypeFilter('All');
    setCriticalOnlyFilter(false);
  };

  const handleBulkDownload = () => {
    const selectedIds = Array.from(selectedReports.ids || []);
    const selected = allReports.filter(r => selectedIds.includes(r.id));
    console.log('Bulk downloading:', selected.length, 'reports');
    showSnackbar(`Downloading ${selected.length} reports as ZIP`, 'success');
  };

  const handleBulkPrint = () => {
    const selectedIds = Array.from(selectedReports.ids || []);
    const selected = allReports.filter(r => selectedIds.includes(r.id));
    console.log('Bulk printing:', selected.length, 'reports');
    showSnackbar(`Printing ${selected.length} reports`, 'success');
  };

  const handleBulkResend = () => {
    const selectedIds = Array.from(selectedReports.ids || []);
    const selected = allReports.filter(r => selectedIds.includes(r.id));
    console.log('Bulk resending:', selected.length, 'reports');
    showSnackbar(`Re-sending notifications for ${selected.length} reports`, 'success');
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel');
    showSnackbar('Exporting to Excel...', 'success');
  };

  const handleExportCSV = () => {
    console.log('Exporting to CSV');
    showSnackbar('Exporting to CSV...', 'success');
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'reportId',
      headerName: 'Report ID',
      width: 180,
      renderCell: (params) => (
        <Typography
          sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 'bold' }}
          onClick={() => handleViewReport(params.row)}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'sampleId',
      headerName: 'Sample ID',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AssignmentIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      width: 200
    },
    {
      field: 'patientId',
      headerName: 'Patient ID',
      width: 120
    },
    {
      field: 'ageGender',
      headerName: 'Age / Gender',
      width: 100,
      valueGetter: (value, row) => `${row.age} / ${row.gender.charAt(0)}`
    },
    {
      field: 'mobile',
      headerName: 'Mobile',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={() => console.log('Call:', params.value)}>
            <PhoneIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'testName',
      headerName: 'Test Name',
      width: 200
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      renderCell: (params) => {
        const colors: Record<string, string> = {
          Hematology: 'primary',
          Biochemistry: 'success',
          Microbiology: 'warning',
          Serology: 'info',
          'Clinical Pathology': 'secondary'
        };
        return <Chip label={params.value} color={colors[params.value] as any || 'default'} size="small" />;
      }
    },
    {
      field: 'referredByDoctor',
      headerName: 'Referred By Doctor',
      width: 180,
      valueGetter: (value) => value || 'Self'
    },
    {
      field: 'publishedAt',
      headerName: 'Published Date & Time',
      width: 180,
      valueGetter: (value) => format(new Date(value), 'dd-MMM-yyyy, hh:mm a')
    },
    {
      field: 'pathologist',
      headerName: 'Pathologist',
      width: 180
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const colors: Record<string, any> = {
          Published: 'success',
          Pending: 'warning',
          Draft: 'default',
          Cancelled: 'error',
          Revised: 'secondary'
        };
        return <Chip label={params.value} color={colors[params.value] || 'default'} size="small" />;
      }
    },
    {
      field: 'criticalValues',
      headerName: 'Critical Values',
      width: 130,
      renderCell: (params) => {
        if (params.row.hasCriticalValues) {
          const count = params.row.criticalValues?.length || 0;
          return (
            <Chip
              icon={<WarningIcon />}
              label={`${count} Critical`}
              color="error"
              size="small"
              onClick={() => console.log('Show critical values', params.row.criticalValues)}
            />
          );
        }
        return null;
      }
    },
    {
      field: 'deliveryStatus',
      headerName: 'Delivery Status',
      width: 150,
      renderCell: (params) => {
        const status = params.row.deliveryStatus;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={`SMS: ${status.sms}`}>
              <SmsIcon
                fontSize="small"
                color={status.sms === 'Delivered' ? 'success' : status.sms === 'Failed' ? 'error' : 'action'}
              />
            </Tooltip>
            <Tooltip title={`Email: ${status.email}`}>
              <EmailIcon
                fontSize="small"
                color={status.email === 'Opened' ? 'primary' : status.email === 'Delivered' ? 'success' : status.email === 'Failed' ? 'error' : 'action'}
              />
            </Tooltip>
            <Tooltip title={`WhatsApp: ${status.whatsapp}`}>
              <WhatsAppIcon
                fontSize="small"
                color={status.whatsapp === 'Delivered' ? 'success' : 'action'}
              />
            </Tooltip>
          </Box>
        );
      }
    },
    {
      field: 'downloadCount',
      headerName: 'Download Count',
      width: 140,
      renderCell: (params) => {
        const count = params.value;
        return (
          <Chip
            icon={<CloudDownloadIcon />}
            label={`${count} downloads`}
            size="small"
            color={count === 0 ? 'error' : count <= 2 ? 'warning' : 'success'}
          />
        );
      }
    },
    {
      field: 'printCount',
      headerName: 'Print Count',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PrintIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value} prints</Typography>
        </Box>
      )
    },
    {
      field: 'pdfSize',
      headerName: 'Report Size',
      width: 100,
      valueGetter: (value) => `${Math.round(value / 1024)} KB`
    },
    {
      field: 'version',
      headerName: 'Version',
      width: 80,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">v{params.value}</Typography>
          {params.row.hasAddendum && (
            <Tooltip title="Has addendum">
              <NoteAddIcon fontSize="small" color="info" />
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Report">
            <IconButton size="small" onClick={() => handleViewReport(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton size="small" onClick={() => handleDownloadReport(params.row)}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" onClick={() => handlePrintReport(params.row)}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="More Actions">
            <IconButton
              size="small"
              onClick={(e) => setActionMenu({ anchorEl: e.currentTarget, report: params.row })}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Row styling
  const getRowClassName = (params: any) => {
    if (params.row.hasCriticalValues && !params.row.criticalAcknowledged) {
      return 'critical-row';
    }
    if (params.row.deliveryStatus.sms === 'Failed' || params.row.deliveryStatus.email === 'Failed') {
      return 'delivery-failed-row';
    }
    if (params.row.downloadCount === 0 && new Date(params.row.publishedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      return 'not-downloaded-row';
    }
    if (params.row.isRevision) {
      return 'revised-row';
    }
    return '';
  };

  const activeFiltersCount = [
    dateRange.from || dateRange.to,
    patientSearch,
    testFilter !== 'All',
    doctorFilter !== 'All',
    statusFilter !== 'All',
    deliveryStatusFilter !== 'All',
    departmentFilter !== 'All',
    pathologistFilter !== 'All',
    downloadStatusFilter !== 'All',
    reportTypeFilter !== 'All',
    criticalOnlyFilter
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Page Title */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Report Management
        </Typography>

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: 'Total Reports',
              value: statsData.totalReports,
              subtitle: 'All time',
              icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              onClick: handleClearFilters
            },
            {
              title: "Today's Reports",
              value: statsData.todayReports,
              subtitle: format(new Date(), 'dd MMM yyyy'),
              icon: <TodayIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              onClick: () => handleDatePreset('Today')
            },
            {
              title: 'Pending Reports',
              value: statsData.pendingReports,
              subtitle: 'Not yet generated',
              icon: <HourglassEmptyIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              onClick: () => setStatusFilter('Pending')
            },
            {
              title: 'Critical Reports',
              value: statsData.criticalReports,
              subtitle: 'Needs attention',
              icon: <ReportProblemIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              onClick: () => setCriticalOnlyFilter(true),
              pulsate: statsData.criticalReports > 0
            },
            {
              title: 'Delivery Failed',
              value: statsData.deliveryFailed,
              subtitle: 'SMS/Email failed',
              icon: <ErrorIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              onClick: () => setDeliveryStatusFilter('Failed')
            },
            {
              title: 'Not Downloaded',
              value: statsData.notDownloaded,
              subtitle: 'Patient not accessed yet',
              icon: <CloudDownloadIcon sx={{ fontSize: 40 }} />,
              gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              onClick: () => setDownloadStatusFilter('Not Downloaded')
            }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <Card
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  animation: stat.pulsate ? 'pulse 2s infinite' : 'none',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  },
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.7)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' }
                  }
                }}
                onClick={stat.onClick}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {stat.subtitle}
                      </Typography>
                    </Box>
                    <Box sx={{ opacity: 0.3 }}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Advanced Search & Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon /> Advanced Search & Filters
            {activeFiltersCount > 0 && (
              <Chip label={`${activeFiltersCount} active`} size="small" color="primary" />
            )}
          </Typography>

          {/* Row 1: Search & Date Range */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by Report ID, Sample ID, Patient Name, Mobile, Patient ID..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: patientSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setPatientSearch('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : null }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : null }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Date Presets */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map((preset) => (
              <Button
                key={preset}
                size="small"
                variant="outlined"
                onClick={() => handleDatePreset(preset)}
              >
                {preset}
              </Button>
            ))}
            {(dateRange.from || dateRange.to) && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() => setDateRange({ from: null, to: null })}
              >
                Clear Dates
              </Button>
            )}
          </Box>

          {/* Row 2: Dropdown Filters */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Test</InputLabel>
                <Select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} label="Test">
                  <MenuItem value="All">All Tests</MenuItem>
                  {uniqueTests.map((test) => (
                    <MenuItem key={test} value={test}>{test}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Referred By Doctor</InputLabel>
                <Select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} label="Referred By Doctor">
                  <MenuItem value="All">All Doctors</MenuItem>
                  <MenuItem value="Self">Self (no referral)</MenuItem>
                  {uniqueDoctors.map((doctor) => (
                    <MenuItem key={doctor} value={doctor}>{doctor}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="Published">Published</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Delivery Status</InputLabel>
                <Select value={deliveryStatusFilter} onChange={(e) => setDeliveryStatusFilter(e.target.value)} label="Delivery Status">
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Delivered">Delivered</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} label="Department">
                  <MenuItem value="All">All Departments</MenuItem>
                  {uniqueDepartments.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Row 3: Advanced Filters & Toggles */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Pathologist</InputLabel>
                <Select value={pathologistFilter} onChange={(e) => setPathologistFilter(e.target.value)} label="Pathologist">
                  <MenuItem value="All">All Pathologists</MenuItem>
                  {uniquePathologists.map((path) => (
                    <MenuItem key={path} value={path}>{path}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Download Status</InputLabel>
                <Select value={downloadStatusFilter} onChange={(e) => setDownloadStatusFilter(e.target.value)} label="Download Status">
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Downloaded">Downloaded</MenuItem>
                  <MenuItem value="Not Downloaded">Not Downloaded</MenuItem>
                  <MenuItem value="Multiple">Multiple Times</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select value={reportTypeFilter} onChange={(e) => setReportTypeFilter(e.target.value)} label="Report Type">
                  <MenuItem value="All">All Types</MenuItem>
                  <MenuItem value="Auto-Generated">Auto-Generated</MenuItem>
                  <MenuItem value="Revised">Revised</MenuItem>
                  <MenuItem value="With Addendum">With Addendum</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={criticalOnlyFilter}
                    onChange={(e) => setCriticalOnlyFilter(e.target.checked)}
                    color="error"
                  />
                }
                label="Critical Reports Only"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={activeFiltersCount === 0}
              >
                Clear All Filters
              </Button>
            </Grid>
          </Grid>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {dateRange.from && (
                <Chip
                  label={`Date: ${format(dateRange.from, 'dd-MMM')} to ${dateRange.to ? format(dateRange.to, 'dd-MMM') : 'Now'}`}
                  onDelete={() => setDateRange({ from: null, to: null })}
                  size="small"
                />
              )}
              {patientSearch && (
                <Chip
                  label={`Search: ${patientSearch}`}
                  onDelete={() => setPatientSearch('')}
                  size="small"
                />
              )}
              {testFilter !== 'All' && (
                <Chip
                  label={`Test: ${testFilter}`}
                  onDelete={() => setTestFilter('All')}
                  size="small"
                />
              )}
              {doctorFilter !== 'All' && (
                <Chip
                  label={`Doctor: ${doctorFilter}`}
                  onDelete={() => setDoctorFilter('All')}
                  size="small"
                />
              )}
              {statusFilter !== 'All' && (
                <Chip
                  label={`Status: ${statusFilter}`}
                  onDelete={() => setStatusFilter('All')}
                  size="small"
                />
              )}
              {deliveryStatusFilter !== 'All' && (
                <Chip
                  label={`Delivery: ${deliveryStatusFilter}`}
                  onDelete={() => setDeliveryStatusFilter('All')}
                  size="small"
                />
              )}
              {criticalOnlyFilter && (
                <Chip
                  label="Critical Only"
                  onDelete={() => setCriticalOnlyFilter(false)}
                  size="small"
                  color="error"
                />
              )}
            </Box>
          )}

          {/* Results Summary */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Showing {filteredReports.length} of {allReports.length} reports
          </Typography>
        </Paper>

        {/* Quick Actions Toolbar */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedReports.ids.size > 0 && (
                <>
                  <Chip
                    label={`${selectedReports.ids.size} selected`}
                    onDelete={() => setSelectedReports({ type: 'include', ids: new Set() })}
                    color="primary"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleBulkDownload}
                  >
                    Download Selected
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PrintIcon />}
                    onClick={handleBulkPrint}
                  >
                    Print Selected
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SendIcon />}
                    onClick={handleBulkResend}
                  >
                    Re-send Selected
                  </Button>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="caption">Auto-Refresh</Typography>}
              />
              {autoRefresh && (
                <Typography variant="caption" color="text.secondary">
                  Last updated: {format(lastUpdated, 'hh:mm a')}
                </Typography>
              )}
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
              >
                Export Excel
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<InsertDriveFileIcon />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<BarChartIcon />}
                onClick={() => setAnalyticsDialog(true)}
              >
                Analytics
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Main Reports Table */}
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredReports}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'publishedAt', sort: 'desc' }] }
            }}
            onRowSelectionModelChange={(newSelection) => setSelectedReports(newSelection)}
            rowSelectionModel={selectedReports}
            getRowClassName={getRowClassName}
            sx={{
              '& .critical-row': {
                bgcolor: '#ffebee'
              },
              '& .delivery-failed-row': {
                bgcolor: '#fff3e0'
              },
              '& .not-downloaded-row': {
                bgcolor: '#fff9c4'
              },
              '& .revised-row': {
                bgcolor: '#f3e5f5'
              }
            }}
          />
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenu.anchorEl}
          open={Boolean(actionMenu.anchorEl)}
          onClose={() => setActionMenu({ anchorEl: null, report: null })}
        >
          <MenuItem onClick={() => { handleResendNotifications(actionMenu.report!); setActionMenu({ anchorEl: null, report: null }); }}>
            <SendIcon fontSize="small" sx={{ mr: 1 }} /> Re-send Notifications
          </MenuItem>
          <MenuItem onClick={() => { handleViewAuditLog(actionMenu.report!); setActionMenu({ anchorEl: null, report: null }); }}>
            <AssignmentIcon fontSize="small" sx={{ mr: 1 }} /> View Audit Log
          </MenuItem>
          <MenuItem onClick={() => { console.log('Copy link'); setActionMenu({ anchorEl: null, report: null }); }}>
            <ShareIcon fontSize="small" sx={{ mr: 1 }} /> Copy Report Link
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { console.log('Revise report'); setActionMenu({ anchorEl: null, report: null }); }}>
            <UpdateIcon fontSize="small" sx={{ mr: 1 }} /> Revise Report
          </MenuItem>
          <MenuItem onClick={() => { console.log('Add addendum'); setActionMenu({ anchorEl: null, report: null }); }}>
            <NoteAddIcon fontSize="small" sx={{ mr: 1 }} /> Add Addendum
          </MenuItem>
          <MenuItem onClick={() => { console.log('Mark reviewed'); setActionMenu({ anchorEl: null, report: null }); }}>
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} /> Mark as Reviewed
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { console.log('Cancel report'); setActionMenu({ anchorEl: null, report: null }); }} sx={{ color: 'error.main' }}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancel Report
          </MenuItem>
        </Menu>

        {/* View Report Dialog */}
        <Dialog
          open={viewReportDialog}
          onClose={() => setViewReportDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">View Report: {selectedReport?.reportId}</Typography>
              <IconButton onClick={() => setViewReportDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box sx={{ display: 'flex', gap: 2, minHeight: 500 }}>
                {/* Left: PDF Viewer */}
                <Paper sx={{ flex: 1, p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom>PDF Preview</Typography>
                  <Box sx={{ bgcolor: 'white', p: 2, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">PDF Viewer Placeholder</Typography>
                  </Box>
                </Paper>

                {/* Right: Details */}
                <Box sx={{ width: 300 }}>
                  <Tabs value={viewTab} onChange={(e, v) => setViewTab(v)}>
                    <Tab label="Details" />
                    <Tab label="Delivery" />
                    <Tab label="Access" />
                    <Tab label="Audit" />
                  </Tabs>

                  {viewTab === 0 && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Patient</Typography>
                      <Typography variant="body2" paragraph>{selectedReport.patientName}, {selectedReport.age}/{selectedReport.gender}</Typography>

                      <Typography variant="subtitle2" gutterBottom>Test</Typography>
                      <Typography variant="body2" paragraph>{selectedReport.testName}</Typography>

                      <Typography variant="subtitle2" gutterBottom>Pathologist</Typography>
                      <Typography variant="body2" paragraph>{selectedReport.pathologist}</Typography>

                      <Typography variant="subtitle2" gutterBottom>Published</Typography>
                      <Typography variant="body2" paragraph>{format(new Date(selectedReport.publishedAt), 'dd-MMM-yyyy, hh:mm a')}</Typography>

                      {selectedReport.hasCriticalValues && (
                        <>
                          <Alert severity="error" sx={{ mt: 2 }}>
                            <Typography variant="subtitle2">Critical Values</Typography>
                            {selectedReport.criticalValues?.map((cv, i) => (
                              <Typography key={i} variant="body2">
                                {cv.parameter}: {cv.value} {cv.unit}
                              </Typography>
                            ))}
                          </Alert>
                        </>
                      )}
                    </Box>
                  )}

                  {viewTab === 1 && (
                    <Box sx={{ p: 2 }}>
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>SMS Delivery</Typography>
                        <Chip
                          label={selectedReport.deliveryStatus.sms}
                          color={selectedReport.deliveryStatus.sms === 'Delivered' ? 'success' : selectedReport.deliveryStatus.sms === 'Failed' ? 'error' : 'default'}
                          size="small"
                        />
                        {selectedReport.deliveryStatus.smsSentAt && (
                          <Typography variant="caption" display="block">
                            Sent: {format(new Date(selectedReport.deliveryStatus.smsSentAt), 'hh:mm a')}
                          </Typography>
                        )}
                      </Paper>

                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Email Delivery</Typography>
                        <Chip
                          label={selectedReport.deliveryStatus.email}
                          color={selectedReport.deliveryStatus.email === 'Opened' ? 'primary' : selectedReport.deliveryStatus.email === 'Delivered' ? 'success' : selectedReport.deliveryStatus.email === 'Failed' ? 'error' : 'default'}
                          size="small"
                        />
                        {selectedReport.deliveryStatus.emailOpenCount && selectedReport.deliveryStatus.emailOpenCount > 0 && (
                          <Typography variant="caption" display="block">
                            Opened {selectedReport.deliveryStatus.emailOpenCount} times
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  )}

                  {viewTab === 2 && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Access History</Typography>
                      {selectedReport.accessHistory.length > 0 ? (
                        selectedReport.accessHistory.map((access, i) => (
                          <Paper key={i} sx={{ p: 1, mb: 1 }}>
                            <Typography variant="caption" display="block">
                              {format(new Date(access.accessedAt), 'dd-MMM hh:mm a')}
                            </Typography>
                            <Typography variant="body2">
                              {access.accessedBy} - {access.action}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {access.device}
                            </Typography>
                          </Paper>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">No access history</Typography>
                      )}
                    </Box>
                  )}

                  {viewTab === 3 && (
                    <Box sx={{ p: 2 }}>
                      <Timeline position="right">
                        {selectedReport.auditLog.map((log, i) => (
                          <TimelineItem key={i}>
                            <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2 }}>
                              {format(new Date(log.timestamp), 'HH:mm')}
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                              <TimelineDot color="primary" />
                              {i < selectedReport.auditLog.length - 1 && <TimelineConnector />}
                            </TimelineSeparator>
                            <TimelineContent>
                              <Typography variant="body2" fontWeight="bold">{log.action}</Typography>
                              <Typography variant="caption" color="text.secondary">{log.user}</Typography>
                            </TimelineContent>
                          </TimelineItem>
                        ))}
                      </Timeline>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewReportDialog(false)}>Close</Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => selectedReport && handleDownloadReport(selectedReport)}>
              Download
            </Button>
          </DialogActions>
        </Dialog>

        {/* Re-send Notifications Dialog */}
        <Dialog open={resendDialog} onClose={() => setResendDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Re-send Report Notifications</DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Report: {selectedReport.reportId}<br />
                    Patient: {selectedReport.patientName}<br />
                    Test: {selectedReport.testName}
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" gutterBottom>Select Channels:</Typography>
                <FormControlLabel
                  control={<Checkbox defaultChecked />}
                  label={`SMS to ${selectedReport.mobile}`}
                />
                <FormControlLabel
                  control={<Checkbox defaultChecked />}
                  label={`Email to ${selectedReport.email || 'N/A'}`}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label={`WhatsApp to ${selectedReport.mobile}`}
                />
                {selectedReport.referredByDoctor && (
                  <FormControlLabel
                    control={<Checkbox />}
                    label={`Notify Doctor: ${selectedReport.referredByDoctor}`}
                  />
                )}

                <TextField
                  fullWidth
                  select
                  label="Reason for Re-send"
                  defaultValue="Patient didn't receive"
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="Patient didn't receive">Patient didn't receive</MenuItem>
                  <MenuItem value="Patient requested">Patient requested</MenuItem>
                  <MenuItem value="Delivery failed">Delivery failed previously</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResendDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                showSnackbar('Notifications sent successfully', 'success');
                setResendDialog(false);
              }}
            >
              Send Now
            </Button>
          </DialogActions>
        </Dialog>

        {/* Audit Log Dialog */}
        <Dialog open={auditLogDialog} onClose={() => setAuditLogDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Audit Log: {selectedReport?.reportId}</Typography>
              <IconButton onClick={() => setAuditLogDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Timeline position="alternate">
                {selectedReport.auditLog.map((log, i) => (
                  <TimelineItem key={i}>
                    <TimelineOppositeContent color="text.secondary">
                      {format(new Date(log.timestamp), 'dd-MMM-yyyy HH:mm')}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color="primary">
                        {log.action.includes('Failed') ? <ErrorIcon /> : <CheckCircleIcon />}
                      </TimelineDot>
                      {i < selectedReport.auditLog.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="subtitle2">{log.action}</Typography>
                        <Typography variant="body2" color="text.secondary">{log.user} - {log.userRole}</Typography>
                        <Typography variant="caption">{log.details}</Typography>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAuditLogDialog(false)}>Close</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>Export Log</Button>
          </DialogActions>
        </Dialog>

        {/* Analytics Dialog */}
        <Dialog open={analyticsDialog} onClose={() => setAnalyticsDialog(false)} maxWidth="xl" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Report Analytics & Insights</Typography>
              <IconButton onClick={() => setAnalyticsDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Reports by Test Type</Typography>
                  <Typography variant="body2" color="text.secondary">Chart visualization would go here</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Delivery Performance</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">SMS Delivery Rate: 98%</Typography>
                    <Typography variant="body2">Email Delivery Rate: 95%</Typography>
                    <Typography variant="body2">WhatsApp Delivery Rate: 85%</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Download Statistics</Typography>
                  <Typography variant="body2">Downloaded: 85% (391/460)</Typography>
                  <Typography variant="body2">Not Downloaded: 15% (69/460)</Typography>
                  <Typography variant="body2">Avg downloads per report: 2.3</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Critical Reports</Typography>
                  <Typography variant="body2">Total: {statsData.criticalReports} reports</Typography>
                  <Typography variant="body2">Percentage: {((statsData.criticalReports / statsData.totalReports) * 100).toFixed(1)}%</Typography>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAnalyticsDialog(false)}>Close</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>Export Analytics</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
