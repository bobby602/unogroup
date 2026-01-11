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
  SaleAmt: number;
  PB: number;
  AmtSP: number;
  CuMS: number;
}

interface TargetData {
  CodeG: string;
  AmtYT: number;
}

interface ProductCommission {
  code: string;
  label: string;
  CR: number;
  PB: number;
  CUMS: number;
  commissionRate: number;
  commission: number;
}

interface MonthlyCommissionData {
  // ข้อมูลพนักงาน
  NameG: string;
  CodeG: string;
  month: number;
  monthName: string;
  year: number;
  
  // กลุ่มฝ่ายขาย
  salesGroup: string;  // 'A' หรือ 'B'
  
  // Summary
  salesCR: number;           // ยอดขาย (CR)
  salesPB: number;           // ยอดขาย (PB)
  CUMS: number;              // CUMS
  
  // Target & Achievement
  baselineTargetY: number;   // Baseline Target (Y) - Target ปี
  targetMonth: number;       // Target รายเดือน
  achievementPct: number;    // Achievement (%)
  RateCom: number;           // Commission (%)
  achievementLevel: string;  // ระดับความสำเร็จ
  
  // Commission รวม
  totalCommission: number;
  
  // Product Breakdown with Commission
  productCommissions: ProductCommission[];
  
  // Raw values
  comSP: number;             // AmtSP (ยาพิเศษ)
}

interface MonthlyCommissionResponse {
  report: MonthlyCommissionData | null;
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

const TARGET_THRESHOLD = 60000000;

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

const getCurrentMonth = (): number => new Date().getMonth() + 1;
const getCurrentYear = (): number => new Date().getFullYear();

const normalizeMonth = (month: number | string | undefined): number => {
  if (!month) return getCurrentMonth();
  const m = typeof month === 'string' ? parseInt(month, 10) : month;
  if (Number.isNaN(m) || m < 1 || m > 12) return getCurrentMonth();
  return m;
};

const normalizeYear = (year: number | string | undefined): number => {
  if (!year) return getCurrentYear();
  let yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  if (Number.isNaN(yearNum) || yearNum < 1900) return getCurrentYear();
  if (yearNum > 2500) yearNum = yearNum - 543;
  return yearNum;
};

/**
 * คำนวณระดับความสำเร็จจาก RateCom
 */
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

/** Query 1: ข้อมูลยอดขายรายเดือน */
const MONTHLY_SALES_QUERY = `
  SELECT 
    CodeG,
    NameG,
    CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(PB), 0), 2) AS DECIMAL(30,2)) AS PB,
    CAST(ROUND(ISNULL(SUM(ComSP), 0), 2) AS DECIMAL(30,2)) AS AmtSP,
    CAST(ROUND(ISNULL(SUM(CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802
  WHERE CodeG = @p1 
    AND MONTH(Docdate) = @p2
    AND YEAR(Docdate) = @p3
  GROUP BY CodeG, NameG
`;

/** Query 2: H1 - กลุ่ม H (สารกำจัดวัชพืชทั่วไป) */
const GROUP_H_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ISNULL(SUM(v.Amt), 0) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB,
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

/** Query 3: H2 - กลุ่ม I (สารกำจัดวัชพืชราคาต่ำแข่งขันสูง) */
const GROUP_I_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ISNULL(SUM(v.Amt), 0) AS DECIMAL(30,2)) AS SaleAmt,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB,
    CAST(ROUND(ISNULL(SUM(v.CUMS), 0), 2) AS DECIMAL(30,2)) AS CuMS
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND MONTH(v.Docdate) = @p2
    AND YEAR(v.Docdate) = @p3
    AND g.grItemCode = 'I'
    AND g.tyitem = '1'
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

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * คำนวณ RateCom แบบ Target-based รายเดือน
 * - กลุ่ม A (Target >= 60 ล้าน): เกณฑ์ต่างจากกลุ่ม B
 * - กลุ่ม B (Target < 60 ล้าน): เกณฑ์ปกติ
 */
function calculateRateCom(PB: number, targetMonth: number, AmtYT: number): number {
  if (targetMonth <= 0 || PB <= 0) return 0;
  
  const pctTarget = (PB / targetMonth) * 100;
  
  // กลุ่ม A (Target >= 60 ล้าน)
  if (AmtYT >= TARGET_THRESHOLD) {
    if (pctTarget < 60) return 0;
    if (pctTarget < 80) return 0.5;
    if (pctTarget < 100) return 1.0;
    if (pctTarget < 110) return 1.5;
    if (pctTarget < 125) return 2.0;
    return 2.5;
  }
  
  // กลุ่ม B (Target < 60 ล้าน)
  if (pctTarget < 60) return 0;
  if (pctTarget < 80) return 0.5;
  if (pctTarget < 100) return 1.0;
  if (pctTarget < 120) return 1.5;
  if (pctTarget < 135) return 2.0;
  return 2.5;
}

/**
 * คำนวณ Commission H1 (กลุ่ม H) - เพดาน 1.0%
 */
function calculateComH1(PBH1: number, rateCom: number): { rate: number; commission: number } {
  const effectiveRate = Math.min(rateCom, 1.0);
  const commission = round2((PBH1 * effectiveRate) / 100);
  return { rate: effectiveRate, commission };
}

/**
 * คำนวณ Commission H2 (กลุ่ม I) - เพดาน 0.5%
 */
function calculateComH2(PBH2: number, rateCom: number): { rate: number; commission: number } {
  const effectiveRate = Math.min(rateCom, 0.5);
  const commission = round2((PBH2 * effectiveRate) / 100);
  return { rate: effectiveRate, commission };
}

/**
 * คำนวณ Commission MP (สินค้าทั่วไป) - เพดาน 2.5%
 */
function calculateComMP(PBMP: number, rateCom: number): { rate: number; commission: number } {
  const effectiveRate = rateCom; // ไม่มีเพดาน (max 2.5% อยู่แล้ว)
  const commission = round2((PBMP * effectiveRate) / 100);
  return { rate: effectiveRate, commission };
}

/**
 * คำนวณ Commission SP (ยาพิเศษ) - rate + 2% ถ้า Achievement >= 60%
 */
function calculateComSP(AmtSP: number, rateCom: number, pctTarget: number): { rate: number; commission: number } {
  const effectiveRate = pctTarget >= 60 ? rateCom + 2.0 : rateCom;
  const commission = round2((AmtSP * effectiveRate) / 100);
  return { rate: effectiveRate, commission };
}

// =============================================================================
// DATA FETCHING
// =============================================================================

interface QueryParams {
  userCode: string;
  month: number;
  year: number;
  thaiYear: number;
}

async function fetchAllData(params: QueryParams) {
  const { userCode, month, year, thaiYear } = params;

  const [
    monthlyData,
    groupHData,
    groupIData,
    targetData
  ] = await Promise.all([
    db.$queryRawUnsafe<MainSalesData[]>(MONTHLY_SALES_QUERY, userCode, month, year),
    db.$queryRawUnsafe<{ CodeG: string; SaleAmt: number; PB: number; CuMS: number }[]>(GROUP_H_QUERY, userCode, month, year),
    db.$queryRawUnsafe<{ CodeG: string; SaleAmt: number; PB: number; CuMS: number }[]>(GROUP_I_QUERY, userCode, month, year),
    db.$queryRawUnsafe<TargetData[]>(TARGET_QUERY, userCode, thaiYear),
  ]);

  return { monthlyData, groupHData, groupIData, targetData };
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

interface TransformParams {
  monthlyData: MainSalesData[];
  groupHData: { CodeG: string; SaleAmt: number; PB: number; CuMS: number }[];
  groupIData: { CodeG: string; SaleAmt: number; PB: number; CuMS: number }[];
  targetData: TargetData[];
  month: number;
  year: number;
}

function transformToReport(params: TransformParams): MonthlyCommissionData | null {
  const { monthlyData, groupHData, groupIData, targetData, month, year } = params;

  if (!monthlyData || monthlyData.length === 0) {
    return null;
  }

  const main = monthlyData[0];
  const codeG = main.CodeG;

  // ค่าพื้นฐาน
  const salesCR = toNumber(main.SaleAmt);
  const salesPB = toNumber(main.PB);
  const AmtSP = toNumber(main.AmtSP);
  const CUMS = toNumber(main.CuMS);
  
  // H1 - กลุ่ม H
  const groupH = groupHData[0] || { SaleAmt: 0, PB: 0, CuMS: 0 };
  const CRH1 = toNumber(groupH.SaleAmt);
  const PBH1 = toNumber(groupH.PB);
  const CuMSH1 = toNumber(groupH.CuMS);
  
  // H2 - กลุ่ม I
  const groupI = groupIData[0] || { SaleAmt: 0, PB: 0, CuMS: 0 };
  const CRH2 = toNumber(groupI.SaleAmt);
  const PBH2 = toNumber(groupI.PB);
  const CuMSH2 = toNumber(groupI.CuMS);
  
  // MP = PB - H1 - H2
  const PBMP = round2(salesPB - PBH1 - PBH2);
  const CRMP = round2(salesCR - CRH1 - CRH2);
  const CuMSMP = round2(CUMS - CuMSH1 - CuMSH2);
  
  // Target
  const target = targetData[0] || { AmtYT: 0 };
  const AmtYT = toNumber(target.AmtYT);
  const targetMonth = round2(AmtYT / 12);
  
  // Sales Group
  const salesGroup = AmtYT >= TARGET_THRESHOLD ? 'A' : 'B';
  
  // Achievement %
  const achievementPct = targetMonth > 0 ? round2((salesPB / targetMonth) * 100) : 0;
  
  // RateCom (คำนวณจากยอดรายเดือน)
  const RateCom = calculateRateCom(salesPB, targetMonth, AmtYT);
  const achievementLevel = getAchievementLevel(RateCom);
  
  // Commission calculations
  const comH1 = calculateComH1(PBH1, RateCom);
  const comH2 = calculateComH2(PBH2, RateCom);
  const comMP = calculateComMP(PBMP, RateCom);
  const comSPCalc = calculateComSP(AmtSP, RateCom, achievementPct);
  
  // Total Commission
  const totalCommission = round2(comH1.commission + comH2.commission + comMP.commission + comSPCalc.commission);
  
  // Product Commissions array
  const productCommissions: ProductCommission[] = [
    {
      code: 'H1',
      label: 'สารกำจัดวัชพืชทั่วไป',
      CR: CRH1,
      PB: PBH1,
      CUMS: CuMSH1,
      commissionRate: comH1.rate,
      commission: comH1.commission,
    },
    {
      code: 'H2',
      label: 'สารกำจัดวัชพืชราคาต่ำ',
      CR: CRH2,
      PB: PBH2,
      CUMS: CuMSH2,
      commissionRate: comH2.rate,
      commission: comH2.commission,
    },
    {
      code: 'MP',
      label: 'สินค้าทั่วไป',
      CR: CRMP,
      PB: PBMP,
      CUMS: CuMSMP,
      commissionRate: comMP.rate,
      commission: comMP.commission,
    },
    {
      code: 'SP',
      label: 'ยาพิเศษ',
      CR: 0,
      PB: AmtSP,
      CUMS: 0,
      commissionRate: comSPCalc.rate,
      commission: comSPCalc.commission,
    },
  ];

  return {
    NameG: toString(main.NameG),
    CodeG: codeG,
    month,
    monthName: THAI_MONTHS[month - 1],
    year,
    salesGroup,
    salesCR,
    salesPB,
    CUMS,
    baselineTargetY: AmtYT,
    targetMonth,
    achievementPct,
    RateCom,
    achievementLevel,
    totalCommission,
    productCommissions,
    comSP: AmtSP,
  };
}

// =============================================================================
// CORE FUNCTION
// =============================================================================

async function getMonthlyCommissionReport(
  userCode: string,
  month: number,
  year: number
): Promise<MonthlyCommissionResponse> {
  const thaiYear = year + 543;

  const rawData = await fetchAllData({ 
    userCode, 
    month, 
    year, 
    thaiYear
  });
  
  const report = transformToReport({ ...rawData, month, year });

  return {
    report,
    monthFil: THAI_MONTHS[month - 1],
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

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MonthlyCommissionResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const month = getCurrentMonth();
    const year = getCurrentYear();
    const data = await getMonthlyCommissionReport(userCode, month, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET Monthly Commission Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<MonthlyCommissionResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const month = normalizeMonth(body.month);
    const year = normalizeYear(body.year);

    const data = await getMonthlyCommissionReport(userCode, month, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST Monthly Commission Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}