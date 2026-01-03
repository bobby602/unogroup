"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Table, LayoutGrid, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

interface MonthlySalesData {
  num: number;
  NameG: string;
  Row: number;
  sales: number;
  PB: number;
  POINTSALE: number;
  RateCom: string;
  incentive: number;
  PBI: number;
  PP: number;
  AmtPoint: number;
  ComPBI: number;
  COMSP: number;
  SumCOMSP: number;
  CUMS: number;
  PBH1: number;
  PBCal: number;
  ComPBH1: number;
}

type ViewMode = "table" | "cards";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function MonthlyPointsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<MonthlySalesData[]>([]);
  const [monthFil, setMonthFil] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    setSelectedMonth(month);
    fetchSalesData();
  }, []);

  const fetchSalesData = async (month?: string) => {
    try {
      setLoading(true);
      
      let response;
      if (month) {
        response = await fetch("/api/sales/monthly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month })
        });
      } else {
        response = await fetch("/api/sales/monthly");
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setSalesData(result.data.testData);
        setMonthFil(result.data.monthFil);
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchSalesData(selectedMonth);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-brand-primary transition-colors">
          หน้าหลัก
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ยอดขายประจำเดือน</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            รายงานยอดขายสะสมประจำเดือน
          </h1>
          <p className="text-brand-primary text-lg font-semibold mt-1">
            {monthFil || THAI_MONTHS[new Date().getMonth()]}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
            >
              {THAI_MONTHS.map((month, index) => (
                <option key={index} value={(index + 1).toString().padStart(2, "0")}>
                  {month}
                </option>
              ))}
            </select>
            <Button 
              onClick={handleSearch}
              className="bg-brand-primary hover:bg-brand-dark"
            >
              <Search className="w-4 h-4 mr-2" />
              ค้นหา
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === "table"
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === "cards"
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : viewMode === "table" ? (
        <SalesDataTable data={salesData} />
      ) : (
        <SalesDataCards data={salesData} />
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

// Table View Component
function SalesDataTable({ data }: { data: MonthlySalesData[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">ไม่พบข้อมูลในเดือนนี้</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-primary text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold">ลำดับ</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">ชื่อ</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">ยอดขาย</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">PB</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">คะแนน</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Rate Com</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Incentive</th>
              <th className="px-4 py-3 text-right text-sm font-semibold hidden lg:table-cell">PBI</th>
              <th className="px-4 py-3 text-right text-sm font-semibold hidden lg:table-cell">PP</th>
              <th className="px-4 py-3 text-right text-sm font-semibold hidden xl:table-cell">AmtPoint</th>
              <th className="px-4 py-3 text-right text-sm font-semibold hidden xl:table-cell">CUMS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-b hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-emerald-50/30" : "bg-white"
                }`}
              >
                <td className="px-4 py-3 text-sm">{item.Row}</td>
                <td className="px-4 py-3 text-sm font-medium">{item.NameG}</td>
                <td className="px-4 py-3 text-sm text-right">{formatNumber(item.sales, 2)}</td>
                <td className="px-4 py-3 text-sm text-right">{formatNumber(item.PB, 2)}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-brand-primary">
                  {formatNumber(item.POINTSALE, 2)}
                </td>
                <td className="px-4 py-3 text-sm text-right">{item.RateCom}</td>
                <td className="px-4 py-3 text-sm text-right">{formatNumber(item.incentive, 2)}</td>
                <td className="px-4 py-3 text-sm text-right hidden lg:table-cell">{formatNumber(item.PBI, 2)}</td>
                <td className="px-4 py-3 text-sm text-right hidden lg:table-cell">{formatNumber(item.PP, 2)}</td>
                <td className="px-4 py-3 text-sm text-right hidden xl:table-cell">{formatNumber(item.AmtPoint, 2)}</td>
                <td className="px-4 py-3 text-sm text-right hidden xl:table-cell">{formatNumber(item.CUMS, 2)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Cards View Component
function SalesDataCards({ data }: { data: MonthlySalesData[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">ไม่พบข้อมูลในเดือนนี้</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-white text-sm font-bold">
                {item.Row}
              </span>
              <h3 className="mt-2 font-semibold text-gray-900">{item.NameG}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">คะแนน</p>
              <p className="text-xl font-bold text-brand-primary">
                {formatNumber(item.POINTSALE, 2)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ยอดขาย</span>
              <span className="font-medium">{formatNumber(item.sales, 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PB</span>
              <span className="font-medium">{formatNumber(item.PB, 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rate Com</span>
              <span className="font-medium">{item.RateCom}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Incentive</span>
              <span className="font-medium">{formatNumber(item.incentive, 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CUMS</span>
              <span className="font-medium">{formatNumber(item.CUMS, 2)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">รวมค่าคอมมิชชั่น</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatNumber(item.SumCOMSP, 2)}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}