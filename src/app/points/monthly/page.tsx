'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MonthSelector } from '@/components/MonthSelector';
import { SalesDataTable, SalesDataCards } from '@/components/SalesDataTable';
import type { MonthlySalesData, MonthlySalesResponse } from '@/types/monthly-sales';

type ViewMode = 'table' | 'cards';

export default function MonthlySalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<MonthlySalesData[]>([]);
  const [monthFil, setMonthFil] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    // Set current month
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    setCurrentMonth(month);
    
    // Fetch initial data
    fetchSalesData();
  }, []);

  const fetchSalesData = async (month?: string) => {
    try {
      setLoading(true);
      
      let response;
      if (month) {
        // POST with selected month
        response = await fetch('/api/sales/monthly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month })
        });
      } else {
        // GET current month
        response = await fetch('/api/sales/monthly');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setSalesData(result.data.testData);
        setMonthFil(result.data.monthFil);
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (month: string) => {
    setCurrentMonth(month);
    fetchSalesData(month);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <main className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
                หน้าหลัก
              </Link>
            </li>
            <li className="text-white/30">/</li>
            <li className="text-white/90">คะแนนประจำเดือน</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                รายงานยอดขายสะสมประจำเดือน
              </h1>
              <p className="text-teal-400 text-lg font-semibold">{monthFil}</p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${viewMode === 'table' 
                    ? 'bg-teal-500 text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Table
                </span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${viewMode === 'cards' 
                    ? 'bg-teal-500 text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cards
                </span>
              </button>
            </div>
          </div>

          {/* Month Selector */}
          <MonthSelector
            currentMonth={currentMonth}
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <SalesDataTable data={salesData} />
        ) : (
          <SalesDataCards data={salesData} />
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="
              px-6 py-3
              bg-white/5 border border-white/10
              rounded-xl text-white/70
              hover:bg-white/10 hover:text-white
              transition-all
              flex items-center gap-2
            "
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับหน้าหลัก
          </button>
        </div>
      </main>
    </div>
  );
}