"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Search, 
  TrendingUp, 
  Award,
  Target,
  DollarSign,
  BarChart3,
  Trophy,
  Medal,
  Users,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

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

interface QuarterlyReportData {
  NameG: string;
  CodeG: string;
  quarter: number;
  quarterName: string;
  salesCR: number;
  salesPB: number;
  pointCUMS: number;
  RateCom: string;
  incentive: number;
  commission: number;
  comSP: number;
  CUMS: number;
  baselineTarget: number;
  targetQuarter: number;
  pctOfTarget: number;
  rankCR: number;
  rankPB: number;
  rankCUMS: number;
  totalSales: number;
  productSummary: ProductSummary[];
  PP: number;
  PBI: number;
  PBH: number;
  AmtPoint: number;
  ComPBI: number;
  ComPBH: number;
  PBH1: number;
  PBH2: number;
  PBMP: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const QUARTERS = [
  { value: 1, label: "ไตรมาส 1", months: "ม.ค. - มี.ค." },
  { value: 2, label: "ไตรมาส 2", months: "เม.ย. - มิ.ย." },
  { value: 3, label: "ไตรมาส 3", months: "ก.ค. - ก.ย." },
  { value: 4, label: "ไตรมาส 4", months: "ต.ค. - ธ.ค." },
];

const AVAILABLE_YEARS = [2023, 2024, 2025, 2026];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getCurrentQuarter = (): number => {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
};

const getAchievementLevel = (pct: number): { label: string; color: string; icon: string } => {
  if (pct >= 135) return { label: 'Top Sales ระดับเพชร', color: 'from-purple-500 to-pink-500', icon: '💎' };
  if (pct >= 120) return { label: 'Top Sales ระดับทอง', color: 'from-yellow-400 to-orange-500', icon: '🥇' };
  if (pct >= 100) return { label: 'Top Sales ระดับเงิน', color: 'from-gray-300 to-gray-400', icon: '🥈' };
  if (pct >= 80) return { label: 'Top Sales ระดับทองแดง', color: 'from-orange-300 to-orange-400', icon: '🥉' };
  return { label: 'กำลังพัฒนา', color: 'from-blue-400 to-blue-500', icon: '📈' };
};

const getRankBadge = (rank: number): { color: string; icon: React.ReactNode } => {
  if (rank === 1) return { color: 'bg-yellow-400 text-yellow-900', icon: <Trophy className="w-3 h-3" /> };
  if (rank === 2) return { color: 'bg-gray-300 text-gray-700', icon: <Medal className="w-3 h-3" /> };
  if (rank === 3) return { color: 'bg-orange-400 text-orange-900', icon: <Medal className="w-3 h-3" /> };
  return { color: 'bg-blue-100 text-blue-700', icon: null };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function QuarterlyPointsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<QuarterlyReportData | null>(null);
  const [quarterFil, setQuarterFil] = useState("");
  const [yearFil, setYearFil] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async (quarter?: number, year?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (quarter || year) {
        response = await fetch("/api/sales/quarterly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            quarter: quarter || selectedQuarter,
            year: year || selectedYear
          })
        });
      } else {
        response = await fetch("/api/sales/quarterly");
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setReport(result.data.report);
        setQuarterFil(result.data.quarterFil);
        setYearFil(result.data.yearFil);
      } else {
        setError(result.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error("Failed to fetch sales data:", err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchSalesData(selectedQuarter, selectedYear);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-brand-primary transition-colors">
          หน้าหลัก
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ยอดขายประจำไตรมาส</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-8 h-8 text-brand-primary" />
            รายงานยอดขายสะสมประจำไตรมาส
          </h1>
          <p className="text-brand-primary text-lg font-semibold mt-1">
            {quarterFil || `ไตรมาส ${getCurrentQuarter()}`} ปี {yearFil}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
          >
            {QUARTERS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label} ({q.months})
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
          >
            {AVAILABLE_YEARS.map((year) => (
              <option key={year} value={year}>
                {year} ({year + 543})
              </option>
            ))}
          </select>

          <Button 
            onClick={handleSearch}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
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
        <ErrorDisplay error={error} onRetry={() => fetchSalesData()} />
      ) : !report ? (
        <NoDataDisplay />
      ) : (
        <QuarterlyReport report={report} />
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
        <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
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
      <p className="text-gray-500">ไม่พบข้อมูลในไตรมาสนี้</p>
    </div>
  );
}

// =============================================================================
// QUARTERLY REPORT COMPONENT
// =============================================================================

function QuarterlyReport({ report }: { report: QuarterlyReportData }) {
  const achievement = getAchievementLevel(report.pctOfTarget);

  return (
    <div className="space-y-6">
      {/* Header Card - User Info & Target */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl text-white p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        {/* Quarter Badge */}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-sm font-medium">Q{report.quarter}</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-teal-200 text-sm">ฝ่ายขาย</p>
            <h2 className="text-2xl font-bold">{report.NameG}</h2>
            <p className="text-teal-100 text-sm mt-1">{report.quarterName}</p>
            <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${achievement.color}`}>
              <span>{achievement.icon}</span>
              <span className="text-sm font-medium">{achievement.label}</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-teal-200 text-sm">Baseline Target (ปี)</p>
            <p className="text-2xl font-bold">{formatNumber(report.baselineTarget, 0)}</p>
            <p className="text-teal-100 text-sm mt-2">Target/ไตรมาส</p>
            <p className="text-xl font-semibold">{formatNumber(report.targetQuarter, 0)}</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards with Rankings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCardWithRank
          icon={<DollarSign className="w-5 h-5" />}
          label="ยอดขาย (CR)"
          value={formatNumber(report.salesCR, 2)}
          rank={report.rankCR}
          total={report.totalSales}
          color="teal"
        />
        <SummaryCardWithRank
          icon={<TrendingUp className="w-5 h-5" />}
          label="ยอดขาย (PB)"
          value={formatNumber(report.salesPB, 2)}
          rank={report.rankPB}
          total={report.totalSales}
          color="cyan"
        />
        <SummaryCard
          icon={<Target className="w-5 h-5" />}
          label="% of Target"
          value={`${report.pctOfTarget.toFixed(2)}%`}
          subLabel={`Rate: ${report.RateCom}%`}
          color="purple"
        />
        <SummaryCardWithRank
          icon={<Trophy className="w-5 h-5" />}
          label="CUMS"
          value={formatNumber(report.CUMS, 2)}
          rank={report.rankCUMS}
          total={report.totalSales}
          color="yellow"
          highlight
        />
      </div>

      {/* Rankings Detail Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          อันดับในบริษัท (ไตรมาส {report.quarter})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RankingCard
            label="อันดับยอดขาย (CR)"
            rank={report.rankCR}
            total={report.totalSales}
            description="เรียงตามยอดขายสูงสุด"
            color="teal"
          />
          <RankingCard
            label="อันดับยอดขาย (PB)"
            rank={report.rankPB}
            total={report.totalSales}
            description="เรียงตาม PB สูงสุด"
            color="cyan"
          />
          <RankingCard
            label="อันดับการเก็บ CUMS"
            rank={report.rankCUMS}
            total={report.totalSales}
            description="เรียงตาม CUMS สูงสุด"
            color="emerald"
          />
        </div>
      </motion.div>

      {/* Commission Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" />
          สรุปค่าคอมมิชชั่น (ไตรมาส {report.quarter})
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CommissionItem label="Rate ค่าคอม" value={`${report.RateCom}%`} />
          <CommissionItem label="Incentive" value={formatNumber(report.incentive, 2)} />
          <CommissionItem label="คอมยาพิเศษ (SP)" value={formatNumber(report.comSP, 2)} />
          <CommissionItem 
            label="รวมค่าคอม" 
            value={formatNumber(report.commission, 2)} 
            highlight 
          />
        </div>

        {/* Commission Breakdown */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 mb-3">รายละเอียดการคำนวณ</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
            <div className="bg-teal-50 p-2 rounded-lg">
              <p className="text-gray-500 text-xs">PP</p>
              <p className="font-medium">{formatNumber(report.PP, 2)}</p>
            </div>
            <div className="bg-teal-50 p-2 rounded-lg">
              <p className="text-gray-500 text-xs">PBI</p>
              <p className="font-medium">{formatNumber(report.PBI, 2)}</p>
            </div>
            <div className="bg-teal-50 p-2 rounded-lg">
              <p className="text-gray-500 text-xs">PBH</p>
              <p className="font-medium">{formatNumber(report.PBH, 2)}</p>
            </div>
            <div className="bg-cyan-50 p-2 rounded-lg">
              <p className="text-gray-500 text-xs">ค่าคอม PP</p>
              <p className="font-medium">{formatNumber(report.AmtPoint, 2)}</p>
            </div>
            <div className="bg-cyan-50 p-2 rounded-lg">
              <p className="text-gray-500 text-xs">ค่าคอม PBI (max 0.5%)</p>
              <p className="font-medium">{formatNumber(report.ComPBI, 2)}</p>
            </div>
            <div className="bg-cyan-50 p-2 rounded-lg">
              <p className="text-gray-500 text-xs">ค่าคอม PBH (max 1%)</p>
              <p className="font-medium">{formatNumber(report.ComPBH, 2)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Product Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            สรุปตามประเภทสินค้า (ไตรมาส {report.quarter})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            H1 = กลุ่ม H (ไม่รวม I), H2 = กลุ่ม I, MP = PB - (H1 + H2)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                <th className="px-4 py-3 text-left font-semibold">ประเภทสินค้า</th>
                <th className="px-4 py-3 text-right font-semibold">CR</th>
                <th className="px-4 py-3 text-right font-semibold">สัดส่วน</th>
                <th className="px-4 py-3 text-right font-semibold">PB</th>
                <th className="px-4 py-3 text-right font-semibold">สัดส่วน</th>
                <th className="px-4 py-3 text-right font-semibold">CUMS</th>
                <th className="px-4 py-3 text-right font-semibold">สัดส่วน</th>
              </tr>
            </thead>
            <tbody>
              {report.productSummary.map((product, index) => (
                <tr 
                  key={product.code}
                  className={`
                    border-b hover:bg-gray-50 transition-colors
                    ${product.code === 'Total' ? 'bg-teal-50 font-semibold' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  `}
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{product.code}</span>
                      {product.code !== 'Total' && (
                        <p className="text-xs text-gray-500">{product.label}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{formatNumber(product.CR, 2)}</td>
                  <td className="px-4 py-3 text-right text-teal-600">{product.ratioCR.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right">{formatNumber(product.PB, 2)}</td>
                  <td className="px-4 py-3 text-right text-teal-600">{product.ratioPB.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right">{formatNumber(product.CUMS, 2)}</td>
                  <td className="px-4 py-3 text-right text-teal-600">{product.ratioCUMS.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  color: 'teal' | 'cyan' | 'purple' | 'yellow';
  highlight?: boolean;
}) {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        bg-white rounded-xl border p-4 shadow-sm
        ${highlight ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
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

function SummaryCardWithRank({ 
  icon, 
  label, 
  value, 
  rank,
  total,
  color,
  highlight = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  rank: number;
  total: number;
  color: 'teal' | 'cyan' | 'purple' | 'yellow';
  highlight?: boolean;
}) {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  const rankBadge = getRankBadge(rank);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        bg-white rounded-xl border p-4 shadow-sm
        ${highlight ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${rankBadge.color}`}>
          {rankBadge.icon}
          <span>#{rank}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">อันดับ {rank}/{total}</p>
    </motion.div>
  );
}

function RankingCard({ 
  label, 
  rank, 
  total,
  description,
  color = 'teal'
}: { 
  label: string; 
  rank: number; 
  total: number;
  description: string;
  color?: 'teal' | 'cyan' | 'emerald';
}) {
  const rankBadge = getRankBadge(rank);
  const percentage = total > 0 ? ((total - rank + 1) / total * 100).toFixed(0) : 0;

  const gradientColors = {
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradientColors[color]}/10 rounded-full -translate-y-10 translate-x-10`} />
      
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
      
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${rankBadge.color}`}>
            {rankBadge.icon}
            <span className="text-2xl font-bold">{rank}</span>
            <span className="text-sm">/{total}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Top</p>
          <p className={`text-lg font-bold text-${color}-600`}>{percentage}%</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${gradientColors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CommissionItem({ 
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
      ${highlight ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-gray-50'}
    `}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}