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
  TotalSaleAmt: number;
  TotalPB: number;
  TotalAmtSP: number;
  TotalCuMS: number;
}

interface TargetData {
  CodeG: string;
  AmtYT: number;
}

interface YearlyCommissionData {
  // ข้อมูลพนักงาน
  NameG: string;
  CodeG: string;
  year: number;
  
  // กลุ่มฝ่ายขาย
  salesGroup: string;
  
  // Summary
  totalPB: number;               // ยอดขายรวม(PB)
  baselineTargetY: number;       // Baseline Target (Y)
  achievementPct: number;        // Achievement (%)
  achievementLevel: string;      // ระดับความสำเร็จ
  yearlyRateCom: number;         // Rate ค่าคอม
  
  // Commission
  yearlyCommission: number;      // Commission รวมประจำปี
  totalReceivedCommission: number; // Commission ที่ได้รับแล้ว (Q1+Q2+Q3+Q4)
  commissionTopUp: number;       // Commission Top up
  
  // Commission แต่ละไตรมาส (Debug/Detail)
  comQ1: number;
  comQ2: number;
  comQ3: number;
  comQ4: number;
  
  // รางวัลพิเศษ
  specialBonus: number;
}

interface YearlyCommissionResponse {
  report: YearlyCommissionData | null;
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

const TARGET_THRESHOLD = 50000000;
const SPECIAL_BONUS_AMOUNT = 100000;

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

const getCurrentYear = (): number => new Date().getFullYear();

const normalizeYear = (year: number | string | undefined): number => {
  if (!year) return getCurrentYear();
  let yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  if (Number.isNaN(yearNum) || yearNum < 1900) return getCurrentYear();
  if (yearNum > 2500) yearNum = yearNum - 543;
  return yearNum;
};

const getAchievementLevel = (rateCom: number): string => {
  if (rateCom === 2.5) return 'Top Sale ระดับตำนาน';
  if (rateCom === 2.0) return 'Top Sale ระดับแนวหน้า';
  if (rateCom === 1.5) return 'ฝ่ายขายระดับมาตรฐาน';
  if (rateCom === 1.0) return 'ฝ่ายขายใกล้เป้าหมาย';
  if (rateCom === 0.5) return 'ต่ำกว่าเป้าหมาย';
  return 'หลุดเป้าหมาย';
};

// =============================================================================
// SQL QUERIES
// =============================================================================

/** Query 1: ยอดขายรวมทั้งปี */
const YEARLY_SALES_QUERY = `
  SELECT 
    CodeG,
    NameG,
    CAST(ISNULL(SUM(Amt), 0) AS DECIMAL(30,2)) AS TotalSaleAmt,
    CAST(ROUND(ISNULL(SUM(PB), 0), 2) AS DECIMAL(30,2)) AS TotalPB,
    CAST(ROUND(ISNULL(SUM(ComSP), 0), 2) AS DECIMAL(30,2)) AS TotalAmtSP,
    CAST(ROUND(ISNULL(SUM(CUMS), 0), 2) AS DECIMAL(30,2)) AS TotalCuMS
  FROM V802
  WHERE CodeG = @p1 
    AND YEAR(Docdate) = @p2
  GROUP BY CodeG, NameG
`;

/** Query 2: H1 รวมปี (กลุ่ม H) */
const YEARLY_GROUP_H_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PBH1
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND YEAR(v.Docdate) = @p2
    AND g.grItemCode = 'H'
    AND g.tyitem = '1'
  GROUP BY v.CodeG
`;

/** Query 3: H2 รวมปี (กลุ่ม I) */
const YEARLY_GROUP_I_QUERY = `
  SELECT 
    v.CodeG,
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PBH2
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1 
    AND YEAR(v.Docdate) = @p2
    AND g.grItemCode = 'I'
    AND g.tyitem = '1'
  GROUP BY v.CodeG
`;

/** Query 4: PB แต่ละเดือน (12 เดือน) */
const MONTHLY_PB_QUERY = `
  SELECT
    MONTH(Docdate) AS [Month],
    CAST(ROUND(ISNULL(SUM(PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802
  WHERE CodeG = @p1
    AND YEAR(Docdate) = @p2
  GROUP BY MONTH(Docdate)
`;

/** Query 5: H1 แต่ละเดือน (กลุ่ม H) */
const MONTHLY_H1_QUERY = `
  SELECT
    MONTH(v.Docdate) AS [Month],
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1
    AND YEAR(v.Docdate) = @p2
    AND g.grItemCode = 'H'
    AND g.tyitem = '1'
  GROUP BY MONTH(v.Docdate)
`;

/** Query 6: H2 แต่ละเดือน (กลุ่ม I) */
const MONTHLY_H2_QUERY = `
  SELECT
    MONTH(v.Docdate) AS [Month],
    CAST(ROUND(ISNULL(SUM(v.PB), 0), 2) AS DECIMAL(30,2)) AS PB
  FROM V802 v
  INNER JOIN ItemG g ON v.ItemCode = g.Code
  WHERE v.CodeG = @p1
    AND YEAR(v.Docdate) = @p2
    AND g.grItemCode = 'I'
    AND g.tyitem = '1'
  GROUP BY MONTH(v.Docdate)
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
  year: number;
  thaiYear: number;
}

async function fetchAllData(params: QueryParams) {
  const { userCode, year, thaiYear } = params;

  const [
    yearlyData,
    yearlyH1,
    yearlyH2,
    monthlyPB,
    monthlyH1,
    monthlyH2,
    targetData
  ] = await Promise.all([
    db.$queryRawUnsafe<YearlySalesData[]>(YEARLY_SALES_QUERY, userCode, year),
    db.$queryRawUnsafe<{ CodeG: string; PBH1: number }[]>(YEARLY_GROUP_H_QUERY, userCode, year),
    db.$queryRawUnsafe<{ CodeG: string; PBH2: number }[]>(YEARLY_GROUP_I_QUERY, userCode, year),
    db.$queryRawUnsafe<{ Month: number; PB: number }[]>(MONTHLY_PB_QUERY, userCode, year),
    db.$queryRawUnsafe<{ Month: number; PB: number }[]>(MONTHLY_H1_QUERY, userCode, year),
    db.$queryRawUnsafe<{ Month: number; PB: number }[]>(MONTHLY_H2_QUERY, userCode, year),
    db.$queryRawUnsafe<TargetData[]>(TARGET_QUERY, userCode, thaiYear),
  ]);

  return {
    yearlyData,
    yearlyH1,
    yearlyH2,
    monthlyPB,
    monthlyH1,
    monthlyH2,
    targetData
  };
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

interface TransformParams {
  yearlyData: YearlySalesData[];
  yearlyH1: { CodeG: string; PBH1: number }[];
  yearlyH2: { CodeG: string; PBH2: number }[];
  monthlyPB: { Month: number; PB: number }[];
  monthlyH1: { Month: number; PB: number }[];
  monthlyH2: { Month: number; PB: number }[];
  targetData: TargetData[];
  year: number;
}

function transformToReport(params: TransformParams): YearlyCommissionData | null {
  const {
    yearlyData, yearlyH1, yearlyH2,
    monthlyPB, monthlyH1, monthlyH2,
    targetData, year
  } = params;

  if (!yearlyData || yearlyData.length === 0) {
    return null;
  }

  const main = yearlyData[0];
  const codeG = main.CodeG;

  // ค่าพื้นฐาน - ปี
  const totalPB = toNumber(main.TotalPB);
  
  // H1, H2, MP ปี
  const PBH1Yearly = toNumber(yearlyH1[0]?.PBH1);
  const PBH2Yearly = toNumber(yearlyH2[0]?.PBH2);
  const PBMPYearly = round2(totalPB - PBH1Yearly - PBH2Yearly);
  
  // Target
  const target = targetData[0] || { AmtYT: 0 };
  const AmtYT = toNumber(target.AmtYT);
  const targetQuarter = round2(AmtYT / 4);
  const targetMonth = round2(AmtYT / 12);

  // Sales Group
 const salesGroup = AmtYT < TARGET_THRESHOLD ? 'A' : 'B';

  // Achievement % ปี
  const achievementPct = AmtYT > 0 ? round2((totalPB / AmtYT) * 100) : 0;

  // RateCom ปี (= พื้นชั้นที่ 3)
  const yearlyRateCom = calculateRateCom(totalPB, AmtYT, AmtYT);
  const achievementLevel = getAchievementLevel(yearlyRateCom);

  // Commission รวมประจำปี (คิดก้อนปีด้วย Rate ปี - ใช้เป็นค่าอ้างอิงในการ์ด Top up)
  const yearlyCommission = calculateCommission(PBH1Yearly, PBH2Yearly, PBMPYearly, yearlyRateCom);

  // Maps รายเดือน
  const pbByMonth = new Map<number, number>();
  const h1ByMonth = new Map<number, number>();
  const h2ByMonth = new Map<number, number>();
  monthlyPB.forEach(m => pbByMonth.set(m.Month, toNumber(m.PB)));
  monthlyH1.forEach(m => h1ByMonth.set(m.Month, toNumber(m.PB)));
  monthlyH2.forEach(m => h2ByMonth.set(m.Month, toNumber(m.PB)));

  // Rate ไตรมาส (= พื้นชั้นที่ 2) คำนวณจากยอดรวมแต่ละไตรมาส
  const quarterPB = [0, 0, 0, 0];
  for (let month = 1; month <= 12; month++) {
    const qIndex = Math.ceil(month / 3) - 1;
    quarterPB[qIndex] += pbByMonth.get(month) || 0;
  }
  const quarterRate = quarterPB.map(qPB => calculateRateCom(qPB, targetQuarter, AmtYT));

  // คำนวณ Commission รายเดือน: rate = MAX(เดือน, ไตรมาส, ปี) แล้วรวมเป็นแต่ละไตรมาส
  const comByQuarter = [0, 0, 0, 0];
  for (let month = 1; month <= 12; month++) {
    const qIndex = Math.ceil(month / 3) - 1;
    const mPB = pbByMonth.get(month) || 0;
    const mH1 = h1ByMonth.get(month) || 0;
    const mH2 = h2ByMonth.get(month) || 0;
    const mMP = round2(mPB - mH1 - mH2);

    const monthRate = calculateRateCom(mPB, targetMonth, AmtYT);
    // floor 3 ชั้น: เดือน ถูกค้ำด้วย Rate ไตรมาส และ Rate ปี เลือกตัวที่สูงสุด
    const effectiveRate = Math.max(monthRate, quarterRate[qIndex], yearlyRateCom);

    comByQuarter[qIndex] = round2(comByQuarter[qIndex] + calculateCommission(mH1, mH2, mMP, effectiveRate));
  }

  const [comQ1, comQ2, comQ3, comQ4] = comByQuarter;

  // Commission ที่ได้รับแล้ว (รวม Q1-Q4 หลัง floor)
  const totalReceivedCommission = round2(comQ1 + comQ2 + comQ3 + comQ4);

  // Commission Top up: ภายใต้กฎ floor ใหม่จะเป็น 0 เสมอ (ยอดรับ >= ยอดคิดก้อนปี)
  const commissionTopUp = yearlyCommission > totalReceivedCommission
    ? round2(yearlyCommission - totalReceivedCommission)
    : 0;
  
  // รางวัลพิเศษระดับตำนาน
  const specialBonus = yearlyRateCom === 2.5 ? SPECIAL_BONUS_AMOUNT : 0;

  return {
    NameG: toString(main.NameG),
    CodeG: codeG,
    year,
    salesGroup,
    totalPB,
    baselineTargetY: AmtYT,
    achievementPct,
    achievementLevel,
    yearlyRateCom,
    yearlyCommission,
    totalReceivedCommission,
    commissionTopUp,
    comQ1,
    comQ2,
    comQ3,
    comQ4,
    specialBonus,
  };
}

// =============================================================================
// CORE FUNCTION
// =============================================================================

async function getYearlyCommissionReport(
  userCode: string,
  year: number
): Promise<YearlyCommissionResponse> {
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

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<YearlyCommissionResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const year = getCurrentYear();
    const data = await getYearlyCommissionReport(userCode, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET Yearly Commission Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<YearlyCommissionResponse>>> {
  try {
    const userCode = await getAuthenticatedUserCode();
    if (!userCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const year = normalizeYear(body.year);

    const data = await getYearlyCommissionReport(userCode, year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST Yearly Commission Report Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}