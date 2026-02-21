import {
  CollectionFormData,
  ValidationErrors,
  AssignCollectorData,
  SampleDetail,
  CollectionProof,
  SampleQuality,
} from '@/types/collection';

/**
 * Validate collection form data
 */
export function validateCollectionForm(data: CollectionFormData): ValidationErrors {
  const errors: Record<string, string> = {};

  // Collector validation
  if (!data.collectorID || !data.collectorName) {
    errors.collector = 'Collector is required';
  }

  // Date and time validation
  if (!data.collectionDate) {
    errors.collectionDate = 'Collection date is required';
  }

  if (!data.collectionTime) {
    errors.collectionTime = 'Collection time is required';
  }

  // Validate collection time is not in the future
  if (data.collectionDate && data.collectionTime) {
    const collectionDateTime = new Date(`${data.collectionDate}T${data.collectionTime}`);
    const now = new Date();
    if (collectionDateTime > now) {
      errors.collectionTime = 'Collection time cannot be in the future';
    }
  }

  // Sample validation
  if (!data.samples || data.samples.length === 0) {
    errors.samples = 'At least one sample is required';
  } else {
    data.samples.forEach((sample, index) => {
      if (!sample.tubeType) {
        errors[`sample_${index}_tubeType`] = 'Tube type is required';
      }
      if (!sample.numberOfTubes || sample.numberOfTubes < 1) {
        errors[`sample_${index}_tubes`] = 'Number of tubes must be at least 1';
      }
      if (!sample.volumeCollected || sample.volumeCollected <= 0) {
        errors[`sample_${index}_volume`] = 'Volume collected is required';
      }
      if (!sample.quality) {
        errors[`sample_${index}_quality`] = 'Sample quality is required';
      }
      // If quality is not Good, require notes
      if (sample.quality && sample.quality !== 'Good' && !sample.qualityNotes) {
        errors[`sample_${index}_qualityNotes`] = 'Quality issue reason is required';
      }
    });
  }

  // Fasting validation
  if (data.fastingStatus === 'Fasting' && (!data.fastingHours || data.fastingHours < 0)) {
    errors.fastingHours = 'Fasting hours is required';
  }

  // Patient condition validation
  if (!data.patientCondition) {
    errors.patientCondition = 'Patient condition is required';
  }

  if (data.patientCondition === 'Other' && !data.patientConditionNotes) {
    errors.patientConditionNotes = 'Patient condition notes required for "Other"';
  }

  // Quality checklist validation
  const checklist = data.qualityChecklist;
  if (!checklist.patientVerified) {
    errors.checklist_patient = 'Patient verification is required';
  }
  if (!checklist.correctTube) {
    errors.checklist_tube = 'Correct tube verification is required';
  }
  if (!checklist.adequateVolume) {
    errors.checklist_volume = 'Volume verification is required';
  }
  if (!checklist.labelApplied) {
    errors.checklist_label = 'Label verification is required';
  }
  if (!checklist.storedProperly) {
    errors.checklist_storage = 'Storage verification is required';
  }
  if (!checklist.patientInformed) {
    errors.checklist_informed = 'Patient information verification is required';
  }

  // Department validation
  if (!data.department) {
    errors.department = 'Department is required';
  }

  // Priority validation
  if (!data.priority) {
    errors.priority = 'Priority level is required';
  }

  if ((data.priority === 'Urgent' || data.priority === 'STAT') && !data.priorityReason) {
    errors.priorityReason = 'Priority reason is required for urgent/STAT samples';
  }

  // Label printing validation
  if (data.printLabels && (!data.numberOfLabels || data.numberOfLabels < 1)) {
    errors.numberOfLabels = 'Number of labels must be at least 1';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if sample volume is adequate
 */
export function checkSampleVolume(volumeCollected: number, requiredVolume: number): boolean {
  return volumeCollected >= requiredVolume;
}

/**
 * Validate tube type for test
 */
export function validateTubeType(tubeType: string, requiredTubeType: string): boolean {
  return tubeType === requiredTubeType;
}

/**
 * Check fasting status compliance
 */
export function checkFastingStatus(
  fastingStatus: 'Fasting' | 'NonFasting' | 'NotApplicable',
  fastingRequired: boolean,
  fastingHours?: number
): boolean {
  if (!fastingRequired) {
    return true; // No fasting required, any status is acceptable
  }

  if (fastingStatus !== 'Fasting') {
    return false; // Fasting required but patient is not fasting
  }

  // Check minimum fasting hours (typically 8-12 hours)
  if (fastingHours !== undefined && fastingHours < 8) {
    return false;
  }

  return true;
}

/**
 * Validate signature is captured
 */
export function validateSignature(signatureData?: string): boolean {
  return !!signatureData && signatureData.length > 0;
}

/**
 * Validate quality checklist is complete
 */
export function validateQualityChecklist(checklist: {
  patientVerified: boolean;
  correctTube: boolean;
  adequateVolume: boolean;
  labelApplied: boolean;
  storedProperly: boolean;
  patientInformed: boolean;
}): boolean {
  return (
    checklist.patientVerified &&
    checklist.correctTube &&
    checklist.adequateVolume &&
    checklist.labelApplied &&
    checklist.storedProperly &&
    checklist.patientInformed
  );
}

/**
 * Validate collector assignment
 */
export function validateCollectorAssignment(data: AssignCollectorData): ValidationErrors {
  const errors: Record<string, string> = {};

  if (!data.collectionID) {
    errors.collectionID = 'Collection ID is required';
  }

  if (!data.collectorID) {
    errors.collectorID = 'Collector is required';
  }

  if (!data.scheduledTime) {
    errors.scheduledTime = 'Scheduled time is required';
  } else {
    // Validate scheduled time is not in the past
    const scheduledDate = new Date(data.scheduledTime);
    const now = new Date();
    if (scheduledDate < now) {
      errors.scheduledTime = 'Scheduled time cannot be in the past';
    }
  }

  if (!data.estimatedDuration || data.estimatedDuration <= 0) {
    errors.estimatedDuration = 'Estimated duration must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate route data
 */
export function validateRouteData(route: {
  date: string;
  collectorID: string;
  areas: string[];
  collections: any[];
}): ValidationErrors {
  const errors: Record<string, string> = {};

  if (!route.date) {
    errors.date = 'Route date is required';
  }

  if (!route.collectorID) {
    errors.collector = 'Collector is required';
  }

  if (!route.areas || route.areas.length === 0) {
    errors.areas = 'At least one area must be selected';
  }

  if (!route.collections || route.collections.length === 0) {
    errors.collections = 'At least one collection must be selected';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check collection time validity
 */
export function checkCollectionTime(collectionTime: string): boolean {
  const collectionDate = new Date(collectionTime);
  const now = new Date();
  
  // Collection time should not be in the future
  return collectionDate <= now;
}

/**
 * Validate GPS location coordinates
 */
export function validateGPSLocation(location: { latitude: number; longitude: number }): boolean {
  return (
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

/**
 * Validate collection proof
 */
export function validateCollectionProof(proof: Partial<CollectionProof>): ValidationErrors {
  const errors: Record<string, string> = {};

  // At least one photo is required
  if (!proof.samplePhotos || proof.samplePhotos.length === 0) {
    errors.photos = 'At least one sample photo is required';
  }

  // Signature is optional but recommended
  // if (!proof.patientSignature) {
  //   errors.signature = 'Patient signature is recommended';
  // }

  // GPS location validation
  if (proof.gpsLocation) {
    if (!validateGPSLocation(proof.gpsLocation)) {
      errors.gpsLocation = 'Invalid GPS coordinates';
    }
  }

  // Collection confirmation
  if (!proof.collectionConfirmed) {
    errors.confirmation = 'Collection confirmation is required';
  }

  // Payment validation if applicable
  if (proof.paymentCollected) {
    if (!proof.paymentAmount || proof.paymentAmount <= 0) {
      errors.paymentAmount = 'Payment amount is required';
    }
    if (!proof.receiptNumber) {
      errors.receiptNumber = 'Receipt number is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate sample detail
 */
export function validateSampleDetail(sample: SampleDetail): ValidationErrors {
  const errors: Record<string, string> = {};

  if (!sample.sampleType) {
    errors.sampleType = 'Sample type is required';
  }

  if (!sample.tubeType) {
    errors.tubeType = 'Tube type is required';
  }

  if (!sample.numberOfTubes || sample.numberOfTubes < 1) {
    errors.numberOfTubes = 'At least 1 tube is required';
  }

  if (!sample.volumeCollected || sample.volumeCollected <= 0) {
    errors.volumeCollected = 'Volume collected must be greater than 0';
  }

  if (!sample.quality) {
    errors.quality = 'Sample quality is required';
  }

  // If quality is not Good, require explanation
  if (sample.quality && sample.quality !== 'Good' && !sample.qualityNotes) {
    errors.qualityNotes = 'Quality issue explanation is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if sample quality requires re-collection
 */
export function requiresReCollection(quality: SampleQuality): boolean {
  return quality === 'Contaminated' || quality === 'Insufficient';
}

/**
 * Check if sample quality allows testing with disclaimer
 */
export function allowsTestingWithDisclaimer(quality: SampleQuality): boolean {
  return quality === 'Hemolyzed' || quality === 'Lipemic' || quality === 'Clotted';
}

/**
 * Validate batch collection data
 */
export function validateBatchCollection(data: {
  collections: any[];
  collectorID: string;
  collectionTime: string;
}): ValidationErrors {
  const errors: Record<string, string> = {};

  if (!data.collections || data.collections.length === 0) {
    errors.collections = 'At least one collection must be selected';
  }

  if (!data.collectorID) {
    errors.collector = 'Collector is required';
  }

  if (!data.collectionTime) {
    errors.collectionTime = 'Collection time is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate rejection reason
 */
export function validateRejection(data: {
  reason: string;
  notes?: string;
}): ValidationErrors {
  const errors: Record<string, string> = {};

  if (!data.reason) {
    errors.reason = 'Rejection reason is required';
  }

  if (data.reason === 'Other' && !data.notes) {
    errors.notes = 'Please provide details for rejection';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate mobile number format
 */
export function validateMobileNumber(mobile: string): boolean {
  // Basic mobile number validation (10 digits)
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate patient ID format
 */
export function validatePatientID(patientID: string): boolean {
  // Basic validation - not empty and has reasonable length
  return patientID.length >= 4 && patientID.length <= 20;
}

/**
 * Validate sample ID format
 */
export function validateSampleID(sampleID: string): boolean {
  // Basic validation - not empty and has reasonable length
  return sampleID.length >= 4 && sampleID.length <= 20;
}

/**
 * Check if all required fields are filled
 */
export function checkRequiredFields(data: Record<string, any>, requiredFields: string[]): ValidationErrors {
  const errors: Record<string, string> = {};

  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '' || data[field] === null || data[field] === undefined) {
      errors[field] = `${field} is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
