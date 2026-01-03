import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardContent } from "./DashboardContent";
import { DashboardSkeleton } from "./DashboardSkeleton";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header - Responsive */}
      <div className="text-center px-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          ยินดีต้อนรับ, {session?.user?.name} {session?.user?.surname}
        </h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          ระบบจัดการการขายและคะแนน UNOGROUP
        </p>
      </div>

      {/* Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
