import { PriceListItem, PriceCategory, GroupOption, PriceListData } from '@/types/price-list';

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

export function clearCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// =============================================================================
// DATA FETCHING (Client-side)
// =============================================================================

export async function fetchPriceList(group: string = '1'): Promise<PriceListData> {
  const cacheKey = `pricelist-${group}`;
  
  // Check cache first
  const cached = getCached<PriceListData>(cacheKey);
  if (cached) return cached;
  
  const response = await fetch(`/api/price-list?group=${group}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch price list');
  }
  
  // Cache the result
  setCache(cacheKey, result.data);
  
  return result.data;
}

// =============================================================================
// SEARCH AND FILTER UTILITIES
// =============================================================================

export function filterItems(items: PriceListItem[], query: string): PriceListItem[] {
  if (!query.trim()) return items;
  
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);
  
  return items.filter(item => {
    const searchText = [
      item.name,
      item.mainName,
      item.noteF,
      item.namePack,
      item.package,
      item.catName,
    ].join(' ').toLowerCase();
    
    // All query words must match
    return queryWords.every(word => searchText.includes(word));
  });
}

export function filterCategories(
  categories: PriceCategory[], 
  query: string
): PriceCategory[] {
  if (!query.trim()) return categories;
  
  return categories
    .map(cat => ({
      ...cat,
      items: filterItems(cat.items, query),
    }))
    .filter(cat => cat.items.length > 0);
}

// =============================================================================
// SORTING UTILITIES
// =============================================================================

export type SortField = 'name' | 'point' | 'priceList' | 'price15' | 'price25' | 'price50';
export type SortDirection = 'asc' | 'desc';

export function sortItems(
  items: PriceListItem[], 
  field: SortField, 
  direction: SortDirection
): PriceListItem[] {
  return [...items].sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;
    
    switch (field) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'point':
        valueA = a.point;
        valueB = b.point;
        break;
      case 'priceList':
        valueA = a.priceList;
        valueB = b.priceList;
        break;
      case 'price15':
        valueA = a.price15;
        valueB = b.price15;
        break;
      case 'price25':
        valueA = a.price25;
        valueB = b.price25;
        break;
      case 'price50':
        valueA = a.price50;
        valueB = b.price50;
        break;
      default:
        return 0;
    }
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// =============================================================================
// GROUPING UTILITIES
// =============================================================================

export function groupByMainName(items: PriceListItem[]): Map<string, PriceListItem[]> {
  const groups = new Map<string, PriceListItem[]>();
  
  for (const item of items) {
    const key = item.mainName;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  
  return groups;
}

export function getMainItems(items: PriceListItem[]): PriceListItem[] {
  return items.filter(item => item.num === 0 || item.num === 1);
}

export function getSubItems(items: PriceListItem[], mainName: string): PriceListItem[] {
  return items.filter(item => item.mainName === mainName && item.num > 0);
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface PriceListStats {
  totalItems: number;
  totalCategories: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPoint: number;
}

export function calculateStats(data: PriceListData): PriceListStats {
  let totalItems = 0;
  let sumPrice = 0;
  let sumPoint = 0;
  let minPrice = Infinity;
  let maxPrice = 0;
  let priceCount = 0;
  let pointCount = 0;
  
  for (const category of data.categories) {
    totalItems += category.items.length;
    
    for (const item of category.items) {
      if (item.priceList > 0) {
        sumPrice += item.priceList;
        priceCount++;
        if (item.priceList < minPrice) minPrice = item.priceList;
        if (item.priceList > maxPrice) maxPrice = item.priceList;
      }
      if (item.point > 0) {
        sumPoint += item.point;
        pointCount++;
      }
    }
  }
  
  return {
    totalItems,
    totalCategories: data.categories.length,
    avgPrice: priceCount > 0 ? Math.round(sumPrice / priceCount * 100) / 100 : 0,
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice,
    avgPoint: pointCount > 0 ? Math.round(sumPoint / pointCount * 100) / 100 : 0,
  };
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export function exportToCSV(data: PriceListData): string {
  const headers = [
    'หมวดหมู่',
    'ชื่อสามัญ',
    'ชื่อหลัก',
    'แพ็คกิ้ง',
    'แต้ม',
    'ขนาดบรรจุ',
    'Price',
    'Price15',
    'Price25',
    'Price50',
    'หมายเหตุ',
  ];
  
  const rows: string[][] = [headers];
  
  for (const category of data.categories) {
    for (const item of category.items) {
      rows.push([
        category.catName,
        item.name,
        item.mainName,
        item.namePack,
        item.point.toString(),
        item.package,
        item.priceList.toString(),
        item.price15.toString(),
        item.price25.toString(),
        item.price50.toString(),
        item.noteF,
      ]);
    }
  }
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

export function downloadCSV(data: PriceListData, filename: string = 'price-list.csv'): void {
  const csv = exportToCSV(data);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}