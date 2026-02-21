'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Divider,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tooltip,
  Slider,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import type {
  Test,
  Package,
  TestCategory,
  SampleType,
  TestFormData,
  PackageFormData,
  TestParameter,
  ContainerType,
  ReportTime,
  ReportFormat,
  AnalysisMethod,
  GenderSpecific,
  PackageCategory,
} from '@/types/test';
import {
  TEST_CATEGORIES,
  SAMPLE_TYPES,
  CONTAINER_TYPES,
  REPORT_TIMES,
  REPORT_FORMATS,
  ANALYSIS_METHODS,
  MACHINES,
  DEPARTMENTS,
  PACKAGE_CATEGORIES,
} from '@/types/test';
import { validateTestForm, validatePackageForm } from '@/utils/testValidation';
import {
  generateTestCode,
  generatePackageCode,
  formatPrice,
  getCategoryColor,
  getSampleTypeIcon,
  exportToExcel,
  exportPackagesToExcel,
  printTestCatalog,
  searchTests,
  filterTests,
  searchPackages,
  filterPackages,
  debounce,
  calculatePackageDiscount,
  calculateSavings,
  downloadCSVTemplate,
} from '@/utils/testHelpers';

type TabValue = 'tests' | 'packages';

export default function TestsPage() {
  // State management
  const [activeTab, setActiveTab] = useState<TabValue>('tests');
  const [tests, setTests] = useState<Test[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [testFilters, setTestFilters] = useState({
    category: 'All',
    sampleType: 'All',
    status: 'All',
    priceRange: [0, 10000] as number[],
  });
  const [packageFilters, setPackageFilters] = useState({
    category: 'All',
    status: 'All',
    priceRange: [0, 50000] as number[],
  });

  // Dialog states
  const [addTestDialogOpen, setAddTestDialogOpen] = useState(false);
  const [editTestDialogOpen, setEditTestDialogOpen] = useState(false);
  const [testDetailsDialogOpen, setTestDetailsDialogOpen] = useState(false);
  const [addPackageDialogOpen, setAddPackageDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [isEditModeTest, setIsEditModeTest] = useState(false);
  const [isEditModePackage, setIsEditModePackage] = useState(false);

  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Form states
  const [testFormData, setTestFormData] = useState<TestFormData>(getEmptyTestForm());
  const [packageFormData, setPackageFormData] = useState<PackageFormData>(getEmptyPackageForm());
  const [testFormErrors, setTestFormErrors] = useState<Record<string, string>>({});
  const [packageFormErrors, setPackageFormErrors] = useState<Record<string, string>>({});

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setTests(getDummyTests());
      setPackages(getDummyPackages());
      setLoading(false);
    }, 1000);
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filtered data with search and filters
  const filteredTests = useMemo(() => {
    let result = searchTests(tests, searchQuery);
    result = filterTests(result, {
      category: testFilters.category !== 'All' ? testFilters.category : undefined,
      sampleType: testFilters.sampleType !== 'All' ? testFilters.sampleType : undefined,
      status: testFilters.status !== 'All' ? testFilters.status : undefined,
      priceFrom: testFilters.priceRange[0],
      priceTo: testFilters.priceRange[1],
    });
    return result;
  }, [tests, searchQuery, testFilters]);

  const filteredPackages = useMemo(() => {
    let result = searchPackages(packages, searchQuery);
    result = filterPackages(result, {
      category: packageFilters.category !== 'All' ? packageFilters.category : undefined,
      status: packageFilters.status !== 'All' ? packageFilters.status : undefined,
      priceFrom: packageFilters.priceRange[0],
      priceTo: packageFilters.priceRange[1],
    });
    return result;
  }, [packages, searchQuery, packageFilters]);

  // Handle test form changes
  const handleTestFormChange = (field: keyof TestFormData, value: any) => {
    setTestFormData(prev => ({ ...prev, [field]: value }));
    if (testFormErrors[field]) {
      setTestFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle package form changes
  const handlePackageFormChange = (field: keyof PackageFormData, value: any) => {
    setPackageFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate discount and savings
      if (field === 'packagePrice' || field === 'individualTotal') {
        const price = parseFloat(field === 'packagePrice' ? value : updated.packagePrice);
        const total = field === 'individualTotal' ? value : updated.individualTotal;
        if (!isNaN(price) && total > 0) {
          updated.discountPercent = calculatePackageDiscount(total, price);
          updated.savingsAmount = calculateSavings(total, price);
        }
      }

      // Calculate final price
      const homeCharges = parseFloat(updated.homeCollectionCharges) || 0;
      const pkgPrice = parseFloat(updated.packagePrice) || 0;
      updated.finalPrice = pkgPrice + homeCharges;

      return updated;
    });

    if (packageFormErrors[field]) {
      setPackageFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Save test
  const handleSaveTest = () => {
    const validation = validateTestForm(testFormData);

    if (!validation.isValid) {
      setTestFormErrors(validation.errors);
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    if (isEditModeTest && selectedTest) {
      // Update existing test
      const updatedTest: Test = {
        ...selectedTest,
        testCode: testFormData.testCode,
        testName: testFormData.testName,
        shortName: testFormData.shortName,
        category: testFormData.category as TestCategory,
        subCategory: testFormData.subCategory || undefined,
        description: testFormData.description || undefined,
        keywords: testFormData.keywords,
        sampleType: testFormData.sampleType as SampleType,
        sampleVolume: testFormData.sampleVolume || undefined,
        containerType: testFormData.containerType || undefined,
        numberOfContainers: testFormData.numberOfContainers ? parseInt(testFormData.numberOfContainers) : undefined,
        sampleHandlingInstructions: testFormData.sampleHandlingInstructions || undefined,
        specialPrecautions: testFormData.specialPrecautions || undefined,
        fastingRequired: testFormData.fastingRequired,
        fastingDuration: testFormData.fastingDuration || undefined,
        medicationsToAvoid: testFormData.medicationsToAvoid,
        otherInstructions: testFormData.otherInstructions || undefined,
        basePrice: parseFloat(testFormData.basePrice),
        discountAllowed: testFormData.discountAllowed,
        maxDiscountPercent: testFormData.maxDiscountPercent ? parseFloat(testFormData.maxDiscountPercent) : undefined,
        emergencyCharges: testFormData.emergencyCharges ? parseFloat(testFormData.emergencyCharges) : undefined,
        homeCollectionCharges: testFormData.homeCollectionCharges ? parseFloat(testFormData.homeCollectionCharges) : undefined,
        packageInclusionAllowed: testFormData.packageInclusionAllowed,
        reportTime: testFormData.reportTime as any,
        reportFormat: testFormData.reportFormat as any,
        reportTemplate: testFormData.reportTemplate || undefined,
        criticalValueAlert: testFormData.criticalValueAlert,
        parameters: testFormData.parameters,
        analysisMethod: testFormData.analysisMethod as any,
        machineInstrument: testFormData.machineInstrument || undefined,
        machineTestCode: testFormData.machineTestCode || undefined,
        qcRequirements: testFormData.qcRequirements || undefined,
        department: testFormData.department || undefined,
        requiresDoctorApproval: testFormData.requiresDoctorApproval,
        minAge: testFormData.minAge ? parseInt(testFormData.minAge) : undefined,
        maxAge: testFormData.maxAge ? parseInt(testFormData.maxAge) : undefined,
        genderSpecific: testFormData.genderSpecific,
        consentFormRequired: testFormData.consentFormRequired,
      };

      setTests(prev => prev.map(t => t.id === selectedTest.id ? updatedTest : t));
      showSnackbar(`Test "${updatedTest.testName}" updated successfully`, 'success');
    } else {
      // Add new test
      const newTest: Test = {
        id: `test_${Date.now()}`,
        testCode: testFormData.testCode,
        testName: testFormData.testName,
        shortName: testFormData.shortName,
        category: testFormData.category as TestCategory,
        subCategory: testFormData.subCategory || undefined,
        description: testFormData.description || undefined,
        keywords: testFormData.keywords,
        sampleType: testFormData.sampleType as SampleType,
        sampleVolume: testFormData.sampleVolume || undefined,
        containerType: testFormData.containerType || undefined,
        numberOfContainers: testFormData.numberOfContainers ? parseInt(testFormData.numberOfContainers) : undefined,
        sampleHandlingInstructions: testFormData.sampleHandlingInstructions || undefined,
        specialPrecautions: testFormData.specialPrecautions || undefined,
        fastingRequired: testFormData.fastingRequired,
        fastingDuration: testFormData.fastingDuration || undefined,
        medicationsToAvoid: testFormData.medicationsToAvoid,
        otherInstructions: testFormData.otherInstructions || undefined,
        basePrice: parseFloat(testFormData.basePrice),
        discountAllowed: testFormData.discountAllowed,
        maxDiscountPercent: testFormData.maxDiscountPercent ? parseFloat(testFormData.maxDiscountPercent) : undefined,
        emergencyCharges: testFormData.emergencyCharges ? parseFloat(testFormData.emergencyCharges) : undefined,
        homeCollectionCharges: testFormData.homeCollectionCharges ? parseFloat(testFormData.homeCollectionCharges) : undefined,
        packageInclusionAllowed: testFormData.packageInclusionAllowed,
        reportTime: testFormData.reportTime as any,
        reportFormat: testFormData.reportFormat as any,
        reportTemplate: testFormData.reportTemplate || undefined,
        criticalValueAlert: testFormData.criticalValueAlert,
        parameters: testFormData.parameters,
        analysisMethod: testFormData.analysisMethod as any,
        machineInstrument: testFormData.machineInstrument || undefined,
        machineTestCode: testFormData.machineTestCode || undefined,
        qcRequirements: testFormData.qcRequirements || undefined,
        department: testFormData.department || undefined,
        requiresDoctorApproval: testFormData.requiresDoctorApproval,
        minAge: testFormData.minAge ? parseInt(testFormData.minAge) : undefined,
        maxAge: testFormData.maxAge ? parseInt(testFormData.maxAge) : undefined,
        genderSpecific: testFormData.genderSpecific,
        consentFormRequired: testFormData.consentFormRequired,
        status: 'Active',
        createdDate: new Date().toISOString().split('T')[0],
        timesPerformed: 0,
        revenueGenerated: 0,
      };

      setTests(prev => [...prev, newTest]);
      showSnackbar(`Test "${newTest.testName}" added successfully with code ${newTest.testCode}`, 'success');
    }
    
    setAddTestDialogOpen(false);
    setIsEditModeTest(false);
    setSelectedTest(null);
    setTestFormData(getEmptyTestForm());
    setTestFormErrors({});
  };

  // Save package
  const handleSavePackage = () => {
    const validation = validatePackageForm(packageFormData);

    if (!validation.isValid) {
      setPackageFormErrors(validation.errors);
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }

    if (isEditModePackage && selectedPackage) {
      // Update existing package
      const updatedPackage: Package = {
        ...selectedPackage,
        packageCode: packageFormData.packageCode,
        packageName: packageFormData.packageName,
        category: packageFormData.category as any,
        description: packageFormData.description || undefined,
        targetAudience: packageFormData.targetAudience,
        includedTests: packageFormData.includedTests,
        individualTotal: packageFormData.individualTotal,
        packagePrice: parseFloat(packageFormData.packagePrice),
        discountPercent: packageFormData.discountPercent,
        savingsAmount: packageFormData.savingsAmount,
        homeCollectionCharges: packageFormData.homeCollectionCharges ? parseFloat(packageFormData.homeCollectionCharges) : undefined,
        finalPrice: packageFormData.finalPrice,
        minAge: packageFormData.minAge ? parseInt(packageFormData.minAge) : undefined,
        maxAge: packageFormData.maxAge ? parseInt(packageFormData.maxAge) : undefined,
        genderSpecific: packageFormData.genderSpecific,
        packageImage: packageFormData.packageImage || undefined,
        highlightPoints: packageFormData.highlightPoints,
        recommendedFor: packageFormData.recommendedFor || undefined,
        displayOnWebsite: packageFormData.displayOnWebsite,
        featuredPackage: packageFormData.featuredPackage,
      };

      setPackages(prev => prev.map(p => p.id === selectedPackage.id ? updatedPackage : p));
      showSnackbar(`Package "${updatedPackage.packageName}" updated successfully`, 'success');
    } else {
      // Add new package
      const newPackage: Package = {
        id: `pkg_${Date.now()}`,
        packageCode: packageFormData.packageCode,
        packageName: packageFormData.packageName,
        category: packageFormData.category as any,
        description: packageFormData.description || undefined,
        targetAudience: packageFormData.targetAudience,
        includedTests: packageFormData.includedTests,
        individualTotal: packageFormData.individualTotal,
        packagePrice: parseFloat(packageFormData.packagePrice),
        discountPercent: packageFormData.discountPercent,
        savingsAmount: packageFormData.savingsAmount,
        homeCollectionCharges: packageFormData.homeCollectionCharges ? parseFloat(packageFormData.homeCollectionCharges) : undefined,
        finalPrice: packageFormData.finalPrice,
        sampleTypesRequired: [],
        fastingRequired: false,
        reportTime: '24 Hours',
        minAge: packageFormData.minAge ? parseInt(packageFormData.minAge) : undefined,
        maxAge: packageFormData.maxAge ? parseInt(packageFormData.maxAge) : undefined,
        genderSpecific: packageFormData.genderSpecific,
        packageImage: packageFormData.packageImage || undefined,
        highlightPoints: packageFormData.highlightPoints,
        recommendedFor: packageFormData.recommendedFor || undefined,
        displayOnWebsite: packageFormData.displayOnWebsite,
        featuredPackage: packageFormData.featuredPackage,
        status: 'Active',
        popularity: 0,
        createdDate: new Date().toISOString().split('T')[0],
      };

      setPackages(prev => [...prev, newPackage]);
      showSnackbar(`Package "${newPackage.packageName}" created successfully`, 'success');
    }
    
    setAddPackageDialogOpen(false);
    setIsEditModePackage(false);
    setSelectedPackage(null);
    setPackageFormData(getEmptyPackageForm());
    setPackageFormErrors({});
  };

  // Duplicate test
  const handleDuplicateTest = (test: Test) => {
    const newCode = generateTestCode(test.category);
    setTestFormData({
      testCode: newCode,
      testName: `Copy of ${test.testName}`,
      shortName: test.shortName,
      category: test.category,
      subCategory: test.subCategory || '',
      description: test.description || '',
      keywords: test.keywords || [],
      sampleType: test.sampleType,
      sampleVolume: test.sampleVolume || '',
      containerType: test.containerType || '',
      numberOfContainers: test.numberOfContainers?.toString() || '',
      sampleHandlingInstructions: test.sampleHandlingInstructions || '',
      specialPrecautions: test.specialPrecautions || '',
      fastingRequired: test.fastingRequired,
      fastingDuration: test.fastingDuration || '',
      medicationsToAvoid: test.medicationsToAvoid || [],
      otherInstructions: test.otherInstructions || '',
      basePrice: test.basePrice.toString(),
      discountAllowed: test.discountAllowed,
      maxDiscountPercent: test.maxDiscountPercent?.toString() || '',
      emergencyCharges: test.emergencyCharges?.toString() || '',
      homeCollectionCharges: test.homeCollectionCharges?.toString() || '',
      packageInclusionAllowed: test.packageInclusionAllowed,
      reportTime: test.reportTime,
      reportFormat: test.reportFormat,
      reportTemplate: test.reportTemplate || '',
      criticalValueAlert: test.criticalValueAlert,
      parameters: [...test.parameters],
      analysisMethod: test.analysisMethod,
      machineInstrument: test.machineInstrument || '',
      machineTestCode: test.machineTestCode || '',
      qcRequirements: test.qcRequirements || '',
      department: test.department || '',
      requiresDoctorApproval: test.requiresDoctorApproval,
      minAge: test.minAge?.toString() || '',
      maxAge: test.maxAge?.toString() || '',
      genderSpecific: test.genderSpecific,
      consentFormRequired: test.consentFormRequired,
    });
    setAddTestDialogOpen(true);
    showSnackbar('Test duplicated. Modify and save as new.', 'info');
  };

  // Delete test
  const handleDeleteTest = (testId: string) => {
    if (confirm('Are you sure you want to delete this test?')) {
      setTests(prev => prev.filter(t => t.id !== testId));
      showSnackbar('Test deleted successfully', 'success');
    }
  };

  // Delete package
  const handleDeletePackage = (packageId: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      setPackages(prev => prev.filter(p => p.id !== packageId));
      showSnackbar('Package deleted successfully', 'success');
    }
  };

  // Toggle test status
  const handleToggleTestStatus = (testId: string) => {
    setTests(prev =>
      prev.map(test =>
        test.id === testId
          ? { ...test, status: test.status === 'Active' ? 'Inactive' as const : 'Active' as const }
          : test
      )
    );
  };

  // Add parameter to test form
  const handleAddParameter = () => {
    const newParam: TestParameter = {
      id: `param_${Date.now()}`,
      parameterName: '',
      shortName: '',
      unit: '',
      normalRange: {},
      displayOrder: testFormData.parameters.length + 1,
    };
    setTestFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, newParam],
    }));
  };

  // Remove parameter
  const handleRemoveParameter = (paramId: string) => {
    setTestFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter(p => p.id !== paramId),
    }));
  };

  // Update parameter
  const handleUpdateParameter = (paramId: string, field: string, value: any) => {
    setTestFormData(prev => ({
      ...prev,
      parameters: prev.parameters.map(p =>
        p.id === paramId ? { ...p, [field]: value } : p
      ),
    }));
  };

  // Handle bulk import file upload
  const handleBulkImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate file processing
    showSnackbar('Processing import file...', 'info');
    setTimeout(() => {
      // Mock: Import 5 tests
      const mockImportedTests = getDummyTests().slice(0, 5);
      setTests(prev => [...mockImportedTests, ...prev]);
      showSnackbar(`Successfully imported ${mockImportedTests.length} tests`, 'success');
      setBulkImportDialogOpen(false);
    }, 1500);
  };

  // Handle export tests
  const handleExportTests = () => {
    exportToExcel(tests, 'tests_catalog');
    showSnackbar('Tests exported successfully', 'success');
  };

  // Handle export packages  
  const handleExportPackages = () => {
    exportPackagesToExcel(packages, 'packages_catalog');
    showSnackbar('Packages exported successfully', 'success');
  };

  // Handle print catalog
  const handlePrintCatalog = () => {
    printTestCatalog(activeTab === 'tests' ? tests : packages, activeTab);
    showSnackbar('Sending to printer...', 'info');
  };

  // Tests DataGrid columns
  const testColumns: GridColDef[] = [
    {
      field: 'testCode',
      headerName: 'Test Code',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'testName',
      headerName: 'Test Name',
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Click to view details">
          <Typography
            variant="body2"
            sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => {
              setSelectedTest(params.row);
              setTestDetailsDialogOpen(true);
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getCategoryColor(params.value as string)} size="small" />
      ),
    },
    {
      field: 'basePrice',
      headerName: 'Price',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatPrice(params.value)}
        </Typography>
      ),
    },
    {
      field: 'sampleType',
      headerName: 'Sample Type',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>{getSampleTypeIcon(params.value)}</span>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'reportTime',
      headerName: 'Report Time',
      width: 110,
    },
    {
      field: 'fastingRequired',
      headerName: 'Fasting',
      width: 90,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'warning' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'machineInstrument',
      headerName: 'Machine',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" noWrap>
          {params.value || 'Manual'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Switch
          checked={params.value === 'Active'}
          onChange={() => handleToggleTestStatus(params.row.id)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => {
                setSelectedTest(params.row);
                setTestFormData({
                  testCode: params.row.testCode,
                  testName: params.row.testName,
                  shortName: params.row.shortName,
                  category: params.row.category,
                  subCategory: params.row.subCategory || '',
                  description: params.row.description || '',
                  keywords: params.row.keywords,
                  sampleType: params.row.sampleType,
                  sampleVolume: params.row.sampleVolume || '',
                  containerType: params.row.containerType || '',
                  numberOfContainers: params.row.numberOfContainers?.toString() || '',
                  sampleHandlingInstructions: params.row.sampleHandlingInstructions || '',
                  specialPrecautions: params.row.specialPrecautions || '',
                  fastingRequired: params.row.fastingRequired,
                  fastingDuration: params.row.fastingDuration || '',
                  medicationsToAvoid: params.row.medicationsToAvoid,
                  otherInstructions: params.row.otherInstructions || '',
                  basePrice: params.row.basePrice.toString(),
                  discountAllowed: params.row.discountAllowed,
                  maxDiscountPercent: params.row.maxDiscountPercent?.toString() || '',
                  emergencyCharges: params.row.emergencyCharges?.toString() || '',
                  homeCollectionCharges: params.row.homeCollectionCharges?.toString() || '',
                  packageInclusionAllowed: params.row.packageInclusionAllowed,
                  reportTime: params.row.reportTime,
                  reportFormat: params.row.reportFormat,
                  reportTemplate: params.row.reportTemplate || '',
                  criticalValueAlert: params.row.criticalValueAlert,
                  parameters: params.row.parameters,
                  analysisMethod: params.row.analysisMethod,
                  machineInstrument: params.row.machineInstrument || '',
                  machineTestCode: params.row.machineTestCode || '',
                  qcRequirements: params.row.qcRequirements || '',
                  department: params.row.department || '',
                  requiresDoctorApproval: params.row.requiresDoctorApproval,
                  minAge: params.row.minAge?.toString() || '',
                  maxAge: params.row.maxAge?.toString() || '',
                  genderSpecific: params.row.genderSpecific,
                  consentFormRequired: params.row.consentFormRequired,
                });
                setIsEditModeTest(true);
                setAddTestDialogOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleDuplicateTest(params.row)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteTest(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Packages DataGrid columns
  const packageColumns: GridColDef[] = [
    { field: 'packageCode', headerName: 'Code', width: 120 },
    { field: 'packageName', headerName: 'Package Name', width: 250 },
    {
      field: 'includedTests',
      headerName: 'Tests',
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value.length} color="primary" size="small" />
      ),
    },
    {
      field: 'individualTotal',
      headerName: 'Individual Total',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">{formatPrice(params.value)}</Typography>
      ),
    },
    {
      field: 'packagePrice',
      headerName: 'Package Price',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatPrice(params.value)}
        </Typography>
      ),
    },
    {
      field: 'discountPercent',
      headerName: 'Discount',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={`${params.value.toFixed(1)}%`} color="success" size="small" />
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color="secondary" size="small" />
      ),
    },
    {
      field: 'popularity',
      headerName: 'Bookings',
      width: 90,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={params.value === 'Active' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => {
                setSelectedPackage(params.row);
                setPackageFormData({
                  packageCode: params.row.packageCode,
                  packageName: params.row.packageName,
                  category: params.row.category,
                  description: params.row.description || '',
                  targetAudience: params.row.targetAudience,
                  includedTests: params.row.includedTests,
                  individualTotal: params.row.individualTotal,
                  packagePrice: params.row.packagePrice.toString(),
                  discountPercent: params.row.discountPercent,
                  savingsAmount: params.row.savingsAmount,
                  homeCollectionCharges: params.row.homeCollectionCharges?.toString() || '',
                  finalPrice: params.row.finalPrice,
                  minAge: params.row.minAge?.toString() || '',
                  maxAge: params.row.maxAge?.toString() || '',
                  genderSpecific: params.row.genderSpecific,
                  packageImage: params.row.packageImage || '',
                  highlightPoints: params.row.highlightPoints,
                  recommendedFor: params.row.recommendedFor || '',
                  displayOnWebsite: params.row.displayOnWebsite,
                  featuredPackage: params.row.featuredPackage,
                });
                setIsEditModePackage(true);
                setAddPackageDialogOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeletePackage(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4"
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Test Catalog Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeTab === 'tests' ? (
              <>
                <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setBulkImportDialogOpen(true)}>
                  Bulk Import
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => {
                    exportToExcel(filteredTests, 'tests');
                    showSnackbar('Tests exported successfully', 'success');
                  }}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => printTestCatalog(filteredTests)}
                >
                  Print Catalog
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setIsEditModeTest(false);
                    setSelectedTest(null);
                    setTestFormData({
                      ...getEmptyTestForm(),
                      testCode: generateTestCode('Hematology'),
                    });
                    setAddTestDialogOpen(true);
                  }}
                >
                  Add New Test
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => {
                    exportPackagesToExcel(filteredPackages, 'packages');
                    showSnackbar('Packages exported successfully', 'success');
                  }}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setIsEditModePackage(false);
                    setSelectedPackage(null);
                    setPackageFormData({
                      ...getEmptyPackageForm(),
                      packageCode: generatePackageCode(),
                    });
                    setAddPackageDialogOpen(true);
                  }}
                >
                  Create New Package
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Tabs */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, value) => setActiveTab(value as TabValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label={`Tests (${tests.length})`} value="tests" />
            <Tab label={`Packages (${packages.length})`} value="packages" />
          </Tabs>
        </Card>

        {/* Search & Filters */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder={
                  activeTab === 'tests'
                    ? 'Search tests by name, code, or category...'
                    : 'Search packages by name or code...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Filters */}
              {activeTab === 'tests' ? (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={testFilters.category}
                      label="Category"
                      onChange={e => setTestFilters(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <MenuItem value="All">All Categories</MenuItem>
                      {TEST_CATEGORIES.map(cat => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Sample Type</InputLabel>
                    <Select
                      value={testFilters.sampleType}
                      label="Sample Type"
                      onChange={e => setTestFilters(prev => ({ ...prev, sampleType: e.target.value }))}
                    >
                      <MenuItem value="All">All Types</MenuItem>
                      {SAMPLE_TYPES.map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={testFilters.status}
                      label="Status"
                      onChange={e => setTestFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ flex: 1, minWidth: 200, px: 2 }}>
                    <Typography variant="caption" gutterBottom>
                      Price Range: {formatPrice(testFilters.priceRange[0])} - {formatPrice(testFilters.priceRange[1])}
                    </Typography>
                    <Slider
                      value={testFilters.priceRange}
                      onChange={(e, value) => setTestFilters(prev => ({ ...prev, priceRange: value as number[] }))}
                      min={0}
                      max={10000}
                      step={100}
                      valueLabelDisplay="auto"
                      valueLabelFormat={value => formatPrice(value)}
                    />
                  </Box>

                  <Button
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      setTestFilters({
                        category: 'All',
                        sampleType: 'All',
                        status: 'All',
                        priceRange: [0, 10000],
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={packageFilters.category}
                      label="Category"
                      onChange={e => setPackageFilters(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <MenuItem value="All">All Categories</MenuItem>
                      {PACKAGE_CATEGORIES.map(cat => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={packageFilters.status}
                      label="Status"
                      onChange={e => setPackageFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      setPackageFilters({
                        category: 'All',
                        status: 'All',
                        priceRange: [0, 50000],
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {activeTab === 'tests'
                ? `${filteredTests.length} Tests Found`
                : `${filteredPackages.length} Packages Found`}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {activeTab === 'tests' ? (
              <DataGrid
                rows={filteredTests}
                columns={testColumns}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                autoHeight
                loading={loading}
              />
            ) : (
              <DataGrid
                rows={filteredPackages}
                columns={packageColumns}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                autoHeight
                loading={loading}
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Add/Edit Test Dialog */}
      <Dialog
        open={addTestDialogOpen}
        onClose={() => {
          setAddTestDialogOpen(false);
          setIsEditModeTest(false);
          setSelectedTest(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {isEditModeTest ? 'Edit Test' : 'Add New Test'}
          <IconButton
            onClick={() => {
              setAddTestDialogOpen(false);
              setIsEditModeTest(false);
              setSelectedTest(null);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Basic Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Test Code"
                  required
                  value={testFormData.testCode}
                  onChange={e => handleTestFormChange('testCode', e.target.value)}
                  error={!!testFormErrors.testCode}
                  helperText={testFormErrors.testCode || 'Format: CAT-12345'}
                />
                <TextField
                  label="Test Name"
                  required
                  value={testFormData.testName}
                  onChange={e => handleTestFormChange('testName', e.target.value)}
                  error={!!testFormErrors.testName}
                  helperText={testFormErrors.testName}
                />
                <TextField
                  label="Short Name"
                  required
                  value={testFormData.shortName}
                  onChange={e => handleTestFormChange('shortName', e.target.value)}
                  error={!!testFormErrors.shortName}
                  helperText={testFormErrors.shortName}
                />
                <FormControl required fullWidth error={!!testFormErrors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={testFormData.category}
                    label="Category"
                    onChange={e => {
                      const category = e.target.value as TestCategory;
                      handleTestFormChange('category', category);
                      handleTestFormChange('testCode', generateTestCode(category));
                    }}
                  >
                    {TEST_CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* Sample Details */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Sample Details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl required fullWidth error={!!testFormErrors.sampleType}>
                  <InputLabel>Sample Type</InputLabel>
                  <Select
                    value={testFormData.sampleType}
                    label="Sample Type"
                    onChange={e => handleTestFormChange('sampleType', e.target.value)}
                  >
                    {SAMPLE_TYPES.map(type => (
                      <MenuItem key={type} value={type}>
                        {getSampleTypeIcon(type)} {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Container Type</InputLabel>
                  <Select
                    value={testFormData.containerType}
                    label="Container Type"
                    onChange={e => handleTestFormChange('containerType', e.target.value)}
                  >
                    {CONTAINER_TYPES.map(type => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* Pricing */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Pricing
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Base Price (₹)"
                  required
                  type="number"
                  value={testFormData.basePrice}
                  onChange={e => handleTestFormChange('basePrice', e.target.value)}
                  error={!!testFormErrors.basePrice}
                  helperText={testFormErrors.basePrice}
                />
                <TextField
                  label="Home Collection Charges (₹)"
                  type="number"
                  value={testFormData.homeCollectionCharges}
                  onChange={e => handleTestFormChange('homeCollectionCharges', e.target.value)}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={testFormData.discountAllowed}
                      onChange={e => handleTestFormChange('discountAllowed', e.target.checked)}
                    />
                  }
                  label="Discount Allowed"
                />
                {testFormData.discountAllowed && (
                  <TextField
                    label="Max Discount %"
                    type="number"
                    value={testFormData.maxDiscountPercent}
                    onChange={e => handleTestFormChange('maxDiscountPercent', e.target.value)}
                  />
                )}
              </Box>
            </Box>

            <Divider />

            {/* Reporting */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Reporting
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl required fullWidth error={!!testFormErrors.reportTime}>
                  <InputLabel>Report Time</InputLabel>
                  <Select
                    value={testFormData.reportTime}
                    label="Report Time"
                    onChange={e => handleTestFormChange('reportTime', e.target.value)}
                  >
                    {REPORT_TIMES.map(time => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl required fullWidth error={!!testFormErrors.reportFormat}>
                  <InputLabel>Report Format</InputLabel>
                  <Select
                    value={testFormData.reportFormat}
                    label="Report Format"
                    onChange={e => handleTestFormChange('reportFormat', e.target.value)}
                  >
                    {REPORT_FORMATS.map(format => (
                      <MenuItem key={format} value={format}>
                        {format}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* Test Parameters */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Test Parameters
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddParameter}
                >
                  Add Parameter
                </Button>
              </Box>
              {testFormData.parameters.map((param, index) => (
                <Box
                  key={param.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    position: 'relative',
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                    onClick={() => handleRemoveParameter(param.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="subtitle2" gutterBottom>
                    Parameter {index + 1}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="Parameter Name"
                      size="small"
                      value={param.parameterName}
                      onChange={e => handleUpdateParameter(param.id, 'parameterName', e.target.value)}
                    />
                    <TextField
                      label="Short Name"
                      size="small"
                      value={param.shortName}
                      onChange={e => handleUpdateParameter(param.id, 'shortName', e.target.value)}
                    />
                    <TextField
                      label="Unit"
                      size="small"
                      value={param.unit}
                      onChange={e => handleUpdateParameter(param.id, 'unit', e.target.value)}
                    />
                  </Box>
                </Box>
              ))}
              {testFormErrors.parameters && (
                <Typography variant="caption" color="error">
                  {testFormErrors.parameters}
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Machine Mapping */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Machine Mapping
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl required fullWidth error={!!testFormErrors.analysisMethod}>
                  <InputLabel>Analysis Method</InputLabel>
                  <Select
                    value={testFormData.analysisMethod}
                    label="Analysis Method"
                    onChange={e => handleTestFormChange('analysisMethod', e.target.value)}
                  >
                    {ANALYSIS_METHODS.map(method => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Machine/Instrument</InputLabel>
                  <Select
                    value={testFormData.machineInstrument}
                    label="Machine/Instrument"
                    onChange={e => handleTestFormChange('machineInstrument', e.target.value)}
                  >
                    {MACHINES.map(machine => (
                      <MenuItem key={machine} value={machine}>
                        {machine}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            {/* Additional Settings */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Additional Settings
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={testFormData.fastingRequired}
                      onChange={e => handleTestFormChange('fastingRequired', e.target.checked)}
                    />
                  }
                  label="Fasting Required"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={testFormData.requiresDoctorApproval}
                      onChange={e => handleTestFormChange('requiresDoctorApproval', e.target.checked)}
                    />
                  }
                  label="Requires Doctor Approval"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddTestDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTest} variant="contained">
            Save Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Details Dialog */}
      <Dialog
        open={testDetailsDialogOpen}
        onClose={() => setTestDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Test Details
          <IconButton
            onClick={() => setTestDetailsDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="h6">{selectedTest.testName}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedTest.testCode} | {selectedTest.category}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Sample Type
                  </Typography>
                  <Typography>{selectedTest.sampleType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Report Time
                  </Typography>
                  <Typography>{selectedTest.reportTime}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Base Price
                  </Typography>
                  <Typography fontWeight="bold" color="success.main">
                    {formatPrice(selectedTest.basePrice)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Fasting Required
                  </Typography>
                  <Typography>{selectedTest.fastingRequired ? 'Yes' : 'No'}</Typography>
                </Box>
              </Box>
              {selectedTest.parameters.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Parameters ({selectedTest.parameters.length})
                    </Typography>
                    {selectedTest.parameters.map(param => (
                      <Box key={param.id} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>{param.parameterName}</strong> ({param.shortName}) - {param.unit}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Package Dialog */}
      <Dialog
        open={addPackageDialogOpen}
        onClose={() => {
          setAddPackageDialogOpen(false);
          setIsEditModePackage(false);
          setSelectedPackage(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditModePackage ? 'Edit Package' : 'Create New Package'}
          <IconButton
            onClick={() => {
              setAddPackageDialogOpen(false);
              setIsEditModePackage(false);
              setSelectedPackage(null);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Package Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Package Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Package Code"
                  required
                  value={packageFormData.packageCode}
                  onChange={e => handlePackageFormChange('packageCode', e.target.value)}
                  error={!!packageFormErrors.packageCode}
                  helperText={packageFormErrors.packageCode || 'Format: PKG-12345'}
                />
                <TextField
                  label="Package Name"
                  required
                  value={packageFormData.packageName}
                  onChange={e => handlePackageFormChange('packageName', e.target.value)}
                  error={!!packageFormErrors.packageName}
                  helperText={packageFormErrors.packageName}
                />
                <FormControl required fullWidth error={!!packageFormErrors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={packageFormData.category}
                    label="Category"
                    onChange={e => handlePackageFormChange('category', e.target.value)}
                  >
                    {PACKAGE_CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Description"
                  multiline
                  rows={3}
                  value={packageFormData.description}
                  onChange={e => handlePackageFormChange('description', e.target.value)}
                />
              </Box>
            </Box>

            <Divider />

            {/* Tests Inclusion */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Tests Inclusion
              </Typography>
              <Autocomplete
                multiple
                options={tests.map(t => t.id)}
                getOptionLabel={option => {
                  const test = tests.find(t => t.id === option);
                  return test ? `${test.testName} - ${formatPrice(test.basePrice)}` : '';
                }}
                value={packageFormData.includedTests}
                onChange={(e, value) => {
                  handlePackageFormChange('includedTests', value);
                  // Calculate individual total
                  const total = value.reduce((sum, testId) => {
                    const test = tests.find(t => t.id === testId);
                    return sum + (test?.basePrice || 0);
                  }, 0);
                  handlePackageFormChange('individualTotal', total);
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Select Tests"
                    placeholder="Search and add tests"
                    error={!!packageFormErrors.includedTests}
                    helperText={packageFormErrors.includedTests}
                  />
                )}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Selected Tests:</strong> {packageFormData.includedTests.length} |{' '}
                <strong>Individual Total:</strong> {formatPrice(packageFormData.individualTotal)}
              </Typography>
            </Box>

            <Divider />

            {/* Pricing */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Pricing
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Individual Tests Total (₹)"
                  value={packageFormData.individualTotal}
                  disabled
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Package Price (₹)"
                  required
                  type="number"
                  value={packageFormData.packagePrice}
                  onChange={e => handlePackageFormChange('packagePrice', e.target.value)}
                  error={!!packageFormErrors.packagePrice}
                  helperText={packageFormErrors.packagePrice}
                />
                <TextField
                  label="Discount %"
                  value={packageFormData.discountPercent.toFixed(2)}
                  disabled
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Savings Amount (₹)"
                  value={packageFormData.savingsAmount}
                  disabled
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Home Collection Charges (₹)"
                  type="number"
                  value={packageFormData.homeCollectionCharges}
                  onChange={e => handlePackageFormChange('homeCollectionCharges', e.target.value)}
                />
                <TextField
                  label="Final Price (₹)"
                  value={packageFormData.finalPrice}
                  disabled
                  InputProps={{ readOnly: true }}
                />
              </Box>
              {packageFormData.savingsAmount > 0 && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                  Save {formatPrice(packageFormData.savingsAmount)}! ({packageFormData.discountPercent.toFixed(1)}% off)
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Marketing */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Marketing
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={packageFormData.displayOnWebsite}
                      onChange={e => handlePackageFormChange('displayOnWebsite', e.target.checked)}
                    />
                  }
                  label="Display on Website"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={packageFormData.featuredPackage}
                      onChange={e => handlePackageFormChange('featuredPackage', e.target.checked)}
                    />
                  }
                  label="Featured Package"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddPackageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePackage} variant="contained">
            Create Package
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialogOpen} onClose={() => setBulkImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Bulk Import Tests
          <IconButton
            onClick={() => setBulkImportDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={downloadCSVTemplate}
              sx={{ mb: 3 }}
            >
              Download CSV Template
            </Button>
            <Typography variant="body2" color="textSecondary" paragraph>
              Upload a CSV file with test data. Make sure it follows the template format.
            </Typography>
            <input
              type="file"
              id="bulk-import-file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleBulkImportFile}
            />
            <label htmlFor="bulk-import-file">
              <Box
                component="div"
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 4,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography>Drag and drop CSV file here or click to browse</Typography>
                <Typography variant="caption" color="textSecondary">
                  Supported formats: CSV, XLS, XLSX
                </Typography>
              </Box>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkImportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

// Helper functions for empty forms
function getEmptyTestForm(): TestFormData {
  return {
    testCode: '',
    testName: '',
    shortName: '',
    category: '',
    subCategory: '',
    description: '',
    keywords: [],
    sampleType: '',
    sampleVolume: '',
    containerType: '',
    numberOfContainers: '',
    sampleHandlingInstructions: '',
    specialPrecautions: '',
    fastingRequired: false,
    fastingDuration: '',
    medicationsToAvoid: [],
    otherInstructions: '',
    basePrice: '',
    discountAllowed: false,
    maxDiscountPercent: '',
    emergencyCharges: '',
    homeCollectionCharges: '',
    packageInclusionAllowed: true,
    reportTime: '',
    reportFormat: '',
    reportTemplate: '',
    criticalValueAlert: false,
    parameters: [],
    analysisMethod: '',
    machineInstrument: '',
    machineTestCode: '',
    qcRequirements: '',
    department: '',
    requiresDoctorApproval: false,
    minAge: '',
    maxAge: '',
    genderSpecific: 'All',
    consentFormRequired: false,
  };
}

function getEmptyPackageForm(): PackageFormData {
  return {
    packageCode: '',
    packageName: '',
    category: '',
    description: '',
    targetAudience: [],
    includedTests: [],
    individualTotal: 0,
    packagePrice: '',
    discountPercent: 0,
    savingsAmount: 0,
    homeCollectionCharges: '',
    finalPrice: 0,
    minAge: '',
    maxAge: '',
    genderSpecific: 'All',
    packageImage: '',
    highlightPoints: [],
    recommendedFor: '',
    displayOnWebsite: true,
    featuredPackage: false,
  };
}

// Dummy data functions
function getDummyTests(): Test[] {
  const tests: Test[] = [
    {
      id: 'test_1',
      testCode: 'HEM-10001',
      testName: 'Complete Blood Count (CBC)',
      shortName: 'CBC',
      category: 'Hematology',
      sampleType: 'Blood',
      containerType: 'EDTA Tube',
      basePrice: 500,
      discountAllowed: true,
      maxDiscountPercent: 20,
      homeCollectionCharges: 100,
      packageInclusionAllowed: true,
      reportTime: '4 Hours',
      reportFormat: 'Tabular',
      criticalValueAlert: true,
      parameters: [
        {
          id: 'param_1',
          parameterName: 'Hemoglobin',
          shortName: 'Hb',
          unit: 'g/dL',
          normalRange: { male: { from: 13, to: 17 }, female: { from: 12, to: 15 } },
          displayOrder: 1,
        },
        {
          id: 'param_2',
          parameterName: 'RBC Count',
          shortName: 'RBC',
          unit: 'million/µL',
          normalRange: { male: { from: 4.5, to: 5.5 }, female: { from: 4.0, to: 5.0 } },
          displayOrder: 2,
        },
      ],
      analysisMethod: 'Automated',
      machineInstrument: 'Sysmex XN-1000',
      fastingRequired: false,
      requiresDoctorApproval: false,
      genderSpecific: 'All',
      consentFormRequired: false,
      status: 'Active',
      createdDate: '2026-01-15',
      timesPerformed: 245,
      revenueGenerated: 122500,
    },
    // Add more dummy tests with variety
    ...Array.from({ length: 99 }, (_, i) => ({
      id: `test_${i + 2}`,
      testCode: `${['HEM', 'BIO', 'MIC', 'IMM', 'PAT'][i % 5]}-${String(10002 + i).padStart(5, '0')}`,
      testName: `Test ${i + 2}`,
      shortName: `T${i + 2}`,
      category: ['Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Pathology'][i % 5] as TestCategory,
      sampleType: ['Blood', 'Urine', 'Stool', 'Serum'][i % 4] as SampleType,
      containerType: 'EDTA Tube' as ContainerType,
      basePrice: Math.floor(Math.random() * 5000) + 300,
      discountAllowed: i % 2 === 0,
      maxDiscountPercent: 20,
      homeCollectionCharges: 100,
      packageInclusionAllowed: true,
      reportTime: ['4 Hours', '24 Hours', 'Same Day'][i % 3] as ReportTime,
      reportFormat: 'Tabular' as ReportFormat,
      criticalValueAlert: false,
      parameters: [],
      analysisMethod: 'Automated' as AnalysisMethod,
      machineInstrument: 'Sysmex XN-1000',
      fastingRequired: i % 3 === 0,
      requiresDoctorApproval: false,
      genderSpecific: 'All' as GenderSpecific,
      consentFormRequired: false,
      status: i % 10 === 0 ? 'Inactive' as const : 'Active' as const,
      createdDate: '2026-01-15',
      timesPerformed: Math.floor(Math.random() * 300),
      revenueGenerated: Math.floor(Math.random() * 200000),
    })),
  ];

  return tests;
}

function getDummyPackages(): Package[] {
  const packages: Package[] = [
    {
      id: 'pkg_1',
      packageCode: 'PKG-10001',
      packageName: 'Full Body Checkup - Basic',
      category: 'Health Checkup',
      description: 'Comprehensive health checkup package',
      targetAudience: ['Adults', 'Seniors'],
      includedTests: ['test_1', 'test_2', 'test_3'],
      individualTotal: 5500,
      packagePrice: 3999,
      discountPercent: 27.29,
      savingsAmount: 1501,
      homeCollectionCharges: 200,
      finalPrice: 4199,
      sampleTypesRequired: ['Blood', 'Urine'],
      fastingRequired: true,
      reportTime: '24 Hours',
      genderSpecific: 'All',
      highlightPoints: ['50+ Parameters', 'Includes CBC', 'Free Home Collection'],
      recommendedFor: 'Regular health monitoring',
      displayOnWebsite: true,
      featuredPackage: true,
      status: 'Active',
      popularity: 145,
      createdDate: '2026-01-10',
    },
    ...Array.from({ length: 19 }, (_, i) => {
      const pkg: Package = {
        id: `pkg_${i + 2}`,
        packageCode: `PKG-${String(10002 + i).padStart(5, '0')}`,
        packageName: `Package ${i + 2}`,
        category: ['Health Checkup', 'Pre-Employment', 'Diabetes', 'Cardiac'][i % 4] as PackageCategory,
        description: `Package description ${i + 2}`,
        targetAudience: ['Adults'],
        includedTests: ['test_1', 'test_2'],
        individualTotal: Math.floor(Math.random() * 10000) + 3000,
        packagePrice: Math.floor(Math.random() * 8000) + 2000,
        discountPercent: 25,
        savingsAmount: 1000,
        homeCollectionCharges: 200,
        finalPrice: Math.floor(Math.random() * 8000) + 2200,
        sampleTypesRequired: ['Blood'],
        fastingRequired: i % 2 === 0,
        reportTime: '24 Hours',
        genderSpecific: 'All',
        highlightPoints: [],
        displayOnWebsite: true,
        featuredPackage: i % 5 === 0,
        status: 'Active',
        popularity: Math.floor(Math.random() * 200),
        createdDate: '2026-01-10',
      };
      return pkg;
    }),
  ];

  return packages;
}
