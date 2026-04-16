'use client';

// =============================================================================
// Page: รายละเอียดการขายของลูกค้า (Sales Detail / SubTableDetail)
// แสดงประวัติการขายทั้งหมดของลูกค้าที่เลือก พร้อม pagination + ค้นหาสินค้า
// =============================================================================

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Home,
  FileText,
  Package,
  DollarSign,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Search,
  X,
} from 'lucide-react';
import { useSalesDetail } from '@/hooks/useCustomerData';
import Pagination from '../../../../../components/ui/pagination';
import type { SalesDetailRecord } from '@/types/customer';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value: number): string {
  return `฿${formatNumber(value)}`;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Summary Card Component
 */
const SummaryCard = memo(function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'teal' | 'blue' | 'purple' | 'orange' | 'green';
}) {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  };

  return (
    <motion.div
      variants={cardVariants}
      className={`p-4 rounded-xl border ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-lg font-bold truncate">{value}</p>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Item Search Input Component
 */
const ItemSearchInput = memo(function ItemSearchInput({
  value,
  onChange,
  disabled,
  resultCount,
  isSearching,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  resultCount?: number;
  isSearching?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
      {/* Search box */}
      <div className="relative flex-1 min-w-0 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          placeholder="ค้นหาชื่อสินค้า..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // ✅ ลบ disabled ออก — ป้องกันแป้นพิมพ์ปิดตอน loading
          className={`w-full pl-9 pr-8 py-2 rounded-lg border transition-all duration-200
                      focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                      text-sm text-gray-900 placeholder-gray-400 bg-white
                      ${isSearching ? 'border-teal-300' : 'border-gray-200'}`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            disabled={disabled}
            className="absolute right-2.5 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600 transition-colors
                       disabled:opacity-50"
            aria-label="ล้างคำค้นหา"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Result count badge */}
      {value && !isSearching && resultCount !== undefined && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-sm text-gray-500 whitespace-nowrap shrink-0"
        >
          พบ{' '}
          <span className="font-semibold text-teal-600">
            {resultCount.toLocaleString()}
          </span>{' '}
          รายการ
        </motion.span>
      )}

      {/* Searching indicator */}
      {value && isSearching && (
        <span className="text-sm text-gray-400 whitespace-nowrap shrink-0">
          กำลังค้นหา...
        </span>
      )}
    </div>
  );
});

/**
 * Sales Table Row Component (Desktop)
 */
const SalesRow = memo(function SalesRow({
  record,
  index,
}: {
  record: SalesDetailRecord;
  index: number;
}) {
  return (
    <motion.tr
      variants={itemVariants}
      className="border-b border-gray-100 hover:bg-teal-50/50 transition-colors"
    >
      <td className="px-3 py-3 text-center">
        <Link
          href={`/dashboard/orders/${encodeURIComponent(record.orderNo)}`}
          className="text-teal-600 hover:text-teal-800 font-medium 
                     hover:underline transition-colors"
        >
          {record.orderNo}
        </Link>
      </td>
      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
        {record.dateDoc}
      </td>
      <td className="px-3 py-3 text-gray-600">
        {record.package || '-'}
      </td>
      <td className="px-3 py-3 text-gray-900 max-w-xs truncate" title={record.itemName}>
        {record.itemName}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600">
        {formatNumber(record.price)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-gray-600">
        {formatNumber(record.qty, 0)}
      </td>
      <td className="px-3 py-3 text-right font-mono font-medium text-gray-900">
        {formatNumber(record.amt)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-teal-600">
        {formatNumber(record.pb)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-blue-600">
        {formatNumber(record.cu)}
      </td>
      <td className="px-3 py-3 text-right font-mono text-purple-600">
        {formatNumber(record.ms)}
      </td>
    </motion.tr>
  );
});

/**
 * Mobile Card Component
 */
const MobileSalesCard = memo(function MobileSalesCard({
  record,
  index,
}: {
  record: SalesDetailRecord;
  index: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3"
    >
      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/dashboard/orders/${encodeURIComponent(record.orderNo)}`}
          className="text-teal-600 hover:text-teal-800 font-medium 
                     flex items-center gap-1"
        >
          <FileText className="w-4 h-4" />
          {record.orderNo}
        </Link>
        <span className="text-sm text-gray-500">{record.dateDoc}</span>
      </div>

      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {record.itemName}
      </h4>

      {record.package && (
        <p className="text-sm text-gray-500 mb-2">
          <Package className="w-3 h-3 inline mr-1" />
          {record.package}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-gray-100">
        <div>
          <span className="text-gray-500">ราคา:</span>{' '}
          <span className="font-mono">{formatNumber(record.price)}</span>
        </div>
        <div>
          <span className="text-gray-500">จำนวน:</span>{' '}
          <span className="font-mono">{formatNumber(record.qty, 0)}</span>
        </div>
        <div>
          <span className="text-gray-500">ยอด:</span>{' '}
          <span className="font-mono font-medium">{formatNumber(record.amt)}</span>
        </div>
        <div>
          <span className="text-gray-500">PB:</span>{' '}
          <span className="font-mono text-teal-600">{formatNumber(record.pb)}</span>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
          <div className="flex-1 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
});

/**
 * Empty State Component
 */
const EmptyState = memo(function EmptyState({
  itemSearch,
  onClearSearch,
}: {
  itemSearch: string;
  onClearSearch: () => void;
}) {
  if (itemSearch) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ไม่พบสินค้า &ldquo;{itemSearch}&rdquo;
        </h3>
        <p className="text-gray-500 mb-4">ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหา</p>
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white
                     rounded-lg hover:bg-teal-700 transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          ล้างคำค้นหา
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        ไม่พบข้อมูลการขาย
      </h3>
      <p className="text-gray-500">ลูกค้ารายนี้ยังไม่มีประวัติการขาย</p>
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

export default function SalesDetailPage() {
  const params = useParams();
  const custCode = decodeURIComponent(params.custCode as string);

  // Use custom hook for data management
  const {
    salesRecords,
    customer,
    summary,
    page,
    pageSize,
    totalPages,
    goToPage,
    setPageSize,
    refresh,
    isLoading,
    isError,
    error,
    itemSearch,
    setItemSearch,
  } = useSalesDetail({ custCode, initialPageSize: 50 });

  // Memoized summary cards
  const summaryCards = useMemo(() => {
    if (!summary) return null;
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        <SummaryCard title="ยอดขายรวม" value={formatCurrency(summary.totalAmt)} icon={DollarSign} color="teal" />
        <SummaryCard title="PB รวม"    value={formatNumber(summary.totalPB)}    icon={TrendingUp} color="blue" />
        <SummaryCard title="CUMS รวม"  value={formatNumber(summary.totalCums)}  icon={TrendingUp} color="purple" />
        <SummaryCard title="Cu รวม"    value={formatNumber(summary.totalCu)}    icon={TrendingUp} color="orange" />
        <SummaryCard title="MS รวม"    value={formatNumber(summary.totalMs)}    icon={TrendingUp} color="green" />
      </motion.div>
    );
  }, [summary]);

  // Table content (แยกจาก summary cards เพื่อให้ search bar อยู่ข้างนอก useMemo)
  const tableContent = useMemo(() => {
    if (isLoading && salesRecords.length === 0) {
      return <LoadingSkeleton />;
    }

    if (isError) {
      return <ErrorState message={error || 'เกิดข้อผิดพลาด'} onRetry={refresh} />;
    }

    if (salesRecords.length === 0) {
      return <EmptyState itemSearch={itemSearch} onClearSearch={() => setItemSearch('')} />;
    }

    return (
      <>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
              <tr>
                <th className="px-3 py-3 text-center text-sm font-semibold">Order No</th>
                <th className="px-3 py-3 text-left text-sm font-semibold">วันที่</th>
                <th className="px-3 py-3 text-left text-sm font-semibold">Package</th>
                <th className="px-3 py-3 text-left text-sm font-semibold">สินค้า</th>
                <th className="px-3 py-3 text-right text-sm font-semibold">ราคา</th>
                <th className="px-3 py-3 text-right text-sm font-semibold">จำนวน</th>
                <th className="px-3 py-3 text-right text-sm font-semibold">ยอด</th>
                <th className="px-3 py-3 text-right text-sm font-semibold">PB</th>
                <th className="px-3 py-3 text-right text-sm font-semibold">Cu</th>
                <th className="px-3 py-3 text-right text-sm font-semibold">MS</th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {salesRecords.map((record, index) => (
                <SalesRow key={`${record.orderNo}-${index}`} record={record} index={index} />
              ))}
            </motion.tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="md:hidden"
        >
          {salesRecords.map((record, index) => (
            <MobileSalesCard
              key={`${record.orderNo}-${index}`}
              record={record}
              index={index}
            />
          ))}
        </motion.div>
      </>
    );
  }, [isLoading, isError, error, salesRecords, refresh, itemSearch, setItemSearch]);

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
            <Link href="/dashboard/points/detail" className="hover:text-white transition-colors">
              รายละเอียดลูกค้า
            </Link>
            <span>/</span>
            <span className="text-white">{custCode}</span>
          </nav>

          {/* Back button & Title */}
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/points/detail"
              className="flex items-center justify-center w-10 h-10 rounded-lg
                         bg-white/10 hover:bg-white/20 transition-colors mt-1 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">
                {customer?.custName || 'กำลังโหลด...'}
              </h1>
              <p className="text-teal-100 mt-1 text-sm">
                รหัสลูกค้า: {custCode}
                {summary && (
                  <span className="ml-3">
                    •{' '}
                    {itemSearch
                      ? `${summary.totalRecords.toLocaleString()} รายการ (กรองแล้ว)`
                      : `${summary.totalRecords.toLocaleString()} รายการ`}
                  </span>
                )}
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center justify-center w-10 h-10 rounded-lg
                         bg-white/10 hover:bg-white/20 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="รีเฟรช"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6">

            {/* Summary Cards */}
            {summaryCards}

            {/* ── Search Bar ── */}
            {!isError && (
              <div className="mb-4">
                <ItemSearchInput
                  value={itemSearch}
                  onChange={setItemSearch}
                  disabled={isLoading}
                  resultCount={summary?.totalRecords}
                  isSearching={isLoading && !!itemSearch}
                />
              </div>
            )}

            {/* Table / Cards / Loading / Empty / Error */}
            {tableContent}
          </div>

          {/* Pagination */}
          {!isError && salesRecords.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={summary?.totalRecords || 0}
                pageSize={pageSize}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
                loading={isLoading}
                pageSizeOptions={[20, 50, 100, 200]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}