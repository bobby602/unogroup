import { PriceListItem, PriceCategory, GroupOption, PriceListData } from '@/types/price-list';

// =============================================================================
// TYPES
// =============================================================================

export interface PriceListStats {
  totalItems: number;
  totalCategories: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

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
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => cache.delete(key));
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
    .map(category => ({
      ...category,
      items: filterItems(category.items, query),
    }))
    .filter(category => category.items.length > 0);
}

// =============================================================================
// STATISTICS UTILITIES
// =============================================================================

export function calculateStats(data: PriceListData): PriceListStats {
  let totalItems = 0;
  let totalPrice = 0;
  let minPrice = Infinity;
  let maxPrice = 0;
  
  for (const category of data.categories) {
    for (const item of category.items) {
      totalItems++;
      const price = item.priceList || 0;
      if (price > 0) {
        totalPrice += price;
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    }
  }
  
  return {
    totalItems,
    totalCategories: data.categories.length,
    avgPrice: totalItems > 0 ? totalPrice / totalItems : 0,
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice,
  };
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export function downloadCSV(data: PriceListData, filename: string = 'price-list.csv'): void {
  const headers = ['Category', 'Name', 'MainName', 'NamePack', 'Point', 'Package', 'PriceList', 'Price15', 'Price25', 'Price50', 'NoteF'];
  
  const rows: string[][] = [];
  
  for (const category of data.categories) {
    for (const item of category.items) {
      rows.push([
        category.catName,
        item.name,
        item.mainName,
        item.namePack,
        String(item.point),
        item.package,
        String(item.priceList),
        String(item.price15),
        String(item.price25),
        String(item.price50),
        item.noteF,
      ]);
    }
  }
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

export function formatNumber(num: number): string {
  if (num === 0) return '-';
  return num.toLocaleString('th-TH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

export function formatCurrency(num: number): string {
  if (num === 0) return '-';
  return num.toLocaleString('th-TH', { 
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}