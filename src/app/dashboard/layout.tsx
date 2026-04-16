import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Main Content with responsive padding */}
      <main className="flex-1 container-responsive pt-4 sm:pt-6 lg:pt-8 pb-28 lg:pb-8">
        {children}
      </main>
      
      {/* Footer - Hidden on mobile to make room for bottom nav */}
      <footer className="hidden lg:block bg-white border-t py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} UNOGROUP. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
