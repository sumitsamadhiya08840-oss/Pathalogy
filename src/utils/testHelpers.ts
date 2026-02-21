// Test Helper Functions

import type { Test, Package, TestCategory, TestParameter, SampleType, ReportTime } from '@/types/test';

/**
 * Generate test code based on category
 */
export function generateTestCode(category: TestCategory): string {
  const prefixes: Record<TestCategory, string> = {
    Hematology: 'HEM',
    Biochemistry: 'BIO',
    Microbiology: 'MIC',
    Immunology: 'IMM',
    Pathology: 'PAT',
    Radiology: 'RAD',
    Other: 'OTH',
  };

  const prefix = prefixes[category] || 'TST';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}

/**
 * Generate package code
 */
export function generatePackageCode(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PKG-${randomNum}`;
}

/**
 * Calculate package discount percentage
 */
export function calculatePackageDiscount(individualTotal: number, packagePrice: number): number {
  if (individualTotal === 0) return 0;
  const discount = ((individualTotal - packagePrice) / individualTotal) * 100;
  return Math.round(discount * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate savings amount
 */
export function calculateSavings(individualTotal: number, packagePrice: number): number {
  return Math.max(0, individualTotal - packagePrice);
}

/**
 * Format price with rupee symbol
 */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Get category color for chips
 */
export function getCategoryColor(
  category: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  const colorMap: Record<string, any> = {
    Hematology: 'error',
    Biochemistry: 'primary',
    Microbiology: 'success',
    Immunology: 'info',
    Pathology: 'warning',
    Radiology: 'secondary',
    Other: 'default',
  };
  return colorMap[category] || 'default';
}

/**
 * Get sample type icon
 */
export function getSampleTypeIcon(sampleType: SampleType): string {
  const iconMap: Record<SampleType, string> = {
    Blood: '🩸',
    Urine: '💧',
    Stool: '💩',
    Sputum: '🫁',
    Tissue: '🧬',
    Serum: '🩸',
    Plasma: '🩸',
    CSF: '🧠',
    Other: '🔬',
  };
  return iconMap[sampleType] || '🔬';
}

/**
 * Export tests to Excel/CSV
 */
export function exportToExcel(tests: Test[], filename: string = 'tests'): void {
  const headers = [
    'Test Code',
    'Test Name',
    'Category',
    'Sample Type',
    'Base Price',
    'Report Time',
    'Fasting Required',
    'Machine',
    'Status',
  ];

  const rows = tests.map(test => [
    test.testCode,
    test.testName,
    test.category,
    test.sampleType,
    test.basePrice.toString(),
    test.reportTime,
    test.fastingRequired ? 'Yes' : 'No',
    test.machineInstrument || 'Manual',
    test.status,
  ]);

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export packages to Excel/CSV
 */
export function exportPackagesToExcel(packages: Package[], filename: string = 'packages'): void {
  const headers = [
    'Package Code',
    'Package Name',
    'Category',
    'Tests Count',
    'Individual Total',
    'Package Price',
    'Discount %',
    'Status',
  ];

  const rows = packages.map(pkg => [
    pkg.packageCode,
    pkg.packageName,
    pkg.category,
    pkg.includedTests.length.toString(),
    pkg.individualTotal.toString(),
    pkg.packagePrice.toString(),
    pkg.discountPercent.toFixed(2),
    pkg.status,
  ]);

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print test catalog
 */
export function printTestCatalog(tests: Test[]): void {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Catalog</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #1976d2; }
        .test { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }
        .test-name { font-weight: bold; font-size: 16px; }
        .test-code { color: #666; }
        .price { color: #2e7d32; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <h1>Test Catalog</h1>
      ${tests
        .map(
          test => `
        <div class="test">
          <div class="test-name">${test.testName}</div>
          <div class="test-code">Code: ${test.testCode} | Category: ${test.category}</div>
          <div class="price">Price: ${formatPrice(test.basePrice)}</div>
          <p><strong>Sample Type:</strong> ${test.sampleType} | <strong>Report Time:</strong> ${test.reportTime}</p>
          ${
            test.parameters.length > 0
              ? `
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Unit</th>
                <th>Normal Range</th>
              </tr>
            </thead>
            <tbody>
              ${test.parameters
                .map(
                  param => `
                <tr>
                  <td>${param.parameterName}</td>
                  <td>${param.unit}</td>
                  <td>${formatNormalRange(param)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          `
              : ''
          }
        </div>
      `
        )
        .join('')}
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

/**
 * Format normal range for display
 */
function formatNormalRange(param: TestParameter): string {
  const ranges: string[] = [];
  if (param.normalRange.male) {
    ranges.push(`M: ${param.normalRange.male.from}-${param.normalRange.male.to}`);
  }
  if (param.normalRange.female) {
    ranges.push(`F: ${param.normalRange.female.from}-${param.normalRange.female.to}`);
  }
  if (param.normalRange.children) {
    ranges.push(`C: ${param.normalRange.children.from}-${param.normalRange.children.to}`);
  }
  return ranges.join(', ') || 'N/A';
}

/**
 * Parse bulk import CSV
 */
export async function parseBulkImportCSV(file: File): Promise<{
  tests: Partial<Test>[];
  errors: Array<{ row: number; message: string }>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const tests: Partial<Test>[] = [];
        const errors: Array<{ row: number; message: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map(v => v.trim());
          const test: Partial<Test> = {};

          try {
            test.testCode = values[0];
            test.testName = values[1];
            test.category = values[2] as TestCategory;
            test.sampleType = values[3] as SampleType;
            test.basePrice = parseFloat(values[4]);
            test.reportTime = values[5] as ReportTime;
            test.fastingRequired = values[6].toLowerCase() === 'yes';

            // Basic validation
            if (!test.testCode || !test.testName || !test.category) {
              errors.push({ row: i + 1, message: 'Missing required fields' });
            } else {
              tests.push(test);
            }
          } catch (error) {
            errors.push({ row: i + 1, message: 'Invalid data format' });
          }
        }

        resolve({ tests, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Download CSV template for bulk import
 */
export function downloadCSVTemplate(): void {
  const headers = [
    'Test Code',
    'Test Name',
    'Category',
    'Sample Type',
    'Base Price',
    'Report Time',
    'Fasting Required',
    'Machine',
  ];

  const sampleRow = [
    'HEM-12345',
    'Complete Blood Count',
    'Hematology',
    'Blood',
    '500',
    '4 Hours',
    'No',
    'Sysmex XN-1000',
  ];

  const csvContent = [headers, sampleRow].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'test_import_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Search tests by name, code, or category
 */
export function searchTests(tests: Test[], query: string): Test[] {
  if (!query || query.trim() === '') return tests;

  const lowerQuery = query.toLowerCase().trim();

  return tests.filter(
    test =>
      test.testName.toLowerCase().includes(lowerQuery) ||
      test.testCode.toLowerCase().includes(lowerQuery) ||
      test.category.toLowerCase().includes(lowerQuery) ||
      test.shortName.toLowerCase().includes(lowerQuery) ||
      test.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Filter tests by criteria
 */
export function filterTests(
  tests: Test[],
  filters: {
    category?: string;
    sampleType?: string;
    status?: string;
    priceFrom?: number;
    priceTo?: number;
  }
): Test[] {
  let filtered = [...tests];

  if (filters.category && filters.category !== 'All') {
    filtered = filtered.filter(test => test.category === filters.category);
  }

  if (filters.sampleType && filters.sampleType !== 'All') {
    filtered = filtered.filter(test => test.sampleType === filters.sampleType);
  }

  if (filters.status && filters.status !== 'All') {
    filtered = filtered.filter(test => test.status === filters.status);
  }

  if (filters.priceFrom !== undefined && filters.priceFrom > 0) {
    filtered = filtered.filter(test => test.basePrice >= filters.priceFrom!);
  }

  if (filters.priceTo !== undefined && filters.priceTo > 0) {
    filtered = filtered.filter(test => test.basePrice <= filters.priceTo!);
  }

  return filtered;
}

/**
 * Search packages
 */
export function searchPackages(packages: Package[], query: string): Package[] {
  if (!query || query.trim() === '') return packages;

  const lowerQuery = query.toLowerCase().trim();

  return packages.filter(
    pkg =>
      pkg.packageName.toLowerCase().includes(lowerQuery) ||
      pkg.packageCode.toLowerCase().includes(lowerQuery) ||
      pkg.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter packages
 */
export function filterPackages(
  packages: Package[],
  filters: {
    category?: string;
    status?: string;
    priceFrom?: number;
    priceTo?: number;
  }
): Package[] {
  let filtered = [...packages];

  if (filters.category && filters.category !== 'All') {
    filtered = filtered.filter(pkg => pkg.category === filters.category);
  }

  if (filters.status && filters.status !== 'All') {
    filtered = filtered.filter(pkg => pkg.status === filters.status);
  }

  if (filters.priceFrom !== undefined && filters.priceFrom > 0) {
    filtered = filtered.filter(pkg => pkg.packagePrice >= filters.priceFrom!);
  }

  if (filters.priceTo !== undefined && filters.priceTo > 0) {
    filtered = filtered.filter(pkg => pkg.packagePrice <= filters.priceTo!);
  }

  return filtered;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Get report time in hours (for sorting/comparison)
 */
export function getReportTimeHours(reportTime: ReportTime): number {
  const timeMap: Record<ReportTime, number> = {
    '2 Hours': 2,
    '4 Hours': 4,
    '6 Hours': 6,
    'Same Day': 12,
    '24 Hours': 24,
    '48 Hours': 48,
    '72 Hours': 72,
    '1 Week': 168,
  };
  return timeMap[reportTime] || 24;
}

/**
 * Calculate package report time (max of all included tests)
 */
export function calculatePackageReportTime(tests: Test[]): ReportTime {
  if (tests.length === 0) return '24 Hours';

  const maxHours = Math.max(...tests.map(test => getReportTimeHours(test.reportTime)));

  if (maxHours <= 2) return '2 Hours';
  if (maxHours <= 4) return '4 Hours';
  if (maxHours <= 6) return '6 Hours';
  if (maxHours <= 12) return 'Same Day';
  if (maxHours <= 24) return '24 Hours';
  if (maxHours <= 48) return '48 Hours';
  if (maxHours <= 72) return '72 Hours';
  return '1 Week';
}

/**
 * Get unique sample types from tests
 */
export function getUniqueSampleTypes(tests: Test[]): SampleType[] {
  const sampleTypes = new Set(tests.map(test => test.sampleType));
  return Array.from(sampleTypes);
}

/**
 * Check if package requires fasting
 */
export function packageRequiresFasting(tests: Test[]): boolean {
  return tests.some(test => test.fastingRequired);
}
