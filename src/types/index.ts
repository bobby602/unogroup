// =====================
// USER TYPES
// =====================

export interface User {
  codeG: string;
  name: string;
  surname: string;
  nameG: string;
  isAdmin: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// =====================
// DASHBOARD TYPES
// =====================

export interface DashboardPoints {
  sumPointMonth: number;
  sumPointQuarter: number;
  sumPointYear: number;
  sumPointAllMonth: number;
  sumPointQuarterUno: number;
  sumPointAllYear: number;
}

export interface DashboardData {
  points: DashboardPoints;
  salesList: SaleUser[];
}

export interface SaleUser {
  codeG: string;
  nameG: string;
}

// =====================
// CUSTOMER TYPES
// =====================

export interface Customer {
  custCode: string;
  custName: string;
  custName2?: string;
  codeG: string;
}

export interface CustomerDetail {
  custCode: string;
  name: string;
  dateDoc: string;
  package: string;
  itemName: string;
  price: number;
  qty: number;
  qtySale: number;
  amt: number;
  pb: number;
  cums: number;
  orderNo: string;
  cu: number;
  ms: number;
}

// =====================
// SALES TYPES
// =====================

export interface SalesReport {
  custCode: string;
  custName: string;
  saleName: string;
  netOne: number;
  pbOne: number;
  cumsOne: number;
  cuOne: number;
  msOne: number;
  netTwo?: number;
  pbTwo?: number;
  cumsTwo?: number;
  netThree?: number;
  pbThree?: number;
  cumsThree?: number;
}

export interface SalesSummary {
  custCode: string;
  custName2: string;
  netAmt: number;
  pb: number;
  cums: number;
  maxCr: number;
}

// =====================
// POINTS & COMMISSION TYPES
// =====================

export interface PointsSummary {
  nameG: string;
  row: number;
  sales: number;
  pb: number;
  pointSale: number;
  rateCom: number;
  incentive: number;
  pbi: number;
  pp: number;
  amtPoint: number;
  comPBI: number;
  comSP: number;
  sumComSP: number;
  cums: number;
  pbH1: number;
  pbCal: number;
  comPBH1: number;
}

export interface QuarterSales {
  codeG: string;
  nameG: string;
  quarter: number;
  month: number;
  point: number;
  pb: number;
  amt: number;
}

export interface MonthlyPoints {
  custName: string;
  jan?: number;
  feb?: number;
  mar?: number;
  apr?: number;
  may?: number;
  jun?: number;
  jul?: number;
  aug?: number;
  sep?: number;
  oct?: number;
  nov?: number;
  dec?: number;
}

// =====================
// ORDER TYPES
// =====================

export interface OrderDetail {
  docDate: string;
  custName: string;
  sendNo: string;
  docNo: string;
  num: number;
  itemName1: string;
  pb: string;
  package: string;
  amt: string;
  packd: string;
  price: string;
}

export interface OrderNote {
  note: string;
}

// =====================
// PRICE LIST TYPES
// =====================

export interface PriceListItem {
  num: number;
  name: string;
  mainName: string;
  priceList: number;
  price15: number;
  price25: number;
  price50: number;
  price120: number;
  catName: string;
  noteF: string;
  point: number;
  package: string;
  namePack: string;
  stShowPrice: number;
}

export interface PriceCategory {
  catName: string;
  items: PriceListItem[];
}

// =====================
// API RESPONSE TYPES
// =====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================
// FILTER TYPES
// =====================

export interface DateFilter {
  startDate?: string;
  endDate?: string;
}

export interface SalesFilter extends DateFilter {
  codeG?: string;
  custCode?: string;
}

export interface PointsFilter extends DateFilter {
  codeG?: string;
  quarter?: number;
}

// =====================
// TABLE TYPES
// =====================

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  format?: (value: T[keyof T]) => string;
}
