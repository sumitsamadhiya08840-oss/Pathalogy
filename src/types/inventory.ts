// Inventory Management Types

export type InventoryCategory = 
  | 'Reagent' 
  | 'Tube' 
  | 'Kit' 
  | 'Chemical' 
  | 'Consumable' 
  | 'Other';

export type StockTxnType = 
  | 'In' 
  | 'Out' 
  | 'Adjust';

export type InventoryItemStatus = 
  | 'Active' 
  | 'Inactive';

export type InventoryUnit = 
  | 'pcs' 
  | 'ml' 
  | 'L' 
  | 'mg' 
  | 'g' 
  | 'kg' 
  | 'box' 
  | 'pack' 
  | 'kit';

export interface InventoryBatch {
  batchId: string;
  itemId: string;
  lotNo?: string;
  expiryDate?: string; // ISO date string
  receivedAt: string;
  quantity: number; // Remaining quantity
  initialQuantity?: number; // Original quantity when received
  unitCost?: number;
  vendor?: string;
  notes?: string;
}

export interface InventoryItem {
  itemId: string;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  minStockLevel: number;
  status: InventoryItemStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  batches: InventoryBatch[];
}

export interface StockTransaction {
  txnId: string;
  type: StockTxnType;
  itemId: string;
  itemName?: string; // For display
  batchId?: string;
  lotNo?: string; // For display
  quantity: number;
  at: string;
  by: string;
  reason?: string;
  refBookingId?: string; // Optional future use
  refSampleId?: string; // Optional future use
}

// Category color mapping
export const CATEGORY_COLORS: Record<InventoryCategory, string> = {
  Reagent: '#2196F3',
  Tube: '#9C27B0',
  Kit: '#FF9800',
  Chemical: '#F44336',
  Consumable: '#4CAF50',
  Other: '#757575',
};

// Transaction type colors
export const TXN_TYPE_COLORS: Record<StockTxnType, string> = {
  In: '#4CAF50',
  Out: '#F44336',
  Adjust: '#FF9800',
};

// Status colors
export const STATUS_COLORS: Record<InventoryItemStatus, string> = {
  Active: '#4CAF50',
  Inactive: '#757575',
};
