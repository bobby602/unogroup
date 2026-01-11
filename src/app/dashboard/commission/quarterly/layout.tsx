import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ค่าคอมมิชชั่นประจำไตรมาส",
  description: "รายงานค่าคอมมิชชั่นประจำไตรมาส",
};

export default function QuarterlyCommissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}