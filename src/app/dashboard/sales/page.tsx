"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/tables/DataTable";
import { formatNumber, formatDate } from "@/lib/utils";

interface SalesData {
  custCode: string;
  custName: string;
  saleName: string;
  netAmt: number;
  pb: number;
  cums: number;
  cu: number;
  ms: number;
  [key: string]: string | number | boolean | undefined | null;
}

// Mock data for demonstration
const mockSalesData: SalesData[] = [
  { custCode: "C001", custName: "บริษัท ABC จำกัด", saleName: "สมชาย", netAmt: 150000, pb: 15000, cums: 5000, cu: 1000, ms: 500 },
  { custCode: "C002", custName: "บริษัท XYZ จำกัด", saleName: "สมหญิง", netAmt: 250000, pb: 25000, cums: 8000, cu: 2000, ms: 1000 },
  { custCode: "C003", custName: "ร้านค้าปลีก 123", saleName: "สมชาย", netAmt: 75000, pb: 7500, cums: 2500, cu: 500, ms: 250 },
  { custCode: "C004", custName: "บริษัท DEF จำกัด", saleName: "สมหญิง", netAmt: 320000, pb: 32000, cums: 10000, cu: 3000, ms: 1500 },
  { custCode: "C005", custName: "ร้าน Happy Shop", saleName: "สมชาย", netAmt: 180000, pb: 18000, cums: 6000, cu: 1200, ms: 600 },
];

export default function SalesPage() {
  const { data: session } = useSession();

  // Define columns for DataTable
  const columns: Column<SalesData>[] = [
    {
      key: "custCode",
      header: "รหัสลูกค้า",
      sortable: true,
      width: "100px",
    },
    {
      key: "custName",
      header: "ชื่อลูกค้า",
      sortable: true,
      minWidth: "200px",
      cell: (value, row) => (
        <span className="font-medium text-brand-primary hover:underline cursor-pointer">
          {value as string}
        </span>
      ),
    },
    {
      key: "saleName",
      header: "พนักงานขาย",
      sortable: true,
      hideOn: ["mobile"],
    },
    {
      key: "netAmt",
      header: "ยอดขาย",
      sortable: true,
      align: "right",
      isNumber: true,
      cell: (value) => (
        <span className="font-medium text-green-600">
          ฿{formatNumber(value as number)}
        </span>
      ),
    },
    {
      key: "pb",
      header: "PB",
      sortable: true,
      align: "right",
      isNumber: true,
      hideOn: ["mobile"],
    },
    {
      key: "cums",
      header: "CUMS",
      sortable: true,
      align: "right",
      isNumber: true,
      hideOn: ["mobile", "tablet"],
    },
  ];

  // Summary cards data
  const summaryCards = [
    {
      title: "ยอดขายรวม",
      value: mockSalesData.reduce((sum, item) => sum + item.netAmt, 0),
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      format: (v: number) => `฿${formatNumber(v)}`,
    },
    {
      title: "จำนวนลูกค้า",
      value: mockSalesData.length,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      format: (v: number) => `${v} ราย`,
    },
    {
      title: "PB รวม",
      value: mockSalesData.reduce((sum, item) => sum + item.pb, 0),
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      format: (v: number) => `฿${formatNumber(v)}`,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            รายงานการขาย
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            สรุปยอดขายประจำปี {new Date().getFullYear() + 543}
          </p>
        </div>
      </div>

      {/* Summary Cards - Horizontal scroll on mobile */}
      <div className="scroll-container sm:grid sm:grid-cols-3 gap-3 sm:gap-4 -mx-3 px-3 sm:mx-0 sm:px-0">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="min-w-[200px] sm:min-w-0 mr-3 sm:mr-0"
          >
            <Card className="overflow-hidden h-full">
              <div className={`h-1 bg-gradient-to-r ${card.color}`} />
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                    <card.icon className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">{card.title}</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {card.format(card.value)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <DataTable
          data={mockSalesData}
          columns={columns}
          title="รายละเอียดการขาย"
          searchable
          searchPlaceholder="ค้นหาลูกค้า..."
          searchKeys={["custCode", "custName", "saleName"]}
          pageSize={10}
          exportable
          onRowClick={(row) => {
            console.log("Clicked:", row);
          }}
          mobileCardRender={(row, index) => (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-brand-primary">{row.custName}</p>
                  <p className="text-xs text-gray-500">{row.custCode}</p>
                </div>
                <span className="text-green-600 font-bold">
                  ฿{formatNumber(row.netAmt)}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500">PB:</span>{" "}
                  <span className="font-medium">฿{formatNumber(row.pb)}</span>
                </div>
                <div>
                  <span className="text-gray-500">CUMS:</span>{" "}
                  <span className="font-medium">฿{formatNumber(row.cums)}</span>
                </div>
              </div>
            </div>
          )}
        />
      </motion.div>
    </div>
  );
}
