// Settings Store - localStorage persistence for app settings

import type {
  AppSettings,
  LabProfile,
  ReportSettings,
  NotificationTemplate,
  PrintSettings,
  StaffUser,
} from '@/types/settings';

const STORAGE_KEY = 'nxa_settings_v1';

const isBrowser = (): boolean => typeof window !== 'undefined';

// Default Settings
const DEFAULT_SETTINGS: AppSettings = {
  labProfile: {
    labName: 'NXA Pathology',
    tagline: 'Accurate Results, Trusted Care',
    phone: '+91-9876543210',
    email: 'info@nxapathology.com',
    address: {
      line1: '123, Medical Complex',
      line2: 'Near City Hospital',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    logoDataUrl: undefined,
    nabl: {
      enabled: true,
      registrationNo: 'NABL-TC-12345',
    },
    abdm: {
      enabled: false,
      facilityId: undefined,
    },
  },
  report: {
    defaultReportFormat: 'A4',
    showReferenceRanges: true,
    showMethodology: true,
    showBarcodeOnReport: true,
    autoPublishAfterSignature: false,
    footerNote: 'This is a computer-generated report and does not require a signature.',
  },
  notifications: [
    {
      templateId: 'tpl-booking-confirm',
      type: 'BookingConfirmation',
      channel: 'SMS',
      enabled: true,
      templateText: 'Dear {{patientName}}, your booking is confirmed. Token: {{token}}. Date: {{bookingDate}}. Tests: {{testNames}}. {{labName}} - {{labPhone}}',
      variables: ['patientName', 'token', 'bookingDate', 'testNames', 'labName', 'labPhone'],
    },
    {
      templateId: 'tpl-sample-collected',
      type: 'SampleCollected',
      channel: 'SMS',
      enabled: true,
      templateText: 'Dear {{patientName}}, your sample ({{sampleId}}) has been collected. Expected report date: {{expectedReportDate}}. Thank you, {{labName}}',
      variables: ['patientName', 'token', 'sampleId', 'expectedReportDate', 'labName'],
    },
    {
      templateId: 'tpl-report-published',
      type: 'ReportPublished',
      channel: 'SMS',
      enabled: true,
      templateText: 'Dear {{patientName}}, your report for Token {{token}} is ready. Download: {{reportLink}}. {{labName}} - {{labPhone}}',
      variables: ['patientName', 'token', 'reportLink', 'labName', 'labPhone'],
    },
    {
      templateId: 'tpl-critical-alert',
      type: 'CriticalAlert',
      channel: 'SMS',
      enabled: true,
      templateText: 'URGENT: {{patientName}}, your {{testName}} result ({{criticalValue}}) requires immediate attention. Please contact {{labName}} at {{labPhone}}',
      variables: ['patientName', 'token', 'testName', 'criticalValue', 'labName', 'labPhone'],
    },
  ],
  print: {
    tokenSlipEnabled: true,
    tokenSlipSize: '80mm',
    defaultPrinterName: 'Thermal Printer',
    marginMm: 5,
  },
  users: [
    {
      userId: 'user-admin-001',
      name: 'Dr. Admin',
      phone: '+91-9876543210',
      role: 'Admin',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'user-staff-001',
      name: 'Reception Staff',
      phone: '+91-9876543211',
      role: 'Staff',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      userId: 'user-path-001',
      name: 'Dr. Pathologist',
      phone: '+91-9876543212',
      role: 'Pathologist',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

// Read settings from localStorage
const readSettings = (): AppSettings => {
  if (!isBrowser()) {
    return DEFAULT_SETTINGS;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    return JSON.parse(raw) as AppSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// Write settings to localStorage
const writeSettings = (settings: AppSettings): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

// Initialize with defaults if not exists
const initializeSettings = (): void => {
  if (!isBrowser()) {
    return;
  }

  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    writeSettings(DEFAULT_SETTINGS);
  }
};

// Get all settings
export const getSettings = (): AppSettings => {
  return readSettings();
};

// Update Lab Profile
export const updateLabProfile = (partial: Partial<LabProfile>): AppSettings => {
  const settings = readSettings();
  settings.labProfile = {
    ...settings.labProfile,
    ...partial,
    // Handle nested address
    address: partial.address 
      ? { ...settings.labProfile.address, ...partial.address }
      : settings.labProfile.address,
    // Handle nested nabl
    nabl: partial.nabl 
      ? { ...settings.labProfile.nabl, ...partial.nabl }
      : settings.labProfile.nabl,
    // Handle nested abdm
    abdm: partial.abdm 
      ? { ...settings.labProfile.abdm, ...partial.abdm }
      : settings.labProfile.abdm,
  };
  writeSettings(settings);
  return settings;
};

// Update Report Settings
export const updateReportSettings = (partial: Partial<ReportSettings>): AppSettings => {
  const settings = readSettings();
  settings.report = {
    ...settings.report,
    ...partial,
  };
  writeSettings(settings);
  return settings;
};

// Get all templates
export const getTemplates = (): NotificationTemplate[] => {
  const settings = readSettings();
  return settings.notifications;
};

// Get template by ID
export const getTemplate = (templateId: string): NotificationTemplate | null => {
  const settings = readSettings();
  return settings.notifications.find(t => t.templateId === templateId) || null;
};

// Upsert (create or update) template
export const upsertTemplate = (template: NotificationTemplate): AppSettings => {
  const settings = readSettings();
  const index = settings.notifications.findIndex(t => t.templateId === template.templateId);
  
  if (index >= 0) {
    settings.notifications[index] = template;
  } else {
    settings.notifications.push(template);
  }
  
  writeSettings(settings);
  return settings;
};

// Toggle template enabled status
export const toggleTemplate = (templateId: string, enabled: boolean): AppSettings => {
  const settings = readSettings();
  const template = settings.notifications.find(t => t.templateId === templateId);
  
  if (template) {
    template.enabled = enabled;
    writeSettings(settings);
  }
  
  return settings;
};

// Delete template
export const deleteTemplate = (templateId: string): AppSettings => {
  const settings = readSettings();
  settings.notifications = settings.notifications.filter(t => t.templateId !== templateId);
  writeSettings(settings);
  return settings;
};

// Update Print Settings
export const updatePrintSettings = (partial: Partial<PrintSettings>): AppSettings => {
  const settings = readSettings();
  settings.print = {
    ...settings.print,
    ...partial,
  };
  writeSettings(settings);
  return settings;
};

// Get all users
export const getUsers = (): StaffUser[] => {
  const settings = readSettings();
  return settings.users;
};

// Get user by ID
export const getUser = (userId: string): StaffUser | null => {
  const settings = readSettings();
  return settings.users.find(u => u.userId === userId) || null;
};

// Upsert (create or update) user
export const upsertUser = (user: Partial<StaffUser> & { userId?: string }): AppSettings => {
  const settings = readSettings();
  
  if (user.userId) {
    // Update existing
    const index = settings.users.findIndex(u => u.userId === user.userId);
    if (index >= 0) {
      settings.users[index] = {
        ...settings.users[index],
        ...user,
        updatedAt: new Date().toISOString(),
      };
    }
  } else {
    // Create new
    const newUser: StaffUser = {
      userId: `user-${Date.now()}`,
      name: user.name || 'New User',
      phone: user.phone,
      role: user.role || 'Staff',
      active: user.active !== undefined ? user.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    settings.users.push(newUser);
  }
  
  writeSettings(settings);
  return settings;
};

// Deactivate user
export const deactivateUser = (userId: string): AppSettings => {
  const settings = readSettings();
  const user = settings.users.find(u => u.userId === userId);
  
  if (user) {
    user.active = false;
    user.updatedAt = new Date().toISOString();
    writeSettings(settings);
  }
  
  return settings;
};

// Activate user
export const activateUser = (userId: string): AppSettings => {
  const settings = readSettings();
  const user = settings.users.find(u => u.userId === userId);
  
  if (user) {
    user.active = true;
    user.updatedAt = new Date().toISOString();
    writeSettings(settings);
  }
  
  return settings;
};

// Delete user
export const deleteUser = (userId: string): AppSettings => {
  const settings = readSettings();
  settings.users = settings.users.filter(u => u.userId !== userId);
  writeSettings(settings);
  return settings;
};

// Render template with variables
export const renderTemplate = (
  templateText: string,
  variables: Record<string, string>
): string => {
  let rendered = templateText;
  
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, variables[key]);
  });
  
  return rendered;
};

// Auto-initialize on import (client-side only)
if (isBrowser()) {
  initializeSettings();
}
