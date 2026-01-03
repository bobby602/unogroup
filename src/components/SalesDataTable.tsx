'use client';

import { formatNumber } from '@/lib/utils';
import type { MonthlySalesData, SalesDisplayField, SALES_DISPLAY_FIELDS } from '@/types/monthly-sales';

interface SalesDataTableProps {
  data: MonthlySalesData[];
  displayFields?: SalesDisplayField[];
}

// Default display fields
const DEFAULT_FIELDS: SalesDisplayField[] = [
  { key: 'sales', label: 'ยอดขาย', type: 'currency' },
  { key: 'PB', label: 'ยอดขาย(PB)', type: 'currency' },
  { key: 'POINTSALE', label: 'POINT', type: 'highlight' },
  { key: 'RateCom', label: 'Rate ค่าคอม', type: 'text' },
  { key: 'incentive', label: 'Incentive', type: 'currency' },
  { key: 'AmtPoint', label: 'ค่าคอม', type: 'currency' },
  { key: 'COMSP', label: 'คอมยาพิเศษ(SP)', type: 'currency' },
  { key: 'CUMS', label: 'CUMS', type: 'highlight' },
];

export function SalesDataTable({ data, displayFields = DEFAULT_FIELDS }: SalesDataTableProps) {
  const formatValue = (value: any, type: SalesDisplayField['type']): string => {
    if (value === null || value === undefined) return '0.00';
    
    switch (type) {
      case 'currency':
      case 'number':
      case 'highlight':
        return typeof value === 'number' ? formatNumber(value) : value.toString();
      case 'text':
      default:
        return value.toString();
    }
  };

  const getValueStyle = (type: SalesDisplayField['type']): string => {
    switch (type) {
      case 'highlight':
        return 'text-emerald-400 font-bold';
      case 'currency':
        return 'text-white/90';
      default:
        return 'text-white/70';
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="
        bg-white/5 backdrop-blur-sm 
        border border-white/10 rounded-2xl 
        p-8 text-center
      ">
        <svg className="w-16 h-16 mx-auto text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-white/50 text-lg">ไม่พบข้อมูลยอดขาย</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="
            bg-white/5 backdrop-blur-sm 
            border border-white/10 rounded-2xl 
            overflow-hidden
            hover:border-white/20 transition-colors
          "
        >
          {/* Header with sales person name if available */}
          {item.NameG && (
            <div className="
              px-6 py-4 
              bg-gradient-to-r from-teal-600/20 to-cyan-600/20
              border-b border-white/10
            ">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-white font-medium">{item.NameG}</span>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="divide-y divide-white/5">
            {displayFields.map((field) => (
              <div
                key={field.key}
                className="
                  flex items-center justify-between
                  px-6 py-4
                  hover:bg-white/5 transition-colors
                "
              >
                <span className="text-white/60 font-medium">{field.label}</span>
                <span className={`text-lg tabular-nums ${getValueStyle(field.type)}`}>
                  {formatValue(item[field.key], field.type)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Alternative: Card Grid Layout
export function SalesDataCards({ data }: { data: MonthlySalesData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50">ไม่พบข้อมูลยอดขาย</p>
      </div>
    );
  }

  const item = data[0]; // Show first item

  const cards = [
    { label: 'ยอดขาย', value: item.sales, icon: '💰', color: 'from-green-500/20 to-emerald-500/20' },
    { label: 'ยอดขาย(PB)', value: item.PB, icon: '📊', color: 'from-blue-500/20 to-cyan-500/20' },
    { label: 'POINT', value: item.POINTSALE, icon: '⭐', color: 'from-amber-500/20 to-yellow-500/20' },
    { label: 'Rate ค่าคอม', value: item.RateCom, icon: '📈', color: 'from-purple-500/20 to-violet-500/20', isText: true },
    { label: 'Incentive', value: item.incentive, icon: '🎁', color: 'from-pink-500/20 to-rose-500/20' },
    { label: 'ค่าคอม', value: item.AmtPoint, icon: '💵', color: 'from-teal-500/20 to-cyan-500/20' },
    { label: 'คอมยาพิเศษ(SP)', value: item.COMSP, icon: '💊', color: 'from-red-500/20 to-orange-500/20' },
    { label: 'CUMS', value: item.CUMS, icon: '📦', color: 'from-indigo-500/20 to-blue-500/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`
            relative overflow-hidden
            bg-gradient-to-br ${card.color}
            border border-white/10
            rounded-2xl p-5
            hover:scale-[1.02] transition-transform
          `}
        >
          <div className="absolute top-3 right-3 text-2xl opacity-50">
            {card.icon}
          </div>
          <p className="text-white/60 text-sm mb-2">{card.label}</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {card.isText ? card.value : formatNumber(card.value as number)}
          </p>
        </div>
      ))}
    </div>
  );
}