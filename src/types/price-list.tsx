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
// OVER STANDARD: กด + เพิ่มราคา (ทุก 0.5 step เพิ่ม 4%)
// UNDER STANDARD: กด - ลดราคา (ใช้ UNDER_STANDARD_RATES แยก)
export const PRICE_ADJUSTMENT_RATES: Record<number, number> = {
  0: 0,
  0.5: 4,
  1: 8,
  1.5: 12,
  2: 16,
  2.5: 20,
  3: 24,
  3.5: 28,
  4: 32,
  4.5: 36,
  5: 40,
  5.5: 44,
  6: 48,
  6.5: 52,
  7: 56,
  7.5: 60,
  8: 64,
  8.5: 68,
  9: 72,
  9.5: 76,
  10: 80,
};

// Under standard rates (negative adjustments) - ค่าต่างจาก over!
// Legacy: 0.5→4%, 1→7%, 1.5→10%, 2→13%, 2.5→16%
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