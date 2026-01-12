/**
 * Monthly Sales Data Types
 * ข้อมูลยอดขายประจำเดือน
 */

// เพิ่มอินเตอร์เฟซสำหรับตัวเลือกเดือน
export interface MonthOption {
  value: string;
  label: string;
}

// เพิ่มค่าคงที่ THAI_MONTHS เพื่อให้ MonthSelector เรียกใช้งานได้
export const THAI_MONTHS: MonthOption[] = [
  { value: '01', label: 'มกราคม' },
  { value: '02', label: 'กุมภาพันธ์' },
  { value: '03', label: 'มีนาคม' },
  { value: '04', label: 'เมษายน' },
  { value: '05', label: 'พฤษภาคม' },
  { value: '06', label: 'มิถุนายน' },
  { value: '07', label: 'กรกฎาคม' },
  { value: '08', label: 'สิงหาคม' },
  { value: '09', label: 'กันยายน' },
  { value: '10', label: 'ตุลาคม' },
  { value: '11', label: 'พฤศจิกายน' },
  { value: '12', label: 'ธันวาคม' },
];

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

export type SalesDisplayField = {
  key: keyof MonthlySalesData; // กำหนดให้ key ต้องเป็นชื่อฟิลด์ที่มีอยู่ใน MonthlySalesData เท่านั้น
  label: string;
  type: 'currency' | 'number' | 'text' | 'highlight';
};

// ข้อมูลสำหรับวนลูปสร้างฟิลด์แสดงผล
export const SALES_DISPLAY_FIELDS: SalesDisplayField[] = [
  { key: 'sales', label: 'ยอดขาย', type: 'currency' },
  { key: 'PB', label: 'ยอดขาย(PB)', type: 'currency' },
  { key: 'POINTSALE', label: 'POINT', type: 'highlight' },
  { key: 'RateCom', label: 'Rate ค่าคอม', type: 'text' },
  { key: 'incentive', label: 'Incentive', type: 'currency' },
  { key: 'AmtPoint', label: 'ค่าคอม', type: 'currency' },
  { key: 'COMSP', label: 'คอมยาพิเศษ(SP)', type: 'currency' },
  { key: 'CUMS', label: 'CUMS', type: 'highlight' },
];