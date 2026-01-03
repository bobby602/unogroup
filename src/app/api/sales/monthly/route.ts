import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ชื่อเดือนสำหรับแสดงผล (Mapping ตาม index 0-11)
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// --- Shared Function: ดึงข้อมูลยอดขาย (Core Logic) ---
async function getMonthlySalesData(userCode: string, month: string, year: number) {
  // แปลงเดือนเป็น integer เพื่อใช้ตรวจสอบเงื่อนไข
  const monthNum = parseInt(month, 10);
  const thaiYear = year + 543;

  // SQL Query หลัก (ถอดแบบมาจาก pageTable2 ใน Express)
  const sql = `
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
      
      -- สูตร AmtPoint (ค่าคอมมิชชั่น)
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
      
      -- สูตร ComPBI
      CASE 
        WHEN c.RateCom = '0' THEN '0' 
        ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
      END as ComPBI,
      
      CAST(ISNULL(SUM(a.ComSP), 0) AS DECIMAL(30,2)) as COMSP,
      
      -- สูตร SumCOMSP (รวมค่าคอมสุทธิ)
      CAST(
        ISNULL(
          (SUM(a.ComSP) + 
           (CAST(ISNULL(((SUM(a.PB) - (ISNULL(b.S1, 0) + (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)))) * CAST(c.RateCom AS FLOAT) / 100), 0) AS DECIMAL(30,2))) 
           + (1 * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100)
           + (CASE 
                WHEN c.RateCom = '0' THEN '0' 
                ELSE CAST(ISNULL((b.S1 * 0.5 / 100), 0) AS DECIMAL(30,2)) 
              END)
          ), 0)
      AS DECIMAL(30,2)) as SumCOMSP,
      
      CAST(ISNULL(SUM(a.cums), 0) AS DECIMAL(30,2)) as CUMS,
      (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) as PBH1,
      (ISNULL(SUM(a.PB), 0) - ISNULL(e.S1, 0)) as PBCal,
      (1 * (ISNULL(e.S1, 0) - ISNULL(d.S1, 0)) / 100) as ComPBH1

    FROM V802 a
    
    -- Join b: สินค้ากลุ่ม I (ItemComPI)
    LEFT JOIN (
      SELECT CodeG, SUM(PB) as S1 
      FROM V802 
      INNER JOIN itemcomPI ON V802.itemcode = itemcomPI.itemcode
      WHERE CodeG = @p1 
        AND MONTH(DocDate) = @p2 
        AND YEAR(DocDate) = @p3
      GROUP BY CodeG
    ) b ON b.CodeG = a.CodeG
    
    -- Join c: Tier และ RateCom
    LEFT JOIN (
      SELECT 
        CASE 
          WHEN SUM(a.PPoint) < A1 THEN '0'
          WHEN SUM(a.PPoint) >= A1 AND SUM(a.PPoint) < A2 THEN Rate1
          WHEN SUM(a.PPoint) >= A3 AND SUM(a.PPoint) < A4 THEN Rate2
          WHEN SUM(a.PPoint) >= A5 THEN Rate3
        END as RateCom,
        SUM(a.PPoint) as point,
        CASE 
          WHEN SUM(a.PPoint) < MPoint THEN '0' 
          ELSE CAST(((SUM(a.PPoint) - c.MPoint) / c.PPoint) AS INT) * c.Incen 
        END as incentive, 
        a.CodeG
      FROM V802 a
      INNER JOIN ItemTier b ON b.CodeG = a.CodeG
      INNER JOIN Tier c ON c.Code = b.TierCode
      WHERE a.CodeG = @p1 
        AND MONTH(a.DocDate) = @p2 
        AND YEAR(a.DocDate) = @p3 
        AND b.YearCal = @p4
      GROUP BY c.A1, c.A2, c.A3, c.A4, c.A5, c.Rate1, c.Rate2, c.Rate3, c.MPoint, c.Incen, c.PPoint, a.CodeG
    ) c ON c.CodeG = a.CodeG
    
    -- Join d: สินค้ากลุ่ม I (ซ้ำกับ b ใน logic เดิม แต่ query แยก)
    LEFT JOIN (
      SELECT SUM(tmp.S1) as S1, tmp.CodeG
      FROM (
        SELECT ROUND(SUM(PB), 2) as S1, CodeG, V802.ItemCode
        FROM V802
        INNER JOIN itemcomPI ON V802.itemcode = itemcomPI.itemcode
        WHERE MONTH(DocDate) = @p2 AND CodeG = @p1 AND YEAR(DocDate) = @p3
        GROUP BY CodeG, V802.ItemCode
      ) tmp
      GROUP BY tmp.CodeG
    ) d ON d.CodeG = a.CodeG
    
    -- Join e: สินค้ากลุ่ม H (ItemG.grItemCode = 'H')
    LEFT JOIN (
      SELECT SUM(tmp.S1) as S1, tmp.CodeG
      FROM (
        SELECT ROUND(SUM(PB), 2) as S1, CodeG, V802.ItemCode
        FROM V802
        INNER JOIN ItemG ON V802.itemcode = ItemG.code
        WHERE MONTH(DocDate) = @p2 AND CodeG = @p1 AND YEAR(DocDate) = @p3 AND ItemG.grItemCode = 'H'
        GROUP BY CodeG, V802.ItemCode
      ) tmp
      GROUP BY tmp.CodeG
    ) e ON e.CodeG = a.CodeG
    
    WHERE a.CodeG = @p1 
      AND MONTH(a.DocDate) = @p2 
      AND YEAR(a.DocDate) = @p3
    
    GROUP BY a.NameG, b.S1, c.RateCom, a.CodeG, c.incentive, e.S1, d.S1
    ORDER BY SUM(a.Amt) DESC
  `;

  // Execute Query (ส่ง parameter: userCode, month, year, thaiYear)
  const result = await db.$queryRawUnsafe<any[]>(sql, userCode, month, year, thaiYear);

  // Format ผลลัพธ์
  const formattedData = result.map((item, index) => ({
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

  return {
    testData: formattedData,
    monthFil: THAI_MONTHS[monthNum - 1] || '' // ส่งชื่อเดือนกลับไป
  };
}

// --- 1. GET Handler (เดือนปัจจุบัน) ---
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Default: เดือนปัจจุบัน, ปีปัจจุบัน
    const currentMonth = (new Date().getMonth() + 1).toString();
    const currentYear = new Date().getFullYear();

    const data = await getMonthlySalesData(session.user.codeG, currentMonth, currentYear);

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('GET Monthly Sales Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- 2. POST Handler (ค้นหาตามเดือน) ---
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { month } = body;
    const currentYear = new Date().getFullYear();

    // Validation
    if (!month || month === 'เลือกเดือน') {
      month = (new Date().getMonth() + 1).toString(); // Fallback เป็นเดือนปัจจุบัน
    }

    const data = await getMonthlySalesData(session.user.codeG, month, currentYear);

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('POST Monthly Sales Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}