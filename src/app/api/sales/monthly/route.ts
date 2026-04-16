import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface MainSalesData {
  CodeG: string;
  NameG: string | null;
  SaleAmt: number;    // CR
  Amt: number;        // PB
  PointSale: number;  // PPOINT
  AmtSP: number;      // ComSP
  CuMS: number;       // CUMS
}

interface TargetData {
  CodeG: string;
  AmtYT: number;
}

interface RankingResult {
  rankCR: number;
  rankPB: number;
  rankCUMS: number;
  totalSales: number;
}

interface ProductGroupResult {
  grItemCode: string;
  SaleAmt: number;  // CR
  Amt: number;      // PB
  CuMS: number;     // CUMS
}

/** สรุปแต่ละประเภทสินค้า */
interface ProductSummary {
  code: string;
  label: string;
  CR: number;
  ratioCR: number;
  PB: number;
  ratioPB: number;
  CUMS: number;
  ratioCUMS: number;
}

/** ผลลัพธ์รายงาน */
interface SalesReportData {
  // ข้อมูลพนักงาน
  NameG: string;
  CodeG: string;
  
  // Summary Section
  salesCR: number;
  salesPB: number;
  pointCUMS: number;
  RateCom: string;
  incentive: number;
  commission: number;
  comSP: number;
  CUMS: number;
  
  // Target
  baselineTarget: number;
  targetMonth: number;
  pctOfTarget: number;
  
  // ✅ Rankings (อันดับในบริษัท)
  rankCR: number;
  rankPB: number;
  rankCUMS: number;
  totalSales: number;
  
  // ✅ Product breakdown (H1, H2, MP, SP)
  productSummary: ProductSummary[];
  
  // Commission breakdown
  PP: number;
  PBI: number;
  PBH: number;
  AmtPoint: number;
  ComPBI: number;
  ComPBH: number;
  
  // เพิ่มสำหรับ Product calculation
  PBH1: number;  // PBH - PBI (กลุ่ม H ลบ กลุ่ม I)
  PBH2: number;  // PBI (กลุ่ม I)
  PBMP: number;  // PB - PBH (MP = ยอดที่ไม่ใช่กลุ่ม H)
}

interface MonthlySalesResponse {
  report: SalesReportData | null;
  monthFil: string;
  yearFil: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
] as const;

const TARGET_THRESHOLD = 50000000;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const toString = (value: unknown, defaultValue = ''): string => {
  return value?.toString() ?? defaultValue;
};

const round2 = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const getCurrentDate = () => {
  const now = new Date();
  return {
    month: (now.getMonth() + 1).toString(),
    year: now.getFullYear(),
  };
};

const normalizeMonth = (month: string | undefined): string => {
  if (!month || month === 'เลือกเดือน') {
    return getCurrentDate().month;
  }
  const monthNum = parseInt(month, 10);
  if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return getCurrentDate().month;
  }
  return month;
};

const normalizeYear = (year: number | string | undefined): number => {
  if (!year) return getCurrentDate().year;
  let yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  if (Number.isNaN(yearNum) || yearNum < 1900) return getCurrentDate().year;
  if (yearNum > 2500) yearNum = yearNum - 543;
  return yearNum;
};

const calculateRatio = (value: number, total: number): number => {
  if (total <= 0) return 0;
  return round2((value / total) * 100);
};

// =============================================================================
// SQL QUERIES
// =============================================================================

/** Query 1: ข้อมูลยอดขายหลัก */
const MAIN_SALES_QUERY = `
  SELECT 
    CodeG,
    NameG,
    CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(PB), 0), 2) AS DECIMAL(30,2)) AS Amt,
    CAST(ROUND(ISNULL(SUM(PPOINT), 0), 2) AS DECIMAL(30,2)) AS PointSale,
    CAST(ROUND(ISNULL(SUM(ComSP), 0), 2) AS DECIMAL(30,2)) AS AmtSP,
    CAST(ROUND(ISNULL(SUM(CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802
  WHERE CodeG = @p1 
    AND MONTH(Docdate) = @p2 
    AND YEAR(Docdate) = @p3
  GROUP BY CodeG, NameG
`;

/** Query 2: PBH รวม (กลุ่ม H ทั้งหมด) */
const GROUP_H_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.Amt), 0), 2) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS Amt,
    CAST(ROUND(ISNULL(SUM(v.CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) = @p2 
    AND YEAR(v.Docdate) = @p3
    AND g.grItemCode = 'H'
    AND g.tyitem = '1'
  GROUP BY v.CodeG
`;

/** Query 3: PBI รวม (กลุ่ม I จาก itemcomPI) */
const GROUP_I_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.Amt), 0), 2) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS Amt,
    CAST(ROUND(ISNULL(SUM(v.CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802 v
  INNER JOIN itemcomPI p ON v.ItemCode = p.ItemCode
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) = @p2 
    AND YEAR(v.Docdate) = @p3
  GROUP BY v.CodeG
`;

/** Query 4: Target */
const TARGET_QUERY = `
  SELECT 
    CodeG,
    CAST(ISNULL(AmtYT, 0) AS DECIMAL(30,2)) AS AmtYT
  FROM ItemTG
  WHERE CodeG = @p1 
    AND YearCal = @p2
`;

/** 
 * Query 5: Rankings (อันดับ CR, PB, CUMS ในบริษัท)
 * ใช้ CTE เพื่อ rank ทุก user แล้วดึงเฉพาะ user ที่ต้องการ
 */
const RANKING_QUERY = `
  WITH AllSalesRanking AS (
    SELECT 
      CodeG,
      SUM(Amt) as TotalCR,
      SUM(PB) as TotalPB,
      SUM(CUMS) as TotalCUMS,
      ROW_NUMBER() OVER (ORDER BY SUM(Amt) DESC) as RankCR,
      ROW_NUMBER() OVER (ORDER BY SUM(PB) DESC) as RankPB,
      ROW_NUMBER() OVER (ORDER BY SUM(CUMS) DESC) as RankCUMS,
      COUNT(*) OVER () as TotalUsers
    FROM V802
    WHERE MONTH(Docdate) = @p1 
      AND YEAR(Docdate) = @p2
    GROUP BY CodeG
  )
  SELECT 
    RankCR as rankCR,
    RankPB as rankPB,
    RankCUMS as rankCUMS,
    TotalUsers as totalSales
  FROM AllSalesRanking
  WHERE CodeG = @p3
`;

/** Query 6: ยอดแยกตามประเภทสินค้า (grItemCode) */
const PRODUCT_GROUP_QUERY = `
  SELECT 
    g.grItemCode,
    CAST(ROUND(ISNULL(SUM(v.Amt), 0), 2) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS Amt,
    CAST(ROUND(ISNULL(SUM(v.CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) = @p2 
    AND YEAR(v.Docdate) = @p3
    AND g.tyitem = '1'
  GROUP BY g.grItemCode
`;

// =============================================================================
// DATA FETCHING
// =============================================================================

interface QueryParams {
  userCode: string;
  month: string;
  year: number;
  thaiYear: number;
}

async function fetchAllData(params: QueryParams) {
  const { userCode, month, year, thaiYear } = params;

  const [
    mainData,
    groupHData,
    groupIData,
    targetData,
    rankingData,
    productGroupData
  ] = await Promise.all([
    db.$queryRawUnsafe<MainSalesData[]>(MAIN_SALES_QUERY, userCode, month, year),
    db.$queryRawUnsafe<{ CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[]>(GROUP_H_QUERY, userCode, month, year),
    db.$queryRawUnsafe<{ CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[]>(GROUP_I_QUERY, userCode, month, year),
    db.$queryRawUnsafe<TargetData[]>(TARGET_QUERY, userCode, thaiYear),
    db.$queryRawUnsafe<RankingResult[]>(RANKING_QUERY, month, year, userCode),
    db.$queryRawUnsafe<ProductGroupResult[]>(PRODUCT_GROUP_QUERY, userCode, month, year),
  ]);

  return { mainData, groupHData, groupIData, targetData, rankingData, productGroupData };
}

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

function calculateRateCom(Amt: number, AmtYT: number): number {
  if (AmtYT <= 0 || Amt <= 0) return 0;
  
  const targetMonth = AmtYT / 12;
  const ratio = Amt / targetMonth;
  
  if (AmtYT < TARGET_THRESHOLD) {
    // กลุ่ม A (เป้าปี < 50 ล้าน)
    if (ratio < 0.60) return 0;
    if (ratio < 0.85) return 0.5;
    if (ratio < 1.00) return 1.0;
    if (ratio < 1.15) return 1.5;
    if (ratio < 1.30) return 2.0;
    return 2.5;
  } else {
    // กลุ่ม B (เป้าปี >= 50 ล้าน)
    if (ratio < 0.60) return 0;
    if (ratio < 0.85) return 0.5;
    if (ratio < 1.00) return 1.0;
    if (ratio < 1.10) return 1.5;
    if (ratio < 1.20) return 2.0;
    return 2.5;
  }
}

function calculatePP(Amt: number, PBH: number, PBI: number): number {
  return round2(Amt - PBH - PBI);
}

function calculateAmtPoint(PP: number, RateCom: number): number {
  return round2((PP * RateCom) / 100);
}

function calculateComPBI(PBI: number, RateCom: number): number {
  if (RateCom <= 0) return 0;
  return round2((PBI * 0.5) / 100);
}

function calculateComPBH(PBH: number, RateCom: number): number {
  if (RateCom <= 0) return 0;
  return round2((PBH * 1) / 100);
}

function calculateSumCOMSP(AmtSP: number, AmtPoint: number, ComPBI: number, ComPBH: number): number {
  return round2(AmtSP + AmtPoint + ComPBI + ComPBH);
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

interface TransformParams {
  mainData: MainSalesData[];
  groupHData: { CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[];
  groupIData: { CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[];
  targetData: TargetData[];
  rankingData: RankingResult[];
  productGroupData: ProductGroupResult[];
}

function transformToReport(params: TransformParams): SalesReportData | null {
  const { mainData, groupHData, groupIData, targetData, rankingData, productGroupData } = params;

  if (!mainData || mainData.length === 0) {
    return null;
  }

  const main = mainData[0];
  const codeG = main.CodeG;

  // ดึงข้อมูลจาก results
  const groupH = groupHData[0] || { SaleAmt: 0, Amt: 0, CuMS: 0 };
  const groupI = groupIData[0] || { SaleAmt: 0, Amt: 0, CuMS: 0 };
  
  const PBH = toNumber(groupH.Amt);   // PB กลุ่ม H ทั้งหมด
  const PBI = toNumber(groupI.Amt);   // PB กลุ่ม I (itemcomPI)
  const AmtYT = toNumber(targetData[0]?.AmtYT);
  const ranking = rankingData[0] || { rankCR: 0, rankPB: 0, rankCUMS: 0, totalSales: 0 };

  // ค่าพื้นฐาน
  const salesCR = toNumber(main.SaleAmt);
  const salesPB = toNumber(main.Amt);
  const AmtSP = toNumber(main.AmtSP);
  const CUMS = toNumber(main.CuMS);

  // Target
  const targetMonth = AmtYT > 0 ? round2(AmtYT / 12) : 0;
  const pctOfTarget = targetMonth > 0 ? round2((salesPB / targetMonth) * 100) : 0;
  
  // RateCom (แก้ไข Bug แล้ว)
  const RateComNum = calculateRateCom(salesPB, AmtYT);
  
  // Commission calculations
  const PP = calculatePP(salesPB, PBH, PBI);
  const AmtPoint = calculateAmtPoint(PP, RateComNum);
  const ComPBI = calculateComPBI(PBI, RateComNum);
  const ComPBH = calculateComPBH(PBH, RateComNum);
  const SumCOMSP = calculateSumCOMSP(AmtSP, AmtPoint, ComPBI, ComPBH);

  // ===== Product Breakdown (H1, H2, MP, SP) =====
  // จาก project เก่า:
  // - PBH1 = PBH - PBI (กลุ่ม H ที่ไม่ใช่ I)
  // - PBH2 = PBI (กลุ่ม I)
  // - MP = PB - PBH (ยอดที่ไม่ใช่กลุ่ม H)
  
  const PBH1 = round2(PBH - PBI);  // กลุ่ม H ลบ กลุ่ม I
  const PBH2 = PBI;                 // กลุ่ม I
  const PBMP = round2(salesPB - PBH); // MP = PB - กลุ่ม H ทั้งหมด

  // CR และ CUMS ของแต่ละกลุ่ม
  const CRH = toNumber(groupH.SaleAmt);
  const CRI = toNumber(groupI.SaleAmt);
  const CRH1 = round2(CRH - CRI);
  const CRMP = round2(salesCR - CRH);

  const CUMSH = toNumber(groupH.CuMS);
  const CUMSI = toNumber(groupI.CuMS);
  const CUMSH1 = round2(CUMSH - CUMSI);
  const CUMSMP = round2(CUMS - CUMSH);

  // สร้าง Product Summary
  const productSummary: ProductSummary[] = [
    {
      code: 'H1',
      label: 'H1 (กลุ่ม H ไม่รวม I)',
      CR: CRH1,
      ratioCR: calculateRatio(CRH1, salesCR),
      PB: PBH1,
      ratioPB: calculateRatio(PBH1, salesPB),
      CUMS: CUMSH1,
      ratioCUMS: calculateRatio(CUMSH1, CUMS),
    },
    {
      code: 'H2',
      label: 'H2 (กลุ่ม I)',
      CR: CRI,
      ratioCR: calculateRatio(CRI, salesCR),
      PB: PBH2,
      ratioPB: calculateRatio(PBH2, salesPB),
      CUMS: CUMSI,
      ratioCUMS: calculateRatio(CUMSI, CUMS),
    },
    {
      code: 'MP',
      label: 'MP (PB - H1 - H2)',
      CR: CRMP,
      ratioCR: calculateRatio(CRMP, salesCR),
      PB: PBMP,
      ratioPB: calculateRatio(PBMP, salesPB),
      CUMS: CUMSMP,
      ratioCUMS: calculateRatio(CUMSMP, CUMS),
    },
    {
      code: 'SP',
      label: 'SP (ยาพิเศษ)',
      CR: 0,  // SP ไม่มี CR แยก
      ratioCR: 0,
      PB: 0,  // SP ไม่มี PB แยก
      ratioPB: 0,
      CUMS: 0,
      ratioCUMS: 0,
    },
    {
      code: 'Total',
      label: 'รวมทั้งหมด',
      CR: salesCR,
      ratioCR: 100,
      PB: salesPB,
      ratioPB: 100,
      CUMS: CUMS,
      ratioCUMS: 100,
    },
  ];

  return {
    NameG: toString(main.NameG),
    CodeG: codeG,
    salesCR,
    salesPB,
    pointCUMS: CUMS,
    RateCom: RateComNum.toString(),
    incentive: 0,
    commission: SumCOMSP,
    comSP: AmtSP,
    CUMS,
    baselineTarget: AmtYT,
    targetMonth,
    pctOfTarget,
    
    // Rankings
    rankCR: toNumber(ranking.rankCR),
    rankPB: toNumber(ranking.rankPB),
    rankCUMS: toNumber(ranking.rankCUMS),
    totalSales: toNumber(ranking.totalSales),
    
    // Product breakdown
    productSummary,
    
    // Commission detail
    PP,
    PBI,
    PBH,
    AmtPoint,
    ComPBI,
    ComPBH,
    
    // Product values
    PBH1,
    PBH2,
    PBMP,
  };
}

// =============================================================================
// CORE FUNCTION
// =============================================================================

async function getMonthlySalesReport(
  userCode: string,
  month: string,
  year: number
): Promise<MonthlySalesResponse> {
  const monthNum = parseInt(month, 10);
  const thaiYear = year + 543;

  const rawData = await fetchAllData({ userCode, month, year, thaiYear });
  const report = transformToReport(rawData);

  return {
    report,
    monthFil: THAI_MONTHS[monthNum - 1] ?? '',
    yearFil: year,
  };
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

async function getAuthenticatedUserCode(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.codeG ?? null;
}

// =============================================================================
// API HANDLERS
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MonthlySalesResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { month, year } = getCurrentDate();
    const data = await getMonthlySalesReport(userCode, month, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET Monthly Sales Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<MonthlySalesResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const month = normalizeMonth(body.month);
    const year = normalizeYear(body.year);

    const data = await getMonthlySalesReport(userCode, month, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST Monthly Sales Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}