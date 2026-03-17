import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentQuarter } from "@/lib/quarter";
export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.codeG) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const codeG = session.user.codeG;
    const quarter = getCurrentQuarter();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [
      pointsMonth,
      pointsQuarter,
      pointsYear,
      pointsAllMonth,
      pointsQuarterUno,
      pointsAllYear,
    ] = await Promise.all([
      // 1. ยอดขาย CR ประจำเดือน (personal) ✅ Amt
      db.$queryRaw<[{ sum: number }]>`
        SELECT ISNULL(SUM(Amt), 0) as sum 
        FROM V802 
        WHERE CodeG = ${codeG} 
          AND MONTH(DocDate) = ${currentMonth}
          AND YEAR(DocDate) = ${currentYear}
      `,
      
      // 2. ยอดขาย CR ประจำไตรมาส (personal) ✅ Amt
      db.$queryRaw<[{ sum: number }]>`
        SELECT ISNULL(SUM(Amt), 0) as sum 
        FROM V802 
        WHERE CodeG = ${codeG} 
          AND MONTH(DocDate) BETWEEN ${quarter.startMonth} AND ${quarter.endMonth}
          AND YEAR(DocDate) = ${currentYear}
      `,
      
      // 3. ยอดขาย CR ประจำปี (personal) ✅ Amt
      db.$queryRaw<[{ sum: number }]>`
        SELECT ISNULL(SUM(Amt), 0) as sum 
        FROM V802 
        WHERE CodeG = ${codeG} 
          AND YEAR(DocDate) = ${currentYear}
      `,
      
      // 4. ค่าคอมฯ เดือน UNOGROUP (คงเดิม PPoint)
      db.$queryRaw<[{ sum: number }]>`
        SELECT ISNULL(SUM(PPoint), 0) as sum 
        FROM V802 
        WHERE MONTH(DocDate) = ${currentMonth}
          AND YEAR(DocDate) = ${currentYear}
      `,
      
      // 5. ค่าคอมฯ ไตรมาส UNOGROUP (คงเดิม PPoint)
      db.$queryRaw<[{ sum: number }]>`
        SELECT ISNULL(SUM(PPoint), 0) as sum 
        FROM V802 
        WHERE MONTH(DocDate) BETWEEN ${quarter.startMonth} AND ${quarter.endMonth}
          AND YEAR(DocDate) = ${currentYear}
      `,
      
      // 6. ค่าคอมฯ ปี UNOGROUP (คงเดิม PPoint)
      db.$queryRaw<[{ sum: number }]>`
        SELECT ISNULL(SUM(PPoint), 0) as sum 
        FROM V802 
        WHERE YEAR(DocDate) = ${currentYear}
      `,
    ]);

    return NextResponse.json({
      sumPointMonth: Number(pointsMonth[0]?.sum) || 0,
      sumPointQuarter: Number(pointsQuarter[0]?.sum) || 0,
      sumPointYear: Number(pointsYear[0]?.sum) || 0,
      sumPointAllMonth: Number(pointsAllMonth[0]?.sum) || 0,
      sumPointQuarterUno: Number(pointsQuarterUno[0]?.sum) || 0,
      sumPointAllYear: Number(pointsAllYear[0]?.sum) || 0,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}