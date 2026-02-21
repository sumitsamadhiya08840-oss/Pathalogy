// Inventory Store - localStorage persistence for inventory items, batches, and transactions

import type {
  InventoryItem,
  InventoryBatch,
  StockTransaction,
  InventoryCategory,
  StockTxnType,
  InventoryItemStatus,
  InventoryUnit,
} from '@/types/inventory';

const STORAGE_KEY_ITEMS = 'nxa_inventory_items_v1';
const STORAGE_KEY_TXNS = 'nxa_inventory_txns_v1';

// Generate unique IDs
function generateItemId(): string {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `ITEM-${random}`;
}

function generateBatchId(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BATCH-${dateStr}-${random}`;
}

function generateTxnId(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN-${dateStr}-${random}`;
}

// Seed inventory items
const SEED_ITEMS: InventoryItem[] = [
  {
    itemId: 'ITEM-00001',
    name: 'EDTA Tube (Purple Cap)',
    category: 'Tube',
    unit: 'pcs',
    minStockLevel: 100,
    status: 'Active',
    notes: 'For CBC and hematology tests',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    batches: [
      {
        batchId: 'BATCH-20260120-0001',
        itemId: 'ITEM-00001',
        lotNo: 'LOT-ED-2024-001',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(),
        quantity: 250,
        initialQuantity: 500,
        unitCost: 2.5,
        vendor: 'MedSupply Inc',
      },
      {
        batchId: 'BATCH-20260215-0002',
        itemId: 'ITEM-00001',
        lotNo: 'LOT-ED-2024-002',
        expiryDate: new Date(Date.now() + 400 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
        quantity: 500,
        initialQuantity: 500,
        unitCost: 2.4,
        vendor: 'MedSupply Inc',
      },
    ],
  },
  {
    itemId: 'ITEM-00002',
    name: 'Serum Tube (Red Cap)',
    category: 'Tube',
    unit: 'pcs',
    minStockLevel: 100,
    status: 'Active',
    notes: 'For biochemistry tests',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    batches: [
      {
        batchId: 'BATCH-20260120-0003',
        itemId: 'ITEM-00002',
        lotNo: 'LOT-SR-2024-001',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(),
        quantity: 180,
        initialQuantity: 500,
        unitCost: 2.8,
        vendor: 'LabTech Solutions',
      },
    ],
  },
  {
    itemId: 'ITEM-00003',
    name: 'CBC Reagent Kit',
    category: 'Kit',
    unit: 'kit',
    minStockLevel: 5,
    status: 'Active',
    notes: 'Complete Blood Count reagent kit - 1000 tests per kit',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    batches: [
      {
        batchId: 'BATCH-20260110-0004',
        itemId: 'ITEM-00003',
        lotNo: 'LOT-CBC-2024-045',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 45 * 24 * 60 * 60000).toISOString(),
        quantity: 3,
        initialQuantity: 10,
        unitCost: 15000,
        vendor: 'Biosystems Ltd',
      },
      {
        batchId: 'BATCH-20260205-0005',
        itemId: 'ITEM-00003',
        lotNo: 'LOT-CBC-2024-052',
        expiryDate: new Date(Date.now() + 250 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 15 * 24 * 60 * 60000).toISOString(),
        quantity: 8,
        initialQuantity: 10,
        unitCost: 14800,
        vendor: 'Biosystems Ltd',
      },
    ],
  },
  {
    itemId: 'ITEM-00004',
    name: 'Glucose Reagent',
    category: 'Reagent',
    unit: 'ml',
    minStockLevel: 500,
    status: 'Active',
    notes: 'For blood sugar testing',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    batches: [
      {
        batchId: 'BATCH-20260115-0006',
        itemId: 'ITEM-00004',
        lotNo: 'LOT-GLU-2024-089',
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 35 * 24 * 60 * 60000).toISOString(),
        quantity: 450,
        initialQuantity: 1000,
        unitCost: 0.8,
        vendor: 'ChemTech Supplies',
        notes: 'Expiring soon - use first',
      },
      {
        batchId: 'BATCH-20260210-0007',
        itemId: 'ITEM-00004',
        lotNo: 'LOT-GLU-2024-095',
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 10 * 24 * 60 * 60000).toISOString(),
        quantity: 1000,
        initialQuantity: 1000,
        unitCost: 0.75,
        vendor: 'ChemTech Supplies',
      },
    ],
  },
  {
    itemId: 'ITEM-00005',
    name: 'Gloves (Nitrile)',
    category: 'Consumable',
    unit: 'box',
    minStockLevel: 10,
    status: 'Active',
    notes: '100 pieces per box',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    batches: [
      {
        batchId: 'BATCH-20260201-0008',
        itemId: 'ITEM-00005',
        lotNo: 'LOT-GLV-2024-112',
        receivedAt: new Date(Date.now() - 20 * 24 * 60 * 60000).toISOString(),
        quantity: 35,
        initialQuantity: 50,
        unitCost: 150,
        vendor: 'Safety First Supplies',
      },
    ],
  },
  {
    itemId: 'ITEM-00006',
    name: 'Alcohol Swabs',
    category: 'Consumable',
    unit: 'pack',
    minStockLevel: 20,
    status: 'Active',
    notes: '100 swabs per pack',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    batches: [
      {
        batchId: 'BATCH-20260206-0009',
        itemId: 'ITEM-00006',
        lotNo: 'LOT-ALC-2024-078',
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60000).toISOString().split('T')[0],
        receivedAt: new Date(Date.now() - 15 * 24 * 60 * 60000).toISOString(),
        quantity: 15,
        initialQuantity: 50,
        unitCost: 50,
        vendor: 'MedSupply Inc',
      },
    ],
  },
];

// Seed transactions
const SEED_TRANSACTIONS: StockTransaction[] = [
  {
    txnId: 'TXN-20260120-0001',
    type: 'In',
    itemId: 'ITEM-00001',
    itemName: 'EDTA Tube (Purple Cap)',
    batchId: 'BATCH-20260120-0001',
    lotNo: 'LOT-ED-2024-001',
    quantity: 500,
    at: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(),
    by: 'Admin',
    reason: 'New stock received',
  },
  {
    txnId: 'TXN-20260125-0002',
    type: 'Out',
    itemId: 'ITEM-00001',
    itemName: 'EDTA Tube (Purple Cap)',
    batchId: 'BATCH-20260120-0001',
    lotNo: 'LOT-ED-2024-001',
    quantity: 50,
    at: new Date(Date.now() - 25 * 24 * 60 * 60000).toISOString(),
    by: 'Lab Tech',
    reason: 'Daily usage',
  },
  {
    txnId: 'TXN-20260215-0003',
    type: 'In',
    itemId: 'ITEM-00001',
    itemName: 'EDTA Tube (Purple Cap)',
    batchId: 'BATCH-20260215-0002',
    lotNo: 'LOT-ED-2024-002',
    quantity: 500,
    at: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
    by: 'Admin',
    reason: 'Replenishment',
  },
];

// Initialize seed data
function initializeSeedData(): void {
  if (typeof window === 'undefined') return;

  const existingItems = localStorage.getItem(STORAGE_KEY_ITEMS);
  const existingTxns = localStorage.getItem(STORAGE_KEY_TXNS);

  if (!existingItems) {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(SEED_ITEMS));
    console.log('✅ Inventory seed items initialized');
  }

  if (!existingTxns) {
    localStorage.setItem(STORAGE_KEY_TXNS, JSON.stringify(SEED_TRANSACTIONS));
    console.log('✅ Inventory seed transactions initialized');
  }
}

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
  initializeSeedData();
}

// Get all items
export function getItems(): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!data) {
      initializeSeedData();
      return SEED_ITEMS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading inventory items:', error);
    return [];
  }
}

// Get single item
export function getItem(itemId: string): InventoryItem | null {
  const items = getItems();
  return items.find(item => item.itemId === itemId) || null;
}

// Save items to localStorage
function saveItems(items: InventoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving inventory items:', error);
  }
}

// Get all transactions
export function getTransactions(): StockTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_TXNS);
    if (!data) {
      initializeSeedData();
      return SEED_TRANSACTIONS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
}

// Save transactions to localStorage
function saveTransactions(txns: StockTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TXNS, JSON.stringify(txns));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
}

// Create or update item
export function upsertItem(item: Omit<InventoryItem, 'itemId' | 'createdAt' | 'updatedAt' | 'batches'> & { itemId?: string }): InventoryItem {
  const items = getItems();
  const now = new Date().toISOString();

  if (item.itemId) {
    // Update existing
    const index = items.findIndex(i => i.itemId === item.itemId);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...item,
        itemId: item.itemId,
        updatedAt: now,
      };
      saveItems(items);
      return items[index];
    }
  }

  // Create new
  const newItem: InventoryItem = {
    ...item,
    itemId: item.itemId || generateItemId(),
    createdAt: now,
    updatedAt: now,
    batches: [],
  };

  items.push(newItem);
  saveItems(items);
  return newItem;
}

// Deactivate item
export function deactivateItem(itemId: string): boolean {
  const items = getItems();
  const index = items.findIndex(i => i.itemId === itemId);

  if (index === -1) return false;

  items[index].status = 'Inactive';
  items[index].updatedAt = new Date().toISOString();
  saveItems(items);
  return true;
}

// Add batch to item (Stock In)
export function addBatch(
  itemId: string,
  batch: Omit<InventoryBatch, 'batchId' | 'itemId'>,
  by: string = 'Staff'
): InventoryItem | null {
  const items = getItems();
  const index = items.findIndex(i => i.itemId === itemId);

  if (index === -1) return null;

  const batchId = generateBatchId();
  const newBatch: InventoryBatch = {
    ...batch,
    batchId,
    itemId,
    initialQuantity: batch.quantity,
  };

  items[index].batches.push(newBatch);
  items[index].updatedAt = new Date().toISOString();
  saveItems(items);

  // Create transaction
  const txn: StockTransaction = {
    txnId: generateTxnId(),
    type: 'In',
    itemId,
    itemName: items[index].name,
    batchId,
    lotNo: batch.lotNo,
    quantity: batch.quantity,
    at: new Date().toISOString(),
    by,
    reason: 'Stock received',
  };

  addTransaction(txn);

  return items[index];
}

// Stock out from batch
export function stockOut(
  itemId: string,
  batchId: string,
  quantity: number,
  by: string = 'Staff',
  reason: string = 'Usage'
): InventoryItem | null {
  const items = getItems();
  const index = items.findIndex(i => i.itemId === itemId);

  if (index === -1) {
    throw new Error('Item not found');
  }

  const batchIndex = items[index].batches.findIndex(b => b.batchId === batchId);

  if (batchIndex === -1) {
    throw new Error('Batch not found');
  }

  const batch = items[index].batches[batchIndex];

  if (batch.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${batch.quantity}, Requested: ${quantity}`);
  }

  // Update batch quantity
  items[index].batches[batchIndex].quantity -= quantity;
  items[index].updatedAt = new Date().toISOString();
  saveItems(items);

  // Create transaction
  const txn: StockTransaction = {
    txnId: generateTxnId(),
    type: 'Out',
    itemId,
    itemName: items[index].name,
    batchId,
    lotNo: batch.lotNo,
    quantity,
    at: new Date().toISOString(),
    by,
    reason,
  };

  addTransaction(txn);

  return items[index];
}

// Adjust batch quantity
export function adjustBatch(
  itemId: string,
  batchId: string,
  newQuantity: number,
  by: string = 'Staff',
  reason: string = 'Adjustment'
): InventoryItem | null {
  const items = getItems();
  const index = items.findIndex(i => i.itemId === itemId);

  if (index === -1) {
    throw new Error('Item not found');
  }

  const batchIndex = items[index].batches.findIndex(b => b.batchId === batchId);

  if (batchIndex === -1) {
    throw new Error('Batch not found');
  }

  const oldQuantity = items[index].batches[batchIndex].quantity;
  const difference = newQuantity - oldQuantity;

  items[index].batches[batchIndex].quantity = newQuantity;
  items[index].updatedAt = new Date().toISOString();
  saveItems(items);

  // Create transaction
  const txn: StockTransaction = {
    txnId: generateTxnId(),
    type: 'Adjust',
    itemId,
    itemName: items[index].name,
    batchId,
    lotNo: items[index].batches[batchIndex].lotNo,
    quantity: difference,
    at: new Date().toISOString(),
    by,
    reason,
  };

  addTransaction(txn);

  return items[index];
}

// Add transaction
function addTransaction(txn: StockTransaction): void {
  const txns = getTransactions();
  txns.unshift(txn); // Add to beginning
  saveTransactions(txns);
}

// Get total stock for an item
export function getItemTotalStock(itemId: string): number {
  const item = getItem(itemId);
  if (!item) return 0;
  return item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
}

// Get low stock items
export function getLowStockItems(): InventoryItem[] {
  const items = getItems();
  return items.filter(item => {
    if (item.status !== 'Active') return false;
    const totalStock = getItemTotalStock(item.itemId);
    return totalStock < item.minStockLevel;
  });
}

// Get out of stock items
export function getOutOfStockItems(): InventoryItem[] {
  const items = getItems();
  return items.filter(item => {
    if (item.status !== 'Active') return false;
    const totalStock = getItemTotalStock(item.itemId);
    return totalStock === 0;
  });
}

// Get expiring batches (within N days)
export function getExpiringBatches(days: number = 30): InventoryBatch[] {
  const items = getItems();
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const expiringBatches: InventoryBatch[] = [];

  items.forEach(item => {
    if (item.status !== 'Active') return;
    item.batches.forEach(batch => {
      if (batch.quantity === 0) return;
      if (batch.expiryDate) {
        const expiry = new Date(batch.expiryDate);
        if (expiry <= threshold && expiry >= now) {
          expiringBatches.push(batch);
        }
      }
    });
  });

  return expiringBatches;
}

// Get all batches with item details
export function getAllBatches(): Array<InventoryBatch & { itemName: string; category: InventoryCategory; unit: InventoryUnit }> {
  const items = getItems();
  const allBatches: Array<InventoryBatch & { itemName: string; category: InventoryCategory; unit: InventoryUnit }> = [];

  items.forEach(item => {
    item.batches.forEach(batch => {
      allBatches.push({
        ...batch,
        itemName: item.name,
        category: item.category,
        unit: item.unit,
      });
    });
  });

  // Sort by expiry date (nearest first)
  return allBatches.sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });
}

// Delete item (admin only)
export function deleteItem(itemId: string): boolean {
  const items = getItems();
  const index = items.findIndex(i => i.itemId === itemId);

  if (index === -1) return false;

  items.splice(index, 1);
  saveItems(items);
  return true;
}

// Delete batch
export function deleteBatch(itemId: string, batchId: string): boolean {
  const items = getItems();
  const itemIndex = items.findIndex(i => i.itemId === itemId);

  if (itemIndex === -1) return false;

  const batchIndex = items[itemIndex].batches.findIndex(b => b.batchId === batchId);

  if (batchIndex === -1) return false;

  items[itemIndex].batches.splice(batchIndex, 1);
  items[itemIndex].updatedAt = new Date().toISOString();
  saveItems(items);
  return true;
}

// Export all data
export function exportInventoryData() {
  return {
    items: getItems(),
    transactions: getTransactions(),
    exportedAt: new Date().toISOString(),
    version: 'v1',
  };
}

// Import data (for restore/migration)
export function importInventoryData(data: { items: InventoryItem[]; transactions: StockTransaction[] }) {
  if (typeof window === 'undefined') return;
  saveItems(data.items);
  saveTransactions(data.transactions);
}
