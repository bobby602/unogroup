import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface QuarterlySalesData {
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

interface MonthlyBreakdown {
  month: number;
  monthName: string;
  PB: number;
  PBH1: number;
  PBH2: number;
  PBMP: number;
  rateCom: number;
  commission: number;
}

interface QuarterlyCommissionData {
  // ข้อมูลพนักงาน
  NameG: string;
  CodeG: string;
  quarter: number;
  quarterName: string;
  year: number;
  
  // กลุ่มฝ่ายขาย
  salesGroup: string;
  
  // Summary ไตรมาส
  quarterlyPB: number;           // ยอดขายรวม(PB)ไตรมาส
  baselineTargetY: number;       // Baseline Target (Y)
  baselineTargetQ: number;       // Baseline Target (Q)
  achievementPct: number;        // Achievement (%)
  RateCom: number;               // Rate ค่าคอม
  achievementLevel: string;      // ระดับความสำเร็จ
  quarterlyCommission: number;   // Commission ไตรมาส
  CUMS: number;                  // CUMS
  
  // ยอดขายและ Commission แต่ละเดือน
  monthlyBreakdown: MonthlyBreakdown[];
}

interface QuarterlyCommissionResponse {
  report: QuarterlyCommissionData | null;
  quarterFil: number;
  quarterName: string;
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

const QUARTER_NAMES = ['ไตรมาส 1', 'ไตรมาส 2', 'ไตรมาส 3', 'ไตรมาส 4'] as const;

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

const getCurrentQuarter = (): number => {
  const month = new Date().getMonth() + 1;
  return Math.ceil(month / 3);
};

const getCurrentYear = (): number => new Date().getFullYear();

const normalizeQuarter = (quarter: number | string | undefined): number => {
  if (!quarter) return getCurrentQuarter();
  const q = typeof quarter === 'string' ? parseInt(quarter, 10) : quarter;
  if (Number.isNaN(q) || q < 1 || q > 4) return getCurrentQuarter();
  return q;
};

const normalizeYear = (year: number | string | undefined): number => {
  if (!year) return getCurrentYear();
  let yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  if (Number.isNaN(yearNum) || yearNum < 1900) return getCurrentYear();
  if (yearNum > 2500) yearNum = yearNum - 543;
  return yearNum;
};

const getQuarterMonths = (quarter: number): { start: number; end: number; months: number[] } => {
  const start = (quarter - 1) * 3 + 1;
  const end = quarter * 3;
  return { start, end, months: [start, start + 1, start + 2] };
};

const getAchievementLevel = (rateCom: number): string => {
  if (rateCom === 0) return 'หลุดเป้าหมาย';
  if (rateCom === 0.5) return 'ต่ำกว่าเป้าหมาย';
  if (rateCom === 1.0) return 'ฝ่ายขายใกล้เป้าหมาย';
  if (rateCom === 1.5) return 'ฝ่ายขายระดับมาตรฐาน';
  if (rateCom === 2.0) return 'Top Sale ระดับแนวหน้า';
  if (rateCom === 2.5) return 'Top Sale ระดับตำนาน';
  return '';
};

// =============================================================================
// SQL QUERIES
// =============================================================================

/** Query 1: ยอดขายรวมไตรมาส */
const QUARTERLY_SALES_QUERY = `
  SELECT 
    CodeG,
    NameG,
    CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(PB), 0), 2) AS DECIMAL(30,2)) AS PB,
    CAST(ROUND(ISNULL(SUM(ComSP), 0), 2) AS DECIMAL(30,2)) AS AmtSP,
    CAST(ROUND(ISNULL(SUM(CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802
  WHERE CodeG = @p1 
    AND MONTH(Docdate) BETWEEN @p2 AND @p3
    AND YEAR(Docdate) = @p4
  GROUP BY CodeG, NameG
`;

/** Query 2: PB แต่ละเดือนในไตรมาส */
const MONTHLY_PB_QUERY = `
  SELECT 
    MONTH(Docdate) AS [Month],
    CAST(ROUND(ISNULL(SUM(PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802
  WHERE CodeG = @p1 
    AND MONTH(Docdate) BETWEEN @p2 AND @p3
    AND YEAR(Docdate) = @p4
  GROUP BY MONTH(Docdate)
  ORDER BY MONTH(Docdate)
`;

/** Query 3: H1 รวมไตรมาส */
const GROUP_H_QUARTERLY_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) BETWEEN @p2 AND @p3
    AND YEAR(v.Docdate) = @p4
    AND g.grItemCode = 'H'
    AND g.tyitem = '1'
  GROUP BY v.CodeG
`;

/** Query 4: H2 รวมไตรมาส */
const GROUP_I_QUARTERLY_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802 v
  INNER JOIN itemcomPI p ON v.ItemCode = p.ItemCode
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) BETWEEN @p2 AND @p3
    AND YEAR(v.Docdate) = @p4
  GROUP BY v.CodeG
`;

/** Query 5: H1 แต่ละเดือน */
const GROUP_H_MONTHLY_QUERY = `
  SELECT 
    MONTH(v.Docdate) AS [Month],
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) BETWEEN @p2 AND @p3
    AND YEAR(v.Docdate) = @p4
    AND g.grItemCode = 'H'
    AND g.tyitem = '1'
  GROUP BY MONTH(v.Docdate)
  ORDER BY MONTH(v.Docdate)
`;

/** Query 6: H2 แต่ละเดือน */
const GROUP_I_MONTHLY_QUERY = `
  SELECT 
    MONTH(v.Docdate) AS [Month],
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) BETWEEN @p2 AND @p3
    AND YEAR(v.Docdate) = @p4
    AND g.grItemCode = 'I'
    AND g.tyitem = '1'
  GROUP BY MONTH(v.Docdate)
  ORDER BY MONTH(v.Docdate)
`;

/** Query 7: Target */
const TARGET_QUERY = `
  SELECT 
    CodeG,
    CAST(ISNULL(AmtYT, 0) AS DECIMAL(30,2)) AS AmtYT
  FROM ItemTG
  WHERE CodeG = @p1 
    AND YearCal = @p2
`;

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * คำนวณ RateCom
 */
function calculateRateCom(PB: number, target: number, AmtYT: number): number {
  if (target <= 0 || PB <= 0) return 0;
  
  const pctTarget = (PB / target) * 100;
  
  // กลุ่ม A (Target < 50 ล้าน)
  if (AmtYT < TARGET_THRESHOLD) {
    if (pctTarget < 60) return 0;
    if (pctTarget < 85) return 0.5;
    if (pctTarget < 100) return 1.0;
    if (pctTarget < 115) return 1.5;
    if (pctTarget < 130) return 2.0;
    return 2.5;
  }
  
  // กลุ่ม B (Target >= 50 ล้าน)
  if (pctTarget < 60) return 0;
  if (pctTarget < 85) return 0.5;
  if (pctTarget < 100) return 1.0;
  if (pctTarget < 110) return 1.5;
  if (pctTarget < 120) return 2.0;
  return 2.5;
}

/**
 * คำนวณ Commission จาก PB breakdown
 */
function calculateCommission(PBH1: number, PBH2: number, PBMP: number, rateCom: number): number {
  // H1: เพดาน 1.0%
  const comH1 = round2((PBH1 * Math.min(rateCom, 1.0)) / 100);
  // H2: เพดาน 0.5%
  const comH2 = round2((PBH2 * Math.min(rateCom, 0.5)) / 100);
  // MP: ใช้ rate ปกติ
  const comMP = round2((PBMP * rateCom) / 100);
  
  return round2(comH1 + comH2 + comMP);
}

// =============================================================================
// DATA FETCHING
// =============================================================================

interface QueryParams {
  userCode: string;
  quarter: number;
  year: number;
  thaiYear: number;
  monthStart: number;
  monthEnd: number;
}

async function fetchAllData(params: QueryParams) {
  const { userCode, year, thaiYear, monthStart, monthEnd } = params;

  const [
    quarterlyData,
    monthlyPBData,
    groupHQuarterly,
    groupIQuarterly,
    groupHMonthly,
    groupIMonthly,
    targetData
  ] = await Promise.all([
    db.$queryRawUnsafe<QuarterlySalesData[]>(QUARTERLY_SALES_QUERY, userCode, monthStart, monthEnd, year),
    db.$queryRawUnsafe<{ Month: number; PB: number }[]>(MONTHLY_PB_QUERY, userCode, monthStart, monthEnd, year),
    db.$queryRawUnsafe<{ CodeG: string; PB: number }[]>(GROUP_H_QUARTERLY_QUERY, userCode, monthStart, monthEnd, year),
    db.$queryRawUnsafe<{ CodeG: string; PB: number }[]>(GROUP_I_QUARTERLY_QUERY, userCode, monthStart, monthEnd, year),
    db.$queryRawUnsafe<{ Month: number; PB: number }[]>(GROUP_H_MONTHLY_QUERY, userCode, monthStart, monthEnd, year),
    db.$queryRawUnsafe<{ Month: number; PB: number }[]>(GROUP_I_MONTHLY_QUERY, userCode, monthStart, monthEnd, year),
    db.$queryRawUnsafe<TargetData[]>(TARGET_QUERY, userCode, thaiYear),
  ]);

  return { 
    quarterlyData, 
    monthlyPBData, 
    groupHQuarterly, 
    groupIQuarterly,
    groupHMonthly,
    groupIMonthly,
    targetData 
  };
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

interface TransformParams {
  quarterlyData: QuarterlySalesData[];
  monthlyPBData: { Month: number; PB: number }[];
  groupHQuarterly: { CodeG: string; PB: number }[];
  groupIQuarterly: { CodeG: string; PB: number }[];
  groupHMonthly: { Month: number; PB: number }[];
  groupIMonthly: { Month: number; PB: number }[];
  targetData: TargetData[];
  quarter: number;
  year: number;
  quarterMonths: number[];
}

function transformToReport(params: TransformParams): QuarterlyCommissionData | null {
  const { 
    quarterlyData, monthlyPBData, 
    groupHQuarterly, groupIQuarterly,
    groupHMonthly, groupIMonthly,
    targetData, quarter, year, quarterMonths 
  } = params;

  if (!quarterlyData || quarterlyData.length === 0) {
    return null;
  }

  const main = quarterlyData[0];
  const codeG = main.CodeG;

  // ค่าพื้นฐาน - ไตรมาส
  const quarterlyPB = toNumber(main.PB);
  const CUMS = toNumber(main.CuMS);
  
  // H1, H2 ไตรมาส
  const PBH1Quarterly = toNumber(groupHQuarterly[0]?.PB);
  const PBH2Quarterly = toNumber(groupIQuarterly[0]?.PB);
  const PBMPQuarterly = round2(quarterlyPB - PBH1Quarterly - PBH2Quarterly);
  
  // Target
  const target = targetData[0] || { AmtYT: 0 };
  const AmtYT = toNumber(target.AmtYT);
  const targetQuarter = round2(AmtYT / 4);
  const targetMonth = round2(AmtYT / 12);
  
  // Sales Group
  const salesGroup = AmtYT < TARGET_THRESHOLD ? 'A' : 'B';
  
  // Achievement % ไตรมาส
  const achievementPct = targetQuarter > 0 ? round2((quarterlyPB / targetQuarter) * 100) : 0;
  
  // RateCom ไตรมาส
  const RateCom = calculateRateCom(quarterlyPB, targetQuarter, AmtYT);
  const achievementLevel = getAchievementLevel(RateCom);
  
  // Commission ไตรมาส
  const quarterlyCommission = calculateCommission(PBH1Quarterly, PBH2Quarterly, PBMPQuarterly, RateCom);
  
  // สร้าง Map สำหรับ H1, H2 แต่ละเดือน
  const h1ByMonth = new Map<number, number>();
  const h2ByMonth = new Map<number, number>();
  
  groupHMonthly.forEach(item => h1ByMonth.set(item.Month, toNumber(item.PB)));
  groupIMonthly.forEach(item => h2ByMonth.set(item.Month, toNumber(item.PB)));
  
  // Monthly Breakdown
  const monthlyBreakdown: MonthlyBreakdown[] = quarterMonths.map(month => {
    const monthData = monthlyPBData.find(m => m.Month === month);
    const PB = toNumber(monthData?.PB);
    const PBH1 = h1ByMonth.get(month) || 0;
    const PBH2 = h2ByMonth.get(month) || 0;
    const PBMP = round2(PB - PBH1 - PBH2);
    
    // Rate แต่ละเดือน (ใช้ Target เดือน)
    const rateCom = calculateRateCom(PB, targetMonth, AmtYT);
    
    // Commission แต่ละเดือน
    const commission = calculateCommission(PBH1, PBH2, PBMP, rateCom);
    
    return {
      month,
      monthName: THAI_MONTHS[month - 1],
      PB,
      PBH1,
      PBH2,
      PBMP,
      rateCom,
      commission,
    };
  });

  return {
    NameG: toString(main.NameG),
    CodeG: codeG,
    quarter,
    quarterName: QUARTER_NAMES[quarter - 1],
    year,
    salesGroup,
    quarterlyPB,
    baselineTargetY: AmtYT,
    baselineTargetQ: targetQuarter,
    achievementPct,
    RateCom,
    achievementLevel,
    quarterlyCommission,
    CUMS,
    monthlyBreakdown,
  };
}

// =============================================================================
// CORE FUNCTION
// =============================================================================

async function getQuarterlyCommissionReport(
  userCode: string,
  quarter: number,
  year: number
): Promise<QuarterlyCommissionResponse> {
  const thaiYear = year + 543;
  const { start: monthStart, end: monthEnd, months: quarterMonths } = getQuarterMonths(quarter);

  const rawData = await fetchAllData({ 
    userCode, 
    quarter,
    year, 
    thaiYear,
    monthStart,
    monthEnd
  });
  
  const report = transformToReport({ ...rawData, quarter, year, quarterMonths });

  return {
    report,
    quarterFil: quarter,
    quarterName: QUARTER_NAMES[quarter - 1],
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

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<QuarterlyCommissionResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const quarter = getCurrentQuarter();
    const year = getCurrentYear();
    const data = await getQuarterlyCommissionReport(userCode, quarter, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET Quarterly Commission Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<QuarterlyCommissionResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const quarter = normalizeQuarter(body.quarter);
    const year = normalizeYear(body.year);

    const data = await getQuarterlyCommissionReport(userCode, quarter, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST Quarterly Commission Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}