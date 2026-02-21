/**
 * Patient validation utilities
 */

/**
 * Validate Indian mobile number (10 digits starting with 6-9)
 */
export function validateMobile(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile.replace(/\D/g, ''));
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate 12-digit Aadhar number
 */
export function validateAadhar(aadhar: string): boolean {
  if (!aadhar) return true; // Aadhar is optional
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(aadhar.replace(/\D/g, ''));
}

/**
 * Validate 6-digit PIN code
 */
export function validatePincode(pin: string): boolean {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pin.replace(/\D/g, ''));
}

/**
 * Validate age (1-120 years)
 */
export function validateAge(age: number | string): boolean {
  const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
  return !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120;
}

/**
 * Validate date of birth (must be in the past and result in valid age)
 */
export function validateDOB(dob: string): { valid: boolean; age?: number; error?: string } {
  try {
    const birthDate = new Date(dob);
    const today = new Date();

    if (birthDate > today) {
      return { valid: false, error: 'Date of birth cannot be in the future' };
    }

    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      const adjustedAge = age - 1;
      return validateAge(adjustedAge) ? { valid: true, age: adjustedAge } : { valid: false, error: 'Invalid age calculated from date of birth' };
    }

    return validateAge(age) ? { valid: true, age } : { valid: false, error: 'Invalid age calculated from date of birth' };
  } catch {
    return { valid: false, error: 'Invalid date format' };
  }
}

/**
 * Validate Health ID / ABHA format
 */
export function validateHealthId(healthId: string): boolean {
  if (!healthId) return true; // Health ID is optional
  // ABHA format: 14 characters (alphanumeric)
  const healthIdRegex = /^[A-Z0-9]{14}$/;
  return healthIdRegex.test(healthId.toUpperCase());
}

/**
 * Validate full name (min 3 characters, only letters and spaces)
 */
export function validateFullName(name: string): boolean {
  const nameRegex = /^[a-zA-Z\s]{3,}$/;
  return nameRegex.test(name.trim());
}

/**
 * Check for duplicate mobile number (simulated)
 * In real app, this would call an API
 */
export async function checkDuplicateMobile(mobile: string, excludePatientId?: string): Promise<{ isDuplicate: boolean; patientName?: string }> {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      // Mock data - in real app, check against database
      const existingMobiles: Record<string, string> = {
        '9876543210': 'Rajesh Kumar',
        '9876543211': 'Priya Sharma',
      };

      const isDuplicate = mobile in existingMobiles && excludePatientId !== existingMobiles[mobile];
      resolve({
        isDuplicate,
        patientName: isDuplicate ? existingMobiles[mobile] : undefined,
      });
    }, 500);
  });
}

/**
 * Mask Aadhar number (show only last 4 digits)
 */
export function maskAadhar(aadhar: string): string {
  if (!aadhar || aadhar.length < 4) return aadhar;
  const lastFour = aadhar.slice(-4);
  return `XXXX XXXX ${lastFour}`;
}

/**
 * Validate all patient form data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validatePatientForm(formData: Record<string, any>): ValidationResult {
  const errors: Record<string, string> = {};

  // Basic Information validation
  if (!formData.fullName || !validateFullName(formData.fullName)) {
    errors.fullName = 'Full name must be at least 3 characters';
  }

  if (!formData.age || !validateAge(formData.age)) {
    errors.age = 'Age must be between 1 and 120';
  }

  if (formData.dateOfBirth) {
    const dobValidation = validateDOB(formData.dateOfBirth);
    if (!dobValidation.valid) {
      errors.dateOfBirth = dobValidation.error || 'Invalid date of birth';
    }
  }

  if (!formData.gender) {
    errors.gender = 'Please select a gender';
  }

  // Contact Information validation
  if (!formData.mobileNumber || !validateMobile(formData.mobileNumber)) {
    errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
  }

  if (formData.alternateMobile && !validateMobile(formData.alternateMobile)) {
    errors.alternateMobile = 'Please enter a valid 10-digit mobile number';
  }

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.addressLine1) {
    errors.addressLine1 = 'Address is required';
  }

  if (!formData.city) {
    errors.city = 'City is required';
  }

  if (!formData.state) {
    errors.state = 'State is required';
  }

  if (!formData.pinCode || !validatePincode(formData.pinCode)) {
    errors.pinCode = 'Please enter a valid 6-digit PIN code';
  }

  // Identification validation
  if (formData.aadharNumber && !validateAadhar(formData.aadharNumber)) {
    errors.aadharNumber = 'Please enter a valid 12-digit Aadhar number';
  }

  if (formData.healthId && !validateHealthId(formData.healthId)) {
    errors.healthId = 'Invalid Health ID / ABHA format';
  }

  // Emergency Contact validation
  if (formData.emergencyContactMobile && !validateMobile(formData.emergencyContactMobile)) {
    errors.emergencyContactMobile = 'Please enter a valid 10-digit mobile number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
