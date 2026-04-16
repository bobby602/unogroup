import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface YearlySalesData {
  CodeG: string;
  NameG: string | null;
  SaleAmt: number;
  PB: number;
  AmtSP: number;
  CuMS: number;
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

interface YearlyReportData {
  // ข้อมูลพนักงาน
  NameG: string;
  CodeG: string;
  year: number;
  
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
  baselineTarget: number;    // Target ปี (AmtYT)
  pctOfTarget: number;
  
  // Rankings
  rankCR: number;
  rankPB: number;
  rankCUMS: number;
  totalSales: number;
  
  // Product breakdown
  productSummary: ProductSummary[];
  
  // Commission breakdown
  PP: number;
  PBI: number;
  PBH: number;
  AmtPoint: number;
  ComPBI: number;
  ComPBH: number;
  
  // Product values
  PBH1: number;
  PBH2: number;
  PBMP: number;
}

interface YearlySalesResponse {
  report: YearlyReportData | null;
  yearFil: number;
  yearFilThai: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

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

const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

const normalizeYear = (year: number | string | undefined): number => {
  if (!year) return getCurrentYear();
  let yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  if (Number.isNaN(yearNum) || yearNum < 1900) return getCurrentYear();
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

/** Query 1: ข้อมูลยอดขายหลักรายปี */
const MAIN_SALES_QUERY = `
  SELECT 
    CodeG,
    NameG,
    CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(PB), 0), 2) AS DECIMAL(30,2)) AS PB,
    CAST(ROUND(ISNULL(SUM(ComSP), 0), 2) AS DECIMAL(30,2)) AS AmtSP,
    CAST(ROUND(ISNULL(SUM(CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802
  WHERE CodeG = @p1 
    AND YEAR(Docdate) = @p2
  GROUP BY CodeG, NameG
`;

/** Query 2: PBH รวม (กลุ่ม H) */
const GROUP_H_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.Amt), 0), 2) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS Amt,
    CAST(ROUND(ISNULL(SUM(v.CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND YEAR(v.Docdate) = @p2
    AND g.grItemCode = 'H'
    AND g.tyitem = '1'
  GROUP BY v.CodeG
`;

/** Query 3: PBI รวม (กลุ่ม I) */
const GROUP_I_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.Amt), 0), 2) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS Amt,
    CAST(ROUND(ISNULL(SUM(v.CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802 v
  INNER JOIN itemcomPI p ON v.ItemCode = p.ItemCode
  WHERE v.CodeG = @p1 
    AND YEAR(v.Docdate) = @p2
  GROUP BY v.CodeG
`;

/** Query 4: Target (AmtYT) */
const TARGET_QUERY = `
  SELECT 
    CodeG,
    CAST(ISNULL(AmtYT, 0) AS DECIMAL(30,2)) AS AmtYT
  FROM ItemTG
  WHERE CodeG = @p1 
    AND YearCal = @p2
`;

/** Query 5: Rankings รายปี */
const RANKING_QUERY = `
  WITH YearlySales AS (
    SELECT 
      CodeG,
      SUM(Amt) as TotalCR,
      SUM(PB) as TotalPB,
      SUM(CUMS) as TotalCUMS
    FROM V802
    WHERE YEAR(Docdate) = @p1
    GROUP BY CodeG
  ),
  RankedSales AS (
    SELECT 
      CodeG,
      TotalCR,
      TotalPB,
      TotalCUMS,
      ROW_NUMBER() OVER (ORDER BY TotalCR DESC) as RankCR,
      ROW_NUMBER() OVER (ORDER BY TotalPB DESC) as RankPB,
      ROW_NUMBER() OVER (ORDER BY TotalCUMS DESC) as RankCUMS,
      COUNT(*) OVER () as TotalUsers
    FROM YearlySales
  )
  SELECT 
    RankCR as rankCR,
    RankPB as rankPB,
    RankCUMS as rankCUMS,
    TotalUsers as totalSales
  FROM RankedSales
  WHERE CodeG = @p2
`;

// =============================================================================
// DATA FETCHING
// =============================================================================

interface QueryParams {
  userCode: string;
  year: number;
  thaiYear: number;
}

async function fetchAllData(params: QueryParams) {
  const { userCode, year, thaiYear } = params;

  const [
    mainData,
    groupHData,
    groupIData,
    targetData,
    rankingData
  ] = await Promise.all([
    db.$queryRawUnsafe<YearlySalesData[]>(MAIN_SALES_QUERY, userCode, year),
    db.$queryRawUnsafe<{ CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[]>(GROUP_H_QUERY, userCode, year),
    db.$queryRawUnsafe<{ CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[]>(GROUP_I_QUERY, userCode, year),
    db.$queryRawUnsafe<TargetData[]>(TARGET_QUERY, userCode, thaiYear),
    db.$queryRawUnsafe<RankingResult[]>(RANKING_QUERY, year, userCode),
  ]);

  return { mainData, groupHData, groupIData, targetData, rankingData };
}

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * คำนวณ RateCom แบบ Target-based สำหรับรายปี
 * ใช้ AmtYT (Target ปี) ตรงๆ
 */
function calculateRateCom(PB: number, AmtYT: number): number {
  if (AmtYT <= 0 || PB <= 0) return 0;
  
  const ratio = PB / AmtYT;
  
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

function calculatePP(PB: number, PBH: number, PBI: number): number {
  return round2(PB - PBH - PBI);
}

function calculateAmtPoint(PP: number, RateCom: number): number {
  return round2((PP * RateCom) / 100);
}

/**
 * ComPBI - max rate 0.5%
 */
function calculateComPBI(PBI: number, RateCom: number): number {
  if (RateCom <= 0) return 0;
  const effectiveRate = Math.min(RateCom, 0.5);
  return round2((PBI * effectiveRate) / 100);
}

/**
 * ComPBH - max rate 1%
 */
function calculateComPBH(PBH: number, RateCom: number): number {
  if (RateCom <= 0) return 0;
  const effectiveRate = Math.min(RateCom, 1);
  return round2((PBH * effectiveRate) / 100);
}

function calculateTotalCommission(AmtSP: number, AmtPoint: number, ComPBI: number, ComPBH: number): number {
  return round2(AmtSP + AmtPoint + ComPBI + ComPBH);
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

interface TransformParams {
  mainData: YearlySalesData[];
  groupHData: { CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[];
  groupIData: { CodeG: string; SaleAmt: number; Amt: number; CuMS: number }[];
  targetData: TargetData[];
  rankingData: RankingResult[];
  year: number;
}

function transformToReport(params: TransformParams): YearlyReportData | null {
  const { mainData, groupHData, groupIData, targetData, rankingData, year } = params;

  if (!mainData || mainData.length === 0) {
    return null;
  }

  const main = mainData[0];
  const codeG = main.CodeG;

  // ดึงข้อมูลจาก results
  const groupH = groupHData[0] || { SaleAmt: 0, Amt: 0, CuMS: 0 };
  const groupI = groupIData[0] || { SaleAmt: 0, Amt: 0, CuMS: 0 };
  
  const PBH = toNumber(groupH.Amt);
  const PBI = toNumber(groupI.Amt);
  const target = targetData[0] || { AmtYT: 0 };
  const AmtYT = toNumber(target.AmtYT);
  const ranking = rankingData[0] || { rankCR: 0, rankPB: 0, rankCUMS: 0, totalSales: 0 };

  // ค่าพื้นฐาน
  const salesCR = toNumber(main.SaleAmt);
  const salesPB = toNumber(main.PB);
  const AmtSP = toNumber(main.AmtSP);
  const CUMS = toNumber(main.CuMS);

  // Target
  const pctOfTarget = AmtYT > 0 ? round2((salesPB / AmtYT) * 100) : 0;
  
  // RateCom
  const RateComNum = calculateRateCom(salesPB, AmtYT);
  
  // Commission calculations
  const PP = calculatePP(salesPB, PBH, PBI);
  const AmtPoint = calculateAmtPoint(PP, RateComNum);
  const ComPBI = calculateComPBI(PBI, RateComNum);
  const ComPBH = calculateComPBH(PBH, RateComNum);
  const TotalCom = calculateTotalCommission(AmtSP, AmtPoint, ComPBI, ComPBH);

  // Product Breakdown
  const PBH1 = round2(PBH - PBI);
  const PBH2 = PBI;
  const PBMP = round2(salesPB - PBH);

  const CRH = toNumber(groupH.SaleAmt);
  const CRI = toNumber(groupI.SaleAmt);
  const CRH1 = round2(CRH - CRI);
  const CRMP = round2(salesCR - CRH);

  const CUMSH = toNumber(groupH.CuMS);
  const CUMSI = toNumber(groupI.CuMS);
  const CUMSH1 = round2(CUMSH - CUMSI);
  const CUMSMP = round2(CUMS - CUMSH);

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
      label: 'SP (ค่าคอมยาพิเศษ)',
      CR: 0,
      ratioCR: 0,
      PB: 0,
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
    year,
    salesCR,
    salesPB,
    pointCUMS: CUMS,
    RateCom: RateComNum.toString(),
    incentive: 0,
    commission: TotalCom,
    comSP: AmtSP,
    CUMS,
    baselineTarget: AmtYT,
    pctOfTarget,
    rankCR: toNumber(ranking.rankCR),
    rankPB: toNumber(ranking.rankPB),
    rankCUMS: toNumber(ranking.rankCUMS),
    totalSales: toNumber(ranking.totalSales),
    productSummary,
    PP,
    PBI,
    PBH,
    AmtPoint,
    ComPBI,
    ComPBH,
    PBH1,
    PBH2,
    PBMP,
  };
}

// =============================================================================
// CORE FUNCTION
// =============================================================================

async function getYearlySalesReport(
  userCode: string,
  year: number
): Promise<YearlySalesResponse> {
  const thaiYear = year + 543;

  const rawData = await fetchAllData({ 
    userCode, 
    year, 
    thaiYear
  });
  
  const report = transformToReport({ ...rawData, year });

  return {
    report,
    yearFil: year,
    yearFilThai: thaiYear,
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

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<YearlySalesResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const year = getCurrentYear();
    const data = await getYearlySalesReport(userCode, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET Yearly Sales Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<YearlySalesResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const year = normalizeYear(body.year);

    const data = await getYearlySalesReport(userCode, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST Yearly Sales Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}