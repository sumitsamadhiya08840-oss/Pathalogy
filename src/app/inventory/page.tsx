'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory2 as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as StockInIcon,
  TrendingDown as StockOutIcon,
  Tune as AdjustIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import type {
  InventoryItem,
  InventoryBatch,
  StockTransaction,
  InventoryCategory,
  InventoryUnit,
  StockTxnType,
  InventoryItemStatus,
} from '@/types/inventory';
import {
  CATEGORY_COLORS,
  TXN_TYPE_COLORS,
  STATUS_COLORS,
} from '@/types/inventory';
import {
  getItems,
  getItem,
  upsertItem,
  deactivateItem,
  deleteItem,
  addBatch,
  stockOut,
  adjustBatch,
  getItemTotalStock,
  getLowStockItems,
  getOutOfStockItems,
  getExpiringBatches,
  getAllBatches,
  getTransactions,
} from '@/services/inventoryStore';
import { useAuth } from '@/contexts/AuthContext';

type TabValue = 'items' | 'batches' | 'transactions';

const CATEGORIES: InventoryCategory[] = ['Reagent', 'Tube', 'Kit', 'Chemical', 'Consumable', 'Other'];
const UNITS: InventoryUnit[] = ['pcs', 'ml', 'L', 'mg', 'g', 'kg', 'box', 'pack', 'kit'];

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('items');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<InventoryItemStatus | 'All'>('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState<number>(30); // days

  // Dialogs
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [stockInDialogOpen, setStockInDialogOpen] = useState(false);
  const [stockOutDialogOpen, setStockOutDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState<{
    name: string;
    category: InventoryCategory;
    unit: InventoryUnit;
    minStockLevel: string;
    status: InventoryItemStatus;
    notes: string;
  }>({
    name: '',
    category: 'Reagent',
    unit: 'pcs',
    minStockLevel: '10',
    status: 'Active',
    notes: '',
  });

  const [stockInForm, setStockInForm] = useState<{
    itemId: string;
    quantity: string;
    lotNo: string;
    expiryDate: string;
    vendor: string;
    unitCost: string;
    notes: string;
  }>({
    itemId: '',
    quantity: '',
    lotNo: '',
    expiryDate: '',
    vendor: '',
    unitCost: '',
    notes: '',
  });

  const [stockOutForm, setStockOutForm] = useState<{
    itemId: string;
    batchId: string;
    quantity: string;
    reason: string;
  }>({
    itemId: '',
    batchId: '',
    quantity: '',
    reason: 'Daily usage',
  });

  const [adjustForm, setAdjustForm] = useState<{
    itemId: string;
    batchId: string;
    newQuantity: string;
    reason: string;
  }>({
    itemId: '',
    batchId: '',
    newQuantity: '',
    reason: 'Stock audit',
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      setItems(getItems());
      setTransactions(getTransactions());
    } catch (error) {
      showSnackbar('Failed to load inventory data', 'error');
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

  // Stats
  const stats = useMemo(() => {
    const lowStock = getLowStockItems();
    const outOfStock = getOutOfStockItems();
    const expiring = getExpiringBatches(30);

    return {
      totalItems: items.filter(i => i.status === 'Active').length,
      lowStock: lowStock.length,
      expiringSoon: expiring.length,
      outOfStock: outOfStock.length,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.itemId.toLowerCase().includes(query)
      );
    }

    // Category
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Low stock
    if (lowStockOnly) {
      filtered = filtered.filter(item => {
        const totalStock = getItemTotalStock(item.itemId);
        return totalStock < item.minStockLevel;
      });
    }

    return filtered;
  }, [items, searchQuery, categoryFilter, statusFilter, lowStockOnly]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    const allBatches = getAllBatches();
    
    let filtered = allBatches;

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        batch =>
          batch.itemName.toLowerCase().includes(query) ||
          batch.lotNo?.toLowerCase().includes(query) ||
          batch.batchId.toLowerCase().includes(query)
      );
    }

    // Expiry filter
    if (expiryFilter > 0) {
      const now = new Date();
      const threshold = new Date(now.getTime() + expiryFilter * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(batch => {
        if (!batch.expiryDate) return false;
        const expiry = new Date(batch.expiryDate);
        return expiry <= threshold && expiry >= now;
      });
    }

    return filtered;
  }, [searchQuery, expiryFilter]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        txn =>
          txn.itemName?.toLowerCase().includes(query) ||
          txn.txnId.toLowerCase().includes(query) ||
          txn.by.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [transactions, searchQuery]);

  // Items DataGrid columns
  const itemColumns: GridColDef[] = [
    {
      field: 'itemId',
      headerName: 'Item ID',
      width: 120,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 250,
      flex: 1,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: CATEGORY_COLORS[params.value as InventoryCategory],
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'totalStock',
      headerName: 'Stock',
      width: 100,
      valueGetter: (value, row) => getItemTotalStock(row.itemId),
      renderCell: (params) => {
        const totalStock = params.value as number;
        const minStock = params.row.minStockLevel;
        const color = totalStock === 0 ? 'error' : totalStock < minStock ? 'warning' : 'success';
        
        return (
          <Typography variant="body2" color={`${color}.main`} fontWeight={600}>
            {totalStock} {params.row.unit}
          </Typography>
        );
      },
    },
    {
      field: 'minStockLevel',
      headerName: 'Min Level',
      width: 100,
      renderCell: (params) => `${params.value} ${params.row.unit}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: STATUS_COLORS[params.value as InventoryItemStatus],
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'alerts',
      headerName: 'Alerts',
      width: 150,
      renderCell: (params) => {
        const totalStock = getItemTotalStock(params.row.itemId);
        const minStock = params.row.minStockLevel;
        const alerts: JSX.Element[] = [];

        if (totalStock === 0) {
          alerts.push(
            <Chip
              key="out"
              label="Out"
              size="small"
              color="error"
              icon={<ErrorIcon />}
              sx={{ mr: 0.5 }}
            />
          );
        } else if (totalStock < minStock) {
          alerts.push(
            <Chip
              key="low"
              label="Low"
              size="small"
              color="warning"
              icon={<WarningIcon />}
              sx={{ mr: 0.5 }}
            />
          );
        }

        // Check for expiring batches
        const expiringBatches = params.row.batches.filter((batch: InventoryBatch) => {
          if (!batch.expiryDate || batch.quantity === 0) return false;
          const expiry = new Date(batch.expiryDate);
          const now = new Date();
          const days = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return days >= 0 && days <= 30;
        });

        if (expiringBatches.length > 0) {
          alerts.push(
            <Chip
              key="exp"
              label="Expiring"
              size="small"
              color="warning"
              icon={<WarningIcon />}
            />
          );
        }

        return <Box>{alerts}</Box>;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => {
        const item = params.row as InventoryItem;
        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            onClick={() => handleEditItem(item)}
          />,
          <GridActionsCellItem
            icon={<StockInIcon />}
            label="Stock In"
            onClick={() => handleOpenStockIn(item)}
            showInMenu
          />,
          <GridActionsCellItem
            icon={<StockOutIcon />}
            label="Stock Out"
            onClick={() => handleOpenStockOut(item)}
            showInMenu
          />,
          <GridActionsCellItem
            icon={<AdjustIcon />}
            label="Adjust"
            onClick={() => handleOpenAdjust(item)}
            showInMenu
          />,
        ];
      },
    },
  ];

  // Batches DataGrid columns
  const batchColumns: GridColDef[] = [
    {
      field: 'batchId',
      headerName: 'Batch ID',
      width: 150,
    },
    {
      field: 'itemName',
      headerName: 'Item',
      width: 200,
      flex: 1,
    },
    {
      field: 'lotNo',
      headerName: 'Lot No',
      width: 130,
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry',
      width: 120,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        
        const expiry = new Date(params.value);
        const now = new Date();
        const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let color = 'text.primary';
        if (days < 0) color = 'error.main';
        else if (days <= 30) color = 'warning.main';
        else if (days <= 90) color = 'info.main';
        
        return (
          <Box>
            <Typography variant="body2" color={color}>
              {expiry.toLocaleDateString()}
            </Typography>
            {days >= 0 && (
              <Typography variant="caption" color="text.secondary">
                ({days} days)
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value} {params.row.unit}
        </Typography>
      ),
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      width: 150,
    },
    {
      field: 'receivedAt',
      headerName: 'Received',
      width: 120,
      valueGetter: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  // Transactions DataGrid columns
  const txnColumns: GridColDef[] = [
    {
      field: 'txnId',
      headerName: 'Transaction ID',
      width: 150,
    },
    {
      field: 'at',
      headerName: 'Date',
      width: 160,
      valueGetter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: TXN_TYPE_COLORS[params.value as StockTxnType],
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'itemName',
      headerName: 'Item',
      width: 200,
      flex: 1,
    },
    {
      field: 'lotNo',
      headerName: 'Lot No',
      width: 120,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
      renderCell: (params) => {
        const txn = params.row as StockTransaction;
        const prefix = txn.type === 'Out' ? '-' : '+';
        const color = txn.type === 'Out' ? 'error' : txn.type === 'In' ? 'success' : 'warning';
        
        return (
          <Typography variant="body2" color={`${color}.main`} fontWeight={600}>
            {prefix}{params.value}
          </Typography>
        );
      },
    },
    {
      field: 'by',
      headerName: 'By',
      width: 120,
    },
    {
      field: 'reason',
      headerName: 'Reason',
      width: 150,
    },
  ];

  // Handlers
  const handleOpenAddItem = () => {
    setSelectedItem(null);
    setItemForm({
      name: '',
      category: 'Reagent',
      unit: 'pcs',
      minStockLevel: '10',
      status: 'Active',
      notes: '',
    });
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      minStockLevel: item.minStockLevel.toString(),
      status: item.status,
      notes: item.notes || '',
    });
    setItemDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.name.trim()) {
      showSnackbar('Item name is required', 'error');
      return;
    }

    const minStock = parseInt(itemForm.minStockLevel);
    if (isNaN(minStock) || minStock < 0) {
      showSnackbar('Invalid minimum stock level', 'error');
      return;
    }

    try {
      upsertItem({
        itemId: selectedItem?.itemId,
        name: itemForm.name,
        category: itemForm.category,
        unit: itemForm.unit,
        minStockLevel: minStock,
        status: itemForm.status,
        notes: itemForm.notes || undefined,
      });

      loadData();
      setItemDialogOpen(false);
      showSnackbar(
        selectedItem ? 'Item updated successfully' : 'Item created successfully',
        'success'
      );
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save item', 'error');
    }
  };

  const handleOpenStockIn = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockInForm({
      itemId: item.itemId,
      quantity: '',
      lotNo: '',
      expiryDate: '',
      vendor: '',
      unitCost: '',
      notes: '',
    });
    setStockInDialogOpen(true);
  };

  const handleStockIn = () => {
    if (!selectedItem) return;

    const quantity = parseFloat(stockInForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showSnackbar('Invalid quantity', 'error');
      return;
    }

    const unitCost = stockInForm.unitCost ? parseFloat(stockInForm.unitCost) : undefined;
    if (stockInForm.unitCost && (isNaN(unitCost!) || unitCost! < 0)) {
      showSnackbar('Invalid unit cost', 'error');
      return;
    }

    try {
      addBatch(
        selectedItem.itemId,
        {
          quantity,
          lotNo: stockInForm.lotNo || undefined,
          expiryDate: stockInForm.expiryDate || undefined,
          vendor: stockInForm.vendor || undefined,
          unitCost,
          notes: stockInForm.notes || undefined,
          receivedAt: new Date().toISOString(),
        },
        user?.name || 'Staff'
      );

      loadData();
      setStockInDialogOpen(false);
      showSnackbar('Stock added successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to add stock', 'error');
    }
  };

  const handleOpenStockOut = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockOutForm({
      itemId: item.itemId,
      batchId: item.batches.length > 0 ? item.batches[0].batchId : '',
      quantity: '',
      reason: 'Daily usage',
    });
    setStockOutDialogOpen(true);
  };

  const handleStockOut = () => {
    if (!selectedItem) return;

    const quantity = parseFloat(stockOutForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showSnackbar('Invalid quantity', 'error');
      return;
    }

    if (!stockOutForm.batchId) {
      showSnackbar('Please select a batch', 'error');
      return;
    }

    try {
      stockOut(
        selectedItem.itemId,
        stockOutForm.batchId,
        quantity,
        user?.name || 'Staff',
        stockOutForm.reason
      );

      loadData();
      setStockOutDialogOpen(false);
      showSnackbar('Stock removed successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to remove stock', 'error');
    }
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustForm({
      itemId: item.itemId,
      batchId: item.batches.length > 0 ? item.batches[0].batchId : '',
      newQuantity: '',
      reason: 'Stock audit',
    });
    setAdjustDialogOpen(true);
  };

  const handleAdjust = () => {
    if (!selectedItem) return;

    const newQuantity = parseFloat(adjustForm.newQuantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      showSnackbar('Invalid quantity', 'error');
      return;
    }

    if (!adjustForm.batchId) {
      showSnackbar('Please select a batch', 'error');
      return;
    }

    try {
      adjustBatch(
        selectedItem.itemId,
        adjustForm.batchId,
        newQuantity,
        user?.name || 'Staff',
        adjustForm.reason
      );

      loadData();
      setAdjustDialogOpen(false);
      showSnackbar('Stock adjusted successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to adjust stock', 'error');
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Inventory Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track reagents, tubes, kits, chemicals, and consumables
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddItem}
          >
            Add Item
          </Button>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, backgroundColor: '#E3F2FD' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.totalItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Items
              </Typography>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, backgroundColor: '#FFF3E0' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats.lowStock}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Low Stock
              </Typography>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, backgroundColor: '#FFEBEE' }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats.expiringSoon}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expiring Soon (30 days)
              </Typography>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, backgroundColor: '#FFEBEE' }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {stats.outOfStock}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Out of Stock
              </Typography>
            </Card>
          </Box>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab label="Items" value="items" />
              <Tab label="Batches" value="batches" />
              <Tab label="Transactions" value="transactions" />
            </Tabs>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1, minWidth: 200 }}
              />

              {activeTab === 'items' && (
                <>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as InventoryCategory | 'All')}
                      label="Category"
                    >
                      <MenuItem value="All">All</MenuItem>
                      {CATEGORIES.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as InventoryItemStatus | 'All')}
                      label="Status"
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={lowStockOnly}
                        onChange={(e) => setLowStockOnly(e.target.checked)}
                      />
                    }
                    label="Low Stock Only"
                  />
                </>
              )}

              {activeTab === 'batches' && (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Expiring Within</InputLabel>
                  <Select
                    value={expiryFilter}
                    onChange={(e) => setExpiryFilter(e.target.value as number)}
                    label="Expiring Within"
                  >
                    <MenuItem value={30}>30 Days</MenuItem>
                    <MenuItem value={60}>60 Days</MenuItem>
                    <MenuItem value={90}>90 Days</MenuItem>
                    <MenuItem value={0}>All</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        </Card>

        {/* DataGrids */}
        <Card>
          {activeTab === 'items' && (
            <DataGrid
              rows={filteredItems}
              columns={itemColumns}
              getRowId={(row) => row.itemId}
              loading={loading}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              sx={{
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
              }}
            />
          )}

          {activeTab === 'batches' && (
            <DataGrid
              rows={filteredBatches}
              columns={batchColumns}
              getRowId={(row) => row.batchId}
              loading={loading}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              sx={{
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
              }}
            />
          )}

          {activeTab === 'transactions' && (
            <DataGrid
              rows={filteredTransactions}
              columns={txnColumns}
              getRowId={(row) => row.txnId}
              loading={loading}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'at', sort: 'desc' }] },
              }}
              sx={{
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
              }}
            />
          )}
        </Card>

        {/* Add/Edit Item Dialog */}
        <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Item Name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })}
                    label="Category"
                  >
                    {CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value as InventoryUnit })}
                    label="Unit"
                  >
                    {UNITS.map(unit => (
                      <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Minimum Stock Level"
                  type="number"
                  value={itemForm.minStockLevel}
                  onChange={(e) => setItemForm({ ...itemForm, minStockLevel: e.target.value })}
                  required
                />

                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={itemForm.status}
                    onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as InventoryItemStatus })}
                    label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveItem}>
              {selectedItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Stock In Dialog */}
        <Dialog open={stockInDialogOpen} onClose={() => setStockInDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Stock In - {selectedItem?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={`Quantity (${selectedItem?.unit})`}
                type="number"
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Lot Number"
                value={stockInForm.lotNo}
                onChange={(e) => setStockInForm({ ...stockInForm, lotNo: e.target.value })}
              />

              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={stockInForm.expiryDate}
                onChange={(e) => setStockInForm({ ...stockInForm, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Vendor"
                value={stockInForm.vendor}
                onChange={(e) => setStockInForm({ ...stockInForm, vendor: e.target.value })}
              />

              <TextField
                fullWidth
                label="Unit Cost (₹)"
                type="number"
                value={stockInForm.unitCost}
                onChange={(e) => setStockInForm({ ...stockInForm, unitCost: e.target.value })}
              />

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={stockInForm.notes}
                onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStockInDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={handleStockIn}>
              Add Stock
            </Button>
          </DialogActions>
        </Dialog>

        {/* Stock Out Dialog */}
        <Dialog open={stockOutDialogOpen} onClose={() => setStockOutDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Stock Out - {selectedItem?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Batch</InputLabel>
                <Select
                  value={stockOutForm.batchId}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, batchId: e.target.value })}
                  label="Batch"
                >
                  {selectedItem?.batches
                    .filter(b => b.quantity > 0)
                    .sort((a, b) => {
                      // FEFO: First Expired, First Out
                      if (!a.expiryDate) return 1;
                      if (!b.expiryDate) return -1;
                      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                    })
                    .map(batch => (
                      <MenuItem key={batch.batchId} value={batch.batchId}>
                        {batch.lotNo || batch.batchId} - {batch.quantity} {selectedItem.unit}
                        {batch.expiryDate && ` (Exp: ${new Date(batch.expiryDate).toLocaleDateString()})`}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {stockOutForm.batchId && selectedItem && (
                <Alert severity="info">
                  Available: {selectedItem.batches.find(b => b.batchId === stockOutForm.batchId)?.quantity || 0} {selectedItem.unit}
                </Alert>
              )}

              <TextField
                fullWidth
                label={`Quantity (${selectedItem?.unit})`}
                type="number"
                value={stockOutForm.quantity}
                onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Reason"
                value={stockOutForm.reason}
                onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                placeholder="e.g., Daily usage, Sample collection, Wastage"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStockOutDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleStockOut}>
              Remove Stock
            </Button>
          </DialogActions>
        </Dialog>

        {/* Adjust Dialog */}
        <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Adjust Stock - {selectedItem?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Batch</InputLabel>
                <Select
                  value={adjustForm.batchId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, batchId: e.target.value })}
                  label="Batch"
                >
                  {selectedItem?.batches.map(batch => (
                    <MenuItem key={batch.batchId} value={batch.batchId}>
                      {batch.lotNo || batch.batchId} - Current: {batch.quantity} {selectedItem.unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label={`New Quantity (${selectedItem?.unit})`}
                type="number"
                value={adjustForm.newQuantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, newQuantity: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Reason"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g., Stock audit, Correction, Physical count"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="warning" onClick={handleAdjust}>
              Adjust Stock
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
