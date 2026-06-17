// POST /api/orders/[orderNo]/send-line
// Generates a PNG image of the Sales Order and pushes it to a LINE Group.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { lineClient } from '@/lib/line-client';
import { generateOrderImage } from '@/lib/generate-order-image';
import type { OrderDataForImage } from '@/lib/generate-order-image';

// =============================================================================
// TYPES
// =============================================================================

interface RouteParams {
  params: Promise<{ orderNo: string }>;
}

interface QSO2Row {
  DocDate: string | null;
  CustName: string | null;
  SendNo: string | null;
  itemName1: string | null;
  Package: string | null;
  amt: string | null;
  Price: string | null;
  PB: string | null;
  packd: string | null;
  AmtT1: string | null;  // CR total
  AmtT2: string | null;  // PB total
  AmtT3: string | null;  // CU total
  AMTTT: string | null;  // MS total
  Note: string | null;
  Note2: string | null;
  Note3: string | null;
  Note4: string | null;
  Note5: string | null;
  Note6: string | null;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. Auth check — same pattern as existing order GET route
    const session = await getServerSession(authOptions);
    if (!session?.user?.codeG) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // 2. Get and decode orderNo
    const { orderNo: rawOrderNo } = await params;
    const orderNo = decodeURIComponent(rawOrderNo ?? '');
    if (!orderNo) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'กรุณาระบุเลขที่ Order' },
        { status: 400 }
      );
    }

    // 3. Validate LINE env config before hitting DB
    const groupId = process.env.LINE_GROUP_ID;
    if (!groupId || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Config Error', message: 'LINE ยังไม่ได้ตั้งค่า กรุณาตรวจสอบ .env (LINE_CHANNEL_ACCESS_TOKEN, LINE_GROUP_ID)' },
        { status: 500 }
      );
    }

    // 4. Fetch full order data — extended query includes totals and notes
    const rows = await db.$queryRaw<QSO2Row[]>`
      SELECT
        FORMAT(DocDate, 'dd/MM/yyyy') as DocDate,
        CustName,
        SendNo,
        itemName1,
        Package,
        CAST(CONVERT(VARCHAR, CAST(qtypackd AS MONEY), 1) AS VARCHAR) as amt,
        CAST(Price AS VARCHAR) as Price,
        CONCAT(AmtCT1, 'x', AmtCT2, 'x', AmtCT3, ' ',
               CAST(CONVERT(VARCHAR, CAST(AMTCTT AS MONEY), 1) AS VARCHAR)) as PB,
        packd,
        CAST(CONVERT(VARCHAR, CAST(AmtT1 AS MONEY), 1) AS VARCHAR) as AmtT1,
        CAST(CONVERT(VARCHAR, CAST(AmtT2 AS MONEY), 1) AS VARCHAR) as AmtT2,
        CAST(CONVERT(VARCHAR, CAST(AmtT3 AS MONEY), 1) AS VARCHAR) as AmtT3,
        CAST(CONVERT(VARCHAR, CAST(AMTTT AS MONEY), 1) AS VARCHAR) as AMTTT,
        Note, Note2, Note3, Note4, Note5, Note6
      FROM QSO2
      WHERE DocNo = ${orderNo}
      ORDER BY itemName1, DocDate DESC
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Not Found', message: 'ไม่พบข้อมูล Order นี้' },
        { status: 404 }
      );
    }

    // 5. Shape data for image generator
    const firstRow = rows[0];

    const orderData: OrderDataForImage = {
      orderNo,
      docDate: firstRow.DocDate || '',
      custName: firstRow.CustName || '',
      sendNo: firstRow.SendNo || '',
      items: rows
        .filter((row) => row.DocDate) // only actual item rows (not total rows)
        .map((row, idx) => ({
          num: idx + 1,
          itemName: row.itemName1 || '',
          package: row.Package || '',
          amt: row.amt || '',
          price: row.Price || '',
          pb: row.PB || '',
          packd: row.packd || '',
        })),
      totals: {
        cr: firstRow.AmtT1 || '0.00',
        pb: firstRow.AmtT2 || '0.00',
        cu: firstRow.AmtT3 || '0.00',
        ms: firstRow.AMTTT || '0.00',
      },
      notes: [
        [firstRow.Note, firstRow.Note2, firstRow.Note3].filter(Boolean).join(''),
        [firstRow.Note4, firstRow.Note5, firstRow.Note6].filter(Boolean).join(''),
      ].filter((s) => s.trim() !== ''),
    };

    // 6. Generate PNG image
    let imageResult;
    try {
      imageResult = await generateOrderImage(orderData);
    } catch (imgErr) {
      console.error('[send-line] Image generation failed:', imgErr);
      return NextResponse.json(
        { error: 'Image Generation Failed', message: 'ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่' },
        { status: 500 }
      );
    }

    // 7. Push to LINE Group: image + brief text context
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
            text: `ใบสั่งขายสินค้า: ${orderNo}\nลูกค้า: ${orderData.custName}\nวันที่: ${orderData.docDate}`,
          },
        ],
      });
    } catch (lineErr) {
      console.error('[send-line] LINE push failed:', lineErr);
      return NextResponse.json(
        {
          error: 'LINE Send Failed',
          message: 'สร้างรูปสำเร็จ แต่ไม่สามารถส่ง LINE ได้ กรุณาตรวจสอบ Token และ Group ID',
          imageUrl: imageResult.imageUrl,
        },
        { status: 500 }
      );
    }

    // 8. Fire-and-forget cleanup of files older than 24h
    const cleanupToken = process.env.CLEANUP_SECRET_TOKEN;
    const baseUrl = process.env.BASE_URL?.replace(/\/$/, '');
    if (cleanupToken && baseUrl) {
      fetch(`${baseUrl}/api/cleanup/po-previews?token=${cleanupToken}`, {
        method: 'DELETE',
      }).catch((e) => console.warn('[send-line] Cleanup trigger failed:', e));
    }

    return NextResponse.json({
      success: true,
      message: 'ส่ง LINE สำเร็จ',
      imageUrl: imageResult.imageUrl,
    });

  } catch (error) {
    console.error('[send-line] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
