/**
 * Quarter utility functions
 * Migrated from original quater() function
 */

export interface QuarterInfo {
  quarter: number;
  startMonth: number;
  endMonth: number;
  months: number[];
  label: string;
  thaiLabel: string;
}

/**
 * Get quarter information from month (1-12)
 */
export function getQuarter(month: number): QuarterInfo {
  const quarterNum = Math.ceil(month / 3);
  
  const quarters: Record<number, QuarterInfo> = {
    1: {
      quarter: 1,
      startMonth: 1,
      endMonth: 3,
      months: [1, 2, 3],
      label: "Q1",
      thaiLabel: "ไตรมาสที่ 1 (ม.ค. - มี.ค.)"
    },
    2: {
      quarter: 2,
      startMonth: 4,
      endMonth: 6,
      months: [4, 5, 6],
      label: "Q2",
      thaiLabel: "ไตรมาสที่ 2 (เม.ย. - มิ.ย.)"
    },
    3: {
      quarter: 3,
      startMonth: 7,
      endMonth: 9,
      months: [7, 8, 9],
      label: "Q3",
      thaiLabel: "ไตรมาสที่ 3 (ก.ค. - ก.ย.)"
    },
    4: {
      quarter: 4,
      startMonth: 10,
      endMonth: 12,
      months: [10, 11, 12],
      label: "Q4",
      thaiLabel: "ไตรมาสที่ 4 (ต.ค. - ธ.ค.)"
    }
  };
  
  return quarters[quarterNum] || quarters[1];
}

/**
 * Get current quarter info
 */
export function getCurrentQuarter(): QuarterInfo {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return getQuarter(currentMonth);
}

/**
 * Get all quarters for a year
 */
export function getAllQuarters(): QuarterInfo[] {
  return [1, 2, 3, 4].map(q => getQuarter(q * 3));
}

/**
 * Check if a date is in the current quarter
 */
export function isInCurrentQuarter(date: Date): boolean {
  const quarter = getCurrentQuarter();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  
  return year === currentYear && month >= quarter.startMonth && month <= quarter.endMonth;
}

/**
 * Get quarter date range
 */
export function getQuarterDateRange(quarter: number, year: number): { start: Date; end: Date } {
  const q = getQuarter(quarter * 3);
  
  const start = new Date(year, q.startMonth - 1, 1);
  const end = new Date(year, q.endMonth, 0); // Last day of end month
  
  return { start, end };
}

/**
 * Get Thai month name
 */
export function getThaiMonthName(month: number): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  return months[month - 1] || "";
}

/**
 * Get short Thai month name
 */
export function getThaiMonthShort(month: number): string {
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
    "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
    "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  return months[month - 1] || "";
}

/**
 * Calculate commission rate based on points
 * Migrated from original logic
 */
export function calculateCommissionRate(points: number): {
  rate: number;
  incentive: number;
  tier: string;
} {
  if (points < 1050) {
    return { rate: 0, incentive: 0, tier: "Bronze" };
  } else if (points >= 1050 && points < 1950) {
    return { rate: 0.5, incentive: 15000, tier: "Silver" };
  } else if (points >= 1950 && points < 3000) {
    return { rate: 1, incentive: 30000, tier: "Gold" };
  } else if (points >= 3000 && points < 3900) {
    return { rate: 1.5, incentive: 45000, tier: "Platinum" };
  } else {
    return { rate: 1.5, incentive: 60000, tier: "Diamond" };
  }
}
