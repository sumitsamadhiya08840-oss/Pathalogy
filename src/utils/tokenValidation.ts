// Token & Sample Management Validation

import type { BookingFormData, ValidationErrors, DiscountReason } from '@/types/token';

/**
 * Validate booking form data
 */
export function validateBookingForm(formData: BookingFormData): ValidationErrors {
  const errors: Record<string, string> = {};

  // Patient validation
  if (!formData.patientID || !formData.patientName) {
    errors.patient = 'Patient is required';
  }

  // Tests or package validation
  if (!formData.selectedPackage && (!formData.selectedTests || formData.selectedTests.length === 0)) {
    errors.tests = 'Please select at least one test or a package';
  }

  // Booking type validation
  if (!formData.bookingType) {
    errors.bookingType = 'Booking type is required';
  }

  // Scheduled booking validations
  if (formData.bookingType === 'Scheduled') {
    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Appointment date is required';
    }
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Appointment time is required';
    }
    // Check if date is today or future
    const appointmentDate = new Date(formData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      errors.appointmentDate = 'Appointment date must be today or in the future';
    }
  }

  // Home collection validations
  if (formData.bookingType === 'HomeCollection') {
    if (!formData.homeCollectionAddress) {
      errors.homeCollectionAddress = 'Address is required for home collection';
    }
    if (!formData.preferredDate) {
      errors.preferredDate = 'Preferred date is required';
    }
    if (!formData.preferredTimeSlot) {
      errors.preferredTimeSlot = 'Time slot is required';
    }
  }

  // Discount validation
  if (formData.discountPercent > 0) {
    if (formData.discountPercent < 0 || formData.discountPercent > 100) {
      errors.discountPercent = 'Discount must be between 0 and 100';
    }
    if (!formData.discountReason) {
      errors.discountReason = 'Discount reason is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if token number already exists (mock async check)
 */
export async function checkTokenExists(tokenNumber: string): Promise<boolean> {
  return new Promise(resolve => {
    // Simulate API call
    setTimeout(() => {
      resolve(false); // Mock: token doesn't exist
    }, 500);
  });
}

/**
 * Validate discount percentage and reason
 */
export function validateDiscount(discountPercent: number, reason: DiscountReason): boolean {
  if (discountPercent < 0 || discountPercent > 100) {
    return false;
  }

  const validReasons: DiscountReason[] = ['SeniorCitizen', 'Staff', 'DoctorReferral', 'Promotional', 'Other'];
  return validReasons.includes(reason);
}

/**
 * Check if test is available for booking
 */
export async function checkTestAvailability(testId: string): Promise<boolean> {
  return new Promise(resolve => {
    // Simulate API call
    setTimeout(() => {
      resolve(true); // Mock: test is available
    }, 300);
  });
}

/**
 * Validate patient mobile number
 */
export function validateMobileNumber(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile.replace(/\D/g, ''));
}

/**
 * Validate patient age
 */
export function validateAge(age: number): boolean {
  return age > 0 && age <= 150;
}

/**
 * Validate appointment date (must be future)
 */
export function validateAppointmentDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Validate appointment time format
 */
export function validateAppointmentTime(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Validate home collection address
 */
export function validateAddress(address: string): boolean {
  return address.length >= 10 && address.length <= 500;
}

/**
 * Validate special instructions
 */
export function validateSpecialInstructions(instructions: string): boolean {
  return instructions.length === 0 || (instructions.length >= 5 && instructions.length <= 1000);
}

/**
 * Validate quick add patient form
 */
export function validateQuickAddPatient(data: {
  name: string;
  age: number;
  gender: string;
  mobile: string;
}): ValidationErrors {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!validateAge(data.age)) {
    errors.age = 'Age must be between 1 and 150';
  }

  if (!data.gender) {
    errors.gender = 'Gender is required';
  }

  if (!validateMobileNumber(data.mobile)) {
    errors.mobile = 'Valid 10-digit mobile number required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate test parameter compatibility
 */
export function validateTestCompatibility(testId: string, patientAge: number, patientGender: string): boolean {
  // Mock validation - in real system would check test parameters
  return true;
}

/**
 * Validate fasting period for tests
 */
export function validateFastingPeriod(fastingHours: number): boolean {
  return fastingHours >= 6 && fastingHours <= 24;
}

/**
 * Validate sample collection time
 */
export function validateCollectionTime(collectionTime: string): boolean {
  const time = new Date(collectionTime);
  const now = new Date();
  // Collection time should not be in future
  return time <= now;
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number, expectedAmount: number): boolean {
  const tolerance = 10; // ±10 rupees tolerance
  return Math.abs(amount - expectedAmount) <= tolerance;
}

/**
 * Check if all required tests in package are available
 */
export async function validatePackageAvailability(packageId: string, testIds: string[]): Promise<boolean> {
  return new Promise(resolve => {
    // Simulate API call
    setTimeout(() => {
      resolve(true);
    }, 300);
  });
}

/**
 * Validate token number format
 */
export function validateTokenNumberFormat(token: string): boolean {
  const tokenRegex = /^TOK-\d{8}-\d{4}$/;
  return tokenRegex.test(token);
}

/**
 * Validate sample ID format
 */
export function validateSampleIDFormat(sampleID: string): boolean {
  const sampleRegex = /^SMP-\d{8}-\d{4}$/;
  return sampleRegex.test(sampleID);
}

/**
 * Validate barcode data
 */
export function validateBarcodeData(data: string): boolean {
  return data.length > 0 && data.length <= 200;
}

/**
 * Comprehensive booking validation
 */
export async function validateBookingComplete(formData: BookingFormData): Promise<ValidationErrors> {
  const errors: Record<string, string> = {};

  // Basic validation
  const basicValidation = validateBookingForm(formData);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Test availability check
  if (formData.selectedTests) {
    for (const testId of formData.selectedTests) {
      const available = await checkTestAvailability(testId);
      if (!available) {
        errors.tests = `One or more tests are not available`;
        break;
      }
    }
  }

  // Duplicate token check
  // This would be done after token generation

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
