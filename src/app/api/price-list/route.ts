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
// SQL QUERIES - EXACT COPY FROM LEGACY priceList.js
// =============================================================================

/**
 * Query สำหรับดึง Categories
 */
const CATEGORIES_QUERY = `
  SELECT CatName as NameCat 
  FROM ItemFG 
  GROUP BY CatName
`;

/**
 * Query สำหรับดึงกลุ่มสินค้า
 */
const GROUPS_QUERY = `
  SELECT G 
  FROM ItemFG 
  WHERE G = '1' OR G = '5' 
  GROUP BY G 
  ORDER BY G ASC
`;

/**
 * Query หลักสำหรับดึงข้อมูลสินค้า - EXACT COPY FROM LEGACY priceList.js
 * รองรับทั้ง NameUno, NameSIM, NameZU
 */
const buildProductsQuery = (group: string) => `
  SELECT * 
  FROM (
    SELECT 0 as num, Name, Name as mainName, 0 as PriceList, 0 as Price15, 0 as Price25, 0 as Price50, 0 as Price120, CatName, '' as NoteF, Point, '' as Package, '' as NamePack, 1 as StShowPrice, '' as id
    FROM ItemFG 
    WHERE G = '${group}' AND StShowPrice = '1'
    GROUP BY Name, CatName, Point

    UNION ALL

    SELECT tmp.* 
    FROM (
      SELECT ROW_NUMBER() OVER(PARTITION BY tmp.mainName ORDER BY tmp.rowReal) as num, 
             tmp.Name, 
             tmp.mainName, 
             CAST(ISNULL(tmp.Pricelist, 0) AS DECIMAL(30, 2)) as Pricelist, 
             CAST(ISNULL(tmp.Price15, 0) AS DECIMAL(30, 2)) as Price15, 
             CAST(ISNULL(tmp.Price25, 0) AS DECIMAL(30, 2)) as Price25, 
             CAST(ISNULL(tmp.Price50, 0) AS DECIMAL(30, 2)) as Price50, 
             CAST(ISNULL(tmp.Price120, 0) AS DECIMAL(30, 2)) as Price120, 
             tmp.CatName, 
             tmp.NoteF, 
             tmp.Point, 
             tmp.Package, 
             tmp.NamePack, 
             tmp.StShowPrice, 
             tmp.id
      FROM (
        SELECT ROW_NUMBER() OVER(PARTITION BY tmp.mainName ORDER BY tmp.row) as num1, 
               CASE WHEN tmp.row IS NULL THEN tmp2.row ELSE tmp.row END as rowReal, 
               tmp.Name,
               CASE WHEN tmp.mainName IS NULL THEN tmp2.mainName ELSE tmp.mainName END as mainName, 
               tmp2.row, 
               tmp2.mainName as mainTmp2, 
               Pricelist, 
               Price15, 
               Price25, 
               Price50, 
               Price120,
               CASE WHEN tmp2.CatName IS NULL THEN tmp.CatName ELSE tmp2.CatName END as CatName, 
               NoteF,
               CASE WHEN tmp2.Point IS NULL THEN tmp.Point ELSE tmp2.Point END as Point, 
               Package, 
               NamePack,
               CASE WHEN tmp2.StShowPrice IS NULL THEN tmp.StShowPrice ELSE tmp2.StShowPrice END as StShowPrice,
               tmp2.id
        FROM (
          SELECT tmp.* 
          FROM (
            SELECT 1 as row, NameUno as Name, Name as mainName, CatName, Point, StShowPrice
            FROM ItemFG
            WHERE G = '${group}'
            GROUP BY NameUno, Name, CatName, Point, StShowPrice
            
            UNION ALL
            
            SELECT 2 as row, NameSIM as Name, Name as mainName, CatName, Point, StShowPrice
            FROM ItemFG
            WHERE G = '${group}'
            GROUP BY NameSIM, Name, CatName, Point, StShowPrice
            
            UNION ALL
            
            SELECT 3 as row, NameZU as Name, Name as mainName, CatName, Point, StShowPrice
            FROM ItemFG
            WHERE G = '${group}'
            GROUP BY NameZU, Name, CatName, Point, StShowPrice
          ) Tmp
          WHERE tmp.Name <> '' AND tmp.StShowPrice = '1'
        ) tmp
        FULL JOIN (
          SELECT ROW_NUMBER() OVER(PARTITION BY Name ORDER BY Name) as row, 
                 NoteF as Name, 
                 Name as mainName, 
                 SUM(ISNULL(Pricelist, 0)) as Pricelist, 
                 SUM(ISNULL(Price15, 0)) as Price15, 
                 SUM(ISNULL(Price25, 0)) as Price25, 
                 SUM(ISNULL(Price50, 0)) as Price50, 
                 SUM(ISNULL(Price120, 0)) as Price120, 
                 CatName, 
                 NoteF, 
                 Point, 
                 CONCAT(Rpack, ' ', PackR, 'x', RpackSale) as Package, 
                 NamePack, 
                 StShowPrice, 
                 id
          FROM ItemFG
          WHERE G = '${group}'
          GROUP BY NoteF, Name, CatName, Point, Rpack, PackR, RpackSale, NamePack, StShowPrice, id
        ) tmp2 ON tmp2.mainName = tmp.mainName AND tmp2.row = tmp.row
      ) tmp
    ) tmp
    FULL JOIN (
      SELECT ROW_NUMBER() OVER(PARTITION BY Name ORDER BY Name) as num, 
             Name as mainName, 
             NoteF, 
             CONCAT(Rpack, ' ', PackR, 'x', RpackSale) as Package, 
             CatName, 
             id
      FROM ItemFG
      WHERE G = '${group}'
      GROUP BY NoteF, Name, Rpack, PackR, RpackSale, CatName, id
    ) tmp2 ON tmp2.mainName = tmp.mainName AND tmp2.num = tmp.num
  ) Temp
  WHERE Temp.StShowPrice = '1' 
  ORDER BY Temp.mainName, CASE WHEN num = 0 THEN 0 ELSE 1 END, id
`;

// =============================================================================
// DATA FETCHING
// =============================================================================

interface RawProductResult {
  num: number;
  Name: string;
  mainName: string;
  PriceList: number;
  Price15: number;
  Price25: number;
  Price50: number;
  Price120: number;
  CatName: string;
  NoteF: string;
  Point: number;
  Package: string;
  NamePack: string;
  StShowPrice: string;
  id: string;
}

async function fetchPriceListData(group: string): Promise<PriceListData> {
  const now = new Date();
  const currentMonth = THAI_MONTHS[now.getMonth()];
  const currentYear = now.getFullYear() + 543; // Thai year

  try {
    // Build the exact query from legacy
    const productsQuery = buildProductsQuery(group);
    
    // Parallel fetch: categories, groups, and products
    const [categoriesResult, groupsResult, productsResult] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ NameCat: string }>>(CATEGORIES_QUERY),
      prisma.$queryRawUnsafe<Array<{ G: string }>>(GROUPS_QUERY),
      prisma.$queryRawUnsafe<RawProductResult[]>(productsQuery),
    ]);

    // Transform products into categories
    const categoryMap = new Map<string, PriceListItem[]>();
    
    for (const product of productsResult) {
      const catName = toString(product.CatName) || 'ไม่ระบุหมวด';
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, []);
      }
      categoryMap.get(catName)!.push({
        num: toNumber(product.num),
        name: toString(product.Name),
        mainName: toString(product.mainName),
        namePack: toString(product.NamePack),
        point: toNumber(product.Point),
        package: toString(product.Package),
        priceList: round2(toNumber(product.PriceList)),
        price15: round2(toNumber(product.Price15)),
        price25: round2(toNumber(product.Price25)),
        price50: round2(toNumber(product.Price50)),
        price120: round2(toNumber(product.Price120)),
        catName: catName,
        noteF: toString(product.NoteF),
        stShowPrice: toString(product.StShowPrice),
        id: toString(product.id),
      });
    }

    // Convert to array format - keep all categories from the query result
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