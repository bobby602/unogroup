import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'รายงานการขาย',
  description: 'รายงานการขายประจำปี - สรุปยอดขายลูกค้าทั้งหมด',
};

export default function ReportSaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}