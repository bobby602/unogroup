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
  Award,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

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
  NameG: string;
  CodeG: string;
  quarter: number;
  quarterName: string;
  year: number;
  salesGroup: string;
  quarterlyPB: number;
  baselineTargetY: number;
  baselineTargetQ: number;
  achievementPct: number;
  RateCom: number;
  achievementLevel: string;
  quarterlyCommission: number;
  CUMS: number;
  monthlyBreakdown: MonthlyBreakdown[];
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
  return Math.ceil(month / 3);
};

const getCurrentYear = (): number => new Date().getFullYear();

const getAchievementBadge = (level: string): { color: string; bgColor: string; icon: string } => {
  if (level.includes('ตำนาน')) return { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '👑' };
  if (level.includes('แนวหน้า')) return { color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: '⭐' };
  if (level.includes('มาตรฐาน')) return { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '🎯' };
  if (level.includes('ใกล้เป้า')) return { color: 'text-green-700', bgColor: 'bg-green-100', icon: '📈' };
  if (level.includes('ต่ำกว่า')) return { color: 'text-orange-700', bgColor: 'bg-orange-100', icon: '⚠️' };
  return { color: 'text-red-700', bgColor: 'bg-red-100', icon: '❌' };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function QuarterlyCommissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<QuarterlyCommissionData | null>(null);
  const [quarterFil, setQuarterFil] = useState<number>(getCurrentQuarter());
  const [quarterName, setQuarterName] = useState("");
  const [yearFil, setYearFil] = useState<number>(getCurrentYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async (quarter?: number, year?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const targetQuarter = quarter ?? selectedQuarter;
      const targetYear = year ?? selectedYear;
      
      const response = await fetch("/api/commission/quarterly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quarter: targetQuarter,
          year: targetYear
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setReport(result.data.report);
        setQuarterFil(result.data.quarterFil);
        setQuarterName(result.data.quarterName);
        setYearFil(result.data.yearFil);
        setSelectedQuarter(targetQuarter);
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
    fetchCommissionData(selectedQuarter, selectedYear);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-teal-600 transition-colors">
          หน้าหลัก
        </Link>
        <span>/</span>
        <Link href="/dashboard/commission" className="hover:text-teal-600 transition-colors">
          ค่าคอมมิชชั่น
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประจำไตรมาส</span>
      </nav>

      {/* Header with Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-teal-600" />
            ค่าคอมมิชชั่นประจำไตรมาส
          </h1>
          <p className="text-teal-600 text-lg font-semibold mt-1">
            {quarterName} ปี {yearFil} (พ.ศ. {yearFil + 543})
          </p>
        </div>

        {/* Quarter/Year Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            {AVAILABLE_YEARS.map((year) => (
              <option key={year} value={year}>
                {year} (พ.ศ. {year + 543})
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
// COMMISSION REPORT COMPONENT
// =============================================================================

function CommissionReport({ report }: { report: QuarterlyCommissionData }) {
  const badge = getAchievementBadge(report.achievementLevel);

  return (
    <div className="space-y-6">
      {/* Header Card - User Info & Target */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl text-white p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        {/* Sales Group Badge */}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-medium">{report.salesGroup === 'A' ? 'กลุ่ม A' : 'กลุ่ม B'}</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-teal-200 text-sm">ฝ่ายขาย</p>
            <h2 className="text-2xl font-bold">{report.NameG}</h2>
            <p className="text-teal-100 text-sm mt-1">{report.quarterName} ปี {report.year}</p>
            <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${badge.bgColor} ${badge.color}`}>
              <span>{badge.icon}</span>
              <span className="text-sm font-medium">{report.achievementLevel}</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-teal-200 text-sm">Baseline Target (ปี)</p>
            <p className="text-3xl font-bold">{formatNumber(report.baselineTargetY, 0)}</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Section - ตามรูป */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-teal-600" />
          สรุปประจำ{report.quarterName}
        </h3>
        
        <div className="space-y-3">
          {/* ยอดขายรวม(PB)ไตรมาส */}
          <SummaryRow 
            label={`ยอดขายรวม(PB)${report.quarterName}`}
            value={formatNumber(report.quarterlyPB, 2)} 
          />
          
          {/* Baseline Target (Q) */}
          <SummaryRow 
            label="Baseline Target (Q)" 
            value={formatNumber(report.baselineTargetQ, 2)} 
          />
          
          {/* Achievement (%) - Orange */}
          <SummaryRow 
            label="Achievement (%)" 
            value={`${report.achievementPct.toFixed(2)}`} 
            highlight="orange"
          />
          
          {/* ระดับความสำเร็จ */}
          <SummaryRow 
            label="ระดับความสำเร็จ" 
            value={report.achievementLevel} 
          />
          
          {/* Commission ไตรมาส */}
          <SummaryRow 
            label={`Commission ${report.quarterName}`}
            value={formatNumber(report.quarterlyCommission, 2)} 
          />
          
          {/* CUMS - Orange */}
          <SummaryRow 
            label="CUMS" 
            value={formatNumber(report.CUMS, 2)} 
            highlight="orange"
          />
        </div>
      </motion.div>

      {/* Monthly Breakdown - ยอดขาย */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          ยอดขายแต่ละเดือน
        </h3>
        
        <div className="space-y-3">
          {report.monthlyBreakdown.map((month) => (
            <SummaryRow 
              key={month.month}
              label={`ยอดขายรวม(PB)${month.monthName}`}
              value={formatNumber(month.PB, 2)} 
            />
          ))}
        </div>
      </motion.div>

      {/* Monthly Breakdown - Commission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" />
          Commission แต่ละเดือน
        </h3>
        
        <div className="space-y-3">
          {report.monthlyBreakdown.map((month) => (
            <div key={month.month} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <span className="text-gray-600 text-sm">Commission {month.monthName}</span>
                <p className="text-xs text-gray-400">Rate: {month.rateCom}%</p>
              </div>
              <span className="font-bold text-teal-600">{formatNumber(month.commission, 2)}</span>
            </div>
          ))}
          
          {/* Total Commission */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-teal-100 border-2 border-teal-300 mt-4">
            <span className="font-semibold text-teal-700">รวม Commission ไตรมาส</span>
            <span className="font-bold text-teal-700 text-xl">{formatNumber(report.quarterlyCommission, 2)}</span>
          </div>
        </div>
      </motion.div>

      {/* Rate Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200"
      >
        <div className="flex items-center gap-2 text-teal-700">
          <Calculator className="w-5 h-5" />
          <span className="font-medium">หมายเหตุการคำนวณ:</span>
        </div>
        <ul className="mt-2 text-sm text-teal-600 space-y-1 ml-7">
          <li>• Achievement คำนวณจาก ยอดขาย(PB) / Baseline Target (Q) × 100</li>
          <li>• Rate Commission แต่ละเดือนคำนวณแยก ตามยอดขายเดือนนั้น</li>
          <li>• H1: เพดาน 1.0%, H2: เพดาน 0.5%, MP: ตาม Rate</li>
        </ul>
      </motion.div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface SummaryRowProps {
  label: string;
  value: string;
  highlight?: 'orange' | 'green';
}

function SummaryRow({ label, value, highlight }: SummaryRowProps) {
  const bgColor = highlight === 'orange' 
    ? 'bg-amber-100' 
    : highlight === 'green'
    ? 'bg-teal-100'
    : 'bg-gray-50';
  
  const textColor = highlight === 'orange'
    ? 'text-amber-700 font-bold'
    : highlight === 'green'
    ? 'text-teal-700 font-bold'
    : 'text-gray-900 font-semibold';

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${bgColor}`}>
      <span className="text-gray-600 text-sm">{label}</span>
      <span className={textColor}>{value}</span>
    </div>
  );
}