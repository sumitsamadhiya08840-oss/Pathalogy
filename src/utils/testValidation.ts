// Test Validation Utilities

import type { TestFormData, PackageFormData, TestParameter, ValidationErrors } from '@/types/test';

/**
 * Validate test code format
 */
export function validateTestCode(code: string): boolean {
  // Format: CAT-XXXXX (3 letters, hyphen, 5 digits)
  const testCodeRegex = /^[A-Z]{3}-\d{5}$/;
  return testCodeRegex.test(code);
}

/**
 * Validate package code format
 */
export function validatePackageCode(code: string): boolean {
  // Format: PKG-XXXXX (PKG, hyphen, 5 digits)
  const packageCodeRegex = /^PKG-\d{5}$/;
  return packageCodeRegex.test(code);
}

/**
 * Check for duplicate test code (mocked API call)
 */
export async function checkDuplicateTestCode(
  code: string,
  excludeId?: string
): Promise<boolean> {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      // In real implementation, this would check database
      resolve(false); // No duplicate found
    }, 300);
  });
}

/**
 * Check for duplicate package code (mocked API call)
 */
export async function checkDuplicatePackageCode(
  code: string,
  excludeId?: string
): Promise<boolean> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(false);
    }, 300);
  });
}

/**
 * Validate normal range values
 */
export function validateNormalRange(low: number, high: number): boolean {
  if (isNaN(low) || isNaN(high)) {
    return false;
  }
  return low < high;
}

/**
 * Validate test name
 */
export function validateTestName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Test name is required' };
  }
  if (name.trim().length < 3) {
    return { valid: false, error: 'Test name must be at least 3 characters' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Test name must not exceed 100 characters' };
  }
  return { valid: true };
}

/**
 * Validate price
 */
export function validatePrice(price: string): { valid: boolean; error?: string } {
  if (!price || price.trim() === '') {
    return { valid: false, error: 'Price is required' };
  }
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return { valid: false, error: 'Price must be a valid number' };
  }
  if (priceNum < 0) {
    return { valid: false, error: 'Price cannot be negative' };
  }
  if (priceNum > 100000) {
    return { valid: false, error: 'Price seems too high' };
  }
  return { valid: true };
}

/**
 * Validate discount percentage
 */
export function validateDiscount(discount: string): { valid: boolean; error?: string } {
  if (!discount || discount.trim() === '') {
    return { valid: true }; // Optional field
  }
  const discountNum = parseFloat(discount);
  if (isNaN(discountNum)) {
    return { valid: false, error: 'Discount must be a valid number' };
  }
  if (discountNum < 0 || discountNum > 100) {
    return { valid: false, error: 'Discount must be between 0 and 100' };
  }
  return { valid: true };
}

/**
 * Validate test parameters
 */
export function validateTestParameters(
  parameters: TestParameter[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (parameters.length === 0) {
    errors.push('At least one parameter is required');
    return { valid: false, errors };
  }

  parameters.forEach((param, index) => {
    if (!param.parameterName || param.parameterName.trim() === '') {
      errors.push(`Parameter ${index + 1}: Name is required`);
    }
    if (!param.unit || param.unit.trim() === '') {
      errors.push(`Parameter ${index + 1}: Unit is required`);
    }

    // Validate normal ranges
    if (param.normalRange.male) {
      if (!validateNormalRange(param.normalRange.male.from, param.normalRange.male.to)) {
        errors.push(`Parameter ${index + 1}: Invalid male normal range`);
      }
    }
    if (param.normalRange.female) {
      if (!validateNormalRange(param.normalRange.female.from, param.normalRange.female.to)) {
        errors.push(`Parameter ${index + 1}: Invalid female normal range`);
      }
    }
    if (param.normalRange.children) {
      if (!validateNormalRange(param.normalRange.children.from, param.normalRange.children.to)) {
        errors.push(`Parameter ${index + 1}: Invalid children normal range`);
      }
    }

    // Validate critical values
    if (param.criticalLowValue !== undefined && param.criticalHighValue !== undefined) {
      if (param.criticalLowValue >= param.criticalHighValue) {
        errors.push(`Parameter ${index + 1}: Critical low must be less than critical high`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Comprehensive test form validation
 */
export function validateTestForm(formData: TestFormData): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  // Basic Information
  const nameValidation = validateTestName(formData.testName);
  if (!nameValidation.valid) {
    errors.testName = nameValidation.error || 'Invalid test name';
  }

  if (!formData.testCode || !validateTestCode(formData.testCode)) {
    errors.testCode = 'Valid test code is required (format: CAT-12345)';
  }

  if (!formData.shortName || formData.shortName.trim().length === 0) {
    errors.shortName = 'Short name is required';
  }

  if (!formData.category) {
    errors.category = 'Category is required';
  }

  // Sample Details
  if (!formData.sampleType) {
    errors.sampleType = 'Sample type is required';
  }

  // Pricing
  const priceValidation = validatePrice(formData.basePrice);
  if (!priceValidation.valid) {
    errors.basePrice = priceValidation.error || 'Invalid price';
  }

  if (formData.discountAllowed && formData.maxDiscountPercent) {
    const discountValidation = validateDiscount(formData.maxDiscountPercent);
    if (!discountValidation.valid) {
      errors.maxDiscountPercent = discountValidation.error || 'Invalid discount';
    }
  }

  // Reporting
  if (!formData.reportTime) {
    errors.reportTime = 'Report time is required';
  }

  if (!formData.reportFormat) {
    errors.reportFormat = 'Report format is required';
  }

  // Parameters
  if (formData.parameters.length === 0) {
    errors.parameters = 'At least one test parameter is required';
  } else {
    const paramValidation = validateTestParameters(formData.parameters);
    if (!paramValidation.valid) {
      errors.parameters = paramValidation.errors.join('; ');
    }
  }

  // Machine Mapping
  if (!formData.analysisMethod) {
    errors.analysisMethod = 'Analysis method is required';
  }

  // Age restrictions
  if (formData.minAge && formData.maxAge) {
    const minAge = parseInt(formData.minAge);
    const maxAge = parseInt(formData.maxAge);
    if (!isNaN(minAge) && !isNaN(maxAge) && minAge >= maxAge) {
      errors.ageRestrictions = 'Minimum age must be less than maximum age';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Comprehensive package form validation
 */
export function validatePackageForm(formData: PackageFormData): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  // Package Information
  if (!formData.packageCode || !validatePackageCode(formData.packageCode)) {
    errors.packageCode = 'Valid package code is required (format: PKG-12345)';
  }

  if (!formData.packageName || formData.packageName.trim().length < 3) {
    errors.packageName = 'Package name must be at least 3 characters';
  }

  if (!formData.category) {
    errors.category = 'Category is required';
  }

  // Tests Inclusion
  if (formData.includedTests.length < 2) {
    errors.includedTests = 'Package must include at least 2 tests';
  }

  // Pricing
  const priceValidation = validatePrice(formData.packagePrice);
  if (!priceValidation.valid) {
    errors.packagePrice = priceValidation.error || 'Invalid price';
  }

  const packagePrice = parseFloat(formData.packagePrice);
  if (!isNaN(packagePrice) && packagePrice >= formData.individualTotal) {
    errors.packagePrice = 'Package price must be less than individual tests total';
  }

  // Age restrictions
  if (formData.minAge && formData.maxAge) {
    const minAge = parseInt(formData.minAge);
    const maxAge = parseInt(formData.maxAge);
    if (!isNaN(minAge) && !isNaN(maxAge) && minAge >= maxAge) {
      errors.ageRestrictions = 'Minimum age must be less than maximum age';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate sample volume
 */
export function validateSampleVolume(volume: string): { valid: boolean; error?: string } {
  if (!volume || volume.trim() === '') {
    return { valid: true }; // Optional
  }
  // Should be number + unit (e.g., "5 ml", "2 drops")
  const volumeRegex = /^\d+(\.\d+)?\s*[a-zA-Z]+$/;
  if (!volumeRegex.test(volume)) {
    return { valid: false, error: 'Invalid format (e.g., "5 ml", "2 drops")' };
  }
  return { valid: true };
}

/**
 * Validate age range
 */
export function validateAgeRange(min: string, max: string): { valid: boolean; error?: string } {
  if ((!min || min === '') && (!max || max === '')) {
    return { valid: true }; // Both optional
  }

  const minAge = min ? parseInt(min) : 0;
  const maxAge = max ? parseInt(max) : 150;

  if (isNaN(minAge) || isNaN(maxAge)) {
    return { valid: false, error: 'Age must be a valid number' };
  }

  if (minAge < 0 || maxAge < 0) {
    return { valid: false, error: 'Age cannot be negative' };
  }

  if (minAge > 150 || maxAge > 150) {
    return { valid: false, error: 'Age seems too high' };
  }

  if (min && max && minAge >= maxAge) {
    return { valid: false, error: 'Minimum age must be less than maximum age' };
  }

  return { valid: true };
}
