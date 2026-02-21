// Analytics Service - Aggregates data from all stores

import type {
  AnalyticsFilters,
  AnalyticsData,
  AllKPIs,
  DailyRevenue,
  TestUsage,
  BottleneckStage,
  HomeCollectionMetrics,
  DateRange,
  DateRangePreset,
  CSVExportConfig,
  CSVExportRow,
} from '@/types/analytics';
import type { Booking } from '@/types/token';
import type { Invoice, Payment } from '@/types/billing';
import type { TestResult } from '@/types/testing';
import type { Report } from '@/types/reportGeneration';
import type { HomePickup } from '@/types/homeCollection';

// Import all stores
import { getBookings } from '@/services/bookingStore';
import { getInvoices } from '@/services/billingStore';
import { getCompletedTests } from '@/services/testingStore';
import { getReports } from '@/services/reportStore';
import { getHomePickups } from '@/services/homeCollectionStore';

// Helper: Get date range from preset
export const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  let start = new Date();
  start.setHours(0, 0, 0, 0);
  
  switch (preset) {
    case 'today':
      // start is already today 00:00
      break;
    case 'last7days':
      start.setDate(start.getDate() - 6);
      break;
    case 'last30days':
      start.setDate(start.getDate() - 29);
      break;
    case 'custom':
      // Should be set externally
      break;
  }
  
  return { start, end };
};

// Helper: Check if date is in range
const isDateInRange = (dateStr: string, range: DateRange): boolean => {
  const date = new Date(dateStr);
  return date >= range.start && date <= range.end;
};

// Helper: Filter bookings
const filterBookings = (bookings: Booking[], filters: AnalyticsFilters): Booking[] => {
  return bookings.filter(booking => {
    // Date range
    if (!isDateInRange(booking.createdAt, filters.dateRange)) {
      return false;
    }
    
    // Booking type
    if (filters.bookingType !== 'All' && booking.bookingType !== filters.bookingType) {
      return false;
    }
    
    // Cancelled
    if (!filters.includeCancelled && booking.status === 'Cancelled') {
      return false;
    }
    
    return true;
  });
};

// Helper: Filter invoices
const filterInvoices = (invoices: Invoice[], filters: AnalyticsFilters): Invoice[] => {
  return invoices.filter(invoice => {
    // Date range
    if (!isDateInRange(invoice.createdAt, filters.dateRange)) {
      return false;
    }
    
    // Cancelled
    if (!filters.includeCancelled && invoice.status === 'Cancelled') {
      return false;
    }
    
    // Refunded
    if (!filters.includeRefunded && invoice.status === 'Refunded') {
      return false;
    }
    
    return true;
  });
};

// Compute Revenue KPIs
const computeRevenueKPIs = (invoices: Invoice[]): AllKPIs['revenue'] => {
  let totalRevenue = 0;
  let pendingDue = 0;
  let grandTotalSum = 0;
  let paidInvoicesCount = 0;
  
  invoices.forEach(invoice => {
    if (invoice.status === 'Paid') {
      totalRevenue += invoice.paidTotal;
      grandTotalSum += invoice.grandTotal;
      paidInvoicesCount++;
    } else if (invoice.status === 'PartiallyPaid') {
      totalRevenue += invoice.paidTotal;
      pendingDue += invoice.dueTotal;
    } else if (invoice.status === 'Unpaid') {
      pendingDue += invoice.dueTotal;
    }
  });
  
  const avgOrderValue = paidInvoicesCount > 0 ? grandTotalSum / paidInvoicesCount : 0;
  
  return {
    totalRevenue,
    pendingDue,
    avgOrderValue,
  };
};

// Compute Operations KPIs
const computeOperationsKPIs = (
  bookings: Booking[],
  tests: TestResult[],
  reports: Report[],
  filters: AnalyticsFilters
): AllKPIs['operations'] => {
  const totalBookings = bookings.length;
  
  // Samples collected = bookings with sample collected
  const samplesCollected = bookings.filter(
    b => b.sample?.status === 'Collected'
  ).length;
  
  // Reports published = reports with Published status in date range
  const reportsPublished = reports.filter(
    r => r.status === 'Published' && isDateInRange(r.createdAt, filters.dateRange)
  ).length;
  
  // Pending reports = completed tests without published report
  // Note: TestResult doesn't have bookingId, use sample.tokenNumber to match
  const completedTestTokens = new Set(tests.map(t => t.sample.tokenNumber));
  const publishedReportBookingIds = new Set(
    reports.filter(r => r.status === 'Published').map(r => r.bookingId)
  );
  
  // Match completed tests to bookings to get booking IDs
  const bookingsByToken = new Map(bookings.map(b => [b.tokenNumber, b.bookingID]));
  let pendingReports = 0;
  completedTestTokens.forEach(tokenNumber => {
    const bookingId = bookingsByToken.get(tokenNumber);
    if (bookingId && !publishedReportBookingIds.has(bookingId)) {
      pendingReports++;
    }
  });
  
  return {
    totalBookings,
    samplesCollected,
    reportsPublished,
    pendingReports,
  };
};

// Compute Quality KPIs
const computeQualityKPIs = (reports: Report[], tests: TestResult[]): AllKPIs['quality'] => {
  // Critical reports = reports with any critical parameter
  const criticalReportsCount = reports.filter(r => {
    if (r.status !== 'Published') return false;
    // Check if report has critical flags
    return r.criticalFlags && r.criticalFlags.length > 0;
  }).length;
  
  // QC Pending = tests with QC status pending (if exists)
  const qcPendingCount = tests.filter(
    t => (t as any).qcStatus === 'Pending' || (t as any).requiresQC
  ).length;
  
  return {
    criticalReportsCount,
    qcPendingCount,
  };
};

// Compute Revenue Over Time
const computeRevenueOverTime = (invoices: Invoice[], filters: AnalyticsFilters): DailyRevenue[] => {
  const dailyMap = new Map<string, { revenue: number; count: number }>();
  
  invoices.forEach(invoice => {
    invoice.payments?.forEach(payment => {
      // All payments in the array are considered completed
      if (payment.paidAt) {
        if (isDateInRange(payment.paidAt, filters.dateRange)) {
          const date = new Date(payment.paidAt).toISOString().split('T')[0];
          const existing = dailyMap.get(date) || { revenue: 0, count: 0 };
          dailyMap.set(date, {
            revenue: existing.revenue + payment.amount,
            count: existing.count + 1,
          });
        }
      }
    });
  });
  
  // Convert to array and sort by date
  const result: DailyRevenue[] = [];
  dailyMap.forEach((value, date) => {
    result.push({
      date,
      revenue: value.revenue,
      invoiceCount: value.count,
    });
  });
  
  result.sort((a, b) => a.date.localeCompare(b.date));
  
  return result;
};

// Compute Top Tests
const computeTopTests = (bookings: Booking[], invoices: Invoice[]): TestUsage[] => {
  const testMap = new Map<string, { name: string; count: number; revenue: number }>();
  
  // Count from bookings
  bookings.forEach(booking => {
    booking.tests?.forEach(test => {
      const existing = testMap.get(test.testCode) || { 
        name: test.testName, 
        count: 0, 
        revenue: 0 
      };
      testMap.set(test.testCode, {
        name: test.testName,
        count: existing.count + 1,
        revenue: existing.revenue,
      });
    });
  });
  
  // Add revenue from invoices
  invoices.forEach(invoice => {
    invoice.lineItems?.forEach(item => {
      if (item.type === 'Test' && item.refId) {
        const existing = testMap.get(item.refId);
        if (existing) {
          existing.revenue += item.amount;
        }
      }
    });
  });
  
  // Convert to array and sort by count
  const result: TestUsage[] = [];
  testMap.forEach((value, testId) => {
    result.push({
      testId,
      testName: value.name,
      count: value.count,
      revenue: value.revenue,
    });
  });
  
  result.sort((a, b) => b.count - a.count);
  
  return result.slice(0, 10); // Top 10
};

// Compute Bottlenecks
const computeBottlenecks = (bookings: Booking[], tests: TestResult[], reports: Report[]): BottleneckStage[] => {
  const booked = bookings.filter(b => 
    b.sample?.status !== 'Collected' && b.status !== 'Cancelled'
  ).length;
  
  // Map tests by token number
  const completedTestTokens = new Set(tests.map(t => t.sample.tokenNumber));
  const collected = bookings.filter(b => 
    b.sample?.status === 'Collected' && !completedTestTokens.has(b.tokenNumber)
  ).length;
  
  const publishedReportBookingIds = new Set(
    reports.filter(r => r.status === 'Published').map(r => r.bookingId)
  );
  // Map bookings to tokens for matching
  const bookingIdByToken = new Map(bookings.map(b => [b.tokenNumber, b.bookingID]));
  const tested = tests.filter(t => {
    const bookingId = bookingIdByToken.get(t.sample.tokenNumber);
    return bookingId && !publishedReportBookingIds.has(bookingId);
  }).length;
  
  const published = reports.filter(r => r.status === 'Published').length;
  
  return [
    { stage: 'Booked', count: booked },
    { stage: 'Collected', count: collected },
    { stage: 'Tested', count: tested },
    { stage: 'Published', count: published },
  ];
};

// Compute Home Collection Metrics
const computeHomeCollectionMetrics = (
  pickups: HomePickup[],
  filters: AnalyticsFilters
): HomeCollectionMetrics | undefined => {
  try {
    const filteredPickups = pickups.filter(p => 
      isDateInRange(p.createdAt, filters.dateRange)
    );
    
    if (filteredPickups.length === 0) return undefined;
    
    const assigned = filteredPickups.filter(p => 
      ['Assigned', 'EnRoute', 'Collected', 'DeliveredToLab'].includes(p.status)
    ).length;
    
    const collected = filteredPickups.filter(p => 
      ['Collected', 'DeliveredToLab'].includes(p.status)
    ).length;
    
    const delivered = filteredPickups.filter(p => 
      p.status === 'DeliveredToLab'
    ).length;
    
    const cancelled = filteredPickups.filter(p => 
      p.status === 'Cancelled'
    ).length;
    
    return {
      assigned,
      collected,
      delivered,
      cancelled,
    };
  } catch {
    return undefined;
  }
};

// Main aggregation function
export const aggregateAnalytics = (filters: AnalyticsFilters): AnalyticsData => {
  // Load all data
  const allBookings = getBookings();
  const allInvoices = getInvoices();
  const allTests = getCompletedTests();
  const allReports = getReports();
  
  let allPickups: HomePickup[] = [];
  try {
    allPickups = getHomePickups();
  } catch {
    // Home collection might not be available
  }
  
  // Filter data
  const bookings = filterBookings(allBookings, filters);
  const invoices = filterInvoices(allInvoices, filters);
  // TestResult doesn't have createdAt/completedAt at root, use testedDate if available
  const tests = allTests.filter(t => 
    t.testedDate && isDateInRange(t.testedDate, filters.dateRange)
  );
  const reports = allReports.filter(r => 
    isDateInRange(r.createdAt, filters.dateRange)
  );
  
  // Compute KPIs
  const revenue = computeRevenueKPIs(invoices);
  const operations = computeOperationsKPIs(bookings, tests, reports, filters);
  const quality = computeQualityKPIs(reports, tests);
  
  // Compute charts
  const revenueOverTime = computeRevenueOverTime(invoices, filters);
  const topTests = computeTopTests(bookings, invoices);
  const bottlenecks = computeBottlenecks(bookings, tests, reports);
  const homeCollection = computeHomeCollectionMetrics(allPickups, filters);
  
  return {
    kpis: {
      revenue,
      operations,
      quality,
    },
    revenueOverTime,
    topTests,
    bottlenecks,
    homeCollection,
  };
};

// CSV Export Helpers
export const generateCSV = (config: CSVExportConfig): string => {
  const lines: string[] = [];
  
  // Headers
  lines.push(config.headers.join(','));
  
  // Rows
  config.rows.forEach(row => {
    const values = config.headers.map(header => {
      const value = row[header];
      if (value === undefined || value === null) return '';
      // Escape commas and quotes
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
};

export const downloadCSV = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export KPI Summary
export const exportKPISummary = (data: AnalyticsData, filters: AnalyticsFilters): void => {
  const rows: CSVExportRow[] = [
    {
      Metric: 'Total Revenue',
      Value: `₹${data.kpis.revenue.totalRevenue.toFixed(2)}`,
      Category: 'Revenue',
    },
    {
      Metric: 'Pending Due',
      Value: `₹${data.kpis.revenue.pendingDue.toFixed(2)}`,
      Category: 'Revenue',
    },
    {
      Metric: 'Avg Order Value',
      Value: `₹${data.kpis.revenue.avgOrderValue.toFixed(2)}`,
      Category: 'Revenue',
    },
    {
      Metric: 'Total Bookings',
      Value: data.kpis.operations.totalBookings,
      Category: 'Operations',
    },
    {
      Metric: 'Samples Collected',
      Value: data.kpis.operations.samplesCollected,
      Category: 'Operations',
    },
    {
      Metric: 'Reports Published',
      Value: data.kpis.operations.reportsPublished,
      Category: 'Operations',
    },
    {
      Metric: 'Pending Reports',
      Value: data.kpis.operations.pendingReports,
      Category: 'Operations',
    },
    {
      Metric: 'Critical Reports',
      Value: data.kpis.quality.criticalReportsCount,
      Category: 'Quality',
    },
    {
      Metric: 'QC Pending',
      Value: data.kpis.quality.qcPendingCount,
      Category: 'Quality',
    },
  ];
  
  const csv = generateCSV({
    filename: 'kpi-summary.csv',
    headers: ['Metric', 'Value', 'Category'],
    rows,
  });
  
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `kpi-summary-${dateStr}.csv`);
};

// Export Top Tests
export const exportTopTests = (tests: TestUsage[]): void => {
  const rows: CSVExportRow[] = tests.map(test => ({
    'Test ID': test.testId,
    'Test Name': test.testName,
    'Count': test.count,
    'Revenue': `₹${test.revenue.toFixed(2)}`,
  }));
  
  const csv = generateCSV({
    filename: 'top-tests.csv',
    headers: ['Test ID', 'Test Name', 'Count', 'Revenue'],
    rows,
  });
  
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `top-tests-${dateStr}.csv`);
};

// Export Revenue Over Time
export const exportRevenueOverTime = (data: DailyRevenue[]): void => {
  const rows: CSVExportRow[] = data.map(d => ({
    Date: d.date,
    Revenue: `₹${d.revenue.toFixed(2)}`,
    'Invoice Count': d.invoiceCount,
  }));
  
  const csv = generateCSV({
    filename: 'revenue-over-time.csv',
    headers: ['Date', 'Revenue', 'Invoice Count'],
    rows,
  });
  
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `revenue-over-time-${dateStr}.csv`);
};
