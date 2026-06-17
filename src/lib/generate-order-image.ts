// Generates a PNG image of ใบสั่งขายสินค้า using Puppeteer + sharp.
// Template: pixel-perfect match to the original Thai print document.

import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// =============================================================================
// TYPES
// =============================================================================

export interface OrderDataForImage {
  orderNo: string;
  docDate: string;
  custName: string;
  sendNo: string;
  address?: string;
  custCode?: string;
  codeG?: string;
  paymentTerms?: string;
  orderedBy?: string;
  transport?: string;
  items: {
    num: number;
    itemName: string;
    package: string;
    amt: string;
    price: string;
    pb: string;
    packd: string;
  }[];
  totals: { cr: string; pb: string; cu: string; ms: string; };
  notes: string[];
}

export interface GeneratedImageResult {
  imagePath: string;
  imageUrl: string;
  thumbUrl: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function e(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// =============================================================================
// HTML TEMPLATE — Pixel-perfect Thai print document
// =============================================================================

function buildOrderHtml(data: OrderDataForImage): string {

  const itemRows = data.items.map((item, idx) => `
    <tr>
      <td class="c td-center">(${idx}) ${item.num}</td>
      <td class="c td-left">
        ${e(item.itemName)}
        ${item.packd ? `<div class="sub-line">${e(item.packd)}</div>` : ''}
      </td>
      <td class="c td-center">${e(item.package)}</td>
      <td class="c td-right">${e(item.amt)}</td>
      <td class="c td-right">${e(item.price)}</td>
      <td class="c td-right fw6">${e(item.pb)}</td>
    </tr>`).join('');

  const noteRows = data.notes.filter(n => n.trim()).map(note => `
    <tr>
      <td colspan="6" style="padding:6px 8px; font-size:12px; border:1px solid #aaa; border-top:none;">
        ${e(note)}
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
  font-size: 13px;
  color: #000;
  background: #fff;
  width: 794px;
  padding: 22px 26px 22px 26px;
}
.fw6 { font-weight: 600; }
.fw7 { font-weight: 700; }
.td-center { text-align: center; }
.td-left   { text-align: left; }
.td-right  { text-align: right; }
.sub-line  { font-size: 11px; color: #444; margin-top: 2px; }

/* ── Title row ── */
.title-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 6px;
}
.title-brand {
  font-size: 11px;
  color: #555;
  width: 72px;
  flex-shrink: 0;
}
.title-center {
  flex: 1;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
}
.title-docno {
  width: 190px;
  flex-shrink: 0;
  text-align: right;
}
.title-docno .lbl { font-size: 11px; color: #444; }
.title-docno .val { font-size: 14px; font-weight: 700; }

/* ── Info table ── */
.info-tbl {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid #000;
  margin-bottom: 0;
}
.info-tbl td {
  padding: 4px 6px;
  vertical-align: top;
  border-bottom: 1px solid #ccc;
  font-size: 13px;
}
.info-tbl tr:last-child td { border-bottom: none; }
.info-lbl {
  width: 88px;
  color: #333;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.info-val {
  font-weight: 600;
}
.div-left  { width: 50%; border-right: 1.5px solid #000 !important; }
.lbl-right { width: 118px; color: #333; font-size: 12px; white-space: nowrap; }

/* ── Items table ── */
.items-tbl {
  width: 100%;
  border-collapse: collapse;
  margin-top: 7px;
  border: 1.5px solid #000;
}
.items-tbl th {
  background: #e0e0e0;
  border: 1px solid #888;
  padding: 5px 5px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.c {
  border: 1px solid #aaa;
  padding: 5px 5px;
  font-size: 13px;
  vertical-align: top;
}

/* ── Subtotal row ── */
.sub-row td {
  border-top: 1.5px solid #000 !important;
  border-bottom: none !important;
  background: #f0f0f0;
  font-weight: 700;
  font-size: 13px;
  padding: 5px 5px;
}

/* ── Bottom section ── */
.bottom-wrap {
  display: flex;
  border: 1.5px solid #000;
  margin-top: 7px;
}
.cr-box {
  padding: 8px 10px;
  border-right: 1.5px solid #000;
  min-width: 148px;
}
.cr-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  gap: 10px;
}
.cr-key { font-size: 14px; font-weight: 700; min-width: 26px; }
.cr-val { font-size: 13px; font-weight: 600; text-align: right; font-family: 'Courier New', monospace; }
.cr-sep { border-top: 1px solid #ccc; margin: 4px 0; }

.sign-box {
  flex: 1;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.send-no-line {
  font-size: 12px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ccc;
}
.send-no-line .sn-val { font-weight: 700; font-size: 13px; margin-left: 4px; }
.sign-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.sign-item { display: flex; flex-direction: column; gap: 16px; }
.sign-lbl  { font-size: 11.5px; color: #222; }
.sign-line { border-bottom: 1px solid #777; }
</style>
</head>
<body>

<!-- ── Title ── -->
<div class="title-row">
  <div class="title-brand">UNOGROUP</div>
  <div class="title-center">ใบสั่งขายสินค้า</div>
  <div class="title-docno">
    <div class="lbl">เลขที่</div>
    <div class="val">${e(data.orderNo)}</div>
  </div>
</div>

<!-- ── Customer / order info ── -->
<table class="info-tbl">
  <tr>
    <td class="info-lbl">ขายให้</td>
    <td class="info-val div-left">${e(data.custName) || '-'}</td>
    <td class="lbl-right">วันที่</td>
    <td class="info-val">${e(data.docDate) || '-'}</td>
  </tr>
  <tr>
    <td class="info-lbl">ที่อยู่</td>
    <td class="info-val div-left">${e(data.address) || '-'}</td>
    <td class="lbl-right">เงื่อนไขการชำระเงิน</td>
    <td class="info-val">${e(data.paymentTerms) || '-'}</td>
  </tr>
  <tr>
    <td class="info-lbl">รหัสลูกค้า</td>
    <td class="info-val div-left">${e(data.custCode) || '-'}</td>
    <td class="lbl-right">สั่งโดย</td>
    <td class="info-val">${e(data.orderedBy) || '-'}</td>
  </tr>
  <tr>
    <td class="info-lbl">รหัสพนักงาน</td>
    <td class="info-val div-left">${e(data.codeG) || '-'}</td>
    <td class="lbl-right">ขนส่ง</td>
    <td class="info-val">${e(data.transport) || '-'}</td>
  </tr>
</table>

<!-- ── Items table ── -->
<table class="items-tbl">
  <thead>
    <tr>
      <th style="width:56px;">ลำดับที่</th>
      <th>รายการ</th>
      <th style="width:76px;">ขนาด</th>
      <th style="width:84px;">ปริมาณ</th>
      <th style="width:78px;">ราคาหน่วย</th>
      <th style="width:96px;">จำนวนเงิน</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    ${noteRows}
    <!-- รวม -->
    <tr class="sub-row">
      <td colspan="4" class="td-right" style="color:#555; font-size:12px; padding-right:8px;">รวม</td>
      <td class="td-right">${e(data.totals.pb)}</td>
      <td class="td-right">${e(data.totals.cr)}</td>
    </tr>
  </tbody>
</table>

<!-- ── Bottom: CR/PB/CU/MS + signatures ── -->
<div class="bottom-wrap">

  <!-- CR / PB / CU / MS -->
  <div class="cr-box">
    <div class="cr-row"><span class="cr-key">CR</span><span class="cr-val">${e(data.totals.cr)}</span></div>
    <div class="cr-row"><span class="cr-key">PB</span><span class="cr-val">${e(data.totals.pb)}</span></div>
    <div class="cr-row"><span class="cr-key">CU</span><span class="cr-val">${e(data.totals.cu)}</span></div>
    <div class="cr-sep"></div>
    <div class="cr-row"><span class="cr-key fw7">MS</span><span class="cr-val fw7">${e(data.totals.ms)}</span></div>
  </div>

  <!-- Signatures + ใบจัดส่ง -->
  <div class="sign-box">
    <div class="send-no-line">
      ใบจัดส่งเลขที่: <span class="sn-val">${e(data.sendNo) || '-'}</span>
    </div>
    <div class="sign-grid">
      <div class="sign-item">
        <span class="sign-lbl">ผู้อนุมัติ</span>
        <div class="sign-line"></div>
      </div>
      <div class="sign-item">
        <span class="sign-lbl">ผู้รับสินค้า</span>
        <div class="sign-line"></div>
      </div>
      <div class="sign-item">
        <span class="sign-lbl">ใบแจ้งหนี้เลขที่</span>
        <div class="sign-line"></div>
      </div>
      <div class="sign-item">
        <span class="sign-lbl">วันที่</span>
        <div class="sign-line"></div>
      </div>
    </div>
  </div>

</div>

</body>
</html>`;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export async function generateOrderImage(data: OrderDataForImage): Promise<GeneratedImageResult> {
  const timestamp = Date.now();
  const safeOrderNo = data.orderNo.replace(/[^a-zA-Z0-9\-_]/g, '_');
  const fileName = `${safeOrderNo}-${timestamp}.png`;
  const thumbFileName = `${safeOrderNo}-${timestamp}-thumb.png`;

  const outputDir = path.join(process.cwd(), 'public', 'po-previews');
  await fs.mkdir(outputDir, { recursive: true });

  const html = buildOrderHtml(data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 846, height: 600, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 }).catch(() => {});

    const bodyH = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: 846, height: bodyH + 40, deviceScaleFactor: 2 });

    const buf = await page.screenshot({ type: 'png', fullPage: true });
    await fs.writeFile(path.join(outputDir, fileName), buf);
    await sharp(buf).resize({ width: 400 }).png({ compressionLevel: 8 })
      .toFile(path.join(outputDir, thumbFileName));

  } finally {
    await browser.close();
  }

  const base = (process.env.BASE_URL ?? '').replace(/\/$/, '');
  return {
    imagePath: path.join(outputDir, fileName),
    imageUrl: `${base}/po-previews/${fileName}`,
    thumbUrl: `${base}/po-previews/${thumbFileName}`,
  };
}
