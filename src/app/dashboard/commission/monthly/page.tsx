"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Search, 
  Trophy,
  Calculator,
  Target,
  TrendingUp,
  DollarSign,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

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
  NameG: string;
  CodeG: string;
  month: number;
  monthName: string;
  year: number;
  salesGroup: string;
  salesCR: number;
  salesPB: number;
  CUMS: number;
  baselineTargetY: number;
  targetMonth: number;
  achievementPct: number;
  RateCom: number;
  achievementLevel: string;
  totalCommission: number;
  productCommissions: ProductCommission[];
  comSP: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const THAI_MONTHS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" },
];

const AVAILABLE_YEARS = [2023, 2024, 2025, 2026];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getCurrentMonth = (): number => new Date().getMonth() + 1;
const getCurrentYear = (): number => new Date().getFullYear();

const getAchievementBadge = (level: string): { color: string; bgColor: string; icon: string } => {
  if (level.includes('ตำนาน')) return { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '👑' };
  if (level.includes('แนวหน้า')) return { color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: '⭐' };
  if (level.includes('มาตรฐาน')) return { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '🎯' };
  if (level.includes('ใกล้เป้า')) return { color: 'text-green-700', bgColor: 'bg-green-100', icon: '📈' };
  if (level.includes('ต่ำกว่า')) return { color: 'text-orange-700', bgColor: 'bg-orange-100', icon: '⚠️' };
  return { color: 'text-red-700', bgColor: 'bg-red-100', icon: '❌' };
};

const getSalesGroupLabel = (group: string): { label: string; color: string } => {
  if (group === 'A') return { label: 'กลุ่ม A (Target ≥ 60 ล้าน)', color: 'text-blue-600 bg-blue-100' };
  return { label: 'กลุ่ม B (Target < 60 ล้าน)', color: 'text-green-600 bg-green-100' };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MonthlyCommissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MonthlyCommissionData | null>(null);
  const [monthFil, setMonthFil] = useState("");
  const [yearFil, setYearFil] = useState<number>(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async (month?: number, year?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const targetMonth = month ?? selectedMonth;
      const targetYear = year ?? selectedYear;
      
      const response = await fetch("/api/commission/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          month: targetMonth,
          year: targetYear
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setReport(result.data.report);
        setMonthFil(result.data.monthFil);
        setYearFil(result.data.yearFil);
        setSelectedMonth(targetMonth);
        setSelectedYear(targetYear);
      } else {
        setError(result.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error("Failed to fetch commission data:", err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCommissionData(selectedMonth, selectedYear);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
          หน้าหลัก
        </Link>
        <span>/</span>
        <Link href="/dashboard/commission" className="hover:text-emerald-600 transition-colors">
          ค่าคอมมิชชั่น
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประจำเดือน</span>
      </nav>

      {/* Header with Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-8 h-8 text-emerald-600" />
            ค่าคอมมิชชั่นประจำเดือน
          </h1>
          <p className="text-emerald-600 text-lg font-semibold mt-1">
            {monthFil} {yearFil} (พ.ศ. {yearFil + 543})
          </p>
        </div>

        {/* Month/Year Selector - เหมือนหน้าอื่นๆ */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            {THAI_MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            {AVAILABLE_YEARS.map((year) => (
              <option key={year} value={year}>
                {year} (พ.ศ. {year + 543})
              </option>
            ))}
          </select>

          <Button 
            onClick={handleSearch}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            <Search className="w-4 h-4 mr-2" />
            ค้นหา
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay error={error} onRetry={() => fetchCommissionData()} />
      ) : !report ? (
        <NoDataDisplay />
      ) : (
        <CommissionReport report={report} />
      )}

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// SUB COMPONENTS
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );
}

function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
      <p className="text-red-600 font-medium mb-4">{error}</p>
      <Button onClick={onRetry} variant="outline" className="text-red-600 border-red-300">
        ลองใหม่
      </Button>
    </div>
  );
}

function NoDataDisplay() {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border">
      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">ไม่พบข้อมูลในเดือนนี้</p>
    </div>
  );
}

// =============================================================================
// COMMISSION REPORT COMPONENT
// =============================================================================

function CommissionReport({ report }: { report: MonthlyCommissionData }) {
  const badge = getAchievementBadge(report.achievementLevel);
  const salesGroup = getSalesGroupLabel(report.salesGroup);

  return (
    <div className="space-y-6">
      {/* Header Card - User Info & Target */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl text-white p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        {/* Sales Group Badge */}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-medium">{report.salesGroup === 'A' ? 'กลุ่ม A' : 'กลุ่ม B'}</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-emerald-200 text-sm">ฝ่ายขาย</p>
            <h2 className="text-2xl font-bold">{report.NameG}</h2>
            <p className="text-emerald-100 text-sm mt-1">{report.monthName} {report.year}</p>
            <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${badge.bgColor} ${badge.color}`}>
              <span>{badge.icon}</span>
              <span className="text-sm font-medium">{report.achievementLevel}</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-emerald-200 text-sm">Baseline Target (ปี)</p>
            <p className="text-3xl font-bold">{formatNumber(report.baselineTargetY, 0)}</p>
            <p className="text-emerald-100 text-sm mt-2">
              Target รายเดือน: {formatNumber(report.targetMonth, 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          label="ยอดขาย (CR)"
          value={formatNumber(report.salesCR, 2)}
          color="emerald"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="ยอดขาย (PB)"
          value={formatNumber(report.salesPB, 2)}
          color="green"
        />
        <SummaryCard
          icon={<Target className="w-5 h-5" />}
          label="Achievement"
          value={`${report.achievementPct.toFixed(2)}%`}
          subLabel={`Rate: ${report.RateCom}%`}
          color="teal"
        />
        <SummaryCard
          icon={<Award className="w-5 h-5" />}
          label="CUMS"
          value={formatNumber(report.CUMS, 2)}
          color="cyan"
          highlight
        />
      </div>

      {/* Commission Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          สรุปค่าคอมมิชชั่น
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <CommissionSummaryItem 
            label="Commission (%)" 
            value={`${report.RateCom}%`} 
          />
          <CommissionSummaryItem 
            label="คอมยาพิเศษ (SP)" 
            value={formatNumber(report.comSP, 2)} 
          />
          <CommissionSummaryItem 
            label="Commission รวม" 
            value={formatNumber(report.totalCommission, 2)} 
            highlight 
          />
        </div>
      </motion.div>

      {/* Product Commission Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-green-50">
          <h3 className="text-lg font-semibold text-gray-900">ประเภทสินค้า</h3>
          <p className="text-sm text-gray-500 mt-1">
            H1 = สารกำจัดวัชพืชทั่วไป (เพดาน 1%), H2 = ราคาต่ำแข่งขันสูง (เพดาน 0.5%), MP = สินค้าทั่วไป, SP = ยาพิเศษ
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="px-4 py-3 text-left font-semibold">ประเภท</th>
                <th className="px-4 py-3 text-right font-semibold">PB</th>
                <th className="px-4 py-3 text-right font-semibold">Commission(%)</th>
                <th className="px-4 py-3 text-right font-semibold">Commission</th>
              </tr>
            </thead>
            <tbody>
              {report.productCommissions.map((product, index) => (
                <tr 
                  key={product.code}
                  className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-semibold text-gray-900">{product.code}</span>
                      <p className="text-xs text-gray-500">{product.label}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatNumber(product.PB, 2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.code === 'SP' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {product.commissionRate.toFixed(2)}%
                      {product.code === 'SP' && report.achievementPct >= 60 && (
                        <span className="ml-1 text-purple-500">+2%</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    {formatNumber(product.commission, 2)}
                  </td>
                </tr>
              ))}
              
              {/* Total Row */}
              <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                <td className="px-4 py-3 font-bold text-gray-900">รวมทั้งหมด</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {formatNumber(report.salesPB, 2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-200 text-emerald-800">
                    {report.RateCom.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700 text-lg">
                  {formatNumber(report.totalCommission, 2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Rate Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200"
      >
        <div className="flex items-center gap-2 text-emerald-700">
          <Calculator className="w-5 h-5" />
          <span className="font-medium">หมายเหตุการคำนวณ:</span>
        </div>
        <ul className="mt-2 text-sm text-emerald-600 space-y-1 ml-7">
          <li>• H1 (สารกำจัดวัชพืชทั่วไป): Commission Rate สูงสุด 1.0%</li>
          <li>• H2 (สารกำจัดวัชพืชราคาต่ำ): Commission Rate สูงสุด 0.5%</li>
          <li>• MP (สินค้าทั่วไป): Commission Rate ตามเป้า (สูงสุด 2.5%)</li>
          <li>• SP (ยาพิเศษ): Rate + 2% ถ้า Achievement ≥ 60%</li>
        </ul>
        
        {/* Sales Group Info */}
        <div className="mt-4 pt-4 border-t border-emerald-200">
          <p className="text-sm text-emerald-700">
            <span className="font-medium">กลุ่มฝ่ายขาย: </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${salesGroup.color}`}>
              {salesGroup.label}
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function SummaryCard({ 
  icon, 
  label, 
  value, 
  subLabel, 
  color,
  highlight = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subLabel?: string;
  color: 'emerald' | 'green' | 'teal' | 'cyan';
  highlight?: boolean;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    green: 'bg-green-50 text-green-600',
    teal: 'bg-teal-50 text-teal-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        bg-white rounded-xl border p-4 shadow-sm
        ${highlight ? 'ring-2 ring-cyan-400 ring-offset-2' : ''}
      `}
    >
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {subLabel && (
        <p className="text-xs text-gray-400 mt-1">{subLabel}</p>
      )}
    </motion.div>
  );
}

function CommissionSummaryItem({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
}) {
  return (
    <div className={`
      p-4 rounded-xl text-center
      ${highlight ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-gray-50'}
    `}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}