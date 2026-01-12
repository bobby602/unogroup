'use client';

// =============================================================================
// Page: Order Detail (subInfo)
// แสดงรายละเอียดของ Order จาก QSO2
// =============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Home,
  FileText,
  Package,
  Calendar,
  User,
  Hash,
  RefreshCw,
  AlertCircle,
  Truck,
  StickyNote,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface OrderItem {
  num: number;
  docDate: string;
  custName: string;
  sendNo: string;
  docNo: string;
  itemName: string;
  package: string;
  amt: string;
  price: string;
  pb: string;
  packd: string;
}

interface OrderDetailResponse {
  data: OrderItem[];
  notes: string[];
  orderNo: string;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNo = decodeURIComponent(params.orderNo as string);

  const [data, setData] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order detail
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNo)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลได้');
      }

      const result: OrderDetailResponse = await response.json();
      setData(result.data);
      setNotes(result.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderNo) {
      fetchData();
    }
  }, [orderNo]);

  // Get header info from first non-empty row
  const headerInfo = data.find((item) => item.docDate !== '') || data[0];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse">
              <div className="h-4 bg-white/20 rounded w-48 mb-4"></div>
              <div className="h-8 bg-white/20 rounded w-64"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-gray-100">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ย้อนกลับ
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-teal-100 mb-4">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <span>/</span>
            <Link
              href="/dashboard/points/detail"
              className="hover:text-white transition-colors"
            >
              รายละเอียดลูกค้า
            </Link>
            <span>/</span>
            <span className="text-white">{orderNo}</span>
          </nav>

          {/* Back button & Title */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-lg
                         bg-white/10 hover:bg-white/20 transition-colors mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <FileText className="w-7 h-7" />
                Order: {orderNo}
              </h1>
              {headerInfo && (
                <div className="flex flex-wrap gap-4 mt-2 text-teal-100">
                  {headerInfo.custName && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {headerInfo.custName}
                    </span>
                  )}
                  {headerInfo.docDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {headerInfo.docDate}
                    </span>
                  )}
                  {headerInfo.sendNo && (
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      {headerInfo.sendNo}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center justify-center w-10 h-10 rounded-lg
                         bg-white/10 hover:bg-white/20 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              title="รีเฟรช"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Order Items Table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold w-12">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">สินค้า</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Package</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">จำนวน</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">ราคา</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">PB</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants}>
                {data.map((item, index) => (
                  <motion.tr
                    key={index}
                    variants={itemVariants}
                    className={`border-b border-gray-100 hover:bg-teal-50/50 transition-colors
                      ${item.docDate === '' ? 'bg-amber-50 font-semibold' : ''}`}
                  >
                    <td className="px-4 py-3 text-center text-gray-500">
                      {item.docDate !== '' ? item.num : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {item.itemName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.package || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">
                      {item.amt || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">
                      {item.price || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-teal-600">
                      {item.pb || '-'}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </motion.div>

        {/* Notes Section */}
        {notes.length > 0 && notes.some((n) => n.trim() !== '') && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-500" />
              หมายเหตุ
            </h3>
            <div className="space-y-2">
              {notes.map((note, index) => (
                note.trim() !== '' && (
                  <p key={index} className="text-gray-600 bg-gray-50 rounded-lg p-3">
                    {note}
                  </p>
                )
              ))}
            </div>
          </motion.div>
        )}

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 
                       text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}