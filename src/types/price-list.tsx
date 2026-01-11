// =====================
// PRICE LIST TYPES
// =====================

export interface PriceListItem {
  num: number;
  name: string;
  mainName: string;
  namePack: string;
  point: number;
  package: string;
  priceList: number;
  price15: number;
  price25: number;
  price50: number;
  price120: number;
  catName: string;
  noteF: string;
  stShowPrice: string;
  id: string;
}

export interface PriceCategory {
  catName: string;
  items: PriceListItem[];
}

export interface GroupOption {
  G: string;
}

export interface PriceListData {
  categories: PriceCategory[];
  groups: GroupOption[];
  currentMonth: string;
  currentYear: number;
}

// Price adjustment configuration
export interface PriceAdjustmentConfig {
  pointValue: number;
  isUnderStandard: boolean;
}

// Price adjustment rates mapping
export const PRICE_ADJUSTMENT_RATES: Record<number, { under: number; over: number }> = {
  0: { under: 0, over: 0 },
  0.5: { under: 4, over: 4 },
  1: { under: 8, over: 8 },
  1.5: { under: 12, over: 12 },
  2: { under: 16, over: 16 },
  2.5: { under: 20, over: 20 },
  3: { under: 24, over: 24 },
  3.5: { under: 28, over: 28 },
  4: { under: 32, over: 32 },
  4.5: { under: 36, over: 36 },
  5: { under: 40, over: 40 },
  5.5: { under: 44, over: 44 },
  6: { under: 48, over: 48 },
  6.5: { under: 52, over: 52 },
  7: { under: 56, over: 56 },
  7.5: { under: 60, over: 60 },
  8: { under: 64, over: 64 },
  8.5: { under: 68, over: 68 },
  9: { under: 72, over: 72 },
  9.5: { under: 76, over: 76 },
  10: { under: 80, over: 80 },
};

// Under standard rates (negative adjustments)
export const UNDER_STANDARD_RATES: Record<number, number> = {
  0: 0,
  0.5: 4,
  1: 7,
  1.5: 10,
  2: 13,
  2.5: 16,
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}