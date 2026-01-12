// =============================================================================
// API: /api/orders/[orderNo]
// ดึงรายละเอียด Order จาก QSO2
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

interface OrderItem {
  num: number;
  docDate: string;
  custName: string;
  sendNo: string;
  docNo: string;
  itemName: string;
  package: string;
  amt: string;
  price: string;
  pb: string;
  packd: string;
}

interface OrderDetailResponse {
  data: OrderItem[];
  notes: string[];
  orderNo: string;
}

interface ApiError {
  error: string;
  message: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

interface RouteParams {
  params: Promise<{ orderNo: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrderDetailResponse | ApiError>> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // 2. Get orderNo from params
    const { orderNo: rawOrderNo } = await params;
    if (!rawOrderNo) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'กรุณาระบุเลขที่ Order' },
        { status: 400 }
      );
    }

    const orderNo = decodeURIComponent(rawOrderNo);

    // 3. Query order details from QSO2
    const orderItems = await db.$queryRaw<Array<{
      num: bigint;
      DocDate: string | null;
      CustName: string | null;
      SendNo: string | null;
      DocNo: string | null;
      itemName1: string | null;
      Package: string | null;
      amt: string | null;
      Price: string | null;
      PB: string | null;
      packd: string | null;
    }>>`
      SELECT 
        tmp.*,
        DENSE_RANK() OVER(ORDER BY itemName1) as num
      FROM (
        SELECT 
          FORMAT(DocDate, 'dd/MM/yyyy') as DocDate,
          CustName,
          SendNo,
          DocNo,
          itemName1,
          Package,
          CAST(CONVERT(VARCHAR, CAST(qtypackd AS MONEY), 1) AS VARCHAR) as amt,
          CAST(Price AS VARCHAR) as Price,
          CONCAT(AmtCT1, 'x', AmtCT2, 'x', AmtCT3, ' ', CAST(CONVERT(VARCHAR, CAST(AMTCTT AS MONEY), 1) AS VARCHAR)) as PB,
          packd
        FROM QSO2
        WHERE DocNo = ${orderNo}
        
        UNION
        
        SELECT 
          '' as DocDate,
          '' as CustName,
          '' as SendNo,
          '' as DocNo,
          itemName1,
          '' as Package,
          '' as amt,
          '' as Price,
          CONCAT(AmtT1, 'x', AmtT2, 'x', AmtT3, ' ', CAST(CONVERT(VARCHAR, CAST(AMTTT AS MONEY), 1) AS VARCHAR)) as PB,
          '' as packd
        FROM QSO2
        WHERE DocNo = ${orderNo}
      ) tmp
      ORDER BY itemName1, DocDate DESC
    `;

    // 4. Query notes
    const notesResult = await db.$queryRaw<Array<{ note: string | null }>>`
      SELECT CONCAT(Note, Note2, Note3) as note 
      FROM QSO2 
      WHERE DocNo = ${orderNo}
      
      UNION
      
      SELECT CONCAT(Note4, Note5, Note6) as note 
      FROM QSO2 
      WHERE DocNo = ${orderNo}
    `;

    // 5. Check if order exists
    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Not Found', message: 'ไม่พบข้อมูล Order นี้' },
        { status: 404 }
      );
    }

    // 6. Map results
    const data: OrderItem[] = orderItems.map((item) => ({
      num: Number(item.num) || 0,
      docDate: item.DocDate || '',
      custName: item.CustName || '',
      sendNo: item.SendNo || '',
      docNo: item.DocNo || '',
      itemName: item.itemName1 || '',
      package: item.Package || '',
      amt: item.amt || '',
      price: item.Price || '',
      pb: item.PB || '',
      packd: item.packd || '',
    }));

    const notes: string[] = notesResult
      .map((n) => n.note)
      .filter((n): n is string => n !== null && n.trim() !== '');

    // 7. Return response
    const response: OrderDetailResponse = {
      data,
      notes,
      orderNo,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Order detail error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: 'Database Error',
          message: 'ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;