'use client';

// =============================================================================
// Page: กรอกใบสั่งขายสินค้า → พิมพ์ส่ง LINE
// Flow: กรอกข้อมูล → บันทึก (preview) → ส่ง LINE
// =============================================================================

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Send, Loader2,
  CheckCircle, AlertCircle, ArrowLeft,
  MessageCircle, FileText, FlaskConical,
} from 'lucide-react';

const IS_DEV = process.env.NODE_ENV === 'development';

// ── Test data ──────────────────────────────────────────────────────────────
const TEST_DATA = {
  custName:     'บจก.วีโนว่า ครื้อพไซเอนซ์',
  address:      '45/58 หมู่ที่ 5 ต.ลำพยา อ.เมือง จ.นครปฐม 73000',
  custCode:     'A1-นจุ-28',
  codeG:        'A1',
  docDate:      '05/06/2569',
  paymentTerms: 'เครดิต 30 วัน',
  orderedBy:    'คุณจิกรพล',
  transport:    'รถถนนส่งบริษัท',
  sendNo:       'IMUA-S6900195',
  notes:        'หมายเหตุ ส่งสินค้าที่ไคดิง ห้องทรงค้า (ก่อนจัดส่งสินค้าแล้วส่งหน้า 1 วัน)\n1.เนื่อง 275/10 = 27.50 บาท',
  pb:           '540000',
  cu:           '0',
  ms:           '59850',
  items: [
    { id: '1', itemName: 'IMTM 40% SP - สีขาว ซองพร้อยด์สเปลี่อยละลายน้ำ (เช็คคนอก 100กรัม)', packageSize: '100กรัมx1', quantity: '30000', unit: 'ซอง', unitPrice: '27.50' },
    { id: '2', itemName: 'IMTM 20% SP - สีเหลือง',  packageSize: '50กรัมx2',  quantity: '5000',  unit: 'กล่อง', unitPrice: '15.00' },
  ],
};

// =============================================================================
// TYPES
// =============================================================================

interface LineItem {
  id: string;
  itemName: string;
  packageSize: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

type Step = 'form' | 'sending' | 'success' | 'error';

const PAYMENT_TERMS = [
  'เงินสด',
  'เครดิต 7 วัน',
  'เครดิต 15 วัน',
  'เครดิต 30 วัน',
  'เครดิต 45 วัน',
  'เครดิต 60 วัน',
];

const TRANSPORT_OPTIONS = [
  'รถถนนส่งบริษัท',
  'รถรับเอง',
  'ขนส่งเอกชน',
  'Kerry Express',
  'Flash Express',
  'ไปรษณีย์ไทย',
];

// =============================================================================
// HELPERS
// =============================================================================

function newItem(): LineItem {
  return { id: crypto.randomUUID(), itemName: '', packageSize: '', quantity: '', unit: 'ซอง', unitPrice: '' };
}

function calcLineTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  return qty * price;
}

function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayThai(): string {
  return new Date().toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-3">
      <span className="text-teal-500">{icon}</span>
      {children}
    </h2>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = `w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800
  focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400
  placeholder-gray-300 transition-colors bg-white`;

const selectCls = `w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800
  focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400
  transition-colors bg-white`;

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function LineSendPage() {
  const { data: session } = useSession();

  // ── Header fields ──
  const [custName, setCustName]       = useState('');
  const [address, setAddress]         = useState('');
  const [custCode, setCustCode]       = useState('');
  const [codeG, setCodeG]             = useState(session?.user?.codeG ?? '');
  const [docDate, setDocDate]         = useState(todayThai());
  const [paymentTerms, setPaymentTerms] = useState('เครดิต 30 วัน');
  const [orderedBy, setOrderedBy]     = useState('');
  const [transport, setTransport]     = useState('รถถนนส่งบริษัท');
  const [sendNo, setSendNo]           = useState('');

  // ── Line items ──
  const [items, setItems] = useState<LineItem[]>([newItem()]);

  // ── Totals (CR auto-calculated) ──
  const [pb, setPb] = useState('');
  const [cu, setCu] = useState('');
  const [ms, setMs] = useState('');

  // ── Notes ──
  const [notes, setNotes] = useState('');

  // ── UI state ──
  const [step, setStep]           = useState<Step>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [successDocNo, setSuccessDocNo] = useState('');

  // ── Calculated CR ──
  const cr = items.reduce((sum, it) => sum + calcLineTotal(it), 0);

  // ── Dev: fill test data ──
  const fillTestData = useCallback(() => {
    setCustName(TEST_DATA.custName);
    setAddress(TEST_DATA.address);
    setCustCode(TEST_DATA.custCode);
    setCodeG(TEST_DATA.codeG);
    setDocDate(TEST_DATA.docDate);
    setPaymentTerms(TEST_DATA.paymentTerms);
    setOrderedBy(TEST_DATA.orderedBy);
    setTransport(TEST_DATA.transport);
    setSendNo(TEST_DATA.sendNo);
    setNotes(TEST_DATA.notes);
    setPb(TEST_DATA.pb);
    setCu(TEST_DATA.cu);
    setMs(TEST_DATA.ms);
    setItems(TEST_DATA.items.map(it => ({ ...it, id: crypto.randomUUID() })));
  }, []);

  // ── Items handlers ──
  const addItem = useCallback(() => setItems(prev => [...prev, newItem()]), []);

  const removeItem = useCallback((id: string) =>
    setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev), []);

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it)), []);

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;
    if (items.every(it => !it.itemName.trim())) return;

    setStep('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/orders/create-and-send-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custName, address, custCode, codeG, docDate,
          paymentTerms, orderedBy, transport, sendNo,
          items: items.map(it => ({
            itemName: it.itemName,
            packageSize: it.packageSize,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: it.unitPrice,
          })),
          pb, cu, ms, notes,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด');

      setSuccessDocNo(data.docNo ?? '');
      setStep('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      setStep('error');
    }
  };

  const handleReset = () => {
    setStep('form');
    setCustName(''); setAddress(''); setCustCode('');
    setCodeG(session?.user?.codeG ?? '');
    setDocDate(todayThai()); setPaymentTerms('เครดิต 30 วัน');
    setOrderedBy(''); setTransport('รถถนนส่งบริษัท'); setSendNo('');
    setItems([newItem()]); setPb(''); setCu(''); setMs(''); setNotes('');
    setErrorMessage(''); setSuccessDocNo('');
  };

  // ==========================================================================
  // SUCCESS
  // ==========================================================================
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">ส่ง LINE สำเร็จ!</h2>
            <p className="text-gray-500 text-sm mt-1">
              ภาพใบสั่งขายสินค้าถูกส่งไปยัง LINE Group เรียบร้อยแล้ว
            </p>
            {successDocNo && (
              <p className="mt-2 text-xs text-gray-400 font-mono">DocNo: {successDocNo}</p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
          >
            สร้างใบสั่งใหม่
          </button>
        </motion.div>
      </div>
    );
  }

  // ==========================================================================
  // ERROR
  // ==========================================================================
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-9 h-9 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">เกิดข้อผิดพลาด</h2>
            <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={() => setStep('form')}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> กลับแก้ไขข้อมูล
          </button>
        </motion.div>
      </div>
    );
  }

  // ==========================================================================
  // SENDING (loading overlay)
  // ==========================================================================
  if (step === 'sending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">กำลังสร้างภาพเอกสารและส่ง LINE…</p>
          <p className="text-gray-400 text-sm">ใช้เวลาประมาณ 5–10 วินาที</p>
        </motion.div>
      </div>
    );
  }

  // ==========================================================================
  // FORM
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">ใบสั่งขายสินค้า</h1>
                <p className="text-teal-100 text-sm">กรอกข้อมูล → ส่งภาพไปยัง LINE Group อัตโนมัติ</p>
              </div>
            </div>

            {/* Dev-only: Fill test data button */}
            {IS_DEV && (
              <button
                type="button"
                onClick={fillTestData}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                           bg-yellow-400 hover:bg-yellow-300 text-yellow-900
                           text-sm font-semibold transition-colors flex-shrink-0"
                title="[Dev only] กรอกข้อมูลทดสอบ"
              >
                <FlaskConical className="w-4 h-4" />
                Fill Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Section 1: ข้อมูลลูกค้าและเอกสาร ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<FileText className="w-4 h-4" />}>ข้อมูลลูกค้าและเอกสาร</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-3">
              <Field label="ขายให้ (ชื่อลูกค้า)" required>
                <input
                  type="text" value={custName} onChange={e => setCustName(e.target.value)}
                  placeholder="เช่น บจก.วีโนว่า ครื้อพไซเอนซ์"
                  required className={inputCls}
                />
              </Field>
              <Field label="ที่อยู่">
                <textarea
                  value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="ที่อยู่จัดส่ง"
                  rows={2} className={`${inputCls} resize-none`}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="รหัสลูกค้า">
                  <input
                    type="text" value={custCode} onChange={e => setCustCode(e.target.value)}
                    placeholder="เช่น A1-นจุ-28" className={inputCls}
                  />
                </Field>
                <Field label="รหัสพนักงาน">
                  <input
                    type="text" value={codeG} onChange={e => setCodeG(e.target.value)}
                    placeholder="เช่น A1" className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-3">
              <Field label="วันที่">
                <input
                  type="text" value={docDate} onChange={e => setDocDate(e.target.value)}
                  placeholder="dd/mm/yyyy" className={inputCls}
                />
              </Field>
              <Field label="เงื่อนไขการชำระเงิน">
                <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={selectCls}>
                  {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="สั่งโดย">
                <input
                  type="text" value={orderedBy} onChange={e => setOrderedBy(e.target.value)}
                  placeholder="เช่น คุณจิกรพล" className={inputCls}
                />
              </Field>
              <Field label="ขนส่ง">
                <select value={transport} onChange={e => setTransport(e.target.value)} className={selectCls}>
                  {TRANSPORT_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="ใบจัดส่งเลขที่">
                <input
                  type="text" value={sendNo} onChange={e => setSendNo(e.target.value)}
                  placeholder="เช่น IMUA-S6900195" className={inputCls}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Section 2: รายการสินค้า ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle icon={<FileText className="w-4 h-4" />}>รายการสินค้า</SectionTitle>
            <button
              type="button" onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
            </button>
          </div>

          {/* Table header — desktop */}
          <div className="hidden sm:grid grid-cols-[28px_1fr_90px_100px_70px_90px_32px] gap-2 mb-2 px-1">
            {['#', 'ชื่อสินค้า / รายการ', 'ขนาด', 'ปริมาณ', 'หน่วย', 'ราคาหน่วย', ''].map((h, i) => (
              <span key={i} className="text-xs font-medium text-gray-400">{h}</span>
            ))}
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[28px_1fr_90px_100px_70px_90px_32px] gap-2 items-center">
                    <span className="text-xs text-gray-400 text-center">{idx + 1}</span>
                    <input
                      type="text" value={item.itemName}
                      onChange={e => updateItem(item.id, 'itemName', e.target.value)}
                      placeholder="ชื่อสินค้า" required className={inputCls}
                    />
                    <input
                      type="text" value={item.packageSize}
                      onChange={e => updateItem(item.id, 'packageSize', e.target.value)}
                      placeholder="100กรัม" className={inputCls}
                    />
                    <input
                      type="number" value={item.quantity} min="0"
                      onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                      placeholder="0" className={inputCls}
                    />
                    <input
                      type="text" value={item.unit}
                      onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      placeholder="ซอง" className={inputCls}
                    />
                    <input
                      type="number" value={item.unitPrice} min="0" step="0.01"
                      onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                      placeholder="0.00" className={inputCls}
                    />
                    <button
                      type="button" onClick={() => removeItem(item.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg
                                 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile card */}
                  <div className="sm:hidden bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-400">รายการที่ {idx + 1}</span>
                      <button type="button" onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input type="text" value={item.itemName}
                      onChange={e => updateItem(item.id, 'itemName', e.target.value)}
                      placeholder="ชื่อสินค้า / รายการ" required className={inputCls} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={item.packageSize}
                        onChange={e => updateItem(item.id, 'packageSize', e.target.value)}
                        placeholder="ขนาด" className={inputCls} />
                      <input type="text" value={item.unit}
                        onChange={e => updateItem(item.id, 'unit', e.target.value)}
                        placeholder="หน่วย" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={item.quantity} min="0"
                        onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                        placeholder="ปริมาณ" className={inputCls} />
                      <input type="number" value={item.unitPrice} min="0" step="0.01"
                        onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="ราคาหน่วย" className={inputCls} />
                    </div>
                    <div className="text-right text-xs text-teal-600 font-semibold">
                      จำนวนเงิน: {formatMoney(calcLineTotal(item))} บาท
                    </div>
                  </div>

                  {/* Desktop: line total */}
                  <div className="hidden sm:flex justify-end pr-10 mt-0.5">
                    <span className="text-xs text-teal-600 font-semibold">
                      จำนวนเงิน: {formatMoney(calcLineTotal(item))} บาท
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Section 3: หมายเหตุ ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<FileText className="w-4 h-4" />}>หมายเหตุ</SectionTitle>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="หมายเหตุ ส่งสินค้าที่ไคดิง ห้องทรงค้า…"
            rows={3} className={`${inputCls} resize-none`}
          />
        </div>

        {/* ── Section 4: สรุปยอด ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<FileText className="w-4 h-4" />}>สรุปยอด</SectionTitle>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* CR — auto-calculated */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                CR (ยอดรวม) — คำนวณอัตโนมัติ
              </label>
              <div className="w-full px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-mono font-semibold text-sm">
                {formatMoney(cr)}
              </div>
            </div>

            <Field label="PB">
              <input
                type="number" value={pb} onChange={e => setPb(e.target.value)}
                placeholder="0.00" min="0" step="0.01" className={inputCls}
              />
            </Field>
            <Field label="CU">
              <input
                type="number" value={cu} onChange={e => setCu(e.target.value)}
                placeholder="0.00" min="0" step="0.01" className={inputCls}
              />
            </Field>
            <Field label="MS">
              <input
                type="number" value={ms} onChange={e => setMs(e.target.value)}
                placeholder="0.00" min="0" step="0.01" className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* ── Submit Button ── */}
        <div className="flex justify-end pb-6">
          <button
            type="submit"
            disabled={!custName.trim() || items.every(it => !it.itemName.trim())}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-base
                       transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#06C755' }}
          >
            <Send className="w-5 h-5" />
            พิมพ์ / ส่งภาพใน LINE
          </button>
        </div>

      </form>
    </div>
  );
}
