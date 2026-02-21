import { 
  Collection, 
  HomeCollection, 
  SampleRequirement, 
  Test, 
  RouteStop,
  SampleQuality,
  Department,
  TUBE_TYPES 
} from '@/types/collection';

/**
 * Calculate waiting time from booking time to now
 */
export function calculateWaitingTime(bookingTime: string): string {
  const booking = new Date(bookingTime);
  const now = new Date();
  const diffMs = now.getTime() - booking.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min';
  if (diffMins < 60) return `${diffMins} mins`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours === 1 && mins === 0) return '1 hour';
  if (hours === 1) return `1 hour ${mins} mins`;
  if (mins === 0) return `${hours} hours`;
  return `${hours} hours ${mins} mins`;
}

/**
 * Calculate waiting time in minutes
 */
export function calculateWaitingMinutes(bookingTime: string): number {
  const booking = new Date(bookingTime);
  const now = new Date();
  const diffMs = now.getTime() - booking.getTime();
  return Math.floor(diffMs / 60000);
}

/**
 * Extract sample requirements from tests
 */
export function getSampleRequirements(tests: Test[]): SampleRequirement[] {
  const requirements = new Map<string, SampleRequirement>();

  tests.forEach(test => {
    const key = `${test.sampleType}-${test.tubeType || test.containerType}`;
    
    if (requirements.has(key)) {
      const existing = requirements.get(key)!;
      existing.volume = Math.max(existing.volume, test.sampleVolume);
      existing.count += 1;
      existing.testNames.push(test.testName);
    } else {
      requirements.set(key, {
        sampleType: test.sampleType,
        volume: test.sampleVolume,
        tubeType: test.tubeType || test.containerType,
        containerType: test.containerType,
        count: 1,
        testNames: [test.testName],
      });
    }
  });

  return Array.from(requirements.values());
}

/**
 * Validate if sample quality is acceptable for testing
 */
export function validateSampleQuality(quality: SampleQuality, testType: string): boolean {
  // Good quality is always acceptable
  if (quality === 'Good') return true;

  // Different tests have different tolerance levels
  const lowTolerance = ['Hematology', 'Coagulation', 'Blood Count'];
  const mediumTolerance = ['Biochemistry', 'Lipid Profile'];
  
  // Hemolysis affects some tests more than others
  if (quality === 'Hemolyzed') {
    return !lowTolerance.some(t => testType.includes(t));
  }

  // Clotted samples are generally not acceptable
  if (quality === 'Clotted') return false;

  // Lipemic can be acceptable for some tests
  if (quality === 'Lipemic') {
    return mediumTolerance.some(t => testType.includes(t));
  }

  // Contaminated and insufficient are not acceptable
  return false;
}

/**
 * Generate collection SMS for patient
 */
export function generateCollectionSMS(data: {
  patientName: string;
  sampleID: string;
  reportTime: string;
}): string {
  return `Dear ${data.patientName}, your sample ${data.sampleID} has been collected successfully. Your report will be ready by ${data.reportTime}. Thank you for choosing our lab.`;
}

/**
 * Generate collector notification SMS
 */
export function generateCollectorSMS(data: {
  collectorName: string;
  patientName: string;
  address: string;
  time: string;
  mobile: string;
}): string {
  return `Home collection assigned: Patient ${data.patientName}, Address: ${data.address}, Time: ${data.time}, Contact: ${data.mobile}. Please confirm.`;
}

/**
 * Calculate optimized route for collections
 * Simple nearest-neighbor algorithm for demonstration
 */
export function optimizeRoute(
  labLocation: { latitude: number; longitude: number },
  collections: HomeCollection[]
): RouteStop[] {
  if (collections.length === 0) return [];

  const unvisited = [...collections];
  const route: RouteStop[] = [];
  let currentLocation = labLocation;
  let sequence = 1;

  while (unvisited.length > 0) {
    // Find nearest unvisited collection
    let nearestIndex = 0;
    let minDistance = Number.MAX_VALUE;

    unvisited.forEach((collection, index) => {
      if (collection.latitude && collection.longitude) {
        const dist = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          collection.latitude,
          collection.longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = index;
        }
      }
    });

    const nearest = unvisited[nearestIndex];
    const estimatedDuration = 20; // 20 minutes per collection

    route.push({
      id: `stop-${sequence}`,
      sequence,
      collection: nearest,
      estimatedTime: '', // Will be calculated based on route start time
      estimatedDuration,
      distance: minDistance,
    });

    if (nearest.latitude && nearest.longitude) {
      currentLocation = {
        latitude: nearest.latitude,
        longitude: nearest.longitude,
      };
    }

    unvisited.splice(nearestIndex, 1);
    sequence++;
  }

  return route;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate total route distance
 */
export function calculateRouteDistance(stops: RouteStop[]): number {
  return stops.reduce((total, stop) => total + stop.distance, 0);
}

/**
 * Calculate estimated time of arrival
 */
export function calculateETA(distanceKm: number, averageSpeed: number = 30): number {
  // Average speed in km/h, default 30 km/h in city
  return Math.ceil((distanceKm / averageSpeed) * 60); // Returns minutes
}

/**
 * Format address for display
 */
export function formatAddress(address: string, area?: string, locality?: string): string {
  const parts = [address];
  if (locality) parts.push(locality);
  if (area && area !== locality) parts.push(area);
  return parts.join(', ');
}

/**
 * Group collections by area
 */
export function groupByArea(collections: HomeCollection[]): Map<string, HomeCollection[]> {
  const grouped = new Map<string, HomeCollection[]>();

  collections.forEach(collection => {
    const area = collection.area || 'Unknown';
    if (!grouped.has(area)) {
      grouped.set(area, []);
    }
    grouped.get(area)!.push(collection);
  });

  return grouped;
}

/**
 * Generate sample label data
 */
export function generateSampleLabel(sample: {
  sampleID: string;
  patientName: string;
  testNames: string[];
  collectionDate: string;
  collectionTime: string;
  collectorName: string;
}): string {
  return [
    `Sample ID: ${sample.sampleID}`,
    `Patient: ${sample.patientName}`,
    `Tests: ${sample.testNames.join(', ')}`,
    `Collected: ${sample.collectionDate} ${sample.collectionTime}`,
    `By: ${sample.collectorName}`,
  ].join('\n');
}

/**
 * Generate barcode data
 */
export function generateBarcodeData(sampleID: string): string {
  return sampleID;
}

/**
 * Get current GPS location
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      error => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for display
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time
 */
export function formatDateTime(datetime: string): string {
  return `${formatDate(datetime)} ${formatTime(datetime)}`;
}

/**
 * Check if collection is overdue (more than 30 minutes waiting)
 */
export function isOverdue(bookingTime: string): boolean {
  return calculateWaitingMinutes(bookingTime) > 30;
}

/**
 * Check if collection is urgent (less than 1 hour waiting or priority)
 */
export function isUrgent(bookingTime: string, priority?: string): boolean {
  return priority === 'Urgent' || priority === 'STAT' || calculateWaitingMinutes(bookingTime) > 60;
}

/**
 * Get department for tests
 */
export function getDepartmentForTests(tests: Test[]): Department {
  // Simple logic to determine department
  const testNames = tests.map(t => t.testName.toLowerCase()).join(' ');

  if (testNames.includes('cbc') || testNames.includes('hemoglobin') || testNames.includes('blood count')) {
    return 'Hematology';
  }
  if (testNames.includes('culture') || testNames.includes('sensitivity')) {
    return 'Microbiology';
  }
  if (testNames.includes('hiv') || testNames.includes('hepatitis') || testNames.includes('antibody')) {
    return 'Serology';
  }
  return 'Biochemistry';
}

/**
 * Get tube type color
 */
export function getTubeTypeColor(tubeType: string): string {
  const type = tubeType as keyof typeof TUBE_TYPES;
  return TUBE_TYPES[type]?.color || '#757575';
}

/**
 * Generate handover sheet data
 */
export function generateHandoverSheet(samples: Collection[]): string {
  const header = [
    '='.repeat(60),
    'SAMPLE HANDOVER SHEET',
    '='.repeat(60),
    `Date: ${formatDate(new Date().toISOString())}`,
    `Time: ${formatTime(new Date().toISOString())}`,
    `Total Samples: ${samples.length}`,
    '='.repeat(60),
    '',
  ].join('\n');

  const sampleList = samples
    .map(
      (sample, index) =>
        `${index + 1}. ${sample.sampleID} - ${sample.patient.name} (Token: ${sample.tokenNumber})`
    )
    .join('\n');

  const footer = [
    '',
    '='.repeat(60),
    'Handed over by: ________________  Sign: ________  Time: ______',
    '',
    'Received by: ________________  Sign: ________  Time: ______',
    '='.repeat(60),
  ].join('\n');

  return header + sampleList + footer;
}

/**
 * Calculate route statistics
 */
export function calculateRouteStatistics(stops: RouteStop[]): {
  totalDistance: number;
  totalDuration: number;
  estimatedEndTime: string;
} {
  const totalDistance = calculateRouteDistance(stops);
  const totalDuration = stops.reduce((sum, stop) => sum + stop.estimatedDuration, 0);
  
  // Add travel time (assuming 2 minutes per km)
  const travelTime = Math.ceil(totalDistance * 2);
  const totalTime = totalDuration + travelTime;

  return {
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalDuration: totalTime,
    estimatedEndTime: '', // Will be calculated based on start time
  };
}

/**
 * Upload file to server (mock implementation)
 */
export async function uploadFile(file: File): Promise<string> {
  // Mock implementation - returns a fake URL
  return new Promise(resolve => {
    setTimeout(() => {
      const fakeUrl = `https://storage.example.com/${Date.now()}-${file.name}`;
      resolve(fakeUrl);
    }, 1000);
  });
}

/**
 * Send to testing department
 */
export async function sendToTesting(sampleID: string, department: Department): Promise<void> {
  // Mock implementation
  console.log(`Sample ${sampleID} sent to ${department}`);
  return Promise.resolve();
}

/**
 * Get areas from collections
 */
export function getUniqueAreas(collections: HomeCollection[]): string[] {
  const areas = new Set<string>();
  collections.forEach(c => {
    if (c.area) areas.add(c.area);
  });
  return Array.from(areas).sort();
}

/**
 * Get report ready time
 */
export function getReportReadyTime(tests: Test[]): string {
  // Find the maximum report time
  const maxHours = Math.max(...tests.map(t => {
    const match = t.reportTime.match(/(\d+)/);
    return match ? parseInt(match[1]) : 24;
  }));

  const readyTime = new Date();
  readyTime.setHours(readyTime.getHours() + maxHours);

  return formatDateTime(readyTime.toISOString());
}

/**
 * Print labels (mock implementation)
 */
export function printLabels(samples: Collection[], count: number): void {
  console.log(`Printing ${count} label(s) for ${samples.length} sample(s)`);
  // In real implementation, this would interface with a thermal printer
}

/**
 * Send SMS (mock implementation)
 */
export async function sendSMS(mobile: string, message: string): Promise<void> {
  console.log(`SMS to ${mobile}: ${message}`);
  return Promise.resolve();
}

/**
 * Get Google Maps URL
 */
export function getGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Get Google Maps URL with coordinates
 */
export function getGoogleMapsUrlWithCoords(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
