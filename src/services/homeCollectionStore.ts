// Home Collection Store - localStorage persistence

import { HomePickup, Collector, HomeCollectionStatus, HomePickupAudit } from '@/types/homeCollection';

const STORAGE_KEY_PICKUPS = 'nxa_home_pickups_v1';
const STORAGE_KEY_COLLECTORS = 'nxa_collectors_v1';

// Seed collectors if none exist
const SEED_COLLECTORS: Collector[] = [
  {
    collectorId: 'COL001',
    name: 'Ramesh Kumar',
    phone: '9876543210',
    active: true,
    currentAssignments: 0,
    vehicleNumber: 'DL-01-AB-1234',
    rating: 4.5,
  },
  {
    collectorId: 'COL002',
    name: 'Sunil Sharma',
    phone: '9876543211',
    active: true,
    currentAssignments: 0,
    vehicleNumber: 'DL-01-AB-5678',
    rating: 4.8,
  },
  {
    collectorId: 'COL003',
    name: 'Vijay Singh',
    phone: '9876543212',
    active: true,
    currentAssignments: 0,
    vehicleNumber: 'DL-01-AB-9012',
    rating: 4.2,
  },
  {
    collectorId: 'COL004',
    name: 'Amit Patel',
    phone: '9876543213',
    active: true,
    currentAssignments: 0,
    vehicleNumber: 'DL-01-AB-3456',
    rating: 4.6,
  },
  {
    collectorId: 'COL005',
    name: 'Rajesh Verma',
    phone: '9876543214',
    active: false,
    currentAssignments: 0,
    vehicleNumber: 'DL-01-AB-7890',
    rating: 4.0,
  },
];

// Seed home pickups for demo
const SEED_PICKUPS: HomePickup[] = [
  {
    pickupId: 'HCP-20260221-0001',
    bookingId: 'TOK-20260221-0001',
    sampleId: 'SAMPLE-20260221-0001',
    patientId: 'P001',
    patientName: 'Rajesh Kumar',
    patientMobile: '9876543210',
    testName: 'Complete Blood Count',
    address: {
      line: 'House No. 45, Sector 12',
      area: 'Dwarka',
      city: 'New Delhi',
      pincode: '110075',
      landmark: 'Near Metro Station',
      lat: 28.5921,
      lng: 77.0460,
    },
    preferredSlot: {
      date: new Date().toISOString().split('T')[0],
      timeWindow: '09:00 AM - 12:00 PM',
    },
    status: 'Pending',
    priority: 'Normal',
    amount: 250,
    paymentStatus: 'Pending',
    audit: [
      {
        at: new Date(Date.now() - 30 * 60000).toISOString(),
        by: 'System',
        action: 'Home Pickup Created',
        notes: 'Created from token booking',
      },
    ],
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    pickupId: 'HCP-20260221-0002',
    bookingId: 'TOK-20260221-0002',
    sampleId: 'SAMPLE-20260221-0002',
    patientId: 'P002',
    patientName: 'Priya Sharma',
    patientMobile: '9876543211',
    testName: 'Lipid Profile, Thyroid Function Test',
    address: {
      line: 'Flat 302, Building A, Green Park Society',
      area: 'Vasant Kunj',
      city: 'New Delhi',
      pincode: '110070',
      landmark: 'Opposite DLF Mall',
      lat: 28.5244,
      lng: 77.1588,
    },
    preferredSlot: {
      date: new Date().toISOString().split('T')[0],
      timeWindow: '09:00 AM - 12:00 PM',
    },
    status: 'Assigned',
    collectorId: 'COL001',
    collectorName: 'Ramesh Kumar',
    assignedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    priority: 'Normal',
    amount: 1200,
    paymentStatus: 'Paid',
    audit: [
      {
        at: new Date(Date.now() - 45 * 60000).toISOString(),
        by: 'System',
        action: 'Home Pickup Created',
        notes: 'Created from token booking',
      },
      {
        at: new Date(Date.now() - 20 * 60000).toISOString(),
        by: 'Admin',
        action: 'Collector Assigned',
        notes: 'Assigned to Ramesh Kumar. ',
      },
    ],
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    pickupId: 'HCP-20260221-0003',
    bookingId: 'TOK-20260221-0003',
    sampleId: 'SAMPLE-20260221-0003',
    patientId: 'P003',
    patientName: 'Amit Patel',
    patientMobile: '9876543212',
    testName: 'Blood Sugar (Fasting), HbA1c',
    address: {
      line: 'B-45/2, Janakpuri',
      area: 'Janakpuri',
      city: 'New Delhi',
      pincode: '110058',
      landmark: 'Near District Centre',
      lat: 28.6217,
      lng: 77.0833,
    },
    preferredSlot: {
      date: new Date().toISOString().split('T')[0],
      timeWindow: '06:00 AM - 09:00 AM',
    },
    status: 'EnRoute',
    collectorId: 'COL002',
    collectorName: 'Sunil Sharma',
    assignedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    priority: 'Urgent',
    amount: 450,
    paymentStatus: 'COD',
    audit: [
      {
        at: new Date(Date.now() - 60 * 60000).toISOString(),
        by: 'System',
        action: 'Home Pickup Created',
        notes: 'Created from token booking',
      },
      {
        at: new Date(Date.now() - 40 * 60000).toISOString(),
        by: 'Staff',
        action: 'Collector Assigned',
        notes: 'Assigned to Sunil Sharma. Fasting sample - early morning collection',
      },
      {
        at: new Date(Date.now() - 10 * 60000).toISOString(),
        by: 'Sunil Sharma',
        action: 'Started Route',
        notes: 'Collector is on the way',
      },
    ],
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    pickupId: 'HCP-20260221-0004',
    bookingId: 'TOK-20260221-0004',
    sampleId: 'SAMPLE-20260221-0004',
    patientId: 'P004',
    patientName: 'Sunita Gupta',
    patientMobile: '9876543213',
    testName: 'Complete Urine Analysis, Kidney Function Test',
    address: {
      line: '23, Lajpat Nagar-II',
      area: 'Lajpat Nagar',
      city: 'New Delhi',
      pincode: '110024',
      landmark: 'Near Central Market',
      lat: 28.5677,
      lng: 77.2436,
    },
    preferredSlot: {
      date: new Date().toISOString().split('T')[0],
      timeWindow: '03:00 PM - 06:00 PM',
    },
    status: 'Collected',
    collectorId: 'COL003',
    collectorName: 'Vijay Singh',
    assignedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    collectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    priority: 'Normal',
    amount: 800,
    paymentStatus: 'Paid',
    proof: {
      receiverName: 'Sunita Gupta',
      otpVerified: true,
      collectedTime: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    audit: [
      {
        at: new Date(Date.now() - 120 * 60000).toISOString(),
        by: 'System',
        action: 'Home Pickup Created',
        notes: 'Created from token booking',
      },
      {
        at: new Date(Date.now() - 90 * 60000).toISOString(),
        by: 'Staff',
        action: 'Collector Assigned',
        notes: 'Assigned to Vijay Singh. ',
      },
      {
        at: new Date(Date.now() - 30 * 60000).toISOString(),
        by: 'Vijay Singh',
        action: 'Started Route',
        notes: 'Collector is on the way',
      },
      {
        at: new Date(Date.now() - 15 * 60000).toISOString(),
        by: 'Vijay Singh',
        action: 'Sample Collected',
        notes: 'Sample collected from patient',
      },
    ],
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    pickupId: 'HCP-20260220-0005',
    bookingId: 'TOK-20260220-0005',
    sampleId: 'SAMPLE-20260220-0005',
    patientId: 'P005',
    patientName: 'Vikram Mehta',
    patientMobile: '9876543214',
    testName: 'Vitamin D, Vitamin B12',
    address: {
      line: 'C-78, Greater Kailash-I',
      area: 'Greater Kailash',
      city: 'New Delhi',
      pincode: '110048',
      landmark: 'M Block Market',
      lat: 28.5494,
      lng: 77.2426,
    },
    preferredSlot: {
      date: new Date(Date.now() - 24 * 60 * 60000).toISOString().split('T')[0],
      timeWindow: '09:00 AM - 12:00 PM',
    },
    status: 'DeliveredToLab',
    collectorId: 'COL001',
    collectorName: 'Ramesh Kumar',
    assignedAt: new Date(Date.now() - 24 * 60 * 60000 - 90 * 60000).toISOString(),
    collectedAt: new Date(Date.now() - 24 * 60 * 60000 - 30 * 60000).toISOString(),
    deliveredAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    priority: 'Normal',
    amount: 1500,
    paymentStatus: 'Paid',
    proof: {
      receiverName: 'Neha Mehta (Wife)',
      otpVerified: true,
      collectedTime: new Date(Date.now() - 24 * 60 * 60000 - 30 * 60000).toISOString(),
    },
    audit: [
      {
        at: new Date(Date.now() - 24 * 60 * 60000 - 120 * 60000).toISOString(),
        by: 'System',
        action: 'Home Pickup Created',
        notes: 'Created from token booking',
      },
      {
        at: new Date(Date.now() - 24 * 60 * 60000 - 90 * 60000).toISOString(),
        by: 'Staff',
        action: 'Collector Assigned',
        notes: 'Assigned to Ramesh Kumar. ',
      },
      {
        at: new Date(Date.now() - 24 * 60 * 60000 - 60 * 60000).toISOString(),
        by: 'Ramesh Kumar',
        action: 'Started Route',
        notes: 'Collector is on the way',
      },
      {
        at: new Date(Date.now() - 24 * 60 * 60000 - 30 * 60000).toISOString(),
        by: 'Ramesh Kumar',
        action: 'Sample Collected',
        notes: 'Sample collected from patient',
      },
      {
        at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        by: 'Ramesh Kumar',
        action: 'Delivered to Lab',
        notes: 'Received by Lab Technician. ',
      },
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60000 - 120 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
  {
    pickupId: 'HCP-20260221-0006',
    bookingId: 'TOK-20260221-0006',
    sampleId: 'SAMPLE-20260221-0006',
    patientId: 'P006',
    patientName: 'Kavita Singh',
    patientMobile: '9876543215',
    testName: 'Liver Function Test, Complete Blood Count',
    address: {
      line: 'A-12, Mayur Vihar Phase-I',
      area: 'Mayur Vihar',
      city: 'New Delhi',
      pincode: '110091',
      landmark: 'Near Hanuman Mandir',
    },
    preferredSlot: {
      date: new Date().toISOString().split('T')[0],
      timeWindow: '12:00 PM - 03:00 PM',
    },
    status: 'Pending',
    priority: 'Urgent',
    amount: 950,
    paymentStatus: 'Pending',
    notes: 'Patient is elderly, please handle with care',
    audit: [
      {
        at: new Date(Date.now() - 15 * 60000).toISOString(),
        by: 'System',
        action: 'Home Pickup Created',
        notes: 'Created from token booking',
      },
    ],
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    pickupId: 'HCP-20260221-0007',
    bookingId: 'TOK-20260221-0007',
    sampleId: 'SAMPLE-20260221-0007',
    patientId: 'P007',
    patientName: 'Rahul Verma',
    patientMobile: '9876543216',
    testName: 'COVID-19 RT-PCR',
    address: {
      line: 'Flat 501, Tower B, Sapphire Heights',
      area: 'Rohini Sector 22',
      city: 'New Delhi',
      pincode: '110086',
      landmark: 'Near Rohini West Metro',
      lat: 28.7341,
      lng: 77.1025,
    },
    preferredSlot: {
      date: new Date().toISOString().split('T')[0],
      timeWindow: '09:00 AM - 12:00 PM',
    },
    status: 'Cancelled',
    cancelledAt: new Date(Date.now() - 5 * 60000).toISOString(),
    cancelReason: 'Patient not available',
    collectorId: 'COL004',
    collectorName: 'Amit Patel',
    assignedAt: new Date(Date.now() - 50 * 60000).toISOString(),
    priority: 'Urgent',
    amount: 600,
    paymentStatus: 'Pending',
    audit: [
      {
        at: new Date(Date.now() - 70 * 60000).toISOString(),
        by: 'System',
        action: 'Home Pickup Created',
        notes: 'Created from token booking',
      },
      {
        at: new Date(Date.now() - 50 * 60000).toISOString(),
        by: 'Staff',
        action: 'Collector Assigned',
        notes: 'Assigned to Amit Patel. ',
      },
      {
        at: new Date(Date.now() - 25 * 60000).toISOString(),
        by: 'Amit Patel',
        action: 'Started Route',
        notes: 'Collector is on the way',
      },
      {
        at: new Date(Date.now() - 5 * 60000).toISOString(),
        by: 'Amit Patel',
        action: 'Pickup Cancelled',
        notes: 'Reason: Patient not available. Called multiple times, no response',
      },
    ],
    createdAt: new Date(Date.now() - 70 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

// Initialize seed data
function initializeSeedData(): void {
  if (typeof window === 'undefined') return;
  
  // Check if already initialized
  const existingPickups = localStorage.getItem(STORAGE_KEY_PICKUPS);
  if (!existingPickups) {
    // First time - add seed data
    localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(SEED_PICKUPS));
    console.log('✅ Home Collection seed pickups initialized');
  }
}

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
  initializeSeedData();
}

// Get all home pickups
export function getHomePickups(): HomePickup[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_PICKUPS);
    if (!data) {
      // If no data, initialize with seed data
      initializeSeedData();
      return SEED_PICKUPS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading home pickups:', error);
    return [];
  }
}

// Save home pickups
export function saveHomePickups(pickups: HomePickup[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(pickups));
  } catch (error) {
    console.error('Error saving home pickups:', error);
  }
}

// Get single pickup
export function getHomePickup(pickupId: string): HomePickup | undefined {
  const pickups = getHomePickups();
  return pickups.find(p => p.pickupId === pickupId);
}

// Add new home pickup
export function addHomePickup(pickup: HomePickup): void {
  const pickups = getHomePickups();
  pickups.push(pickup);
  saveHomePickups(pickups);
}

// Update home pickup
export function updateHomePickup(pickupId: string, updates: Partial<HomePickup>): void {
  const pickups = getHomePickups();
  const index = pickups.findIndex(p => p.pickupId === pickupId);
  if (index !== -1) {
    pickups[index] = {
      ...pickups[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveHomePickups(pickups);
  }
}

// Add audit entry
export function addPickupAudit(pickupId: string, by: string, action: string, notes?: string): void {
  const pickups = getHomePickups();
  const index = pickups.findIndex(p => p.pickupId === pickupId);
  if (index !== -1) {
    const audit: HomePickupAudit = {
      at: new Date().toISOString(),
      by,
      action,
      notes,
    };
    pickups[index].audit.push(audit);
    pickups[index].updatedAt = new Date().toISOString();
    saveHomePickups(pickups);
  }
}

// Assign collector
export function assignCollector(pickupId: string, collectorId: string, collectorName: string, by: string, notes?: string): void {
  const now = new Date().toISOString();
  updateHomePickup(pickupId, {
    status: 'Assigned',
    collectorId,
    collectorName,
    assignedAt: now,
  });
  addPickupAudit(pickupId, by, 'Collector Assigned', `Assigned to ${collectorName}. ${notes || ''}`);
  
  // Update collector assignment count
  const collectors = getCollectors();
  const collector = collectors.find(c => c.collectorId === collectorId);
  if (collector) {
    collector.currentAssignments += 1;
    saveCollectors(collectors);
  }
}

// Start route (En Route)
export function startRoute(pickupId: string, by: string): void {
  updateHomePickup(pickupId, {
    status: 'EnRoute',
  });
  addPickupAudit(pickupId, by, 'Started Route', 'Collector is on the way');
}

// Mark collected
export function markCollected(pickupId: string, proof: any, by: string, notes?: string): void {
  const now = new Date().toISOString();
  updateHomePickup(pickupId, {
    status: 'Collected',
    collectedAt: now,
    proof,
  });
  addPickupAudit(pickupId, by, 'Sample Collected', notes || 'Sample collected from patient');
}

// Mark delivered to lab
export function markDeliveredToLab(pickupId: string, by: string, receivedBy: string, notes?: string): void {
  const pickup = getHomePickup(pickupId);
  if (!pickup) return;
  
  const now = new Date().toISOString();
  updateHomePickup(pickupId, {
    status: 'DeliveredToLab',
    deliveredAt: now,
  });
  addPickupAudit(pickupId, by, 'Delivered to Lab', `Received by ${receivedBy}. ${notes || ''}`);
  
  // Update collector assignment count
  if (pickup.collectorId) {
    const collectors = getCollectors();
    const collector = collectors.find(c => c.collectorId === pickup.collectorId);
    if (collector && collector.currentAssignments > 0) {
      collector.currentAssignments -= 1;
      saveCollectors(collectors);
    }
  }
}

// Cancel pickup
export function cancelPickup(pickupId: string, reason: string, by: string, notes?: string): void {
  const pickup = getHomePickup(pickupId);
  if (!pickup) return;
  
  const now = new Date().toISOString();
  updateHomePickup(pickupId, {
    status: 'Cancelled',
    cancelledAt: now,
    cancelReason: reason,
  });
  addPickupAudit(pickupId, by, 'Pickup Cancelled', `Reason: ${reason}. ${notes || ''}`);
  
  // Update collector assignment count if assigned
  if (pickup.collectorId && (pickup.status === 'Assigned' || pickup.status === 'EnRoute')) {
    const collectors = getCollectors();
    const collector = collectors.find(c => c.collectorId === pickup.collectorId);
    if (collector && collector.currentAssignments > 0) {
      collector.currentAssignments -= 1;
      saveCollectors(collectors);
    }
  }
}

// Get all collectors
export function getCollectors(): Collector[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_COLLECTORS);
    if (!data) {
      // Seed initial collectors
      saveCollectors(SEED_COLLECTORS);
      return SEED_COLLECTORS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading collectors:', error);
    return [];
  }
}

// Save collectors
export function saveCollectors(collectors: Collector[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_COLLECTORS, JSON.stringify(collectors));
  } catch (error) {
    console.error('Error saving collectors:', error);
  }
}

// Get active collectors
export function getActiveCollectors(): Collector[] {
  return getCollectors().filter(c => c.active);
}

// Generate pickup ID
export function generatePickupId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `HCP-${dateStr}-${randomNum}`;
}
