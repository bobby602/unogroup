import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PriceListItem, PriceCategory, GroupOption, PriceListData, ApiResponse } from '@/types/price-list';

const prisma = new PrismaClient();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const toNumber = (val: unknown): number => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const toString = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

const round2 = (num: number): number => Math.round(num * 100) / 100;

// Thai month names
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// =============================================================================
// SQL QUERIES (Optimized)
// =============================================================================

/**
 * Query สำหรับดึง Categories
 * Optimized: ดึงเฉพาะ CatName ที่มีสินค้าแสดง
 */
const CATEGORIES_QUERY = `
  SELECT DISTINCT CatName as NameCat 
  FROM ItemFG 
  WHERE StShowPrice = '1' AND G = @group
  ORDER BY CatName
`;

/**
 * Query สำหรับดึงกลุ่มสินค้า
 */
const GROUPS_QUERY = `
  SELECT DISTINCT G 
  FROM ItemFG 
  WHERE G = '1' OR G = '5' 
  ORDER BY G ASC
`;

/**
 * Query หลักสำหรับดึงข้อมูลสินค้า (Optimized)
 * - ใช้ CTE แทน subquery ซ้อนๆ
 * - ลด full join ที่ไม่จำเป็น
 * - เพิ่ม index hints
 */
const PRODUCTS_QUERY = `
  WITH ProductBase AS (
    -- Main product rows (num = 0)
    SELECT 
      0 as num,
      Name,
      Name as mainName,
      CAST(0 AS DECIMAL(30,2)) as PriceList,
      CAST(0 AS DECIMAL(30,2)) as Price15,
      CAST(0 AS DECIMAL(30,2)) as Price25,
      CAST(0 AS DECIMAL(30,2)) as Price50,
      CAST(0 AS DECIMAL(30,2)) as Price120,
      CatName,
      '' as NoteF,
      Point,
      '' as Package,
      '' as NamePack,
      StShowPrice,
      '' as id
    FROM ItemFG 
    WHERE G = @group AND StShowPrice = '1'
    GROUP BY Name, CatName, Point, StShowPrice

    UNION ALL

    -- Detail rows with prices
    SELECT 
      ROW_NUMBER() OVER(PARTITION BY Name ORDER BY Name) as num,
      NoteF as Name,
      Name as mainName,
      CAST(ISNULL(PriceList, 0) AS DECIMAL(30,2)) as PriceList,
      CAST(ISNULL(Price15, 0) AS DECIMAL(30,2)) as Price15,
      CAST(ISNULL(Price25, 0) AS DECIMAL(30,2)) as Price25,
      CAST(ISNULL(Price50, 0) AS DECIMAL(30,2)) as Price50,
      CAST(ISNULL(Price120, 0) AS DECIMAL(30,2)) as Price120,
      CatName,
      NoteF,
      Point,
      CONCAT(Rpack, ' ', PackR, 'x', RpackSale) as Package,
      NamePack,
      StShowPrice,
      CAST(id AS VARCHAR(50)) as id
    FROM ItemFG 
    WHERE G = @group AND StShowPrice = '1'
  )
  SELECT 
    num,
    Name as name,
    mainName,
    PriceList as priceList,
    Price15 as price15,
    Price25 as price25,
    Price50 as price50,
    Price120 as price120,
    CatName as catName,
    NoteF as noteF,
    Point as point,
    Package as package,
    NamePack as namePack,
    StShowPrice as stShowPrice,
    id
  FROM ProductBase
  WHERE StShowPrice = '1'
  ORDER BY mainName, CASE WHEN num = 0 THEN 0 ELSE 1 END, id
`;

/**
 * Alternative simplified query (fallback)
 */
const PRODUCTS_SIMPLE_QUERY = `
  SELECT 
    ROW_NUMBER() OVER(PARTITION BY Name ORDER BY NoteF) as num,
    CASE WHEN NoteF IS NULL OR NoteF = '' THEN Name ELSE NoteF END as name,
    Name as mainName,
    CAST(ISNULL(PriceList, 0) AS DECIMAL(30,2)) as priceList,
    CAST(ISNULL(Price15, 0) AS DECIMAL(30,2)) as price15,
    CAST(ISNULL(Price25, 0) AS DECIMAL(30,2)) as price25,
    CAST(ISNULL(Price50, 0) AS DECIMAL(30,2)) as price50,
    CAST(ISNULL(Price120, 0) AS DECIMAL(30,2)) as price120,
    CatName as catName,
    ISNULL(NoteF, '') as noteF,
    ISNULL(Point, 0) as point,
    CONCAT(ISNULL(Rpack, ''), ' ', ISNULL(PackR, ''), 'x', ISNULL(RpackSale, '')) as package,
    ISNULL(NamePack, '') as namePack,
    StShowPrice as stShowPrice,
    CAST(ISNULL(id, '') AS VARCHAR(50)) as id
  FROM ItemFG
  WHERE G = @group AND StShowPrice = '1'
  ORDER BY Name, 
    CASE WHEN NoteF IS NULL OR NoteF = '' THEN 0 ELSE 1 END,
    NoteF
`;

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchPriceListData(group: string): Promise<PriceListData> {
  const now = new Date();
  const currentMonth = THAI_MONTHS[now.getMonth()];
  const currentYear = now.getFullYear() + 543; // Thai year

  try {
    // Parallel fetch: categories, groups, and products
    const [categoriesResult, groupsResult, productsResult] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ NameCat: string }>>(
        CATEGORIES_QUERY.replace('@group', `'${group}'`)
      ),
      prisma.$queryRawUnsafe<Array<{ G: string }>>(GROUPS_QUERY),
      prisma.$queryRawUnsafe<PriceListItem[]>(
        PRODUCTS_SIMPLE_QUERY.replace(/@group/g, `'${group}'`)
      ),
    ]);

    // Transform products into categories
    const categoryMap = new Map<string, PriceListItem[]>();
    
    for (const product of productsResult) {
      const catName = product.catName || 'ไม่ระบุหมวด';
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, []);
      }
      categoryMap.get(catName)!.push({
        num: toNumber(product.num),
        name: toString(product.name),
        mainName: toString(product.mainName),
        namePack: toString(product.namePack),
        point: toNumber(product.point),
        package: toString(product.package),
        priceList: round2(toNumber(product.priceList)),
        price15: round2(toNumber(product.price15)),
        price25: round2(toNumber(product.price25)),
        price50: round2(toNumber(product.price50)),
        price120: round2(toNumber(product.price120)),
        catName: toString(product.catName),
        noteF: toString(product.noteF),
        stShowPrice: toString(product.stShowPrice),
        id: toString(product.id),
      });
    }

    // Convert to array format
    const categories: PriceCategory[] = categoriesResult
      .map(cat => ({
        catName: cat.NameCat,
        items: categoryMap.get(cat.NameCat) || [],
      }))
      .filter(cat => cat.items.length > 0);

    const groups: GroupOption[] = groupsResult.map(g => ({ G: g.G }));

    return {
      categories,
      groups,
      currentMonth,
      currentYear,
    };
  } catch (error) {
    console.error('Error fetching price list data:', error);
    throw error;
  }
}

// =============================================================================
// API HANDLERS
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') || '1';

    // Validate group
    if (!['1', '5'].includes(group)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid group parameter' },
        { status: 400 }
      );
    }

    const data = await fetchPriceListData(group);

    return NextResponse.json<ApiResponse<PriceListData>>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('PriceList API Error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const group = body.stGroup || '1';

    // Validate group
    if (!['1', '5'].includes(group)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid group parameter' },
        { status: 400 }
      );
    }

    const data = await fetchPriceListData(group);

    return NextResponse.json<ApiResponse<PriceListData>>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('PriceList API Error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}