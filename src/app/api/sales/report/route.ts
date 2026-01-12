// =============================================================================
// API: /api/sales/report
// รายงานการขาย - รวมยอดขายตามลูกค้าประจำปี
// Optimized: Server-side pagination, search, sorting
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type {
  ReportSaleResponse,
  ReportSaleRecord,
  ReportSalePagination,
  ReportSaleSummary,
} from '@/types/report-sale';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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
  const search = searchParams.get('search')?.trim() || '';
  let year = parseInt(searchParams.get('year') || '', 10);
  const sortBy = searchParams.get('sortBy') || 'custCode';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  // Validate page
  if (isNaN(page) || page < 1) page = 1;

  // Validate pageSize
  if (isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  // Default to current year if not provided
  if (isNaN(year) || year < 2000 || year > 2100) {
    year = new Date().getFullYear();
  }

  return { page, pageSize, search, year, sortBy, sortOrder };
}

/**
 * Calculate pagination info
 */
function calculatePagination(
  page: number,
  pageSize: number,
  totalItems: number
): ReportSalePagination {
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
 * Convert Decimal to number safely
 */
function toNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return parseFloat(value.toString()) || 0;
}

/**
 * Build ORDER BY clause based on sortBy parameter
 */
function getOrderByClause(sortBy: string, sortOrder: string): string {
  const direction = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  
  const sortMapping: Record<string, string> = {
    custCode: `a.custCode ${direction}`,
    custName: `a.custName2 ${direction}`,
    netOne: `a.NetAmt ${direction}`,
    pbOne: `a.PB ${direction}`,
    cumsOne: `a.CUMS ${direction}`,
  };

  return sortMapping[sortBy] || `a.custCode ${direction}`;
}

// =============================================================================
// DATABASE QUERIES
// =============================================================================

interface RawReportRecord {
  custCode: string | null;
  custName: string | null;
  saleName: string | null;
  NetOne: Prisma.Decimal | null;
  PBOne: Prisma.Decimal | null;
  CumsOne: Prisma.Decimal | null;
  CuOne: Prisma.Decimal | null;
  msOne: Prisma.Decimal | null;
  NetTwo: Prisma.Decimal | null;
  PBTwo: Prisma.Decimal | null;
  cumsTwo: Prisma.Decimal | null;
  NetThree: Prisma.Decimal | null;
  PBThree: Prisma.Decimal | null;
  CUMSThree: Prisma.Decimal | null;
}

interface RawSummaryRecord {
  TotalNetOne: Prisma.Decimal | null;
  TotalPBOne: Prisma.Decimal | null;
  TotalCumsOne: Prisma.Decimal | null;
  TotalCuOne: Prisma.Decimal | null;
  TotalMsOne: Prisma.Decimal | null;
  TotalNetTwo: Prisma.Decimal | null;
  TotalPBTwo: Prisma.Decimal | null;
  TotalCumsTwo: Prisma.Decimal | null;
  TotalNetThree: Prisma.Decimal | null;
  TotalPBThree: Prisma.Decimal | null;
  TotalCumsThree: Prisma.Decimal | null;
  TotalRecords: bigint;
}

/**
 * Fetch paginated report data with optimized CTE query
 */
async function fetchReportData(
  userCode: string,
  year: number,
  search: string,
  sortBy: string,
  sortOrder: string,
  page: number,
  pageSize: number
): Promise<RawReportRecord[]> {
  const skip = (page - 1) * pageSize;
  const orderBy = getOrderByClause(sortBy, sortOrder);
  
  // Build search condition
  const searchCondition = search
    ? Prisma.sql`AND (a.custCode LIKE ${`%${search}%`} OR a.custName2 LIKE ${`%${search}%`})`
    : Prisma.empty;

  const result = await db.$queryRaw<RawReportRecord[]>`
    WITH firstTemp AS (
      SELECT 
        rptSale3.custCode,
        rptSale3.custName,
        rptSale3.custName2,
        rptSale3.saleName,
        CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2)) AS NetAmt,
        CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS PB,
        CAST(ISNULL(SUM(AmtDiff), 0) AS DECIMAL(18,2)) AS CUMS,
        CAST(ISNULL(SUM(cu), 0) AS DECIMAL(18,2)) AS cu,
        CAST(ISNULL(SUM(ms), 0) AS DECIMAL(18,2)) AS ms
      FROM rptSale3
      WHERE YEAR(rptSale3.DocDate) = ${year}
        AND rptSale3.CodeG = ${userCode}
      GROUP BY 
        rptSale3.custCode,
        rptSale3.custName,
        rptSale3.saleName,
        rptSale3.SaleCode,
        rptSale3.custName2
    ),
    secondTemp AS (
      SELECT 
        CustCode,
        CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2)) AS NetAmt,
        CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS PB,
        CAST(ISNULL(SUM(AmtDiff), 0) AS DECIMAL(18,2)) AS CUMS
      FROM rptSale3
      WHERE YEAR(rptSale3.DocDate) = ${year}
        AND rptSale3.CodeG = ${userCode}
        AND rptSale3.DocSP = '1'
      GROUP BY rptSale3.custCode, rptSale3.SaleCode
    ),
    thirdTemp AS (
      SELECT 
        CustCode,
        CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2)) AS NetAmt,
        CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS PB,
        CAST(ISNULL(SUM(AmtDiff), 0) AS DECIMAL(18,2)) AS CUMS
      FROM rptSale3
      WHERE YEAR(rptSale3.DocDate) = ${year}
        AND rptSale3.CodeG = ${userCode}
        AND rptSale3.DocSP = '2'
      GROUP BY rptSale3.custCode, rptSale3.SaleCode
    )
    SELECT 
      a.custCode,
      a.custName2 AS custName,
      a.saleName,
      a.NetAmt AS NetOne,
      a.PB AS PBOne,
      a.CUMS AS CumsOne,
      a.cu AS CuOne,
      a.ms AS msOne,
      b.NetAmt AS NetTwo,
      b.PB AS PBTwo,
      b.CUMS AS cumsTwo,
      c.NetAmt AS NetThree,
      c.PB AS PBThree,
      c.CUMS AS CUMSThree
    FROM firstTemp a
    LEFT JOIN secondTemp b ON b.CustCode = a.custCode
    LEFT JOIN thirdTemp c ON c.CustCode = a.custCode
    WHERE 1=1 ${searchCondition}
    ORDER BY ${Prisma.raw(orderBy)}
    OFFSET ${skip} ROWS
    FETCH NEXT ${pageSize} ROWS ONLY
  `;

  return result;
}

/**
 * Fetch summary totals
 */
async function fetchSummary(
  userCode: string,
  year: number,
  search: string
): Promise<RawSummaryRecord> {
  // Build search condition
  const searchCondition = search
    ? Prisma.sql`AND (a.custCode LIKE ${`%${search}%`} OR a.custName2 LIKE ${`%${search}%`})`
    : Prisma.empty;

  const result = await db.$queryRaw<RawSummaryRecord[]>`
    WITH firstTemp AS (
      SELECT 
        rptSale3.custCode,
        rptSale3.custName2,
        CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2)) AS NetAmt,
        CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS PB,
        CAST(ISNULL(SUM(AmtDiff), 0) AS DECIMAL(18,2)) AS CUMS,
        CAST(ISNULL(SUM(cu), 0) AS DECIMAL(18,2)) AS cu,
        CAST(ISNULL(SUM(ms), 0) AS DECIMAL(18,2)) AS ms
      FROM rptSale3
      WHERE YEAR(rptSale3.DocDate) = ${year}
        AND rptSale3.CodeG = ${userCode}
      GROUP BY 
        rptSale3.custCode,
        rptSale3.custName,
        rptSale3.saleName,
        rptSale3.SaleCode,
        rptSale3.custName2
    ),
    secondTemp AS (
      SELECT 
        CustCode,
        CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2)) AS NetAmt,
        CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS PB,
        CAST(ISNULL(SUM(AmtDiff), 0) AS DECIMAL(18,2)) AS CUMS
      FROM rptSale3
      WHERE YEAR(rptSale3.DocDate) = ${year}
        AND rptSale3.CodeG = ${userCode}
        AND rptSale3.DocSP = '1'
      GROUP BY rptSale3.custCode, rptSale3.SaleCode
    ),
    thirdTemp AS (
      SELECT 
        CustCode,
        CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(18,2)) AS NetAmt,
        CAST(ISNULL(SUM(Cost), 0) AS DECIMAL(18,2)) AS PB,
        CAST(ISNULL(SUM(AmtDiff), 0) AS DECIMAL(18,2)) AS CUMS
      FROM rptSale3
      WHERE YEAR(rptSale3.DocDate) = ${year}
        AND rptSale3.CodeG = ${userCode}
        AND rptSale3.DocSP = '2'
      GROUP BY rptSale3.custCode, rptSale3.SaleCode
    ),
    combined AS (
      SELECT 
        a.custCode,
        a.custName2,
        a.NetAmt AS NetOne,
        a.PB AS PBOne,
        a.CUMS AS CumsOne,
        a.cu AS CuOne,
        a.ms AS msOne,
        ISNULL(b.NetAmt, 0) AS NetTwo,
        ISNULL(b.PB, 0) AS PBTwo,
        ISNULL(b.CUMS, 0) AS cumsTwo,
        ISNULL(c.NetAmt, 0) AS NetThree,
        ISNULL(c.PB, 0) AS PBThree,
        ISNULL(c.CUMS, 0) AS CUMSThree
      FROM firstTemp a
      LEFT JOIN secondTemp b ON b.CustCode = a.custCode
      LEFT JOIN thirdTemp c ON c.CustCode = a.custCode
      WHERE 1=1 ${searchCondition}
    )
    SELECT 
      CAST(ISNULL(SUM(NetOne), 0) AS DECIMAL(18,2)) AS TotalNetOne,
      CAST(ISNULL(SUM(PBOne), 0) AS DECIMAL(18,2)) AS TotalPBOne,
      CAST(ISNULL(SUM(CumsOne), 0) AS DECIMAL(18,2)) AS TotalCumsOne,
      CAST(ISNULL(SUM(CuOne), 0) AS DECIMAL(18,2)) AS TotalCuOne,
      CAST(ISNULL(SUM(msOne), 0) AS DECIMAL(18,2)) AS TotalMsOne,
      CAST(ISNULL(SUM(NetTwo), 0) AS DECIMAL(18,2)) AS TotalNetTwo,
      CAST(ISNULL(SUM(PBTwo), 0) AS DECIMAL(18,2)) AS TotalPBTwo,
      CAST(ISNULL(SUM(cumsTwo), 0) AS DECIMAL(18,2)) AS TotalCumsTwo,
      CAST(ISNULL(SUM(NetThree), 0) AS DECIMAL(18,2)) AS TotalNetThree,
      CAST(ISNULL(SUM(PBThree), 0) AS DECIMAL(18,2)) AS TotalPBThree,
      CAST(ISNULL(SUM(CUMSThree), 0) AS DECIMAL(18,2)) AS TotalCumsThree,
      COUNT(*) AS TotalRecords
    FROM combined
  `;

  return result[0] || {
    TotalNetOne: null,
    TotalPBOne: null,
    TotalCumsOne: null,
    TotalCuOne: null,
    TotalMsOne: null,
    TotalNetTwo: null,
    TotalPBTwo: null,
    TotalCumsTwo: null,
    TotalNetThree: null,
    TotalPBThree: null,
    TotalCumsThree: null,
    TotalRecords: BigInt(0),
  };
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

/**
 * Transform raw records to typed response
 */
function transformRecords(rawRecords: RawReportRecord[]): ReportSaleRecord[] {
  return rawRecords.map((record) => ({
    custCode: record.custCode || '',
    custName: record.custName || '',
    saleName: record.saleName || '',
    netOne: toNumber(record.NetOne),
    pbOne: toNumber(record.PBOne),
    cumsOne: toNumber(record.CumsOne),
    cuOne: toNumber(record.CuOne),
    msOne: toNumber(record.msOne),
    netTwo: record.NetTwo ? toNumber(record.NetTwo) : null,
    pbTwo: record.PBTwo ? toNumber(record.PBTwo) : null,
    cumsTwo: record.cumsTwo ? toNumber(record.cumsTwo) : null,
    netThree: record.NetThree ? toNumber(record.NetThree) : null,
    pbThree: record.PBThree ? toNumber(record.PBThree) : null,
    cumsThree: record.CUMSThree ? toNumber(record.CUMSThree) : null,
  }));
}

/**
 * Transform raw summary to typed response
 */
function transformSummary(rawSummary: RawSummaryRecord): ReportSaleSummary {
  return {
    totalNetOne: toNumber(rawSummary.TotalNetOne),
    totalPBOne: toNumber(rawSummary.TotalPBOne),
    totalCumsOne: toNumber(rawSummary.TotalCumsOne),
    totalCuOne: toNumber(rawSummary.TotalCuOne),
    totalMsOne: toNumber(rawSummary.TotalMsOne),
    totalNetTwo: toNumber(rawSummary.TotalNetTwo),
    totalPBTwo: toNumber(rawSummary.TotalPBTwo),
    totalCumsTwo: toNumber(rawSummary.TotalCumsTwo),
    totalNetThree: toNumber(rawSummary.TotalNetThree),
    totalPBThree: toNumber(rawSummary.TotalPBThree),
    totalCumsThree: toNumber(rawSummary.TotalCumsThree),
    totalRecords: Number(rawSummary.TotalRecords) || 0,
  };
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

interface SessionUser {
  codeG: string;
  Name: string;
  lastName: string;
}

async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.codeG) return null;

  return {
    codeG: session.user.codeG,
    Name: session.user.name || '',
    lastName: session.user.surname || '',
  };
}

// =============================================================================
// API HANDLERS
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ReportSaleResponse | { error: string }>> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query params
    const { page, pageSize, search, year, sortBy, sortOrder } = parseQueryParams(request);

    // 3. Fetch data in parallel
    const [rawRecords, rawSummary] = await Promise.all([
      fetchReportData(user.codeG, year, search, sortBy, sortOrder, page, pageSize),
      fetchSummary(user.codeG, year, search),
    ]);

    // 4. Transform data
    const data = transformRecords(rawRecords);
    const summary = transformSummary(rawSummary);

    // 5. Calculate pagination
    const pagination = calculatePagination(page, pageSize, summary.totalRecords);

    // 6. Build response
    const response: ReportSaleResponse = {
      success: true,
      data,
      pagination,
      summary,
      filters: {
        year,
        search: search || undefined,
      },
      user: {
        codeG: user.codeG,
        surName: user.Name,
        lastName: user.lastName,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET Report Sale Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST handler - same as GET but accepts body params
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ReportSaleResponse | { error: string }>> {
  try {
    // 1. Authenticate
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse body
    const body = await request.json().catch(() => ({}));
    
    let page = parseInt(body.page || '1', 10);
    let pageSize = parseInt(body.pageSize || String(DEFAULT_PAGE_SIZE), 10);
    const search = (body.search || '').trim();
    let year = parseInt(body.year || '', 10);
    const sortBy = body.sortBy || 'custCode';
    const sortOrder = body.sortOrder || 'asc';

    // Validate
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
    if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
    if (isNaN(year) || year < 2000 || year > 2100) {
      year = new Date().getFullYear();
    }

    // 3. Fetch data in parallel
    const [rawRecords, rawSummary] = await Promise.all([
      fetchReportData(user.codeG, year, search, sortBy, sortOrder, page, pageSize),
      fetchSummary(user.codeG, year, search),
    ]);

    // 4. Transform data
    const data = transformRecords(rawRecords);
    const summary = transformSummary(rawSummary);

    // 5. Calculate pagination
    const pagination = calculatePagination(page, pageSize, summary.totalRecords);

    // 6. Build response
    const response: ReportSaleResponse = {
      success: true,
      data,
      pagination,
      summary,
      filters: {
        year,
        search: search || undefined,
      },
      user: {
        codeG: user.codeG,
        surName: user.Name,
        lastName: user.lastName,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST Report Sale Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}