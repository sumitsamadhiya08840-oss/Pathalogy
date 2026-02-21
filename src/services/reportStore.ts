import { Report, ReportAuditAction, ReportAuditEvent } from '@/types/reportGeneration';

const REPORTS_KEY = 'nxa_reports_v1';

const isBrowser = (): boolean => typeof window !== 'undefined';

const readReports = (): Report[] => {
  if (!isBrowser()) {
    return [];
  }

  const raw = localStorage.getItem(REPORTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
};

const writeReports = (reports: Report[]): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

const buildAudit = (by: string, action: ReportAuditAction, notes?: string): ReportAuditEvent => ({
  at: new Date().toISOString(),
  by,
  action,
  notes,
});

export const getReports = (): Report[] => readReports();

export const upsertReport = (report: Report): Report => {
  const reports = readReports();
  const index = reports.findIndex((entry) => entry.reportId === report.reportId);

  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }

  writeReports(reports);
  return report;
};

export const addAuditEvent = (reportId: string, by: string, action: ReportAuditAction, notes?: string): Report | null => {
  const reports = readReports();
  const report = reports.find((entry) => entry.reportId === reportId);

  if (!report) {
    return null;
  }

  report.audit.push(buildAudit(by, action, notes));
  report.updatedAt = new Date().toISOString();
  writeReports(reports);
  return report;
};

export const publishReport = (reportId: string, by: string, notes?: string): Report | null => {
  const reports = readReports();
  const report = reports.find((entry) => entry.reportId === reportId);

  if (!report) {
    return null;
  }

  report.status = 'Published';
  report.updatedAt = new Date().toISOString();
  report.audit.push(buildAudit(by, 'Published', notes));
  writeReports(reports);
  return report;
};
