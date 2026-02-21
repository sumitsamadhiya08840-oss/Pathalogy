// Analytics Types

export type DateRangePreset = 'today' | 'last7days' | 'last30days' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  datePreset: DateRangePreset;
  bookingType: 'All' | 'WalkIn' | 'Scheduled' | 'HomeCollection';
  includeCancelled: boolean;
  includeRefunded: boolean;
}

// KPI Metrics
export interface RevenueKPIs {
  totalRevenue: number;
  pendingDue: number;
  avgOrderValue: number;
  revenueChange?: number; // % change vs previous period
}

export interface OperationsKPIs {
  totalBookings: number;
  samplesCollected: number;
  reportsPublished: number;
  pendingReports: number;
  bookingsChange?: number;
}

export interface QualityKPIs {
  criticalReportsCount: number;
  qcPendingCount: number;
  avgTurnaroundTime?: number; // hours
}

export interface AllKPIs {
  revenue: RevenueKPIs;
  operations: OperationsKPIs;
  quality: QualityKPIs;
}

// Chart Data
export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  revenue: number;
  invoiceCount: number;
}

export interface TestUsage {
  testId: string;
  testName: string;
  count: number;
  revenue: number;
}

export interface BottleneckStage {
  stage: 'Booked' | 'Collected' | 'Tested' | 'Published';
  count: number;
  avgWaitTime?: number; // hours
}

export interface HomeCollectionMetrics {
  assigned: number;
  collected: number;
  delivered: number;
  cancelled: number;
  avgCollectionTime?: number; // minutes
}

export interface AnalyticsData {
  kpis: AllKPIs;
  revenueOverTime: DailyRevenue[];
  topTests: TestUsage[];
  bottlenecks: BottleneckStage[];
  homeCollection?: HomeCollectionMetrics;
}

// CSV Export
export interface CSVExportRow {
  [key: string]: string | number | boolean;
}

export interface CSVExportConfig {
  filename: string;
  headers: string[];
  rows: CSVExportRow[];
}
