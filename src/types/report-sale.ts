// =============================================================================
// REPORT SALE PAGE TYPES - รายงานการขาย
// =============================================================================

/**
 * รายการขายลูกค้าแบบรวม (จาก SQL Query)
 * - NetOne/PBOne/CumsOne = ยอดรวมทั้งหมด
 * - NetTwo/PBTwo/cumsTwo = ยอดจาก DocSP='1'
 * - NetThree/PBThree/CUMSThree = ยอดจาก DocSP='2'
 */
export interface ReportSaleRecord {
  custCode: string;
  custName: string;
  saleName: string;
  // ยอดรวมทั้งหมด
  netOne: number;
  pbOne: number;
  cumsOne: number;
  cuOne: number;
  msOne: number;
  // ยอดจาก DocSP='1'
  netTwo: number | null;
  pbTwo: number | null;
  cumsTwo: number | null;
  // ยอดจาก DocSP='2'
  netThree: number | null;
  pbThree: number | null;
  cumsThree: number | null;
}

/**
 * Pagination info
 */
export interface ReportSalePagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Summary totals
 */
export interface ReportSaleSummary {
  totalNetOne: number;
  totalPBOne: number;
  totalCumsOne: number;
  totalCuOne: number;
  totalMsOne: number;
  totalNetTwo: number;
  totalPBTwo: number;
  totalCumsTwo: number;
  totalNetThree: number;
  totalPBThree: number;
  totalCumsThree: number;
  totalRecords: number;
}

/**
 * API Response
 */
export interface ReportSaleResponse {
  success: boolean;
  data: ReportSaleRecord[];
  pagination: ReportSalePagination;
  summary: ReportSaleSummary;
  filters: {
    year: number;
    search?: string;
  };
  user: {
    codeG: string;
    surName: string;
    lastName: string;
  };
}

/**
 * Query params for API
 */
export interface ReportSaleParams {
  page?: number;
  pageSize?: number;
  search?: string;
  year?: number;
  sortBy?: 'custCode' | 'custName' | 'netOne' | 'pbOne' | 'cumsOne';
  sortOrder?: 'asc' | 'desc';
}