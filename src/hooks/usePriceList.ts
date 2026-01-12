'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PriceListData, PriceListItem, PriceCategory } from '@/types/price-list';
import { 
  fetchPriceList, 
  filterCategories, 
  calculateStats,
  PriceListStats 
} from '@/lib/price-list-utils';

// =============================================================================
// TYPES
// =============================================================================

interface UsePriceListState {
  data: PriceListData | null;
  loading: boolean;
  error: string | null;
  selectedGroup: string;
  searchQuery: string;
  pointAdjustments: Map<string, number>;
  filteredCategories: PriceCategory[];
  stats: PriceListStats | null;
}

interface UsePriceListActions {
  fetchData: (group: string) => Promise<void>;
  setSelectedGroup: (group: string) => void;
  setSearchQuery: (query: string) => void;
  adjustPoint: (mainName: string, delta: number) => void;
  resetPointAdjustments: () => void;
  resetAll: () => void;
}

type UsePriceListReturn = UsePriceListState & UsePriceListActions;

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function usePriceList(initialGroup: string = '1'): UsePriceListReturn {
  // State
  const [data, setData] = useState<PriceListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const [searchQuery, setSearchQuery] = useState('');
  const [pointAdjustments, setPointAdjustments] = useState<Map<string, number>>(new Map());
  
  // Abort controller for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Fetch data function
  const fetchData = useCallback(async (group: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPriceList(group);
      setData(result);
      setPointAdjustments(new Map()); // Reset adjustments on group change
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    fetchData(initialGroup);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, initialGroup]);
  
  // Handle group change
  const handleSetSelectedGroup = useCallback((group: string) => {
    setSelectedGroup(group);
    fetchData(group);
  }, [fetchData]);
  
  // Handle search query with debounce
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // Adjust point
  const adjustPoint = useCallback((mainName: string, delta: number) => {
    setPointAdjustments(prev => {
      const newMap = new Map(prev);
      
      // 1. หาข้อมูลสินค้าตัวนี้เพื่อดูแต้มตั้งต้น (Standard Point)
      const item = data?.categories
        .flatMap(c => c.items)
        .find(i => i.mainName === mainName && i.num === 0);
      
      if (!item) return prev;

      const stdPoint = item.point; // แต้มเดิมจากฐานข้อมูล
      const currentAdjustment = newMap.get(mainName) || 0;
      
      // 2. คำนวณแต้มใหม่ที่ควรจะเป็น (แต้มจริง)
      let newPoint = stdPoint + currentAdjustment + delta;

      // 3. --- LOGIC พิเศษจากต้นฉบับ (Legacy Match) ---
      
      // การกระโดดข้ามตัวเลข (Skip Logic)
      if (delta < 0 && newPoint === 1.0) newPoint = 0.5; // ถ้าลดจาก 1.5 ลงมา ให้ข้าม 1.0 ไปที่ 0.5
      if (delta > 0 && newPoint === 4.5) newPoint = 5.0; // ถ้าเพิ่มจาก 4.0 ขึ้นมา ให้ข้าม 4.5 ไปที่ 5.0

      // การกั้นขอบเขต (Constraints)
      if (newPoint < 0.5) newPoint = 0.5; // ห้ามต่ำกว่า 0.5 (แก้ปัญหาตัวเลขติดลบ)
      if (newPoint > 13) newPoint = 13;   // เพดานสูงสุดไม่เกิน 13
      if (newPoint > stdPoint + 10) newPoint = stdPoint + 10; // เพดานเทียบกับแต้มเดิม
      
      // ---------------------------------------------

      // 4. คำนวณผลต่างเพื่อเก็บลงใน Map (Adjustment)
      const finalAdjustment = newPoint - stdPoint;
      
      // ถ้าแต้มกลับมาเท่ากับแต้มเดิม (ผลต่างเป็น 0) ให้ลบทิ้งจาก Map
      if (Math.abs(finalAdjustment) < 0.001) {
        newMap.delete(mainName);
      } else {
        newMap.set(mainName, finalAdjustment);
      }
      
      return newMap;
    });
  }, [data]);
  
  // Reset point adjustments
  const resetPointAdjustments = useCallback(() => {
    setPointAdjustments(new Map());
  }, []);
  
  // Reset all
  const resetAll = useCallback(() => {
    setSearchQuery('');
    setPointAdjustments(new Map());
  }, []);
  
  // Filtered categories (memoized)
  const filteredCategories = useMemo(() => {
    if (!data) return [];
    return filterCategories(data.categories, searchQuery);
  }, [data, searchQuery]);
  
  // Stats (memoized)
  const stats = useMemo(() => {
    if (!data) return null;
    return calculateStats(data);
  }, [data]);
  
  return {
    // State
    data,
    loading,
    error,
    selectedGroup,
    searchQuery,
    pointAdjustments,
    filteredCategories,
    stats,
    // Actions
    fetchData,
    setSelectedGroup: handleSetSelectedGroup,
    setSearchQuery: handleSetSearchQuery,
    adjustPoint,
    resetPointAdjustments,
    resetAll,
  };
}

// =============================================================================
// VIRTUALIZATION HOOK (for large lists)
// =============================================================================

interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

interface UseVirtualListOptions {
  itemCount: number;
  itemSize: number;
  overscan?: number;
}

export function useVirtualList(
  containerRef: React.RefObject<HTMLElement>,
  { itemCount, itemSize, overscan = 5 }: UseVirtualListOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
    
    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };
    
    // Initial setup
    handleResize();
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    globalThis.addEventListener('resize', handleResize);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      globalThis.removeEventListener('resize', handleResize);
    };
  }, [containerRef]);
  
  // Calculate visible items
  const virtualItems = useMemo((): VirtualItem[] => {
    if (containerHeight === 0 || itemCount === 0) return [];
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.floor((scrollTop + containerHeight) / itemSize) + overscan
    );
    
    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemSize,
        size: itemSize,
      });
    }
    
    return items;
  }, [scrollTop, containerHeight, itemCount, itemSize, overscan]);
  
  const totalSize = itemCount * itemSize;
  
  return {
    virtualItems,
    totalSize,
    containerHeight,
    scrollTop,
  };
}

// =============================================================================
// DEBOUNCED SEARCH HOOK
// =============================================================================

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// =============================================================================
// LOCAL STORAGE PERSISTENCE HOOK
// =============================================================================

interface UsePriceListPersistenceOptions {
  key?: string;
  enabled?: boolean;
}

export function usePriceListPersistence(
  pointAdjustments: Map<string, number>,
  setPointAdjustments: (adjustments: Map<string, number>) => void,
  options: UsePriceListPersistenceOptions = {}
) {
  const { key = 'priceListAdjustments', enabled = true } = options;
  
  // Load from localStorage on mount
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPointAdjustments(new Map(parsed));
        }
      }
    } catch (err) {
      console.warn('Failed to load price list adjustments from localStorage:', err);
    }
  }, [key, enabled, setPointAdjustments]);
  
  // Save to localStorage on change
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const serialized = JSON.stringify(Array.from(pointAdjustments.entries()));
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('Failed to save price list adjustments to localStorage:', err);
    }
  }, [key, enabled, pointAdjustments]);
}