import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ค่าคอมมิชชั่นประจำเดือน",
  description: "รายงานค่าคอมมิชชั่นประจำเดือน",
};

export default function MonthlyCommissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}