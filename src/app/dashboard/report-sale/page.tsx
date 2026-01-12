'use client';

// =============================================================================
// REPORT SALE PAGE - รายงานการขาย
// Migrated from: /users/reportSalePage
// Improvements: Server-side pagination, search, sorting, responsive design
// =============================================================================

import { useState, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useReportSale } from '../../../hooks/useReportSale';
import type { ReportSaleRecord } from '@/types/report-sale';

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
// UTILITY FUNCTIONS
// =============================================================================

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
}

const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  color,
  subValue,
}: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-400 mt-1">{subValue}</p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-opacity-20">{icon}</div>
      </div>
    </motion.div>
  );
});

// =============================================================================
// SEARCH INPUT COMPONENT
// =============================================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SearchInput = memo(function SearchInput({
  value,
  onChange,
  disabled,
}: SearchInputProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="ค้นหารหัสลูกค้า หรือ ชื่อลูกค้า..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200
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

// =============================================================================
// YEAR SELECTOR COMPONENT
// =============================================================================

interface YearSelectorProps {
  value: number;
  onChange: (year: number) => void;
  disabled?: boolean;
}

const YearSelector = memo(function YearSelector({
  value,
  onChange,
  disabled,
}: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 bg-white
                   focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                   text-gray-900 appearance-none cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            ปี {year + 543}
          </option>
        ))}
      </select>
    </div>
  );
});

// =============================================================================
// SORTABLE HEADER COMPONENT
// =============================================================================

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

const SortableHeader = memo(function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  align = 'left',
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSortBy === sortKey;

  const handleClick = () => {
    if (isActive) {
      onSort(sortKey, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(sortKey, 'asc');
    }
  };

  const alignClass = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }[align];

  return (
    <th
      className={`px-3 py-3 ${alignClass} text-xs font-semibold text-gray-600 
                  uppercase tracking-wider cursor-pointer hover:bg-gray-100 
                  transition-colors select-none ${className}`}
      onClick={handleClick}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span>{label}</span>
        {isActive ? (
          currentSortOrder === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </div>
    </th>
  );
});

// =============================================================================
// TABLE ROW COMPONENT
// =============================================================================

interface TableRowProps {
  record: ReportSaleRecord;
  index: number;
}

const TableRow = memo(function TableRow({ record, index }: TableRowProps) {
  return (
    <motion.tr
      variants={itemVariants}
      className="border-b border-gray-100 hover:bg-teal-50/30 transition-colors"
    >
      {/* ลำดับ */}
      <td className="px-3 py-3 text-center text-gray-500 text-sm">
        {index + 1}
      </td>

      {/* รหัสลูกค้า */}
      <td className="px-3 py-3">
        <Link
          href={`/dashboard/points/detail/${encodeURIComponent(record.custCode)}`}
          className="text-teal-600 hover:text-teal-800 font-medium transition-colors"
        >
          {record.custCode}
        </Link>
      </td>

      {/* ชื่อลูกค้า */}
      <td className="px-3 py-3 text-gray-900 max-w-[200px] truncate">
        {record.custName}
      </td>

      {/* ชื่อพนักงาน */}
      <td className="px-3 py-3 text-gray-600 hidden lg:table-cell">
        {record.saleName}
      </td>

      {/* ยอดรวม */}
      <td className="px-3 py-3 text-right font-mono text-gray-900 bg-blue-50/50">
        {formatNumber(record.netOne)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-700 bg-blue-50/50 hidden md:table-cell">
        {formatNumber(record.pbOne)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-700 bg-blue-50/50 hidden md:table-cell">
        {formatNumber(record.cumsOne)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600 bg-blue-50/50 hidden xl:table-cell">
        {formatNumber(record.cuOne)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600 bg-blue-50/50 hidden xl:table-cell">
        {formatNumber(record.msOne)}
      </td>

      {/* ยอด DocSP='1' */}
      <td className="px-3 py-3 text-right font-mono text-gray-700 bg-green-50/50 hidden lg:table-cell">
        {formatNumber(record.netTwo)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600 bg-green-50/50 hidden xl:table-cell">
        {formatNumber(record.pbTwo)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600 bg-green-50/50 hidden xl:table-cell">
        {formatNumber(record.cumsTwo)}
      </td>

      {/* ยอด DocSP='2' */}
      <td className="px-3 py-3 text-right font-mono text-gray-700 bg-orange-50/50 hidden lg:table-cell">
        {formatNumber(record.netThree)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600 bg-orange-50/50 hidden xl:table-cell">
        {formatNumber(record.pbThree)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600 bg-orange-50/50 hidden xl:table-cell">
        {formatNumber(record.cumsThree)}
      </td>
    </motion.tr>
  );
});

// =============================================================================
// MOBILE CARD COMPONENT
// =============================================================================

interface MobileCardProps {
  record: ReportSaleRecord;
  index: number;
}

const MobileCard = memo(function MobileCard({ record, index }: MobileCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link
            href={`/dashboard/points/detail/${encodeURIComponent(record.custCode)}`}
            className="text-teal-600 hover:text-teal-800 font-semibold transition-colors"
          >
            {record.custCode}
          </Link>
          <p className="text-gray-900 font-medium mt-1">{record.custName}</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          #{index + 1}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">ยอดขาย</p>
          <p className="font-mono font-semibold text-gray-900">
            {formatNumber(record.netOne)}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">PB</p>
          <p className="font-mono font-semibold text-gray-900">
            {formatNumber(record.pbOne)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">CUMS</p>
          <p className="font-mono font-semibold text-gray-900">
            {formatNumber(record.cumsOne)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Cu / MS</p>
          <p className="font-mono text-gray-900">
            {formatNumber(record.cuOne)} / {formatNumber(record.msOne)}
          </p>
        </div>
      </div>

      {/* Salesperson */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          พนักงาน: <span className="text-gray-700">{record.saleName || '-'}</span>
        </p>
      </div>
    </motion.div>
  );
});

// =============================================================================
// PAGINATION COMPONENT
// =============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

const Pagination = memo(function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onPageSizeChange,
  isLoading,
}: PaginationProps) {
  const pageSizes = [10, 20, 50, 100];

  // Generate page numbers to show
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    const halfShow = Math.floor(showPages / 2);

    let start = Math.max(1, page - halfShow);
    let end = Math.min(totalPages, start + showPages - 1);

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages]);

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 
                    bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
      {/* Page Size & Info */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>แสดง</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="border border-gray-200 rounded px-2 py-1 bg-white
                       focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>รายการ</span>
        </div>
        <span className="hidden sm:inline">
          แสดง {startItem} - {endItem} จาก {totalItems.toLocaleString()} รายการ
        </span>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage || isLoading}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors"
          aria-label="หน้าแรก"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || isLoading}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors"
          aria-label="หน้าก่อน"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                disabled={isLoading}
                className={`min-w-[36px] h-9 rounded font-medium transition-colors
                  ${
                    p === page
                      ? 'bg-teal-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isLoading}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors"
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage || isLoading}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors"
          aria-label="หน้าสุดท้าย"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// =============================================================================
// LOADING SKELETON
// =============================================================================

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-12 bg-gray-100" />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-100 bg-gray-50" />
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// ERROR STATE
// =============================================================================

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState = memo(function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        เกิดข้อผิดพลาด
      </h3>
      <p className="text-gray-500 mb-6 max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white 
                   rounded-lg hover:bg-teal-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
});

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  search: string;
  onClear: () => void;
}

const EmptyState = memo(function EmptyState({ search, onClear }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {search ? 'ไม่พบข้อมูล' : 'ยังไม่มีข้อมูล'}
      </h3>
      <p className="text-gray-500 mb-4">
        {search
          ? `ไม่พบรายการที่ตรงกับ "${search}"`
          : 'ยังไม่มีข้อมูลการขายในปีนี้'}
      </p>
      {search && (
        <button
          onClick={onClear}
          className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          ล้างคำค้นหา
        </button>
      )}
    </div>
  );
});

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ReportSalePage() {
  const {
    records,
    summary,
    user,
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    search,
    year,
    sortBy,
    sortOrder,
    goToPage,
    setPageSize,
    setSearch,
    setYear,
    setSorting,
    refresh,
    isLoading,
    isError,
    error,
  } = useReportSale();

  // Handle export to CSV
  const handleExport = useCallback(() => {
    if (!records.length) return;

    const headers = [
      'ลำดับ',
      'รหัสลูกค้า',
      'ชื่อลูกค้า',
      'พนักงาน',
      'ยอดขาย',
      'PB',
      'CUMS',
      'Cu',
      'MS',
      'ยอดขาย(1)',
      'PB(1)',
      'CUMS(1)',
      'ยอดขาย(2)',
      'PB(2)',
      'CUMS(2)',
    ].join(',');

    const rows = records.map((r, i) =>
      [
        i + 1,
        r.custCode,
        `"${r.custName}"`,
        `"${r.saleName}"`,
        r.netOne,
        r.pbOne,
        r.cumsOne,
        r.cuOne,
        r.msOne,
        r.netTwo ?? '',
        r.pbTwo ?? '',
        r.cumsTwo ?? '',
        r.netThree ?? '',
        r.pbThree ?? '',
        r.cumsThree ?? '',
      ].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-sale-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records, year]);

  // Show loading skeleton
  if (isLoading && !records.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">รายงานการขาย</h1>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">รายงานการขาย</h1>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <ErrorState message={error || 'เกิดข้อผิดพลาด'} onRetry={refresh} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">รายงานการขาย</h1>
              {user && (
                <p className="text-gray-500 mt-1">
                  ฝ่ายขาย {user.surName} {user.lastName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2.5 rounded-lg border border-gray-200 bg-white
                           hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="รีเฟรช"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                disabled={!records.length}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg 
                           bg-teal-600 text-white hover:bg-teal-700 
                           disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">ส่งออก CSV</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        {summary && (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              title="จำนวนลูกค้า"
              value={summary.totalRecords.toLocaleString()}
              icon={<Users className="w-6 h-6 text-teal-600" />}
              color="hover:border-teal-200"
              subValue="รายทั้งหมด"
            />
            <StatCard
              title="ยอดขายรวม"
              value={formatNumber(summary.totalNetOne)}
              icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
              color="hover:border-blue-200"
              subValue="บาท"
            />
            <StatCard
              title="PB รวม"
              value={formatNumber(summary.totalPBOne)}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
              color="hover:border-green-200"
              subValue="บาท"
            />
            <StatCard
              title="CUMS รวม"
              value={formatNumber(summary.totalCumsOne)}
              icon={<FileText className="w-6 h-6 text-orange-600" />}
              color="hover:border-orange-200"
              subValue="บาท"
            />
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4"
        >
          <SearchInput value={search} onChange={setSearch} disabled={isLoading} />
          <YearSelector value={year} onChange={setYear} disabled={isLoading} />
        </motion.div>

        {/* Data Table - Desktop */}
        <motion.div
          variants={itemVariants}
          className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-12">
                    #
                  </th>
                  <SortableHeader
                    label="รหัส"
                    sortKey="custCode"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                  />
                  <SortableHeader
                    label="ชื่อลูกค้า"
                    sortKey="custName"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                    className="min-w-[150px]"
                  />
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">
                    พนักงาน
                  </th>

                  {/* ยอดรวม - Blue */}
                  <SortableHeader
                    label="ยอดขาย"
                    sortKey="netOne"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                    align="right"
                    className="bg-blue-50"
                  />
                  <SortableHeader
                    label="PB"
                    sortKey="pbOne"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                    align="right"
                    className="bg-blue-50 hidden md:table-cell"
                  />
                  <SortableHeader
                    label="CUMS"
                    sortKey="cumsOne"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={setSorting}
                    align="right"
                    className="bg-blue-50 hidden md:table-cell"
                  />
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-blue-50 hidden xl:table-cell">
                    Cu
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-blue-50 hidden xl:table-cell">
                    MS
                  </th>

                  {/* DocSP='1' - Green */}
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-green-50 hidden lg:table-cell">
                    ยอด(1)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-green-50 hidden xl:table-cell">
                    PB(1)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-green-50 hidden xl:table-cell">
                    CUMS(1)
                  </th>

                  {/* DocSP='2' - Orange */}
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-orange-50 hidden lg:table-cell">
                    ยอด(2)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-orange-50 hidden xl:table-cell">
                    PB(2)
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-orange-50 hidden xl:table-cell">
                    CUMS(2)
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="wait">
                  {records.length > 0 ? (
                    records.map((record, index) => (
                      <TableRow
                        key={record.custCode}
                        record={record}
                        index={(page - 1) * pageSize + index}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={15} className="py-0">
                        <EmptyState
                          search={search}
                          onClear={() => setSearch('')}
                        />
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Loading overlay */}
          {isLoading && records.length > 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          )}
        </motion.div>

        {/* Data Cards - Mobile */}
        <motion.div
          variants={containerVariants}
          className="md:hidden space-y-3 mb-4"
        >
          <AnimatePresence mode="wait">
            {records.length > 0 ? (
              records.map((record, index) => (
                <MobileCard
                  key={record.custCode}
                  record={record}
                  index={(page - 1) * pageSize + index}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <EmptyState search={search} onClear={() => setSearch('')} />
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {records.length > 0 && (
          <motion.div variants={itemVariants}>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}