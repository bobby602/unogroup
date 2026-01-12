import { Metadata } from 'next';
import PriceListOptimized from './PriceListOptimized';

export const metadata: Metadata = {
  title: 'Price List | UNOGROUP',
  description: 'รายการราคาสินค้า UNOGROUP',
};

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default function PriceListPage() {
  return <PriceListOptimized />;
}