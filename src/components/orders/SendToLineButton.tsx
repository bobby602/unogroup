'use client';

import React, { useState } from 'react';
import { MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  orderNo: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function SendToLineButton({ orderNo }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSend = async () => {
    if (status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderNo)}/send-line`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'ไม่สามารถส่ง LINE ได้');
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 4000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setStatus('error');
      setErrorMessage(msg);
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 6000);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        ส่งแล้ว!
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="max-w-[200px] truncate">{errorMessage}</span>
        </div>
        <button
          onClick={handleSend}
          className="text-xs text-red-500 underline hover:text-red-700 transition-colors"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={status === 'loading'}
      style={{ backgroundColor: status === 'loading' ? '#05a548' : '#06C755' }}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium
                 transition-colors duration-200 hover:opacity-90 active:opacity-80
                 disabled:cursor-not-allowed shadow-sm"
      title="ส่งภาพใบสั่งขายสินค้าไปยัง LINE"
    >
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {status === 'loading' ? 'กำลังส่ง...' : 'ส่งภาพใน LINE'}
    </button>
  );
}
