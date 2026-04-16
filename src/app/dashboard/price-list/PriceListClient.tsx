'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Package, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
import { 
  PriceListData, 
  PriceListItem, 
  PriceCategory,
  PRICE_ADJUSTMENT_RATES,
  UNDER_STANDARD_RATES 
} from '@/types/price-list';

// =============================================================================
// PRICE CALCULATION UTILITIES (Preserved from legacy priceListPage.ejs)
// =============================================================================

interface AdjustedPrices {
  priceList: number;
  price15: number;
  price25: number;
  price50: number;
}

/**
 * คำนวณราคาที่ปรับแล้วตาม point adjustment
 * 
 * Logic จาก legacy:
 * - กด + (Over Standard): เพิ่มราคา ตาม PRICE_ADJUSTMENT_RATES
 * - กด - (Under Standard): ลดราคา ตาม UNDER_STANDARD_RATES (max 2.5 step)
 */
function calculateAdjustedPrices(
  basePrices: { priceList: number; price15: number; price25: number; price50: number },
  adjustment: number // ค่า adjustment (+ หรือ -)
): AdjustedPrices {
  const { priceList, price15, price25, price50 } = basePrices;
  
  // ไม่มี adjustment = คืนราคาเดิม
  if (adjustment === 0) {
    return basePrices;
  }
  
  const isUnderStandard = adjustment < 0;
  const step = Math.round(Math.abs(adjustment) * 2) / 2; // Round to nearest 0.5
  
  let adjustmentRate = 0;
  
  if (isUnderStandard) {
    // Under standard: ลดราคา (max 2.5 step = 16%)
    const clampedStep = Math.min(step, 2.5);
    adjustmentRate = -(UNDER_STANDARD_RATES[clampedStep] || 0);
  } else {
    // Over standard: เพิ่มราคา (max 10 step = 80%)
    const clampedStep = Math.min(step, 10);
    adjustmentRate = PRICE_ADJUSTMENT_RATES[clampedStep] || 0;
  }
  
  // Apply adjustment percentage
  const multiplier = 1 + (adjustmentRate / 100);
  
  return {
    priceList: Math.round(priceList * multiplier * 100) / 100,
    price15: Math.round(price15 * multiplier * 100) / 100,
    price25: Math.round(price25 * multiplier * 100) / 100,
    price50: Math.round(price50 * multiplier * 100) / 100,
  };
}

// =============================================================================
// FORMAT UTILITIES
// =============================================================================

function formatNumber(num: number): string {
  if (num === 0) return '-';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// =============================================================================
// PRICE TABLE ROW COMPONENT
// =============================================================================

interface PriceRowProps {
  item: PriceListItem;
  pointAdjustment: number;
  onPointChange: (mainName: string, delta: number) => void;
}

const PriceRow = ({ item, pointAdjustment, onPointChange }: PriceRowProps) => {
  const isMainRow = item.num === 0;  // เฉพาะ num = 0 เท่านั้น ตาม legacy
  const isUnderStandard = pointAdjustment < 0;
  const isOverStandard = pointAdjustment > 0;
  
  // Calculate adjusted prices
  const adjustedPrices = useMemo(() => {
    return calculateAdjustedPrices(
      {
        priceList: item.priceList,
        price15: item.price15,
        price25: item.price25,
        price50: item.price50,
      },
      pointAdjustment
    );
  }, [item.priceList, item.price15, item.price25, item.price50, pointAdjustment]);
  
  const currentPoint = item.point + pointAdjustment;
  
  return (
    <tr className={`
      ${isMainRow ? 'bg-cyan-100 font-medium' : 'bg-white hover:bg-gray-50'}
      transition-colors duration-150
    `}>
      {/* Hidden mainName */}
      <td className="hidden">{item.mainName}</td>
      
      {/* Product Name */}
      <td className={`
        px-3 py-2 text-sm border border-gray-200
        ${isMainRow ? 'text-cyan-800 font-semibold' : 'text-gray-700'}
      `}>
        {item.name}
      </td>
      
      {/* Name Pack */}
      <td className="px-3 py-2 text-sm text-center border border-gray-200 text-gray-600">
        {item.namePack}
      </td>
      
      {/* Point with +/- buttons (only for main rows) */}
      <td className={`
        px-2 py-2 text-center border border-gray-200
        ${isMainRow ? 'bg-teal-500' : ''}
      `}>
        {isMainRow ? (
          <div className="flex items-center justify-center gap-1">
            {/* <button
              onClick={() => onPointChange(item.mainName, -0.5)}
              className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
              aria-label="Decrease point"
            >
              <Minus size={14} />
            </button> */}
            <span className={`
              min-w-[3rem] px-2 py-0.5 rounded font-medium text-sm
              ${isUnderStandard 
                ? 'text-red-600 bg-red-100' 
                : isOverStandard 
                  ? 'text-green-600 bg-green-100'
                  : 'text-white'
              }
            `}>
              {currentPoint.toFixed(1)}
            </span>
            {/* <button
              onClick={() => onPointChange(item.mainName, 0.5)}
              className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
              aria-label="Increase point"
            >
              <Plus size={14} />
            </button> */}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      
      {/* Package */}
      <td className="px-3 py-2 text-sm text-center border border-gray-200 text-gray-600">
        {item.package}
      </td>
      
      {/* Prices */}
      <td className="px-3 py-2 text-sm text-right border border-gray-200 font-mono">
        {formatNumber(adjustedPrices.priceList)}
      </td>
      <td className="px-3 py-2 text-sm text-right border border-gray-200 font-mono">
        {formatNumber(adjustedPrices.price15)}
      </td>
      <td className="px-3 py-2 text-sm text-right border border-gray-200 font-mono">
        {formatNumber(adjustedPrices.price25)}
      </td>
      <td className="px-3 py-2 text-sm text-right border border-gray-200 font-mono">
        {formatNumber(adjustedPrices.price50)}
      </td>
      
      {/* Note */}
      <td className="px-3 py-2 text-sm text-center border border-gray-200 text-gray-500">
        {item.noteF}
      </td>
    </tr>
  );
};

// =============================================================================
// CATEGORY TABLE COMPONENT
// =============================================================================

interface CategoryTableProps {
  category: PriceCategory;
  index: number;
  searchQuery: string;
  pointAdjustments: Map<string, number>;
  onPointChange: (mainName: string, delta: number) => void;
}

const CategoryTable = ({ 
  category, 
  index, 
  searchQuery, 
  pointAdjustments,
  onPointChange 
}: CategoryTableProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return category.items;
    const query = searchQuery.toLowerCase();
    return category.items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.mainName.toLowerCase().includes(query) ||
      item.noteF.toLowerCase().includes(query) ||
      item.namePack.toLowerCase().includes(query)
    );
  }, [category.items, searchQuery]);
  
  if (filteredItems.length === 0) return null;
  
  return (
    <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Package size={18} />
          {category.catName}
          <span className="text-amber-200 text-sm">({filteredItems.length} รายการ)</span>
        </span>
        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
      
      {/* Table */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-teal-700 text-white text-sm">
                <th className="hidden">Hidden</th>
                <th className="px-3 py-2 text-left font-medium border border-teal-600">ชื่อสามัญ</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600">แพ็คกิ้ง</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600 w-32">แต้ม</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600">ขนาดบรรจุ</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600">Price</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600">Price15</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600">Price25</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600">Price50</th>
                <th className="px-3 py-2 text-center font-medium border border-teal-600">NoteF</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const adjustment = pointAdjustments.get(item.mainName) || 0;
                
                return (
                  <PriceRow
                    key={`${item.mainName}-${item.num}-${idx}`}
                    item={item}
                    pointAdjustment={adjustment}
                    onPointChange={onPointChange}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN PRICE LIST CLIENT COMPONENT
// =============================================================================

interface PriceListClientProps {
  initialData?: PriceListData;
}

export default function PriceListClient({ initialData }: PriceListClientProps) {
  const [data, setData] = useState<PriceListData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [pointAdjustments, setPointAdjustments] = useState<Map<string, number>>(new Map());
  
  // Fetch data
  const fetchData = useCallback(async (group: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/price-list?group=${group}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setPointAdjustments(new Map()); // Reset adjustments on group change
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initial fetch if no data
  useEffect(() => {
    if (!initialData) {
      fetchData(selectedGroup);
    }
  }, [initialData, fetchData, selectedGroup]);
  
  // Handle group change
  const handleGroupChange = useCallback((group: string) => {
    setSelectedGroup(group);
    fetchData(group);
  }, [fetchData]);
  
  // Handle point change
  const handlePointChange = useCallback((mainName: string, delta: number) => {
    setPointAdjustments(prev => {
      const newMap = new Map(prev);
      const currentAdjustment = newMap.get(mainName) || 0;
      const newAdjustment = currentAdjustment + delta;
      
      // Clamp to reasonable range (-2.5 to +10)
      const clamped = Math.max(-2.5, Math.min(10, newAdjustment));
      
      if (clamped === 0) {
        newMap.delete(mainName);
      } else {
        newMap.set(mainName, clamped);
      }
      
      return newMap;
    });
  }, []);
  
  // Reset all adjustments
  const handleResetAll = useCallback(() => {
    setPointAdjustments(new Map());
  }, []);
  
  // Memoized total items count
  const totalItems = useMemo(() => {
    if (!data) return 0;
    return data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  }, [data]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
          <p className="text-teal-700 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => fetchData(selectedGroup)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Price List</h1>
        <p className="text-gray-500 mt-1">
          {data?.currentMonth} {data?.currentYear} • {totalItems} รายการ
        </p>
      </div>
      
      {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Group Filter */}
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-gray-500" />
              <label className="text-gray-700 font-medium">กลุ่มสินค้า:</label>
              <select
                value={selectedGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              >
                {data?.groups.map(g => (
                  <option key={g.G} value={g.G}>กลุ่ม {g.G}</option>
                ))}
              </select>
            </div>
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาสินค้า..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
            
            {/* Reset Button */}
            {pointAdjustments.size > 0 && (
              <button
                onClick={handleResetAll}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
              >
                <span>รีเซ็ตแต้ม ({pointAdjustments.size})</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Category Tables */}
        <div className="space-y-6">
          {data?.categories.map((category, index) => (
            <CategoryTable
              key={category.catName}
              category={category}
              index={index}
              searchQuery={searchQuery}
              pointAdjustments={pointAdjustments}
              onPointChange={handlePointChange}
            />
          ))}
        </div>
        
        {/* Empty State */}
        {data?.categories.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">ไม่พบข้อมูลสินค้า</p>
          </div>
        )}
      </div>
  );
}