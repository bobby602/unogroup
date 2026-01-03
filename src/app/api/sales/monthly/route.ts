import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
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
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const codeG = session.user.codeG;
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    const monthFil = THAI_MONTHS[currentMonth - 1];

    // Query ข้อมูลจาก database
    const salesData = await db.$queryRaw<MonthlySalesData[]>`
      SELECT
        0 as num,
        a.NameG,
        ROW_NUMBER() OVER(ORDER BY SUM(a.Amt) DESC) AS Row,
        CAST(ISNULL(SUM(a.Amt), 0) AS DECIMAL(30,2)) as sales,
        CAST(ISNULL(SUM(a.PB), 0) AS DECIMAL(30,2)) as PB,
        CAST(ISNULL(SUM(a.PPoint), 0) AS DECIMAL(30,2)) as POINTSALE,
        ISNULL(c.RateCom, '0') as RateCom,
        ISNULL(c.incentive, 0) as incentive,
        CAST(ISNULL(b.S1, 0) AS DECIMAL(30,2)) as PBI,
        CAST(ISNULL((SUM(a.PB) - ISNULL(b.S1, 0)), 0) AS DECIMAL(30,2)) as PP,
        CAST(
          ISNULL(
            ((SUM(a.PB) - (ISNULL(b.S1, 0) + (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)))) * CAST(c.RateCom AS FLOAT) / 100)
            + (CASE 
                WHEN CAST(c.RateCom AS FLOAT) = 0 THEN 0 
                WHEN CAST(c.RateCom AS FLOAT) = 0.5 THEN 0.5 
                ELSE 1 
              END * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100)
            + (CASE 
                WHEN c.RateCom = '0' THEN 0 
                ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
              END)
          , 0) 
        AS DECIMAL(30,2)) as AmtPoint,
        CASE 
          WHEN c.RateCom = '0' THEN 0 
          ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
        END as ComPBI,
        CAST(ISNULL(SUM(a.ComSP), 0) AS DECIMAL(30,2)) as COMSP,
        CAST(
          ISNULL(
            SUM(a.ComSP) + 
            ((SUM(a.PB) - (ISNULL(b.S1, 0) + (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)))) * CAST(c.RateCom AS FLOAT) / 100)
            + (CASE 
                WHEN CAST(c.RateCom AS FLOAT) = 0 THEN 0 
                WHEN CAST(c.RateCom AS FLOAT) = 0.5 THEN 0.5 
                ELSE 1 
              END * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100)
            + (CASE 
                WHEN c.RateCom = '0' THEN 0 
                ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
              END)
          , 0)
        AS DECIMAL(30,2)) as SumCOMSP,
        CAST(ISNULL(SUM(a.cums), 0) AS DECIMAL(30,2)) as CUMS,
        CAST((ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) AS DECIMAL(30,2)) as PBH1,
        CAST((ISNULL(SUM(a.PB), 0) - ISNULL(e.S1, 0)) AS DECIMAL(30,2)) as PBCal,
        CAST(
          (CASE 
            WHEN CAST(c.RateCom AS FLOAT) = 0 THEN 0 
            WHEN CAST(c.RateCom AS FLOAT) = 0.5 THEN 0.5 
            ELSE 1 
          END * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100)
        AS DECIMAL(30,2)) as ComPBH1
      FROM V802 a
      LEFT JOIN (
        SELECT CodeG, SUM(PB) as S1 
        FROM V802 
        WHERE MONTH(DocDate) = ${currentMonth} 
          AND YEAR(DocDate) = ${currentYear}
          AND ItemType = 'I'
        GROUP BY CodeG
      ) b ON b.CodeG = a.CodeG
      LEFT JOIN (
        SELECT CodeG, RateCom, incentive, point 
        FROM SalesRate 
        WHERE MONTH(EffectiveDate) <= ${currentMonth} 
          AND YEAR(EffectiveDate) = ${currentYear}
      ) c ON c.CodeG = a.CodeG
      LEFT JOIN (
        SELECT CodeG, SUM(PB) as S1 
        FROM V802 
        WHERE MONTH(DocDate) = ${currentMonth} 
          AND YEAR(DocDate) = ${currentYear}
          AND ItemType = 'H1'
          AND CustType = 'OLD'
        GROUP BY CodeG
      ) d ON d.CodeG = a.CodeG
      LEFT JOIN (
        SELECT CodeG, SUM(PB) as S1 
        FROM V802 
        WHERE MONTH(DocDate) = ${currentMonth} 
          AND YEAR(DocDate) = ${currentYear}
          AND ItemType = 'H1'
        GROUP BY CodeG
      ) e ON e.CodeG = a.CodeG
      WHERE a.CodeG = ${codeG}
        AND MONTH(a.DocDate) = ${currentMonth}
        AND YEAR(a.DocDate) = ${currentYear}
      GROUP BY a.NameG, b.S1, c.RateCom, a.CodeG, c.incentive, e.S1, d.S1, c.point
      ORDER BY SUM(a.Amt) DESC
    `;

    // แปลงค่าให้เป็น number (Prisma อาจ return เป็น Decimal)
    const formattedData: MonthlySalesData[] = salesData.map((item, index) => ({
      num: index,
      NameG: item.NameG || '',
      Row: Number(item.Row) || index + 1,
      sales: Number(item.sales) || 0,
      PB: Number(item.PB) || 0,
      POINTSALE: Number(item.POINTSALE) || 0,
      RateCom: String(item.RateCom) || '0',
      incentive: Number(item.incentive) || 0,
      PBI: Number(item.PBI) || 0,
      PP: Number(item.PP) || 0,
      AmtPoint: Number(item.AmtPoint) || 0,
      ComPBI: Number(item.ComPBI) || 0,
      COMSP: Number(item.COMSP) || 0,
      SumCOMSP: Number(item.SumCOMSP) || 0,
      CUMS: Number(item.CUMS) || 0,
      PBH1: Number(item.PBH1) || 0,
      PBCal: Number(item.PBCal) || 0,
      ComPBH1: Number(item.ComPBH1) || 0,
    }));

    const response: MonthlySalesResponse = {
      testData: formattedData,
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
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { month } = body;
    const codeG = session.user.codeG;

    // Validate month
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid month parameter' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const monthFil = THAI_MONTHS[monthNum - 1];

    // Query ข้อมูลจาก database ตามเดือนที่เลือก
    const salesData = await db.$queryRaw<MonthlySalesData[]>`
      SELECT
        0 as num,
        a.NameG,
        ROW_NUMBER() OVER(ORDER BY SUM(a.Amt) DESC) AS Row,
        CAST(ISNULL(SUM(a.Amt), 0) AS DECIMAL(30,2)) as sales,
        CAST(ISNULL(SUM(a.PB), 0) AS DECIMAL(30,2)) as PB,
        CAST(ISNULL(SUM(a.PPoint), 0) AS DECIMAL(30,2)) as POINTSALE,
        ISNULL(c.RateCom, '0') as RateCom,
        ISNULL(c.incentive, 0) as incentive,
        CAST(ISNULL(b.S1, 0) AS DECIMAL(30,2)) as PBI,
        CAST(ISNULL((SUM(a.PB) - ISNULL(b.S1, 0)), 0) AS DECIMAL(30,2)) as PP,
        CAST(
          ISNULL(
            ((SUM(a.PB) - (ISNULL(b.S1, 0) + (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)))) * CAST(c.RateCom AS FLOAT) / 100)
            + (CASE 
                WHEN CAST(c.RateCom AS FLOAT) = 0 THEN 0 
                WHEN CAST(c.RateCom AS FLOAT) = 0.5 THEN 0.5 
                ELSE 1 
              END * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100)
            + (CASE 
                WHEN c.RateCom = '0' THEN 0 
                ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
              END)
          , 0) 
        AS DECIMAL(30,2)) as AmtPoint,
        CASE 
          WHEN c.RateCom = '0' THEN 0 
          ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
        END as ComPBI,
        CAST(ISNULL(SUM(a.ComSP), 0) AS DECIMAL(30,2)) as COMSP,
        CAST(
          ISNULL(
            SUM(a.ComSP) + 
            ((SUM(a.PB) - (ISNULL(b.S1, 0) + (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)))) * CAST(c.RateCom AS FLOAT) / 100)
            + (CASE 
                WHEN CAST(c.RateCom AS FLOAT) = 0 THEN 0 
                WHEN CAST(c.RateCom AS FLOAT) = 0.5 THEN 0.5 
                ELSE 1 
              END * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100)
            + (CASE 
                WHEN c.RateCom = '0' THEN 0 
                ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
              END)
          , 0)
        AS DECIMAL(30,2)) as SumCOMSP,
        CAST(ISNULL(SUM(a.cums), 0) AS DECIMAL(30,2)) as CUMS,
        CAST((ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) AS DECIMAL(30,2)) as PBH1,
        CAST((ISNULL(SUM(a.PB), 0) - ISNULL(e.S1, 0)) AS DECIMAL(30,2)) as PBCal,
        CAST(
          (CASE 
            WHEN CAST(c.RateCom AS FLOAT) = 0 THEN 0 
            WHEN CAST(c.RateCom AS FLOAT) = 0.5 THEN 0.5 
            ELSE 1 
          END * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100)
        AS DECIMAL(30,2)) as ComPBH1
      FROM V802 a
      LEFT JOIN (
        SELECT CodeG, SUM(PB) as S1 
        FROM V802 
        WHERE MONTH(DocDate) = ${monthNum} 
          AND YEAR(DocDate) = ${currentYear}
          AND ItemType = 'I'
        GROUP BY CodeG
      ) b ON b.CodeG = a.CodeG
      LEFT JOIN (
        SELECT CodeG, RateCom, incentive, point 
        FROM SalesRate 
        WHERE MONTH(EffectiveDate) <= ${monthNum} 
          AND YEAR(EffectiveDate) = ${currentYear}
      ) c ON c.CodeG = a.CodeG
      LEFT JOIN (
        SELECT CodeG, SUM(PB) as S1 
        FROM V802 
        WHERE MONTH(DocDate) = ${monthNum} 
          AND YEAR(DocDate) = ${currentYear}
          AND ItemType = 'H1'
          AND CustType = 'OLD'
        GROUP BY CodeG
      ) d ON d.CodeG = a.CodeG
      LEFT JOIN (
        SELECT CodeG, SUM(PB) as S1 
        FROM V802 
        WHERE MONTH(DocDate) = ${monthNum} 
          AND YEAR(DocDate) = ${currentYear}
          AND ItemType = 'H1'
        GROUP BY CodeG
      ) e ON e.CodeG = a.CodeG
      WHERE a.CodeG = ${codeG}
        AND MONTH(a.DocDate) = ${monthNum}
        AND YEAR(a.DocDate) = ${currentYear}
      GROUP BY a.NameG, b.S1, c.RateCom, a.CodeG, c.incentive, e.S1, d.S1, c.point
      ORDER BY SUM(a.Amt) DESC
    `;

    // แปลงค่าให้เป็น number
    const formattedData: MonthlySalesData[] = salesData.map((item, index) => ({
      num: index,
      NameG: item.NameG || '',
      Row: Number(item.Row) || index + 1,
      sales: Number(item.sales) || 0,
      PB: Number(item.PB) || 0,
      POINTSALE: Number(item.POINTSALE) || 0,
      RateCom: String(item.RateCom) || '0',
      incentive: Number(item.incentive) || 0,
      PBI: Number(item.PBI) || 0,
      PP: Number(item.PP) || 0,
      AmtPoint: Number(item.AmtPoint) || 0,
      ComPBI: Number(item.ComPBI) || 0,
      COMSP: Number(item.COMSP) || 0,
      SumCOMSP: Number(item.SumCOMSP) || 0,
      CUMS: Number(item.CUMS) || 0,
      PBH1: Number(item.PBH1) || 0,
      PBCal: Number(item.PBCal) || 0,
      ComPBH1: Number(item.ComPBH1) || 0,
    }));

    const response: MonthlySalesResponse = {
      testData: formattedData,
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