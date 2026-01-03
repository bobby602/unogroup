import { NextRequest, NextResponse } from 'next/server';
import type { MonthlySalesData, MonthlySalesResponse } from '@/types/monthly-sales';

// Thai month names
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * GET /api/sales/monthly
 * ดึงข้อมูลยอดขายประจำเดือนปัจจุบัน
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const userCode = searchParams.get('userCode') || 'demo';
    
    // Get current month
    const currentMonth = new Date().getMonth();
    const monthFil = THAI_MONTHS[currentMonth];

    // TODO: Replace with actual database query using Prisma
    /*
    Original SQL Query:
    
    SELECT
      0 as num,
      NameG,
      ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row,
      CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales,
      CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,
      CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE,
      c.RateCom,
      c.incentive,
      CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,
      CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP,
      CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( ISNULL(e.s1,0)-ISNULL(d.s1,0))))*c.rateCom/100)+(case when Cast(c.RateCom as float) ='0' then 0 when Cast(c.RateCom as float) ='0.5'  then 0.5 else 1 end*(ISNULL(e.s1,0)-ISNULL(d.s1,0))/100)+ case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end,0) as DECIMAL(30,2)) as AmtPoint,
      case when c.RateCom = '0' then '0' else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI,
      CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP,
      CAST(ISNULL((Sum(ComSP)+(...)) AS DECIMAL(30,2)) as SumCOMSP,
      CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS,
      (e.s1-ISNULL(d.s1,0)) as PBH1,
      (ISNULL(Sum(PB),0)-(e.s1)) as PBCal,
      (...) as ComPBH1
    FROM V802 a
    LEFT JOIN (...) b ON b.CodeG = a.codeG
    LEFT JOIN (...) c ON c.CodeG = a.codeG
    LEFT JOIN (...) d ON d.CodeG = a.CodeG
    LEFT JOIN (...) e ON e.CodeG = a.CodeG
    WHERE CodeG = @Login
      AND Month(DocDate) = MONTH(GETDATE())
      AND year(Docdate) = YEAR(GETDATE())
    GROUP BY NameG, b.S1, c.RateCom, a.CodeG, c.incentive, e.s1, d.s1, c.point
    */

    // Mock data for demonstration
    const mockData: MonthlySalesData[] = [
      {
        num: 0,
        NameG: 'ทดสอบ Sales',
        Row: 1,
        sales: 1250000.50,
        PB: 980000.25,
        POINTSALE: 12500.75,
        RateCom: '1.5',
        incentive: 45000.00,
        PBI: 50000.00,
        PP: 930000.25,
        AmtPoint: 14850.00,
        ComPBI: 250.00,
        COMSP: 3500.00,
        SumCOMSP: 18600.00,
        CUMS: 270000.00,
        PBH1: 25000.00,
        PBCal: 905000.25,
        ComPBH1: 375.00
      }
    ];

    const response: MonthlySalesResponse = {
      testData: mockData,
      monthFil: monthFil
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monthly sales data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sales/monthly
 * ดึงข้อมูลยอดขายตามเดือนที่เลือก
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, userCode } = body;

    // Validate month
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid month parameter' },
        { status: 400 }
      );
    }

    const monthFil = THAI_MONTHS[monthNum - 1];

    // TODO: Replace with actual database query using Prisma
    /*
    Original SQL Query (POST version - with selected month):
    
    Same as GET but with:
    WHERE CodeG = @Login
      AND Month(DocDate) = @selectedMonth
      AND year(Docdate) = YEAR(GETDATE())
    */

    // Mock data - adjust values based on selected month
    const mockData: MonthlySalesData[] = [
      {
        num: 0,
        NameG: 'ทดสอบ Sales',
        Row: 1,
        sales: 1000000 + (monthNum * 50000),
        PB: 800000 + (monthNum * 40000),
        POINTSALE: 10000 + (monthNum * 500),
        RateCom: monthNum > 6 ? '1.5' : '1',
        incentive: monthNum > 6 ? 45000 : 30000,
        PBI: 45000 + (monthNum * 1000),
        PP: 755000 + (monthNum * 39000),
        AmtPoint: 12000 + (monthNum * 600),
        ComPBI: 225 + (monthNum * 5),
        COMSP: 3000 + (monthNum * 100),
        SumCOMSP: 15225 + (monthNum * 705),
        CUMS: 220000 + (monthNum * 10000),
        PBH1: 20000 + (monthNum * 1000),
        PBCal: 735000 + (monthNum * 38000),
        ComPBH1: 300 + (monthNum * 15)
      }
    ];

    const response: MonthlySalesResponse = {
      testData: mockData,
      monthFil: monthFil
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching monthly sales by month:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monthly sales data' },
      { status: 500 }
    );
  }
}