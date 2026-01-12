'use client';

import { useState } from 'react';
import { THAI_MONTHS, type MonthOption } from '../types/monthly-sales';

interface MonthSelectorProps {
  currentMonth: string;
  onSearch: (month: string) => void;
  loading?: boolean;
}

export function MonthSelector({ currentMonth, onSearch, loading }: MonthSelectorProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = THAI_MONTHS.find(m => m.value === selectedMonth)?.label || 'เลือกเดือน';

  const handleSelect = (value: string) => {
    setSelectedMonth(value);
    setIsOpen(false);
  };

  const handleSearch = () => {
    onSearch(selectedMonth);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
      {/* Dropdown */}
      <div className="relative w-full sm:w-64">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="
            w-full px-4 py-3
            bg-white/5 border border-white/10 
            rounded-xl text-left
            text-white/90
            hover:bg-white/10 hover:border-white/20
            transition-all duration-200
            flex items-center justify-between gap-3
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{selectedLabel}</span>
          </div>
          <svg 
            className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            <div className="
              absolute top-full left-0 right-0 mt-2
              bg-slate-800/95 backdrop-blur-xl
              border border-white/10 rounded-xl
              shadow-2xl shadow-black/50
              max-h-64 overflow-y-auto
              z-20
            ">
              {THAI_MONTHS.map((month) => (
                <button
                  key={month.value}
                  onClick={() => handleSelect(month.value)}
                  className={`
                    w-full px-4 py-3 text-left
                    hover:bg-white/10
                    transition-colors
                    flex items-center justify-between
                    ${selectedMonth === month.value ? 'bg-amber-500/20 text-amber-400' : 'text-white/80'}
                  `}
                >
                  <span>{month.label}</span>
                  {selectedMonth === month.value && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        className="
          px-6 py-3 
          bg-gradient-to-r from-amber-500 to-orange-600
          rounded-xl text-white font-semibold
          hover:from-amber-400 hover:to-orange-500
          shadow-lg shadow-amber-500/25
          transition-all duration-300
          hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          flex items-center gap-2
        "
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>กำลังค้นหา...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </>
        )}
      </button>
    </div>
  );
}