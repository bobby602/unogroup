"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  Home,
  Award,
  FileText,
  DollarSign,
  List,
  Settings,
  BarChart3, // เพิ่ม icon สำหรับรายงานการขาย
} from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// NAVIGATION LINKS - อัพเดทเพิ่ม Report Sale
// =============================================================================
const navLinks = [
  { href: "/dashboard", label: "หน้าหลัก", icon: Home },
  { href: "/dashboard/report-sale", label: "รายงานการขาย", icon: BarChart3 }, 
  { href: "/dashboard/points/detail", label: "ประวัติลูกค้า", icon: Award },
  { href: "/dashboard/commission/monthly", label: "ค่าคอมมิชชั่น", icon: DollarSign },
  { href: "/dashboard/price-list", label: "Price List", icon: List },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Main Navbar */}
      <nav
        className={`navbar sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-lg" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/dashboard" className="navbar-brand flex-shrink-0">
              <div className="relative w-8 h-7 sm:w-10 sm:h-9">
                <Image
                  src="/icons/logo-header2.png"
                  alt="UNOGROUP"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="hidden sm:block text-shadow text-lg lg:text-xl">
                UNOGROUP
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile/tablet portrait */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-brand-primary text-white shadow-md"
                      : "text-brand-dark hover:bg-white/50"
                  }`}
                >
                  <link.icon size={18} />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-medium text-sm sm:text-base">
                    {session?.user?.name?.[0] || "U"}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-brand-dark max-w-[120px] truncate">
                    {session?.user?.name} {session?.user?.surname}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-brand-dark transition-transform hidden sm:block ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b bg-gradient-to-br from-brand-primary to-brand-dark text-white">
                          <p className="font-medium">
                            {session?.user?.name} {session?.user?.surname}
                          </p>
                          <p className="text-sm text-white/80 mt-1">
                            {session?.user?.nameG}
                          </p>
                          {session?.user?.isAdmin && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <Link
                            href="/dashboard/settings"
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Settings size={18} />
                            <span>ตั้งค่า</span>
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <LogOut size={18} />
                            <span>ออกจากระบบ</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile/Tablet Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t shadow-lg"
            >
              <div className="px-3 py-3 space-y-1 max-h-[60vh] overflow-y-auto">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                        isActive(link.href)
                          ? "bg-brand-primary text-white shadow-md"
                          : "text-gray-700 hover:bg-brand-secondary/20 active:bg-brand-secondary/30"
                      }`}
                    >
                      <link.icon size={22} />
                      <span className="font-medium text-base">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Bottom Navigation for Mobile - Fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t shadow-lg lg:hidden safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive(link.href)
                  ? "text-brand-primary"
                  : "text-gray-500 hover:text-brand-primary"
              }`}
            >
              <link.icon size={20} strokeWidth={isActive(link.href) ? 2.5 : 2} />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-1">
                {link.label.split(" ")[0]}
              </span>
              {isActive(link.href) && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-primary"
                />
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer for bottom navigation on mobile */}
      <div className="h-16 lg:hidden" />
    </>
  );
}