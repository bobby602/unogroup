// POST /api/orders/create-and-send-line
// รับข้อมูล form, generate DocNo, สร้างภาพเอกสาร, ส่ง LINE — ไม่บันทึก DB

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { lineClient } from '@/lib/line-client';
import { generateOrderImage } from '@/lib/generate-order-image';
import type { OrderDataForImage } from '@/lib/generate-order-image';

// =============================================================================
// TYPES
// =============================================================================

export interface FormItem {
  itemName: string;
  packageSize: string;  // ขนาด
  quantity: string;     // ปริมาณ (as string to allow formatting)
  unit: string;         // หน่วย เช่น ซอง กล่อง
  unitPrice: string;    // ราคาหน่วย
}

export interface CreateOrderBody {
  // Header
  custName: string;
  address: string;
  custCode: string;
  codeG: string;
  docDate: string;
  paymentTerms: string;
  orderedBy: string;
  transport: string;
  sendNo: string;         // ใบจัดส่งเลขที่
  // Items
  items: FormItem[];
  // Totals (CR auto-calculated; PB, CU, MS manual)
  pb: string;
  cu: string;
  ms: string;
  // Notes
  notes: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatMoney(num: number): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateDocNo(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `FORM-${yy}${mm}${dd}${hh}${mi}${ss}`;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // 2. Validate LINE config
    const groupId = process.env.LINE_GROUP_ID;
    if (!groupId || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Config Error', message: 'LINE ยังไม่ได้ตั้งค่า กรุณาตรวจสอบ .env' },
        { status: 500 }
      );
    }

    // 3. Parse body
    let body: CreateOrderBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Bad Request', message: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // 4. Validate required fields
    if (!body.custName?.trim()) {
      return NextResponse.json(
        { error: 'Validation', message: 'กรุณากรอกชื่อลูกค้า (ขายให้)' },
        { status: 400 }
      );
    }
    if (!body.items?.length) {
      return NextResponse.json(
        { error: 'Validation', message: 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ' },
        { status: 400 }
      );
    }

    // 5. Generate DocNo
    const docNo = generateDocNo();

    // 6. Calculate CR from items
    let cr = 0;
    const mappedItems: OrderDataForImage['items'] = body.items.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const lineTotal = qty * price;
      cr += lineTotal;

      return {
        num: idx + 1,
        itemName: item.itemName,
        package: item.packageSize,
        amt: `${Number(qty).toLocaleString('en-US')} ${item.unit}`.trim(),
        price: formatMoney(price),
        pb: formatMoney(lineTotal),   // จำนวนเงิน
        packd: '',
      };
    });

    // 7. Build OrderDataForImage
    const orderData: OrderDataForImage = {
      orderNo: docNo,
      docDate: body.docDate || new Date().toLocaleDateString('th-TH'),
      custName: body.custName,
      sendNo: body.sendNo,
      address: body.address,
      custCode: body.custCode,
      codeG: body.codeG,
      paymentTerms: body.paymentTerms,
      orderedBy: body.orderedBy,
      transport: body.transport,
      items: mappedItems,
      totals: {
        cr: formatMoney(cr),
        pb: body.pb ? formatMoney(parseFloat(body.pb)) : '0.00',
        cu: body.cu ? formatMoney(parseFloat(body.cu)) : '0.00',
        ms: body.ms ? formatMoney(parseFloat(body.ms)) : '0.00',
      },
      notes: body.notes?.trim() ? [body.notes.trim()] : [],
    };

    // 8. Generate PNG
    let imageResult;
    try {
      imageResult = await generateOrderImage(orderData);
    } catch (imgErr) {
      console.error('[create-and-send-line] Image generation failed:', imgErr);
      return NextResponse.json(
        { error: 'Image Generation Failed', message: 'ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่' },
        { status: 500 }
      );
    }

    // 9. Push to LINE Group
    try {
      await lineClient.pushMessage({
        to: groupId,
        messages: [
          {
            type: 'image',
            originalContentUrl: imageResult.imageUrl,
            previewImageUrl: imageResult.thumbUrl,
          },
          {
            type: 'text',
            text: `ใบสั่งขายสินค้า: ${docNo}\nลูกค้า: ${body.custName}\nวันที่: ${body.docDate}\nยอดรวม: ${formatMoney(cr)} บาท`,
          },
        ],
      });
    } catch (lineErr) {
      console.error('[create-and-send-line] LINE push failed:', lineErr);
      return NextResponse.json(
        {
          error: 'LINE Send Failed',
          message: 'สร้างรูปสำเร็จ แต่ไม่สามารถส่ง LINE ได้',
          imageUrl: imageResult.imageUrl,
        },
        { status: 500 }
      );
    }

    // 10. Fire-and-forget cleanup
    const cleanupToken = process.env.CLEANUP_SECRET_TOKEN;
    const baseUrl = process.env.BASE_URL?.replace(/\/$/, '');
    if (cleanupToken && baseUrl) {
      fetch(`${baseUrl}/api/cleanup/po-previews?token=${cleanupToken}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'ส่ง LINE สำเร็จ',
      docNo,
      imageUrl: imageResult.imageUrl,
    });

  } catch (error) {
    console.error('[create-and-send-line] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
