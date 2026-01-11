import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "คะแนนประจำปี",
  description: "รายงานยอดขายสะสมประจำปี",
};

export default function YearlyPointsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}