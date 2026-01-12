// =============================================================================
// API: /api/customers/list
// ดึงรายชื่อลูกค้าจาก V801 พร้อม pagination และ search
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { CustomerListResponse, CustomerBasic, PaginationInfo, ApiError } from '@/types/customer';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MIN_YEAR = 2021; // Filter customers from this year onwards

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
  
  // Validate page
  if (isNaN(page) || page < 1) page = 1;
  
  // Validate pageSize
  if (isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
  
  return { page, pageSize, search };
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

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<CustomerListResponse | ApiError>> {
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

    // 2. Parse query parameters
    const { page, pageSize, search } = parseQueryParams(request);
    
    // 3. Calculate skip for pagination
    const skip = (page - 1) * pageSize;

    // 4. Build where clause
    const minDate = new Date(`${MIN_YEAR}-01-01`);
    
    const whereClause: Prisma.V801WhereInput = {
      CodeG: userCode,
      DocDate: {
        gte: minDate,
      },
      ...(search && {
        OR: [
          { CustName: { contains: search } },
          { CustCode: { contains: search } },
        ],
      }),
    };

    // 5. Get unique customers with grouping using raw query for better performance
    // Since Prisma doesn't support GROUP BY well, we use raw query
    const searchPattern = `%${search}%`;
    
    const customersRaw = await db.$queryRaw<Array<{
      CustName: string | null;
      CustCode: string | null;
      CodeG: string | null;
    }>>`
      SELECT CustName, CustCode, CodeG 
      FROM V801 
      WHERE CodeG = ${userCode} 
        AND YEAR(DocDate) >= ${MIN_YEAR}
        AND (${search} = '' OR CustName LIKE ${searchPattern} OR CustCode LIKE ${searchPattern})
      GROUP BY CustName, CustCode, CodeG
      ORDER BY CustName ASC
      OFFSET ${skip} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;

    // 6. Get total count
    const countResult = await db.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(DISTINCT CustCode) as total
      FROM V801 
      WHERE CodeG = ${userCode} 
        AND YEAR(DocDate) >= ${MIN_YEAR}
        AND (${search} = '' OR CustName LIKE ${searchPattern} OR CustCode LIKE ${searchPattern})
    `;
    
    const totalItems = Number(countResult[0]?.total) || 0;

    // 7. Map results
    const customers: CustomerBasic[] = customersRaw.map((row) => ({
      custName: row.CustName || '',
      custCode: row.CustCode || '',
      codeG: row.CodeG || '',
    }));

    // 8. Calculate pagination
    const pagination = calculatePagination(page, pageSize, totalItems);

    // 9. Return response
    const response: CustomerListResponse = {
      data: customers,
      pagination,
      summary: {
        totalCustomers: totalItems,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Customer list error:', error);
    
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