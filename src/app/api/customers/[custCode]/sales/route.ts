// =============================================================================
// API: /api/customers/[custCode]/sales
// ดึงรายละเอียดประวัติการขายลูกค้าจาก RptSale3N พร้อม pagination
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { SalesDetailResponse, SalesDetailRecord, PaginationInfo, ApiError } from '@/types/customer';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse and validate query parameters
 */
function parseQueryParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  let page = parseInt(searchParams.get('page') || '1', 10);
  let pageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10);
  const itemSearch = (searchParams.get('itemSearch') || '').trim();

  // Validate page
  if (isNaN(page) || page < 1) page = 1;
  
  // Validate pageSize
  if (isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
  
  return { page, pageSize, itemSearch };
}

/**
 * Calculate pagination info
 */
function calculatePagination(
  page: number, 
  pageSize: number, 
  totalItems: number
): PaginationInfo {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Format date to dd/MM/yyyy
 */
function formatDate(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Sanitize customer code to prevent issues
 * Allow Thai characters, alphanumeric, dash, underscore
 */
function sanitizeCustCode(code: string): string {
  // Allow: Thai characters (ก-ฮ, ะ-์), a-z, A-Z, 0-9, dash, underscore
  return code.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\-_]/g, '').substring(0, 50);
}

// =============================================================================
// ROW TYPE
// =============================================================================

type SalesRawRow = {
  OrderNo: string | null;
  CustCode: string | null;
  CustName2: string | null;
  DocDate: Date | null;
  Package: string | null;
  ItemName: string | null;
  Price: Prisma.Decimal | null;
  Qty: Prisma.Decimal | null;
  QtySale: Prisma.Decimal | null;
  Amt: Prisma.Decimal | null;
  Cost: Prisma.Decimal | null;
  CUMS: Prisma.Decimal | null;
  cu: Prisma.Decimal | null;
  MS: Prisma.Decimal | null;
  CodeG: string | null;
};

type SummaryRawRow = {
  TotalAmt: Prisma.Decimal | null;
  TotalPB: Prisma.Decimal | null;
  TotalCums: Prisma.Decimal | null;
  TotalCu: Prisma.Decimal | null;
  TotalMs: Prisma.Decimal | null;
  TotalRecords: bigint;
  CustName: string | null;
};

// =============================================================================
// MAIN HANDLER
// =============================================================================

interface RouteParams {
  params: Promise<{ custCode: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SalesDetailResponse | ApiError>> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const userCode = session.user.codeG;

    // 2. Get and validate custCode from params
    const { custCode: rawCustCode } = await params;
    if (!rawCustCode) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'กรุณาระบุรหัสลูกค้า' },
        { status: 400 }
      );
    }

    const custCode = sanitizeCustCode(decodeURIComponent(rawCustCode));
    if (!custCode) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'รหัสลูกค้าไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // 3. Parse query parameters (รวม itemSearch)
    const { page, pageSize, itemSearch } = parseQueryParams(request);
    
    // 4. Calculate skip for pagination
    const skip = (page - 1) * pageSize;

    // 5. สร้าง search pattern สำหรับ LIKE query
    const itemSearchPattern = itemSearch ? `%${itemSearch}%` : null;

    // 6. Execute queries in parallel for performance
    const [salesRecordsRaw, summaryResult] = await Promise.all([
      // Detail query with pagination
      itemSearchPattern
        ? db.$queryRaw<SalesRawRow[]>`
            SELECT 
              OrderNo, CustCode, CustName2, DocDate, Package, ItemName,
              Price, Qty, QtySale, Amt, Cost, CUMS, cu, MS, CodeG
            FROM RptSale3N
            WHERE CodeG = ${userCode}
              AND CustCode = ${custCode}
              AND ItemName LIKE ${itemSearchPattern}
            ORDER BY DocDate DESC, OrderNo DESC
            OFFSET ${skip} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
          `
        : db.$queryRaw<SalesRawRow[]>`
            SELECT 
              OrderNo, CustCode, CustName2, DocDate, Package, ItemName,
              Price, Qty, QtySale, Amt, Cost, CUMS, cu, MS, CodeG
            FROM RptSale3N
            WHERE CodeG = ${userCode}
              AND CustCode = ${custCode}
            ORDER BY DocDate DESC, OrderNo DESC
            OFFSET ${skip} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
          `,

      // Summary query for totals
      itemSearchPattern
        ? db.$queryRaw<SummaryRawRow[]>`
            SELECT 
              CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2))  AS TotalAmt,
              CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS TotalPB,
              CAST(ISNULL(SUM(CUMS), 0) AS DECIMAL(18,2)) AS TotalCums,
              CAST(ISNULL(SUM(cu), 0) AS DECIMAL(18,2))   AS TotalCu,
              CAST(ISNULL(SUM(MS), 0) AS DECIMAL(18,2))   AS TotalMs,
              COUNT(*) AS TotalRecords,
              MAX(CustName2) AS CustName
            FROM RptSale3N
            WHERE CodeG = ${userCode}
              AND CustCode = ${custCode}
              AND ItemName LIKE ${itemSearchPattern}
          `
        : db.$queryRaw<SummaryRawRow[]>`
            SELECT 
              CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2))  AS TotalAmt,
              CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS TotalPB,
              CAST(ISNULL(SUM(CUMS), 0) AS DECIMAL(18,2)) AS TotalCums,
              CAST(ISNULL(SUM(cu), 0) AS DECIMAL(18,2))   AS TotalCu,
              CAST(ISNULL(SUM(MS), 0) AS DECIMAL(18,2))   AS TotalMs,
              COUNT(*) AS TotalRecords,
              MAX(CustName2) AS CustName
            FROM RptSale3N
            WHERE CodeG = ${userCode}
              AND CustCode = ${custCode}
          `,
    ]);

    const summary = summaryResult[0] || {};

    // 7. Check if customer exists (เฉพาะหน้าแรก ถ้าไม่มี itemSearch)
    const totalRecords = Number(summary.TotalRecords) || 0;
    if (totalRecords === 0 && page === 1 && !itemSearch) {
      return NextResponse.json(
        { error: 'Not Found', message: 'ไม่พบข้อมูลลูกค้านี้' },
        { status: 404 }
      );
    }

    // 8. Map results
    const salesDetails: SalesDetailRecord[] = salesRecordsRaw.map((row) => ({
      orderNo: row.OrderNo || '',
      custCode: row.CustCode || '',
      name: row.CustName2 || '',
      dateDoc: formatDate(row.DocDate),
      package: row.Package || null,
      itemName: row.ItemName || '',
      price: Number(row.Price) || 0,
      qty: Number(row.Qty) || 0,
      qtySale: Number(row.QtySale) || 0,
      amt: Number(row.Amt) || 0,
      pb: Number(row.Cost) || 0,
      cums: Number(row.CUMS) || 0,
      cu: Number(row.cu) || 0,
      ms: Number(row.MS) || 0,
      codeG: row.CodeG || '',
    }));

    // 9. Calculate pagination
    const pagination = calculatePagination(page, pageSize, totalRecords);

    // 10. Return response
    const response: SalesDetailResponse = {
      data: salesDetails,
      customer: {
        custCode,
        custName: String(summary.CustName || custCode),
      },
      pagination,
      summary: {
        totalAmt: Number(summary.TotalAmt) || 0,
        totalPB: Number(summary.TotalPB) || 0,
        totalCums: Number(summary.TotalCums) || 0,
        totalCu: Number(summary.TotalCu) || 0,
        totalMs: Number(summary.TotalMs) || 0,
        totalRecords,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Sales detail error:', error);
    
    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: 'Database Error', 
          message: 'ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// EXPORT CONFIG
// =============================================================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;