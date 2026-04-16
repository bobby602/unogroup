'use client';

import { 
  useState, 
  useCallback, 
  useMemo, 
  memo,
  useRef,
  useEffect 
} from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Loader2,
  Download,
  RefreshCw,
  BarChart2
} from 'lucide-react';
import { 
  PriceListData, 
  PriceListItem, 
  PriceCategory,
  PRICE_ADJUSTMENT_RATES,
  UNDER_STANDARD_RATES 
} from '@/types/price-list';
import { 
  usePriceList, 
  useDebouncedValue,
  usePriceListPersistence 
} from '@/hooks/usePriceList';
import { downloadCSV, calculateStats, PriceListStats } from '@/lib/price-list-utils';

// =============================================================================
// PRICE CALCULATION (Preserved from legacy priceListPage.ejs)
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
 * 
 * @param basePrices - ราคาฐาน
 * @param adjustment - ค่า adjustment (+ หรือ -)
 */
const calculateAdjustedPrices = (
  basePrices: AdjustedPrices,
  adjustment: number
): AdjustedPrices => {
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
  
  const multiplier = 1 + (adjustmentRate / 100);
  
  return {
    priceList: Math.round(priceList * multiplier * 100) / 100,
    price15: Math.round(price15 * multiplier * 100) / 100,
    price25: Math.round(price25 * multiplier * 100) / 100,
    price50: Math.round(price50 * multiplier * 100) / 100,
  };
};

// =============================================================================
// UTILITIES
// =============================================================================

const formatNumber = (num: number): string => {
  if (num === 0) return '-';
  return num.toLocaleString('th-TH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// =============================================================================
// MEMOIZED COMPONENTS
// =============================================================================

// Price Cell Component (memoized)
const PriceCell = memo(({ 
  value, 
  adjusted,
  className = '' 
}: { 
  value: number; 
  adjusted: boolean;
  className?: string;
}) => (
  <td className={`
    px-3 py-2 text-sm text-right border border-gray-200 font-mono
    ${adjusted ? 'text-blue-600 bg-blue-50' : ''}
    ${className}
  `}>
    {formatNumber(value)}
  </td>
));
PriceCell.displayName = 'PriceCell';

// Point Control Component (memoized)
const PointControl = memo(({
  point,
  adjustment,
  onIncrease,
  onDecrease,
}: {
  point: number;
  adjustment: number;
  onIncrease: () => void;
  onDecrease: () => void;
}) => {
  const currentPoint = point + adjustment;
  const isUnderStandard = adjustment < 0;
  const isOverStandard = adjustment > 0;
  
  return (
    <div className="flex items-center justify-center gap-1">
      {/* <button
        onClick={onDecrease}
        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-red-200 rounded text-gray-700 transition-colors active:scale-95"
        aria-label="Decrease point"
      >
        <Minus size={14} />
      </button> */}
      <span className={`
        min-w-[3.5rem] px-2 py-1 rounded font-semibold text-sm text-center
        ${isUnderStandard 
          ? 'text-red-600 bg-red-100' 
          : isOverStandard 
            ? 'text-green-600 bg-green-100'
            : 'text-white bg-teal-600'
        }
      `}>
        {currentPoint.toFixed(1)}
      </span>
      {/* <button
        onClick={onIncrease}
        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-green-200 rounded text-gray-700 transition-colors active:scale-95"
        aria-label="Increase point"
      >
        <Plus size={14} />
      </button> */}
    </div>
  );
});
PointControl.displayName = 'PointControl';

// Price Row Component (memoized)
interface PriceRowProps {
  item: PriceListItem;
  adjustment: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

const PriceRow = memo(({ 
  item, 
  adjustment, 
  onIncrease,
  onDecrease 
}: PriceRowProps) => {
  const isMainRow = item.num === 0;
  
  const adjustedPrices = useMemo(() => {
    return calculateAdjustedPrices(
      {
        priceList: item.priceList,
        price15: item.price15,
        price25: item.price25,
        price50: item.price50,
      },
      adjustment
    );
  }, [item.priceList, item.price15, item.price25, item.price50, adjustment]);
  
  const hasAdjustment = adjustment !== 0;
  
  return (
    <tr className={`
      ${isMainRow 
        ? 'bg-gradient-to-r from-cyan-100 to-cyan-50 font-medium' 
        : 'bg-white hover:bg-gray-50'
      }
      transition-colors duration-100
    `}>
      <td className={`
        px-3 py-2 text-sm border border-gray-200
        ${isMainRow ? 'text-teal-800 font-semibold' : 'text-gray-700'}
      `}>
        {item.name}
      </td>
      
      <td className="px-3 py-2 text-sm text-center border border-gray-200 text-gray-600">
        {item.namePack}
      </td>
      
      <td className={`
        px-2 py-2 text-center border border-gray-200
        ${isMainRow ? 'bg-teal-600' : ''}
      `}>
        {isMainRow ? (
          <PointControl
            point={item.point}
            adjustment={adjustment}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
          />
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      
      <td className="px-3 py-2 text-sm text-center border border-gray-200 text-gray-600">
        {item.package}
      </td>
      
      <PriceCell value={adjustedPrices.priceList} adjusted={hasAdjustment} />
      <PriceCell value={adjustedPrices.price15} adjusted={hasAdjustment} />
      <PriceCell value={adjustedPrices.price25} adjusted={hasAdjustment} />
      <PriceCell value={adjustedPrices.price50} adjusted={hasAdjustment} />
      
      <td className="px-3 py-2 text-sm text-center border border-gray-200 text-gray-500 max-w-[200px] truncate">
        {item.noteF}
      </td>
    </tr>
  );
});
PriceRow.displayName = 'PriceRow';

// =============================================================================
// CATEGORY TABLE COMPONENT
// =============================================================================

interface CategoryTableProps {
  category: PriceCategory;
  pointAdjustments: Map<string, number>;
  onPointChange: (mainName: string, delta: number) => void;
  defaultCollapsed?: boolean;
}

const CategoryTable = memo(({ 
  category, 
  pointAdjustments,
  onPointChange,
  defaultCollapsed = false,
}: CategoryTableProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Get adjustment for each product
  const getAdjustment = useCallback((mainName: string) => {
    return pointAdjustments.get(mainName) || 0;
  }, [pointAdjustments]);
  
  if (category.items.length === 0) return null;
  
  return (
    <div className="mb-4 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Category Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-white font-semibold hover:from-amber-600 hover:to-amber-500 transition-all"
      >
        <span className="flex items-center gap-2">
          <Package size={18} />
          <span>{category.catName}</span>
          <span className="text-amber-100 text-sm font-normal">
            ({category.items.length} รายการ)
          </span>
        </span>
        {isCollapsed ? (
          <ChevronDown size={20} className="transition-transform" />
        ) : (
          <ChevronUp size={20} className="transition-transform" />
        )}
      </button>
      
      {/* Table */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-teal-700 to-teal-600 text-white text-sm">
                <th className="px-3 py-3 text-left font-medium border border-teal-600 w-[20%]">
                  ชื่อสามัญ
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[10%]">
                  แพ็คกิ้ง
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[12%]">
                  แต้ม
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[10%]">
                  ขนาดบรรจุ
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[10%]">
                  Price
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[10%]">
                  Price15
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[10%]">
                  Price25
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[10%]">
                  Price50
                </th>
                <th className="px-3 py-3 text-center font-medium border border-teal-600 w-[8%]">
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {category.items.map((item, idx) => {
                const adjustment = getAdjustment(item.mainName);
                
                return (
                  <PriceRow
                    key={`${item.mainName}-${item.num}-${idx}`}
                    item={item}
                    adjustment={adjustment}
                    onIncrease={() => onPointChange(item.mainName, 0.5)}
                    onDecrease={() => onPointChange(item.mainName, -0.5)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
CategoryTable.displayName = 'CategoryTable';

// =============================================================================
// STATS CARD COMPONENT
// =============================================================================

interface StatsCardProps {
  stats: PriceListStats | null;
  adjustmentCount: number;
}

const StatsCard = memo(({ stats, adjustmentCount }: StatsCardProps) => {
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wide">สินค้าทั้งหมด</div>
        <div className="text-xl font-bold text-teal-600">{stats.totalItems.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wide">หมวดหมู่</div>
        <div className="text-xl font-bold text-amber-600">{stats.totalCategories}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wide">แต้มเฉลี่ย</div>
        <div className="text-xl font-bold text-purple-600">{stats.avgPoint.toFixed(1)}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wide">ปรับแต้มแล้ว</div>
        <div className="text-xl font-bold text-blue-600">{adjustmentCount}</div>
      </div>
    </div>
  );
});
StatsCard.displayName = 'StatsCard';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PriceListOptimized() {
  const {
    data,
    loading,
    error,
    selectedGroup,
    searchQuery,
    pointAdjustments,
    filteredCategories,
    stats,
    fetchData,
    setSelectedGroup,
    setSearchQuery,
    adjustPoint,
    resetPointAdjustments,
    resetAll,
  } = usePriceList('1');
  
  // Debounced search
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  
  // Persist adjustments to localStorage
  usePriceListPersistence(
    pointAdjustments,
    (adjustments) => {
      // Note: This is read-only, we don't update from localStorage
    },
    { enabled: false } // Disable for now
  );
  
  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle export
  const handleExport = useCallback(() => {
    if (data) {
      downloadCSV(data, `price-list-group-${selectedGroup}.csv`);
    }
  }, [data, selectedGroup]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/80 backdrop-blur rounded-2xl shadow-lg">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
          <p className="text-teal-700 font-medium">กำลังโหลดข้อมูลราคา...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => fetchData(selectedGroup)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Price List
        </h1>
        <p className="text-gray-500 mt-1">
          {data?.currentMonth} {data?.currentYear} • {stats?.totalItems.toLocaleString() || 0} รายการ
        </p>
      </div>
      
      {/* Stats */}
      <StatsCard stats={stats} adjustmentCount={pointAdjustments.size} />
        
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Left: Group Filter */}
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-gray-400 flex-shrink-0" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-gray-50"
              >
                {data?.groups.map(g => (
                  <option key={g.G} value={g.G}>กลุ่ม {g.G}</option>
                ))}
              </select>
            </div>
            
            {/* Center: Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาสินค้า... (⌘K)"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-gray-50"
              />
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {pointAdjustments.size > 0 && (
                <button
                  onClick={resetPointAdjustments}
                  className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  <RefreshCw size={14} />
                  รีเซ็ต ({pointAdjustments.size})
                </button>
              )}
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Category Tables */}
        <div className="space-y-4">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <CategoryTable
                key={category.catName}
                category={category}
                pointAdjustments={pointAdjustments}
                onPointChange={adjustPoint}
                defaultCollapsed={index > 2} // Collapse categories after 3rd
              />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery 
                  ? `ไม่พบสินค้าที่ตรงกับ "${searchQuery}"` 
                  : 'ไม่พบข้อมูลสินค้า'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  ล้างการค้นหา
                </button>
              )}
            </div>
          )}
        </div>
      </div>
  );
}