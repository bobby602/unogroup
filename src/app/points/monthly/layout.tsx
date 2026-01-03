import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "คะแนนประจำเดือน",
  description: "รายงานยอดขายสะสมประจำเดือน",
};

export default function MonthlyPointsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}