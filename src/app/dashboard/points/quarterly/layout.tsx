import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "คะแนนประจำไตรมาส",
  description: "รายงานยอดขายสะสมประจำไตรมาส",
};

export default function QuarterlyPointsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}