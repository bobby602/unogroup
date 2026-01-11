import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ค่าคอมมิชชั่นประจำปี",
  description: "รายงานค่าคอมมิชชั่นประจำปี รวม Commission Top up",
};

export default function YearlyCommissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}