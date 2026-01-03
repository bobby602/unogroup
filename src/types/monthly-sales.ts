/**
 * Monthly Sales Data Types
 * ข้อมูลยอดขายประจำเดือน
 */

export interface MonthlySalesData {
  num: number;
  NameG: string;
  Row: number;
  sales: number;      // ยอดขาย
  PB: number;         // PB รวม
  POINTSALE: number;  // คะแนนขาย
  RateCom: string;    // อัตราค่าคอมมิชชั่น
  incentive: number;  // Incentive
  PBI: number;        // PB สินค้า I
  PP: number;         // PB หลังหัก
  AmtPoint: number;   // จำนวนคะแนน
  ComPBI: number;     // ค่าคอม PBI
  COMSP: number;      // ค่าคอม SP
  SumCOMSP: number;   // รวมค่าคอมมิชชั่น
  CUMS: number;       // CUMS
  PBH1: number;       // PB H1
  PBCal: number;      // PB คำนวณ
  ComPBH1: number;    // ค่าคอม PBH1
}

export interface MonthlySalesResponse {
  testData: MonthlySalesData[];
  monthFil: string;   // ชื่อเดือนภาษาไทย
}

export interface MonthlySalesRequest {
  month: string;      // เดือนที่ต้องการ (01-12)
  userCode?: string;  // รหัสพนักงาน (optional สำหรับ admin)
}