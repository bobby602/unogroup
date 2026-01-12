'use client';

// =============================================================================
// Component: Pagination
// Reusable pagination component with page numbers and navigation
// =============================================================================

import React, { useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  className?: string;
  loading?: boolean;
}

const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
  loading = false,
}: PaginationProps) {
  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5; // Maximum visible page buttons
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at start
      if (currentPage <= 3) {
        end = maxVisible - 1;
      }
      
      // Adjust if at end
      if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 2;
      }
      
      // Add ellipsis before range if needed
      if (start > 2) {
        pages.push('ellipsis');
      }
      
      // Add range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after range if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // Calculate display range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange?.(Number(e.target.value));
  };

  if (totalPages <= 1 && !showPageSize) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Items info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        {loading ? (
          <span className="animate-pulse">กำลังโหลด...</span>
        ) : (
          <span>
            แสดง <span className="font-medium">{startItem.toLocaleString()}</span> -{' '}
            <span className="font-medium">{endItem.toLocaleString()}</span> จาก{' '}
            <span className="font-medium">{totalItems.toLocaleString()}</span> รายการ
          </span>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Page size selector */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2 mr-4">
            <label htmlFor="pageSize" className="text-sm text-gray-600 hidden sm:inline">
              แสดง:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={loading}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white 
                         focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} รายการ
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation buttons */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                       transition-colors"
            aria-label="หน้าแรก"
            title="หน้าแรก"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                       transition-colors"
            aria-label="หน้าก่อนหน้า"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-1">
            {visiblePages.map((page, index) => (
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  disabled={loading}
                  className={`min-w-[32px] px-2 py-1 text-sm font-medium rounded-md transition-colors
                    ${currentPage === page
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    disabled:cursor-not-allowed`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                       transition-colors"
            aria-label="หน้าถัดไป"
            title="หน้าถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                       transition-colors"
            aria-label="หน้าสุดท้าย"
            title="หน้าสุดท้าย"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </div>
  );
});

export default Pagination;