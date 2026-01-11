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
  RefreshCw
} from 'lucide-react';
import { 
  PriceListItem, 
  PriceCategory,
  GroupOption,
  PRICE_ADJUSTMENT_RATES,
  UNDER_STANDARD_RATES 
} from '@/types/price-list';
import { 
  usePriceList, 
  useDebouncedValue,
  usePriceListPersistence 
} from '../../hooks/usePriceList';
import { downloadCSV } from '../../lib/price-list-utils';

// =============================================================================
// PRICE CALCULATION (Preserved from legacy)
// =============================================================================

interface AdjustedPrices {
  priceList: number;
  price15: number;
  price25: number;
  price50: number;
}

const calculateAdjustedPrices = (
  basePrices: AdjustedPrices,
  pointDiff: number,
  isUnderStandard: boolean
): AdjustedPrices => {
  const { priceList, price15, price25, price50 } = basePrices;
  const step = Math.round(Math.abs(pointDiff) * 2) / 2;
  
  let adjustmentRate = 0;
  
  if (isUnderStandard) {
    adjustmentRate = -(UNDER_STANDARD_RATES[step] || 0);
  } else {
    const rates = PRICE_ADJUSTMENT_RATES[step];
    adjustmentRate = rates ? rates.over : 0;
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
  isUnderStandard,
  onIncrease,
  onDecrease,
}: {
  point: number;
  adjustment: number;
  isUnderStandard: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}) => {
  const currentPoint = point + adjustment;
  
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={onDecrease}
        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-red-200 rounded text-gray-700 transition-colors active:scale-95"
        aria-label="Decrease point"
      >
        <Minus size={14} />
      </button>
      <span className={`
        min-w-[3.5rem] px-2 py-1 rounded font-semibold text-sm text-center
        ${adjustment !== 0 
          ? isUnderStandard 
            ? 'text-red-600 bg-red-100' 
            : 'text-green-600 bg-green-100'
          : 'text-white bg-teal-600'
        }
      `}>
        {currentPoint.toFixed(1)}
      </span>
      <button
        onClick={onIncrease}
        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-green-200 rounded text-gray-700 transition-colors active:scale-95"
        aria-label="Increase point"
      >
        <Plus size={14} />
      </button>
    </div>
  );
});
PointControl.displayName = 'PointControl';

// Price Row Component (memoized)
interface PriceRowProps {
  item: PriceListItem;
  adjustment: number;
  isUnderStandard: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

const PriceRow = memo(({ 
  item, 
  adjustment, 
  isUnderStandard,
  onIncrease,
  onDecrease 
}: PriceRowProps) => {
  const isMainRow = item.num === 0;
  
  const adjustedPrices = useMemo(() => {
    if (adjustment === 0) {
      return {
        priceList: item.priceList,
        price15: item.price15,
        price25: item.price25,
        price50: item.price50,
      };
    }
    return calculateAdjustedPrices(
      {
        priceList: item.priceList,
        price15: item.price15,
        price25: item.price25,
        price50: item.price50,
      },
      adjustment,
      isUnderStandard
    );
  }, [item, adjustment, isUnderStandard]);
  
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
            isUnderStandard={isUnderStandard}
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
  searchQuery?: string;
}

const CategoryTable = memo(({ 
  category, 
  pointAdjustments, 
  onPointChange,
  defaultCollapsed = false,
  searchQuery = ''
}: CategoryTableProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
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
                const isUnderStandard = adjustment < 0;
                
                return (
                  <PriceRow
                    key={`${item.mainName}-${item.num}-${idx}`}
                    item={item}
                    adjustment={adjustment}
                    isUnderStandard={isUnderStandard}
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
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatsCard = memo(({ label, value, icon, color }: StatsCardProps) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="opacity-80">
        {icon}
      </div>
    </div>
  </div>
));
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
  } = usePriceList('1');
  
  // Debounced search (for display purposes)
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  
  // Persist adjustments to localStorage
  usePriceListPersistence(
    pointAdjustments,
    (_adjustments: Map<string, number>) => {
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
    
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
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
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => fetchData(selectedGroup)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} />
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/icons/LOGOUNO.png" 
            alt="UNOGROUP Logo" 
            className="mx-auto h-24 w-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-teal-800">Price List</h1>
          <p className="text-teal-600">
            {data?.currentMonth} {data?.currentYear} • {stats?.totalItems || 0} รายการ
          </p>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              label="สินค้าทั้งหมด" 
              value={stats.totalItems} 
              icon={<Package size={24} />}
              color="from-teal-500 to-teal-600"
            />
            <StatsCard 
              label="หมวดหมู่" 
              value={stats.totalCategories} 
              icon={<Filter size={24} />}
              color="from-amber-500 to-amber-600"
            />
            <StatsCard 
              label="ราคาเฉลี่ย" 
              value={formatNumber(stats.avgPrice)} 
              icon={<span className="text-2xl">฿</span>}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard 
              label="ราคาสูงสุด" 
              value={formatNumber(stats.maxPrice)} 
              icon={<span className="text-2xl">฿</span>}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Group Filter */}
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-gray-500" />
              <label className="text-gray-700 font-medium">กลุ่มสินค้า:</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              >
                {data?.groups.map((g: GroupOption) => (
                  <option key={g.G} value={g.G}>กลุ่ม {g.G}</option>
                ))}
              </select>
            </div>
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ค้นหาสินค้า... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={resetPointAdjustments}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                รีเซ็ต
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category: PriceCategory, index: number) => (
            <CategoryTable
              key={category.catName}
              category={category}
              pointAdjustments={pointAdjustments}
              onPointChange={adjustPoint}
              defaultCollapsed={index > 2}
              searchQuery={debouncedSearchQuery}
            />
          ))}
        </div>
        
        {/* Empty state */}
        {filteredCategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
          </div>
        )}
      </div>
    </div>
  );
}