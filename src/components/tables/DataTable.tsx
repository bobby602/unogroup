"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Filter,
  Download,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  minWidth?: string;
  // Hide column on certain breakpoints
  hideOn?: ("mobile" | "tablet" | "desktop")[];
  // Custom cell renderer
  cell?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  // Format as number
  isNumber?: boolean;
  // Format as currency
  isCurrency?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  // Search
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  // Actions
  onRowClick?: (row: T, index: number) => void;
  // Mobile card view
  mobileCardRender?: (row: T, index: number) => React.ReactNode;
  // Empty state
  emptyMessage?: string;
  // Loading state
  isLoading?: boolean;
  // Title
  title?: string;
  // Export
  exportable?: boolean;
  onExport?: () => void;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  searchKeys,
  searchPlaceholder = "ค้นหา...",
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  mobileCardRender,
  emptyMessage = "ไม่พบข้อมูล",
  isLoading = false,
  title,
  exportable = false,
  onExport,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const query = searchQuery.toLowerCase();
    const keys = searchKeys || (columns.map((c) => c.key) as (keyof T)[]);

    return data.filter((row) =>
      keys.some((key) => {
        const value = row[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr, "th");
      }
      return bStr.localeCompare(aStr, "th");
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Get visibility class based on hideOn
  const getVisibilityClass = (hideOn?: ("mobile" | "tablet" | "desktop")[]) => {
    if (!hideOn || hideOn.length === 0) return "";
    
    const classes: string[] = [];
    if (hideOn.includes("mobile")) classes.push("hidden sm:table-cell");
    if (hideOn.includes("tablet")) classes.push("sm:hidden md:table-cell");
    if (hideOn.includes("desktop")) classes.push("md:hidden");
    
    return classes.join(" ");
  };

  // Render cell value
  const renderCellValue = (column: Column<T>, row: T, index: number) => {
    const value = row[column.key as keyof T];

    if (column.cell) {
      return column.cell(value, row, index);
    }

    if (column.isCurrency && typeof value === "number") {
      return `฿${formatNumber(value)}`;
    }

    if (column.isNumber && typeof value === "number") {
      return formatNumber(value);
    }

    return value as React.ReactNode ?? "-";
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title */}
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            {searchable && (
              <div className="relative flex-1 sm:flex-none">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full sm:w-64 pl-10 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Export */}
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="hidden sm:flex"
              >
                <Download size={16} />
                <span className="hidden md:inline ml-2">Export</span>
              </Button>
            )}

            {/* Mobile filter */}
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} />
            </Button>
          </div>
        </div>

        {/* Mobile Filter Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden mt-3 pt-3 border-t"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">แสดง:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 text-sm border rounded-lg"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size} รายการ
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-primary text-white">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-3 py-3 text-left text-sm font-medium whitespace-nowrap",
                    column.sortable && "cursor-pointer select-none hover:bg-brand-dark",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    getVisibilityClass(column.hideOn)
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={cn(
                            "-mb-1",
                            sortKey === column.key && sortDirection === "asc"
                              ? "text-white"
                              : "text-white/40"
                          )}
                        />
                        <ChevronDown
                          size={12}
                          className={cn(
                            sortKey === column.key && sortDirection === "desc"
                              ? "text-white"
                              : "text-white/40"
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn("px-3 py-3", getVisibilityClass(column.hideOn))}
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium">{emptyMessage}</p>
                    {searchQuery && (
                      <p className="text-sm mt-1">
                        ลองค้นหาด้วยคำค้นอื่น
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.02 }}
                  className={cn(
                    "border-b transition-colors",
                    rowIndex % 2 === 0 ? "bg-emerald-50/50" : "bg-white",
                    onRowClick && "cursor-pointer hover:bg-brand-secondary/20"
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-3 py-3 text-sm",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        getVisibilityClass(column.hideOn)
                      )}
                    >
                      {renderCellValue(column, row, rowIndex)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-medium">{emptyMessage}</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {paginatedData.map((row, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 bg-gray-50 rounded-xl border",
                  onRowClick && "cursor-pointer active:bg-gray-100"
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {mobileCardRender ? (
                  mobileCardRender(row, index)
                ) : (
                  // Default mobile card
                  <div className="space-y-2">
                    {columns
                      .filter((c) => !c.hideOn?.includes("mobile"))
                      .slice(0, 4)
                      .map((column) => (
                        <div
                          key={String(column.key)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-500">
                            {column.header}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {renderCellValue(column, row, index)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && sortedData.length > 0 && (
        <div className="px-3 sm:px-4 py-3 border-t bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Info */}
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              แสดง {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, sortedData.length)} จาก{" "}
              {sortedData.length} รายการ
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              {/* Page size selector - desktop only */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600">แสดง:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-sm border rounded-lg"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  <ChevronLeft size={16} className="-ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 text-sm rounded-lg transition-colors",
                          currentPage === pageNum
                            ? "bg-brand-primary text-white"
                            : "hover:bg-gray-200"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                  <ChevronRight size={16} className="-ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
