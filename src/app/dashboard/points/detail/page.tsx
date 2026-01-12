'use client';

// =============================================================================
// Page: รายละเอียดประวัติการขายลูกค้า (Detail Point)
// แสดงรายชื่อลูกค้าทั้งหมด พร้อม search และ pagination
// =============================================================================

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  ArrowRight, 
  RefreshCw,
  AlertCircle,
  Home 
} from 'lucide-react';
import { useCustomers } from '../../../../hooks/useCustomerData';
import Pagination from '../../../../components/ui/pagination';
import type { CustomerBasic } from '../../../../types/customer';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Search Input Component
 */
const SearchInput = memo(function SearchInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="ค้นหาชื่อลูกค้า หรือ รหัสลูกค้า..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200
                   bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                   text-gray-900 placeholder-gray-400
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                     hover:text-gray-600 transition-colors"
          aria-label="ล้างคำค้นหา"
        >
          ×
        </button>
      )}
    </div>
  );
});

/**
 * Customer Table Row Component
 */
const CustomerRow = memo(function CustomerRow({
  customer,
  index,
}: {
  customer: CustomerBasic;
  index: number;
}) {
  return (
    <motion.tr
      variants={itemVariants}
      className="border-b border-gray-100 hover:bg-teal-50/50 transition-colors"
    >
      <td className="px-4 py-3 text-gray-900">
        {customer.custName}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/dashboard/points/detail/${encodeURIComponent(customer.custCode)}`}
          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 
                     font-medium transition-colors group"
        >
          {customer.custCode}
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 
                                 transform group-hover:translate-x-1 transition-all" />
        </Link>
      </td>
      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
        {customer.codeG}
      </td>
    </motion.tr>
  );
});

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded hidden sm:block"></div>
        </div>
      ))}
    </div>
  );
});

/**
 * Empty State Component
 */
const EmptyState = memo(function EmptyState({
  searchTerm,
  onClear,
}: {
  searchTerm: string;
  onClear: () => void;
}) {
  return (
    <div className="text-center py-12">
      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? 'ไม่พบข้อมูลลูกค้า' : 'ยังไม่มีข้อมูลลูกค้า'}
      </h3>
      <p className="text-gray-500 mb-4">
        {searchTerm 
          ? `ไม่พบลูกค้าที่ตรงกับ "${searchTerm}"`
          : 'ระบบยังไม่มีข้อมูลลูกค้าในช่วงเวลานี้'
        }
      </p>
      {searchTerm && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700
                     hover:bg-teal-50 rounded-lg transition-colors"
        >
          ล้างคำค้นหา
        </button>
      )}
    </div>
  );
});

/**
 * Error State Component
 */
const ErrorState = memo(function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white
                   rounded-lg hover:bg-teal-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CustomerListPage() {
  const router = useRouter();
  
  // Use custom hook for data management
  const {
    customers,
    totalCustomers,
    page,
    pageSize,
    totalPages,
    searchTerm,
    setSearchTerm,
    goToPage,
    setPageSize,
    refresh,
    isLoading,
    isError,
    error,
  } = useCustomers({ initialPageSize: 20, debounceMs: 300 });

  // Handlers
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, [setSearchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-teal-100 mb-4">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <span>/</span>
            <span className="text-white">รายละเอียดประวัติการขายลูกค้า</span>
          </nav>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                รายละเอียดประวัติการขายลูกค้า
              </h1>
              <p className="text-teal-100 mt-1">
                เลือกลูกค้าเพื่อดูประวัติการขาย
              </p>
            </div>
            
            {/* Stats Badge */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm 
                            rounded-lg px-4 py-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">
                {isLoading ? '...' : totalCustomers.toLocaleString()} ลูกค้า
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search & Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                disabled={isLoading && customers.length === 0}
              />
            </div>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5
                         bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Loading State */}
          {isLoading && <LoadingSkeleton />}

          {/* Error State */}
          {!isLoading && isError && (
            <ErrorState message={error || 'เกิดข้อผิดพลาด'} onRetry={refresh} />
          )}

          {/* Empty State */}
          {!isLoading && !isError && customers.length === 0 && (
            <EmptyState searchTerm={searchTerm} onClear={handleClearSearch} />
          )}

          {/* Data Table */}
          {!isLoading && !isError && customers.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        ชื่อลูกค้า
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        รหัสลูกค้า
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold hidden sm:table-cell">
                        รหัสพนักงาน
                      </th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {customers.map((customer, index) => (
                      <CustomerRow 
                        key={customer.custCode} 
                        customer={customer} 
                        index={index}
                      />
                    ))}
                  </motion.tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-gray-100 px-4 py-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalCustomers}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                  loading={isLoading}
                  pageSizeOptions={[10, 20, 50, 100]}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}