'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Divider,
  Avatar,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Notifications as NotificationsIcon,
  Print as PrintIcon,
  People as PeopleIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type {
  AppSettings,
  LabProfile,
  ReportSettings,
  NotificationTemplate,
  PrintSettings,
  StaffUser,
  UserRole,
  NotificationType,
  TokenSlipSize,
  ReportFormat,
} from '@/types/settings';
import {
  TEMPLATE_VARIABLES,
  NOTIFICATION_TYPE_LABELS,
  ROLE_COLORS,
} from '@/types/settings';
import {
  getSettings,
  updateLabProfile,
  updateReportSettings,
  getTemplates,
  upsertTemplate,
  toggleTemplate,
  deleteTemplate,
  updatePrintSettings,
  getUsers,
  upsertUser,
  deactivateUser,
  activateUser,
  deleteUser,
  renderTemplate,
} from '@/services/settingsStore';

type TabValue = 'lab' | 'report' | 'notifications' | 'print' | 'users';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('lab');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Lab Profile state
  const [labForm, setLabForm] = useState<LabProfile | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report Settings state
  const [reportForm, setReportForm] = useState<ReportSettings | null>(null);

  // Notifications state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<NotificationTemplate>>({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewText, setPreviewText] = useState('');

  // Print Settings state
  const [printForm, setPrintForm] = useState<PrintSettings | null>(null);

  // Users state
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [userForm, setUserForm] = useState<Partial<StaffUser>>({});

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    try {
      const data = getSettings();
      setSettings(data);
      setLabForm(data.labProfile);
      setLogoPreview(data.labProfile.logoDataUrl || null);
      setReportForm(data.report);
      setTemplates(getTemplates());
      setPrintForm(data.print);
      setUsers(getUsers());
    } catch (error) {
      showSnackbar('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // ===== LAB PROFILE =====
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreview(dataUrl);
      if (labForm) {
        setLabForm({ ...labForm, logoDataUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLabProfile = () => {
    if (!labForm) return;

    try {
      updateLabProfile(labForm);
      showSnackbar('Lab profile updated successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update lab profile', 'error');
    }
  };

  // ===== REPORT SETTINGS =====
  const handleSaveReportSettings = () => {
    if (!reportForm) return;

    try {
      updateReportSettings(reportForm);
      showSnackbar('Report settings updated successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update report settings', 'error');
    }
  };

  // ===== NOTIFICATIONS =====
  const handleOpenTemplateDialog = (template?: NotificationTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm(template);
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        templateId: `tpl-${Date.now()}`,
        type: 'BookingConfirmation',
        channel: 'SMS',
        enabled: true,
        templateText: '',
        variables: TEMPLATE_VARIABLES.BookingConfirmation,
      });
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.templateId || !templateForm.templateText) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    try {
      upsertTemplate(templateForm as NotificationTemplate);
      setTemplates(getTemplates());
      setTemplateDialogOpen(false);
      showSnackbar('Template saved successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save template', 'error');
    }
  };

  const handleToggleTemplate = (templateId: string, enabled: boolean) => {
    try {
      toggleTemplate(templateId, enabled);
      setTemplates(getTemplates());
      showSnackbar(`Template ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to toggle template', 'error');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      deleteTemplate(templateId);
      setTemplates(getTemplates());
      showSnackbar('Template deleted successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to delete template', 'error');
    }
  };

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById('template-text') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = templateForm.templateText || '';
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + `{{${variable}}}` + after;

    setTemplateForm({ ...templateForm, templateText: newText });

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4;
      textarea.focus();
    }, 0);
  };

  const handlePreviewTemplate = () => {
    if (!templateForm.templateText) return;

    // Mock variable values for preview
    const mockValues: Record<string, string> = {
      patientName: 'John Doe',
      token: 'TOK-001',
      bookingDate: new Date().toLocaleDateString(),
      testNames: 'CBC, Lipid Profile',
      sampleId: 'SMP-001',
      expectedReportDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      reportLink: 'https://example.com/report/123',
      testName: 'Blood Sugar',
      criticalValue: '250 mg/dL (Critical High)',
      labName: settings?.labProfile.labName || 'NXA Pathology',
      labPhone: settings?.labProfile.phone || '+91-9876543210',
    };

    const rendered = renderTemplate(templateForm.templateText, mockValues);
    setPreviewText(rendered);
    setPreviewDialogOpen(true);
  };

  // ===== USERS =====
  const handleOpenUserDialog = (user?: StaffUser) => {
    if (user) {
      setEditingUser(user);
      setUserForm(user);
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        phone: '',
        role: 'Staff',
        active: true,
      });
    }
    setUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.role) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    try {
      upsertUser(userForm as StaffUser);
      setUsers(getUsers());
      setUserDialogOpen(false);
      showSnackbar('User saved successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save user', 'error');
    }
  };

  const handleToggleUserActive = (userId: string, active: boolean) => {
    try {
      if (active) {
        activateUser(userId);
      } else {
        deactivateUser(userId);
      }
      setUsers(getUsers());
      showSnackbar(`User ${active ? 'activated' : 'deactivated'}`, 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to toggle user status', 'error');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      deleteUser(userId);
      setUsers(getUsers());
      showSnackbar('User deleted successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to delete user', 'error');
    }
  };

  // ===== PRINT SETTINGS =====
  const handleSavePrintSettings = () => {
    if (!printForm) return;

    try {
      updatePrintSettings(printForm);
      showSnackbar('Print settings updated successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update print settings', 'error');
    }
  };

  // DataGrid columns for notifications
  const templateColumns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 200,
      renderCell: (params) => (
        <Chip label={NOTIFICATION_TYPE_LABELS[params.value as NotificationType]} size="small" />
      ),
    },
    {
      field: 'channel',
      headerName: 'Channel',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" />
      ),
    },
    {
      field: 'enabled',
      headerName: 'Enabled',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleToggleTemplate(params.row.templateId, e.target.checked)}
          size="small"
        />
      ),
    },
    {
      field: 'templateText',
      headerName: 'Template',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleOpenTemplateDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteTemplate(params.row.templateId)}
        />,
      ],
    },
  ];

  // DataGrid columns for users
  const userColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => params.value || 'N/A',
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: ROLE_COLORS[params.value as UserRole],
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'active',
      headerName: 'Active',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleToggleUserActive(params.row.userId, e.target.checked)}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueGetter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleOpenUserDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteUser(params.row.userId)}
        />,
      ],
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon fontSize="large" />
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure lab profile, reports, notifications, and users
          </Typography>
        </Box>

        {/* Tabs */}
        <Card>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab icon={<BusinessIcon />} iconPosition="start" label="Lab Profile" value="lab" />
            <Tab icon={<DescriptionIcon />} iconPosition="start" label="Reports" value="report" />
            <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" value="notifications" />
            <Tab icon={<PrintIcon />} iconPosition="start" label="Print" value="print" />
            <Tab icon={<PeopleIcon />} iconPosition="start" label="Users" value="users" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* ===== LAB PROFILE TAB ===== */}
            {activeTab === 'lab' && labForm && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Lab Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Update your lab information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Logo Upload */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Lab Logo
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={logoPreview || undefined}
                        sx={{ width: 100, height: 100 }}
                        variant="rounded"
                      >
                        {!logoPreview && <BusinessIcon sx={{ fontSize: 50 }} />}
                      </Avatar>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<PhotoCameraIcon />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Logo
                      </Button>
                      {logoPreview && (
                        <Button
                          variant="text"
                          color="error"
                          onClick={() => {
                            setLogoPreview(null);
                            setLabForm({ ...labForm, logoDataUrl: undefined });
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" mt={1}>
                      Upload PNG, JPG or GIF (max 2MB)
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Basic Info */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                      label="Lab Name"
                      value={labForm.labName}
                      onChange={(e) => setLabForm({ ...labForm, labName: e.target.value })}
                      required
                      sx={{ flex: '1 1 300px' }}
                    />
                    <TextField
                      label="Tagline"
                      value={labForm.tagline || ''}
                      onChange={(e) => setLabForm({ ...labForm, tagline: e.target.value })}
                      sx={{ flex: '1 1 300px' }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                      label="Phone"
                      value={labForm.phone || ''}
                      onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })}
                      sx={{ flex: '1 1 300px' }}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={labForm.email || ''}
                      onChange={(e) => setLabForm({ ...labForm, email: e.target.value })}
                      sx={{ flex: '1 1 300px' }}
                    />
                  </Box>

                  <Divider />

                  {/* Address */}
                  <Typography variant="subtitle2" gutterBottom>
                    Address
                  </Typography>

                  <TextField
                    label="Address Line 1"
                    value={labForm.address.line1}
                    onChange={(e) => setLabForm({
                      ...labForm,
                      address: { ...labForm.address, line1: e.target.value }
                    })}
                    fullWidth
                  />

                  <TextField
                    label="Address Line 2"
                    value={labForm.address.line2 || ''}
                    onChange={(e) => setLabForm({
                      ...labForm,
                      address: { ...labForm.address, line2: e.target.value }
                    })}
                    fullWidth
                  />

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                      label="City"
                      value={labForm.address.city}
                      onChange={(e) => setLabForm({
                        ...labForm,
                        address: { ...labForm.address, city: e.target.value }
                      })}
                      sx={{ flex: '1 1 200px' }}
                    />
                    <TextField
                      label="State"
                      value={labForm.address.state || ''}
                      onChange={(e) => setLabForm({
                        ...labForm,
                        address: { ...labForm.address, state: e.target.value }
                      })}
                      sx={{ flex: '1 1 200px' }}
                    />
                    <TextField
                      label="Pincode"
                      value={labForm.address.pincode}
                      onChange={(e) => setLabForm({
                        ...labForm,
                        address: { ...labForm.address, pincode: e.target.value }
                      })}
                      sx={{ flex: '1 1 150px' }}
                    />
                  </Box>

                  <Divider />

                  {/* NABL */}
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={labForm.nabl.enabled}
                          onChange={(e) => setLabForm({
                            ...labForm,
                            nabl: { ...labForm.nabl, enabled: e.target.checked }
                          })}
                        />
                      }
                      label="NABL Accredited"
                    />
                    {labForm.nabl.enabled && (
                      <TextField
                        label="NABL Registration Number"
                        value={labForm.nabl.registrationNo || ''}
                        onChange={(e) => setLabForm({
                          ...labForm,
                          nabl: { ...labForm.nabl, registrationNo: e.target.value }
                        })}
                        fullWidth
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Box>

                  {/* ABDM */}
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={labForm.abdm.enabled}
                          onChange={(e) => setLabForm({
                            ...labForm,
                            abdm: { ...labForm.abdm, enabled: e.target.checked }
                          })}
                        />
                      }
                      label="ABDM Integrated (Future)"
                    />
                    {labForm.abdm.enabled && (
                      <TextField
                        label="ABDM Facility ID"
                        value={labForm.abdm.facilityId || ''}
                        onChange={(e) => setLabForm({
                          ...labForm,
                          abdm: { ...labForm.abdm, facilityId: e.target.value }
                        })}
                        fullWidth
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button variant="outlined" onClick={loadSettings}>
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveLabProfile}
                    >
                      Save Profile
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* ===== REPORT SETTINGS TAB ===== */}
            {activeTab === 'report' && reportForm && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Report Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Configure report generation preferences
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Default Report Format</InputLabel>
                    <Select
                      value={reportForm.defaultReportFormat}
                      onChange={(e) => setReportForm({
                        ...reportForm,
                        defaultReportFormat: e.target.value as ReportFormat
                      })}
                      label="Default Report Format"
                    >
                      <MenuItem value="A4">A4</MenuItem>
                      <MenuItem value="Letter">Letter</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportForm.showReferenceRanges}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          showReferenceRanges: e.target.checked
                        })}
                      />
                    }
                    label="Show Reference Ranges"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportForm.showMethodology}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          showMethodology: e.target.checked
                        })}
                      />
                    }
                    label="Show Methodology"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportForm.showBarcodeOnReport}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          showBarcodeOnReport: e.target.checked
                        })}
                      />
                    }
                    label="Show Barcode on Report"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportForm.autoPublishAfterSignature}
                        onChange={(e) => setReportForm({
                          ...reportForm,
                          autoPublishAfterSignature: e.target.checked
                        })}
                      />
                    }
                    label="Auto-Publish After Signature"
                  />

                  <Divider />

                  <TextField
                    label="Footer Note"
                    multiline
                    rows={3}
                    value={reportForm.footerNote || ''}
                    onChange={(e) => setReportForm({
                      ...reportForm,
                      footerNote: e.target.value
                    })}
                    fullWidth
                    helperText="This note will appear at the bottom of all reports"
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button variant="outlined" onClick={loadSettings}>
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveReportSettings}
                    >
                      Save Settings
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* ===== NOTIFICATIONS TAB ===== */}
            {activeTab === 'notifications' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      SMS Templates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage notification templates
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenTemplateDialog()}
                  >
                    Add Template
                  </Button>
                </Box>

                <DataGrid
                  rows={templates}
                  columns={templateColumns}
                  getRowId={(row) => row.templateId}
                  autoHeight
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                />
              </Box>
            )}

            {/* ===== PRINT SETTINGS TAB ===== */}
            {activeTab === 'print' && printForm && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Print Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Configure printing preferences
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={printForm.tokenSlipEnabled}
                        onChange={(e) => setPrintForm({
                          ...printForm,
                          tokenSlipEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Enable Token Slip Printing"
                  />

                  {printForm.tokenSlipEnabled && (
                    <>
                      <FormControl fullWidth>
                        <InputLabel>Token Slip Size</InputLabel>
                        <Select
                          value={printForm.tokenSlipSize}
                          onChange={(e) => setPrintForm({
                            ...printForm,
                            tokenSlipSize: e.target.value as TokenSlipSize
                          })}
                          label="Token Slip Size"
                        >
                          <MenuItem value="58mm">58mm (Thermal)</MenuItem>
                          <MenuItem value="80mm">80mm (Thermal)</MenuItem>
                          <MenuItem value="A4">A4 (Full Size)</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="Default Printer Name"
                        value={printForm.defaultPrinterName || ''}
                        onChange={(e) => setPrintForm({
                          ...printForm,
                          defaultPrinterName: e.target.value
                        })}
                        fullWidth
                        helperText="Name of the printer (no OS integration)"
                      />

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Margin (mm): {printForm.marginMm}
                        </Typography>
                        <Slider
                          value={printForm.marginMm}
                          onChange={(_, value) => setPrintForm({
                            ...printForm,
                            marginMm: value as number
                          })}
                          min={0}
                          max={20}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </>
                  )}

                  <Divider />

                  {/* Preview Box */}
                  <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Token Slip Preview
                    </Typography>
                    <Box sx={{ 
                      backgroundColor: 'white', 
                      p: printForm.marginMm / 10 + 1,
                      border: '1px dashed #ccc',
                      borderRadius: 1,
                      maxWidth: printForm.tokenSlipSize === 'A4' ? '100%' : '300px',
                    }}>
                      <Typography variant="caption" fontWeight={700} align="center" display="block">
                        {settings?.labProfile.labName || 'NXA Pathology'}
                      </Typography>
                      <Typography variant="caption" align="center" display="block" color="text.secondary">
                        Token: TOK-001
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" display="block">Patient: John Doe</Typography>
                      <Typography variant="caption" display="block">Tests: CBC, Lipid Profile</Typography>
                      <Typography variant="caption" display="block">Date: {new Date().toLocaleDateString()}</Typography>
                    </Box>
                  </Paper>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button variant="outlined" onClick={loadSettings}>
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSavePrintSettings}
                    >
                      Save Settings
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* ===== USERS TAB ===== */}
            {activeTab === 'users' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Users & Roles
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage staff users (scaffolding only)
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenUserDialog()}
                  >
                    Add User
                  </Button>
                </Box>

                <DataGrid
                  rows={users}
                  columns={userColumns}
                  getRowId={(row) => row.userId}
                  autoHeight
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                />
              </Box>
            )}
          </Box>
        </Card>

        {/* ===== TEMPLATE EDIT DIALOG ===== */}
        <Dialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingTemplate ? 'Edit Template' : 'Add Template'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={templateForm.type || 'BookingConfirmation'}
                  onChange={(e) => {
                    const type = e.target.value as NotificationType;
                    setTemplateForm({
                      ...templateForm,
                      type,
                      variables: TEMPLATE_VARIABLES[type],
                    });
                  }}
                  label="Type"
                  disabled={!!editingTemplate}
                >
                  {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={templateForm.enabled !== false}
                    onChange={(e) => setTemplateForm({
                      ...templateForm,
                      enabled: e.target.checked
                    })}
                  />
                }
                label="Enabled"
              />

              <Divider />

              <Typography variant="subtitle2">
                Available Variables (click to insert)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {templateForm.variables?.map((variable) => (
                  <Chip
                    key={variable}
                    label={`{{${variable}}}`}
                    onClick={() => handleInsertVariable(variable)}
                    size="small"
                    clickable
                  />
                ))}
              </Box>

              <TextField
                id="template-text"
                label="Template Text"
                multiline
                rows={6}
                value={templateForm.templateText || ''}
                onChange={(e) => setTemplateForm({
                  ...templateForm,
                  templateText: e.target.value
                })}
                fullWidth
                required
                helperText="Use {{variableName}} placeholders for dynamic values"
              />

              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={handlePreviewTemplate}
                disabled={!templateForm.templateText}
              >
                Preview with Sample Data
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveTemplate}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* ===== TEMPLATE PREVIEW DIALOG ===== */}
        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Template Preview</DialogTitle>
          <DialogContent>
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', mt: 2 }}>
              <Typography variant="body2">
                {previewText}
              </Typography>
            </Paper>
            <Typography variant="caption" color="text.secondary" mt={2} display="block">
              This preview uses sample data. Actual SMS will use real values.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* ===== USER EDIT DIALOG ===== */}
        <Dialog
          open={userDialogOpen}
          onClose={() => setUserDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={userForm.name || ''}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Phone"
                value={userForm.phone || ''}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role || 'Staff'}
                  onChange={(e) => setUserForm({
                    ...userForm,
                    role: e.target.value as UserRole
                  })}
                  label="Role"
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Staff">Staff</MenuItem>
                  <MenuItem value="Pathologist">Pathologist</MenuItem>
                  <MenuItem value="Collector">Collector</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={userForm.active !== false}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      active: e.target.checked
                    })}
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveUser}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
