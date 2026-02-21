'use client';

import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box,
  Card,
  Typography,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  LocalHospital as LocalHospitalIcon,
  MonetizationOn as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type {
  AnalyticsFilters,
  DateRangePreset,
  AnalyticsData,
} from '@/types/analytics';
import {
  aggregateAnalytics,
  getDateRangeFromPreset,
  exportKPISummary,
  exportTopTests,
  exportRevenueOverTime,
} from '@/services/analyticsService';

export default function AnalyticsPage() {
  // Filters
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [bookingType, setBookingType] = useState<AnalyticsFilters['bookingType']>('All');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [includeRefunded, setIncludeRefunded] = useState(false);

  // Data
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Compute filters
  const filters: AnalyticsFilters = useMemo(() => {
    let dateRange = getDateRangeFromPreset(datePreset);
    
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      dateRange = {
        start: new Date(customStartDate + 'T00:00:00'),
        end: new Date(customEndDate + 'T23:59:59'),
      };
    }
    
    return {
      dateRange,
      datePreset,
      bookingType,
      includeCancelled,
      includeRefunded,
    };
  }, [datePreset, customStartDate, customEndDate, bookingType, includeCancelled, includeRefunded]);

  // Load data
  const loadData = () => {
    setLoading(true);
    // Simulate loading delay for UX
    setTimeout(() => {
      try {
        const analyticsData = aggregateAnalytics(filters);
        setData(analyticsData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // Export handlers
  const handleExportKPIs = () => {
    if (data) {
      exportKPISummary(data, filters);
    }
  };

  const handleExportTopTests = () => {
    if (data) {
      exportTopTests(data.topTests);
    }
  };

  const handleExportRevenueOverTime = () => {
    if (data) {
      exportRevenueOverTime(data.revenueOverTime);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isEmpty = data && 
    data.kpis.operations.totalBookings === 0 &&
    data.kpis.revenue.totalRevenue === 0;

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon fontSize="large" />
              Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lab performance metrics and insights
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportKPIs}
              disabled={loading || !data}
            >
              Export KPIs
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Filters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200, flex: '1 1 auto' }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
                label="Date Range"
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="last7days">Last 7 Days</MenuItem>
                <MenuItem value="last30days">Last 30 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>

            {datePreset === 'custom' && (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="Start Date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="End Date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 160 }}
                />
              </>
            )}

            <FormControl size="small" sx={{ minWidth: 180, flex: '1 1 auto' }}>
              <InputLabel>Booking Type</InputLabel>
              <Select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as AnalyticsFilters['bookingType'])}
                label="Booking Type"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="WalkIn">Walk-In</MenuItem>
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="HomeCollection">Home Collection</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeCancelled}
                    onChange={(e) => setIncludeCancelled(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Include Cancelled</Typography>}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeRefunded}
                    onChange={(e) => setIncludeRefunded(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Include Refunded</Typography>}
              />
            </Box>
          </Box>
        </Card>

        {/* Empty State */}
        {!loading && isEmpty && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No data available for the selected date range and filters. Try adjusting your filters or check back after creating bookings and invoices.
          </Alert>
        )}

        {/* Revenue KPIs */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon />
          Revenue Metrics
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
            <Card sx={{ p: 2.5, backgroundColor: '#E8F5E9', height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
                    {data ? formatCurrency(data.kpis.revenue.totalRevenue) : '₹0.00'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="text.secondary">
                      Paid invoices
                    </Typography>
                  </Box>
                </>
              )}
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFF3E0', height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pending Due
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main" gutterBottom>
                    {data ? formatCurrency(data.kpis.revenue.pendingDue) : '₹0.00'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningIcon fontSize="small" color="warning" />
                    <Typography variant="caption" color="text.secondary">
                      Unpaid/Partial
                    </Typography>
                  </Box>
                </>
              )}
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
            <Card sx={{ p: 2.5, backgroundColor: '#E3F2FD', height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Avg Order Value
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
                    {data ? formatCurrency(data.kpis.revenue.avgOrderValue) : '₹0.00'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Per paid invoice
                  </Typography>
                </>
              )}
            </Card>
          </Box>
        </Box>

        {/* Operations KPIs */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <LocalHospitalIcon />
          Operations Metrics
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={70} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {data?.kpis.operations.totalBookings || 0}
                  </Typography>
                </>
              )}
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={70} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Samples Collected
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {data?.kpis.operations.samplesCollected || 0}
                  </Typography>
                </>
              )}
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={70} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Reports Published
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {data?.kpis.operations.reportsPublished || 0}
                  </Typography>
                </>
              )}
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={70} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pending Reports
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {data?.kpis.operations.pendingReports || 0}
                  </Typography>
                </>
              )}
            </Card>
          </Box>
        </Box>

        {/* Quality KPIs */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <AssessmentIcon />
          Quality Metrics
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFEBEE', height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={70} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Critical Reports
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {data?.kpis.quality.criticalReportsCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reports with critical flags
                  </Typography>
                </>
              )}
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <Card sx={{ p: 2.5, backgroundColor: '#FFF3E0', height: '100%' }}>
              {loading ? (
                <Skeleton variant="rectangular" height={70} />
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    QC Pending
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {data?.kpis.quality.qcPendingCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tests requiring QC
                  </Typography>
                </>
              )}
            </Card>
          </Box>
        </Box>

        {/* Revenue Over Time */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Revenue Over Time
            </Typography>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportRevenueOverTime}
              disabled={loading || !data || data.revenueOverTime.length === 0}
            >
              Export CSV
            </Button>
          </Box>

          {loading ? (
            <Skeleton variant="rectangular" height={250} />
          ) : data && data.revenueOverTime.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell align="right"><strong>Revenue</strong></TableCell>
                    <TableCell align="right"><strong>Invoice Count</strong></TableCell>
                    <TableCell align="right"><strong>Visual</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.revenueOverTime.map((item) => {
                    const maxRevenue = Math.max(...data.revenueOverTime.map(d => d.revenue));
                    const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <TableRow key={item.date}>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {formatCurrency(item.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{item.invoiceCount}</TableCell>
                        <TableCell align="right" sx={{ width: '30%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No revenue data for selected period
            </Typography>
          )}
        </Card>

        {/* Most Used Tests */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Most Used Tests
            </Typography>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportTopTests}
              disabled={loading || !data || data.topTests.length === 0}
            >
              Export CSV
            </Button>
          </Box>

          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : data && data.topTests.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Rank</strong></TableCell>
                    <TableCell><strong>Test Name</strong></TableCell>
                    <TableCell align="right"><strong>Count</strong></TableCell>
                    <TableCell align="right"><strong>Revenue</strong></TableCell>
                    <TableCell align="right"><strong>Popularity</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.topTests.map((test, index) => {
                    const maxCount = data.topTests[0]?.count || 1;
                    const percentage = (test.count / maxCount) * 100;
                    
                    return (
                      <TableRow key={test.testId}>
                        <TableCell>
                          <Chip 
                            label={`#${index + 1}`} 
                            size="small" 
                            color={index < 3 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{test.testName}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {test.count}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(test.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ width: '25%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No test usage data available
            </Typography>
          )}
        </Card>

        {/* Pending Bottlenecks */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Workflow Bottlenecks
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Current counts by workflow stage
          </Typography>

          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : data && data.bottlenecks ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Stage</strong></TableCell>
                    <TableCell align="right"><strong>Count</strong></TableCell>
                    <TableCell align="right"><strong>Distribution</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.bottlenecks.map((stage) => {
                    const totalCount = data.bottlenecks.reduce((sum, s) => sum + s.count, 0);
                    const percentage = totalCount > 0 ? (stage.count / totalCount) * 100 : 0;
                    
                    const stageColors: Record<string, string> = {
                      Booked: '#2196F3',
                      Collected: '#4CAF50',
                      Tested: '#FF9800',
                      Published: '#9C27B0',
                    };
                    
                    return (
                      <TableRow key={stage.stage}>
                        <TableCell>
                          <Chip
                            label={stage.stage}
                            size="small"
                            sx={{
                              backgroundColor: stageColors[stage.stage],
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {stage.count}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ width: '50%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: stageColors[stage.stage],
                                },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                              {percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No workflow data available
            </Typography>
          )}
        </Card>

        {/* Home Collection Performance */}
        {data?.homeCollection && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Home Collection Performance
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Pickup status distribution
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#E3F2FD', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {data.homeCollection.assigned}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigned
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#E8F5E9', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {data.homeCollection.collected}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collected
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F3E5F5', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="secondary.main">
                    {data.homeCollection.delivered}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivered
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: '200px' }}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#FFEBEE', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {data.homeCollection.cancelled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );
}
