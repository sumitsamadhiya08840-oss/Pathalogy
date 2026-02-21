'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Drawer,
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AttachMoney as CashIcon,
  QrCode as UPIIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
  HealthAndSafety as InsuranceIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import type { 
  Invoice, 
  Payment, 
  InvoiceLineItem, 
  PaymentMode, 
  InvoiceStatus,
  LineItemType 
} from '@/types/billing';
import { INVOICE_STATUS_COLORS } from '@/types/billing';
import {
  getInvoices,
  upsertInvoice,
  addPayment,
  addLineItem,
  removeLineItem,
  applyDiscount,
  cancelInvoice,
  updateInvoiceStatus,
  recalculateInvoice,
} from '@/services/billingStore';
import { useAuth } from '@/contexts/AuthContext';

type TabValue = 'all' | 'unpaid' | 'partiallyPaid' | 'paid' | 'cancelled';

const paymentModeIcons: Record<PaymentMode, React.ReactNode> = {
  Cash: <CashIcon />,
  UPI: <UPIIcon />,
  Card: <CardIcon />,
  Wallet: <WalletIcon />,
  Insurance: <InsuranceIcon />,
};

export default function BillingPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialogs & Drawers
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [addChargeDialogOpen, setAddChargeDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });
  
  // Form states
  const [paymentForm, setPaymentForm] = useState<{
    mode: PaymentMode;
    amount: string;
    reference: string;
    notes: string;
  }>({ mode: 'Cash', amount: '', reference: '', notes: '' });
  
  const [cancelForm, setCancelForm] = useState({ reason: '' });
  
  const [chargeForm, setChargeForm] = useState({
    name: '',
    amount: '',
  });
  
  const [discountForm, setDiscountForm] = useState({
    type: 'percent' as 'percent' | 'flat',
    percent: '',
    flat: '',
    name: '',
  });

  // Load invoices
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    setLoading(true);
    try {
      const data = getInvoices();
      setInvoices(data);
    } catch (error) {
      showSnackbar('Failed to load invoices', 'error');
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

  // Filter invoices based on tab
  const filteredByTab = useMemo(() => {
    switch (activeTab) {
      case 'unpaid':
        return invoices.filter(inv => inv.status === 'Unpaid');
      case 'partiallyPaid':
        return invoices.filter(inv => inv.status === 'PartiallyPaid');
      case 'paid':
        return invoices.filter(inv => inv.status === 'Paid');
      case 'cancelled':
        return invoices.filter(inv => inv.status === 'Cancelled');
      default:
        return invoices;
    }
  }, [invoices, activeTab]);

  // Search invoices
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;
    
    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(
      inv =>
        inv.invoiceId.toLowerCase().includes(query) ||
        inv.tokenNumber?.toLowerCase().includes(query) ||
        inv.patientName.toLowerCase().includes(query) ||
        inv.patientMobile.includes(query)
    );
  }, [filteredByTab, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      all: invoices.length,
      unpaid: invoices.filter(inv => inv.status === 'Unpaid').length,
      partiallyPaid: invoices.filter(inv => inv.status === 'PartiallyPaid').length,
      paid: invoices.filter(inv => inv.status === 'Paid').length,
      cancelled: invoices.filter(inv => inv.status === 'Cancelled').length,
      totalRevenue: invoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + inv.grandTotal, 0),
      totalDue: invoices
        .filter(inv => inv.status !== 'Cancelled' && inv.status !== 'Paid')
        .reduce((sum, inv) => sum + inv.dueTotal, 0),
    };
  }, [invoices]);

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'invoiceId',
      headerName: 'Invoice ID',
      width: 150,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer' }}
          onClick={() => handleViewInvoice(params.row)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'tokenNumber',
      headerName: 'Token',
      width: 130,
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.row.patientName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.patientMobile}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'grandTotal',
      headerName: 'Total',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          ₹{params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'paidTotal',
      headerName: 'Paid',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" color="success.main">
          ₹{params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'dueTotal',
      headerName: 'Due',
      width: 100,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color={params.value > 0 ? 'error.main' : 'text.secondary'}
          fontWeight={params.value > 0 ? 600 : 400}
        >
          ₹{params.value.toLocaleString()}
        </Typography>
      ),
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
            backgroundColor: INVOICE_STATUS_COLORS[params.value as InvoiceStatus],
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 120,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Typography variant="caption">
            {date.toLocaleDateString()}
            <br />
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => {
        const invoice = params.row as Invoice;
        return [
          <GridActionsCellItem
            icon={<VisibilityIcon />}
            label="View"
            onClick={() => handleViewInvoice(invoice)}
          />,
          <GridActionsCellItem
            icon={<PaymentIcon />}
            label="Add Payment"
            onClick={() => handleOpenPaymentDialog(invoice)}
            disabled={invoice.status === 'Paid' || invoice.status === 'Cancelled'}
          />,
          <GridActionsCellItem
            icon={<PrintIcon />}
            label="Print"
            onClick={() => handlePrintReceipt(invoice)}
          />,
        ];
      },
    },
  ];

  // Handlers
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDrawerOpen(true);
  };

  const handleOpenPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      mode: 'Cash',
      amount: invoice.dueTotal.toString(),
      reference: '',
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(paymentForm.amount);
    
    if (isNaN(amount) || amount <= 0) {
      showSnackbar('Please enter a valid payment amount', 'error');
      return;
    }
    
    if (amount > selectedInvoice.dueTotal) {
      showSnackbar(`Payment amount cannot exceed due amount (₹${selectedInvoice.dueTotal})`, 'error');
      return;
    }
    
    try {
      const updated = addPayment(
        selectedInvoice.invoiceId,
        {
          mode: paymentForm.mode,
          amount,
          reference: paymentForm.reference || undefined,
          notes: paymentForm.notes || undefined,
        },
        user?.name || 'Staff'
      );
      
      if (updated) {
        loadInvoices();
        setPaymentDialogOpen(false);
        setDrawerOpen(false);
        showSnackbar(`Payment of ₹${amount} added successfully`, 'success');
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to add payment', 'error');
    }
  };

  const handlePrintReceipt = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPrintDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelInvoice = async () => {
    if (!selectedInvoice) return;
    
    if (!cancelForm.reason.trim()) {
      showSnackbar('Please provide a reason for cancellation', 'error');
      return;
    }
    
    try {
      const updated = cancelInvoice(
        selectedInvoice.invoiceId,
        cancelForm.reason,
        user?.name || 'Staff'
      );
      
      if (updated) {
        loadInvoices();
        setCancelDialogOpen(false);
        setDrawerOpen(false);
        showSnackbar('Invoice cancelled successfully', 'success');
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to cancel invoice', 'error');
    }
  };

  const handleAddCharge = async () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(chargeForm.amount);
    
    if (!chargeForm.name.trim()) {
      showSnackbar('Please enter charge name', 'error');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      showSnackbar('Please enter a valid amount', 'error');
      return;
    }
    
    try {
      const lineItem: InvoiceLineItem = {
        type: 'Charge',
        name: chargeForm.name,
        qty: 1,
        unitPrice: amount,
        amount,
      };
      
      const updated = addLineItem(selectedInvoice.invoiceId, lineItem, user?.name || 'Staff');
      
      if (updated) {
        setSelectedInvoice(updated);
        loadInvoices();
        setAddChargeDialogOpen(false);
        setChargeForm({ name: '', amount: '' });
        showSnackbar('Charge added successfully', 'success');
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to add charge', 'error');
    }
  };

  const handleApplyDiscount = async () => {
    if (!selectedInvoice) return;
    
    const percent = discountForm.type === 'percent' ? parseFloat(discountForm.percent) : 0;
    const flat = discountForm.type === 'flat' ? parseFloat(discountForm.flat) : 0;
    
    if ((discountForm.type === 'percent' && (isNaN(percent) || percent <= 0 || percent > 100)) ||
        (discountForm.type === 'flat' && (isNaN(flat) || flat <= 0))) {
      showSnackbar('Please enter a valid discount amount', 'error');
      return;
    }
    
    try {
      const updated = applyDiscount(
        selectedInvoice.invoiceId,
        percent,
        flat,
        discountForm.name || 'Discount',
        user?.name || 'Staff'
      );
      
      if (updated) {
        setSelectedInvoice(updated);
        loadInvoices();
        setDiscountDialogOpen(false);
        setDiscountForm({ type: 'percent', percent: '', flat: '', name: '' });
        showSnackbar('Discount applied successfully', 'success');
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to apply discount', 'error');
    }
  };

  const handleRemoveLineItem = async (index: number) => {
    if (!selectedInvoice) return;
    
    try {
      const updated = removeLineItem(selectedInvoice.invoiceId, index, user?.name || 'Staff');
      
      if (updated) {
        setSelectedInvoice(updated);
        loadInvoices();
        showSnackbar('Line item removed', 'success');
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to remove line item', 'error');
    }
  };

  const handleMarkAsUnpaid = async () => {
    if (!selectedInvoice) return;
    
    try {
      const updated = updateInvoiceStatus(
        selectedInvoice.invoiceId,
        'Unpaid',
        user?.name || 'Staff',
        'Marked as Unpaid'
      );
      
      if (updated) {
        setSelectedInvoice(updated);
        loadInvoices();
        showSnackbar('Invoice marked as Unpaid', 'success');
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update status', 'error');
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Billing & Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage invoices, payments, and billing records
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card sx={{ p: 2, backgroundColor: '#E3F2FD' }}>
            <Typography variant="h4" fontWeight={700} color="primary">
              {stats.all}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Invoices
            </Typography>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card sx={{ p: 2, backgroundColor: '#FFEBEE' }}>
            <Typography variant="h4" fontWeight={700} color="error">
              {stats.unpaid + stats.partiallyPaid}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Payments
            </Typography>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card sx={{ p: 2, backgroundColor: '#E8F5E9' }}>
            <Typography variant="h4" fontWeight={700} color="success.main">
              ₹{stats.totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Revenue
            </Typography>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card sx={{ p: 2, backgroundColor: '#FFF3E0' }}>
            <Typography variant="h4" fontWeight={700} color="warning.main">
              ₹{stats.totalDue.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Due
            </Typography>
          </Card>
        </Box>
      </Box>

      {/* Tabs and Search */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab label={`All (${stats.all})`} value="all" />
            <Tab label={`Unpaid (${stats.unpaid})`} value="unpaid" />
            <Tab label={`Partially Paid (${stats.partiallyPaid})`} value="partiallyPaid" />
            <Tab label={`Paid (${stats.paid})`} value="paid" />
            <Tab label={`Cancelled (${stats.cancelled})`} value="cancelled" />
          </Tabs>
        </Box>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Invoice ID, Token, Patient Name, Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Card>

      {/* DataGrid */}
      <Card>
        <DataGrid
          rows={filteredInvoices}
          columns={columns}
          getRowId={(row) => row.invoiceId}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'updatedAt', sort: 'desc' }] },
          }}
          sx={{
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
          }}
        />
      </Card>

      {/* Invoice Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600 } } }}
      >
        {selectedInvoice && (
          <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={700}>
                Invoice Details
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Invoice Info */}
            <Card sx={{ p: 2, mb: 2, backgroundColor: '#F5F5F5' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice ID
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedInvoice.invoiceId}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Token Number
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedInvoice.tokenNumber || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Divider sx={{ my: 1 }} />
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Patient Name
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedInvoice.patientName}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Mobile
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedInvoice.patientMobile}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip
                      label={selectedInvoice.status}
                      size="small"
                      sx={{
                        backgroundColor: INVOICE_STATUS_COLORS[selectedInvoice.status],
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Line Items */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Line Items
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedInvoice.lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2">{item.name}</Typography>
                        <Chip label={item.type} size="small" sx={{ mt: 0.5 }} />
                      </TableCell>
                      <TableCell align="center">{item.qty}</TableCell>
                      <TableCell align="right">₹{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={item.amount < 0 ? 'success.main' : 'inherit'}
                        >
                          ₹{item.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {(item.type === 'Charge' || item.type === 'Discount') && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveLineItem(index)}
                            disabled={selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Cancelled'}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Action Buttons for Line Items */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddChargeDialogOpen(true)}
                disabled={selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Cancelled'}
              >
                Add Charge
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setDiscountDialogOpen(true)}
                disabled={selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Cancelled'}
              >
                Apply Discount
              </Button>
            </Box>

            {/* Totals */}
            <Card sx={{ p: 2, mb: 2, backgroundColor: '#F5F5F5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  ₹{selectedInvoice.subtotal.toLocaleString()}
                </Typography>
              </Box>
              {selectedInvoice.discountTotal > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Discount:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    -₹{selectedInvoice.discountTotal.toLocaleString()}
                  </Typography>
                </Box>
              )}
              {selectedInvoice.taxTotal > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{selectedInvoice.taxTotal.toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Grand Total:
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  ₹{selectedInvoice.grandTotal.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="success.main">
                  Paid:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  ₹{selectedInvoice.paidTotal.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">
                  Due:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  ₹{selectedInvoice.dueTotal.toLocaleString()}
                </Typography>
              </Box>
            </Card>

            {/* Payments */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Payment History
            </Typography>
            {selectedInvoice.payments.length > 0 ? (
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mode</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.payments.map((payment) => (
                      <TableRow key={payment.paymentId}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {paymentModeIcons[payment.mode]}
                            <Typography variant="body2">{payment.mode}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            ₹{payment.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(payment.paidAt).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{payment.reference || '-'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                No payments recorded yet
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={() => {
                  setPaymentDialogOpen(true);
                  setPaymentForm({
                    mode: 'Cash',
                    amount: selectedInvoice.dueTotal.toString(),
                    reference: '',
                    notes: '',
                  });
                }}
                disabled={selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Cancelled'}
              >
                Add Payment
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintReceipt(selectedInvoice)}
              >
                Print Receipt
              </Button>
              {selectedInvoice.status === 'Draft' && (
                <Button variant="outlined" onClick={handleMarkAsUnpaid}>
                  Mark as Unpaid
                </Button>
              )}
              {selectedInvoice.status !== 'Cancelled' && selectedInvoice.status !== 'Paid' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel Invoice
                </Button>
              )}
            </Box>

            {/* Audit Trail */}
            <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
              Audit Trail
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {selectedInvoice.audit.map((entry, index) => (
                <Card key={index} sx={{ p: 2, mb: 1, backgroundColor: '#FAFAFA' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {entry.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(entry.at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    By: {entry.by}
                  </Typography>
                  {entry.notes && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {entry.notes}
                    </Typography>
                  )}
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedInvoice && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Due Amount: ₹{selectedInvoice.dueTotal.toLocaleString()}
              </Alert>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={paymentForm.mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value as PaymentMode })}
                label="Payment Mode"
              >
                <MenuItem value="Cash">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CashIcon /> Cash
                  </Box>
                </MenuItem>
                <MenuItem value="UPI">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UPIIcon /> UPI
                  </Box>
                </MenuItem>
                <MenuItem value="Card">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CardIcon /> Card
                  </Box>
                </MenuItem>
                <MenuItem value="Wallet">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WalletIcon /> Wallet
                  </Box>
                </MenuItem>
                <MenuItem value="Insurance">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InsuranceIcon /> Insurance
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Reference / Transaction ID (Optional)"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPayment}>
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Invoice</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            Are you sure you want to cancel this invoice? This action cannot be undone.
          </Alert>
          <TextField
            fullWidth
            label="Cancellation Reason"
            multiline
            rows={3}
            value={cancelForm.reason}
            onChange={(e) => setCancelForm({ reason: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCancelInvoice}>
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Charge Dialog */}
      <Dialog open={addChargeDialogOpen} onClose={() => setAddChargeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Additional Charge</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Charge Name"
              value={chargeForm.name}
              onChange={(e) => setChargeForm({ ...chargeForm, name: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., Emergency Charge, Delivery Fee"
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={chargeForm.amount}
              onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddChargeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCharge}>
            Add Charge
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Discount Dialog */}
      <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Discount</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={discountForm.type}
                onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as 'percent' | 'flat' })}
                label="Discount Type"
              >
                <MenuItem value="percent">Percentage (%)</MenuItem>
                <MenuItem value="flat">Flat Amount (₹)</MenuItem>
              </Select>
            </FormControl>
            
            {discountForm.type === 'percent' ? (
              <TextField
                fullWidth
                label="Discount Percentage"
                type="number"
                value={discountForm.percent}
                onChange={(e) => setDiscountForm({ ...discountForm, percent: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ min: 0, max: 100 }}
              />
            ) : (
              <TextField
                fullWidth
                label="Discount Amount"
                type="number"
                value={discountForm.flat}
                onChange={(e) => setDiscountForm({ ...discountForm, flat: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            )}
            
            <TextField
              fullWidth
              label="Discount Name (Optional)"
              value={discountForm.name}
              onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
              placeholder="e.g., Senior Citizen, Staff Discount"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyDiscount}>
            Apply Discount
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Receipt Dialog */}
      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Receipt</span>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box id="print-receipt" sx={{ p: 3 }}>
              {/* Lab Header */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="primary">
                  NXA Pathology Lab
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Advanced Diagnostic Services
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Contact: 123-456-7890 | Email: info@nxalab.com
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Invoice Info */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice ID:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedInvoice.invoiceId}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Date:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Token Number:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedInvoice.tokenNumber || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={selectedInvoice.status}
                    size="small"
                    sx={{
                      backgroundColor: INVOICE_STATUS_COLORS[selectedInvoice.status],
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>

              {/* Patient Info */}
              <Card sx={{ p: 2, mb: 3, backgroundColor: '#F5F5F5' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Patient Information
                </Typography>
                <Typography variant="body2">Name: {selectedInvoice.patientName}</Typography>
                <Typography variant="body2">Mobile: {selectedInvoice.patientMobile}</Typography>
                {selectedInvoice.patientAge && (
                  <Typography variant="body2">Age: {selectedInvoice.patientAge}</Typography>
                )}
                {selectedInvoice.patientGender && (
                  <Typography variant="body2">Gender: {selectedInvoice.patientGender}</Typography>
                )}
              </Card>

              {/* Line Items */}
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="center">{item.qty}</TableCell>
                        <TableCell align="right">₹{item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Box sx={{ minWidth: 300 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">₹{selectedInvoice.subtotal.toLocaleString()}</Typography>
                  </Box>
                  {selectedInvoice.discountTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="success.main">
                        Discount:
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        -₹{selectedInvoice.discountTotal.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {selectedInvoice.taxTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tax:</Typography>
                      <Typography variant="body2">₹{selectedInvoice.taxTotal.toLocaleString()}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Grand Total:
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      ₹{selectedInvoice.grandTotal.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="success.main">
                      Paid:
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      ₹{selectedInvoice.paidTotal.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="error.main" fontWeight={600}>
                      Due:
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight={600}>
                      ₹{selectedInvoice.dueTotal.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Payment History */}
              {selectedInvoice.payments.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Payment History
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Mode</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Reference</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.payments.map((payment) => (
                          <TableRow key={payment.paymentId}>
                            <TableCell>
                              {new Date(payment.paidAt).toLocaleString()}
                            </TableCell>
                            <TableCell>{payment.mode}</TableCell>
                            <TableCell align="right">
                              ₹{payment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{payment.reference || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Footer */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Thank you for choosing NXA Pathology Lab
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  For queries, contact us at info@nxalab.com or 123-456-7890
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialogOpen(false)}>Close</Button>
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
