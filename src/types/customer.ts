// =============================================================================
// CUSTOMER TYPES - รายละเอียดประวัติการขายลูกค้า
// =============================================================================

/**
 * Customer basic info from V801 view
 */
export interface CustomerBasic {
  custName: string;
  custCode: string;
  codeG: string;
}

/**
 * Customer list response with pagination
 */
export interface CustomerListResponse {
  data: CustomerBasic[];
  pagination: PaginationInfo;
  summary: {
    totalCustomers: number;
  };
}

/**
 * Sales detail record from RptSale3N
 */
export interface SalesDetailRecord {
  orderNo: string;
  custCode: string;
  name: string;
  dateDoc: string;
  package: string | null;
  itemName: string;
  price: number;
  qty: number;
  qtySale: number;
  amt: number;
  pb: number;
  cums: number;
  cu: number;
  ms: number;
  codeG: string;
}

/**
 * Sales detail response with pagination and summary
 */
export interface SalesDetailResponse {
  data: SalesDetailRecord[];
  customer: {
    custCode: string;
    custName: string;
  };
  pagination: PaginationInfo;
  summary: {
    totalAmt: number;
    totalPB: number;
    totalCums: number;
    totalCu: number;
    totalMs: number;
    totalRecords: number;
  };
}

/**
 * Pagination info for API responses
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Query params for customer list API
 */
export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Query params for sales detail API
 */
export interface SalesDetailParams {
  custCode: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  message: string;
  code?: string;
}