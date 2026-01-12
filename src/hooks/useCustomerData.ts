// =============================================================================
// Custom Hook: useCustomers
// จัดการ state และ fetch data สำหรับ customer list
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '../types/useDebounce';
import type { CustomerListResponse, CustomerBasic } from '@/types/customer';

interface UseCustomersOptions {
  initialPageSize?: number;
  debounceMs?: number;
}

interface UseCustomersReturn {
  // Data
  customers: CustomerBasic[];
  totalCustomers: number;
  
  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  
  // Status
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersReturn {
  const { initialPageSize = 20, debounceMs = 300 } = options;

  // State
  const [customers, setCustomers] = useState<CustomerBasic[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [searchTerm, setSearchTermState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm);
      }

      const response = await fetch(`/api/customers/list?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลได้');
      }

      const data: CustomerListResponse = await response.json();

      setCustomers(data.data);
      setTotalCustomers(data.summary.totalCustomers);
      setTotalPages(data.pagination.totalPages);
      setHasNextPage(data.pagination.hasNextPage);
      setHasPrevPage(data.pagination.hasPrevPage);

    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, refreshTrigger]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Actions
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    customers,
    totalCustomers,
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    searchTerm,
    setSearchTerm,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
    isLoading,
    isError,
    error,
  };
}

// =============================================================================
// Custom Hook: useSalesDetail
// จัดการ state และ fetch data สำหรับ sales detail
// =============================================================================

import type { SalesDetailResponse, SalesDetailRecord } from '@/types/customer';

interface UseSalesDetailOptions {
  custCode: string;
  initialPageSize?: number;
}

interface UseSalesDetailReturn {
  // Data
  salesRecords: SalesDetailRecord[];
  customer: { custCode: string; custName: string } | null;
  summary: {
    totalAmt: number;
    totalPB: number;
    totalCums: number;
    totalCu: number;
    totalMs: number;
    totalRecords: number;
  } | null;
  
  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // Actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  
  // Status
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useSalesDetail(options: UseSalesDetailOptions): UseSalesDetailReturn {
  const { custCode, initialPageSize = 50 } = options;

  // State
  const [salesRecords, setSalesRecords] = useState<SalesDetailRecord[]>([]);
  const [customer, setCustomer] = useState<{ custCode: string; custName: string } | null>(null);
  const [summary, setSummary] = useState<UseSalesDetailReturn['summary']>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch sales detail
  const fetchSalesDetail = useCallback(async () => {
    if (!custCode) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      const response = await fetch(
        `/api/customers/${encodeURIComponent(custCode)}/sales?${params.toString()}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลได้');
      }

      const data: SalesDetailResponse = await response.json();

      setSalesRecords(data.data);
      setCustomer(data.customer);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
      setHasNextPage(data.pagination.hasNextPage);
      setHasPrevPage(data.pagination.hasPrevPage);

    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      setSalesRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [custCode, page, pageSize]);

  // Effect to fetch data
  useEffect(() => {
    fetchSalesDetail();
  }, [fetchSalesDetail, refreshTrigger]);

  // Actions
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    salesRecords,
    customer,
    summary,
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
    isLoading,
    isError,
    error,
  };
}