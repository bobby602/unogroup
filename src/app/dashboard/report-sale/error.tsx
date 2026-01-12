'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Report Sale Page Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          เกิดข้อผิดพลาด
        </h2>

        <p className="text-gray-500 mb-6">
          ไม่สามารถโหลดรายงานการขายได้ กรุณาลองใหม่อีกครั้ง
        </p>

        {error.message && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
            <p className="text-xs text-gray-400 mb-1">รายละเอียดข้อผิดพลาด:</p>
            <p className="text-sm text-gray-600 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-2.5 
                       bg-teal-600 text-white rounded-lg hover:bg-teal-700 
                       transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </button>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-2.5 
                       border border-gray-200 text-gray-700 rounded-lg 
                       hover:bg-gray-50 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}