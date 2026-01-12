// =============================================================================
// useReportSale Hook - รายงานการขาย
// =============================================================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  ReportSaleResponse,
  ReportSaleRecord,
  ReportSalePagination,
  ReportSaleSummary,
  ReportSaleParams,
} from '@/types/report-sale';

interface UseReportSaleOptions {
  initialPageSize?: number;
  initialYear?: number;
}

interface UseReportSaleReturn {
  // Data
  records: ReportSaleRecord[];
  summary: ReportSaleSummary | null;
  user: { codeG: string; surName: string; lastName: string } | null;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  // Filters
  search: string;
  year: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  setSearch: (search: string) => void;
  setYear: (year: number) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refresh: () => void;

  // Status
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

const DEFAULT_PAGE_SIZE = 20;

export function useReportSale(options: UseReportSaleOptions = {}): UseReportSaleReturn {
  const {
    initialPageSize = DEFAULT_PAGE_SIZE,
    initialYear = new Date().getFullYear(),
  } = options;

  // Data state
  const [records, setRecords] = useState<ReportSaleRecord[]>([]);
  const [summary, setSummary] = useState<ReportSaleSummary | null>(null);
  const [user, setUser] = useState<UseReportSaleReturn['user']>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Filter state
  const [search, setSearchState] = useState('');
  const [year, setYearState] = useState(initialYear);
  const [sortBy, setSortByState] = useState('custCode');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('asc');

  // Status state
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        year: String(year),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const response = await fetch(`/api/sales/report?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ไม่สามารถดึงข้อมูลได้');
      }

      const data: ReportSaleResponse = await response.json();

      if (data.success) {
        setRecords(data.data);
        setSummary(data.summary);
        setUser(data.user);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setHasNextPage(data.pagination.hasNextPage);
        setHasPrevPage(data.pagination.hasPrevPage);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      setRecords([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, year, sortBy, sortOrder, debouncedSearch, refreshTrigger]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to page 1 when page size changes
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const setYear = useCallback((value: number) => {
    setYearState(value);
    setPage(1); // Reset to page 1 when year changes
  }, []);

  const setSorting = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortByState(newSortBy);
    setSortOrderState(newSortOrder);
    setPage(1); // Reset to page 1 when sorting changes
  }, []);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    // Data
    records,
    summary,
    user,

    // Pagination
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,

    // Filters
    search,
    year,
    sortBy,
    sortOrder,

    // Actions
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    setSearch,
    setYear,
    setSorting,
    refresh,

    // Status
    isLoading,
    isError,
    error,
  };
}

export default useReportSale;