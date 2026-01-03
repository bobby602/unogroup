"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Award,
  TrendingUp,
  Calendar,
  Building2,
  FileText,
  Users,
  Target,
  Smartphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { DashboardSkeleton } from "./DashboardSkeleton";

interface DashboardData {
  sumPointMonth: number;
  sumPointQuarter: number;
  sumPointYear: number;
  sumPointAllMonth: number;
  sumPointQuarterUno: number;
  sumPointAllYear: number;
}

async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    }
  },
};

export function DashboardContent() {
  const { data: session } = useSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", session?.user?.codeG],
    queryFn: fetchDashboardData,
    enabled: !!session?.user?.codeG,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <div className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>;

  const stats = [
    {
      num: "1",
      title: "ยอดขายประจำเดือน",
      value: data?.sumPointMonth || 0,
      icon: Calendar,
      href: "/dashboard/points/monthly",
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      num: "2",
      title: "ยอดขายประจำไตรมาส",
      value: data?.sumPointQuarter || 0,
      icon: TrendingUp,
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      iconBg: "bg-emerald-500",
      textColor: "text-emerald-600",
    },
    {
      num: "3",
      title: "ยอดขายประจำปี",
      value: data?.sumPointYear || 0,
      icon: Award,
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      bgGradient: "from-violet-50 to-fuchsia-50",
      iconBg: "bg-violet-500",
      textColor: "text-violet-600",
    },
  ];

  const unoStats = [
    {
      num: "4",
      title: "ค่าคอมมิชชั่นประจำเดือน UNOGROUP",
      shortTitle: "ค่าคอมฯ เดือน UNOGROUP",
      value: data?.sumPointAllMonth || 0,
      icon: Building2,
    },
    {
      num: "5",
      title: "ค่าคอมมิชชั่นประจำไตรมาส UNOGROUP",
      shortTitle: "ค่าคอมฯ ไตรมาส UNOGROUP",
      value: data?.sumPointQuarterUno || 0,
      icon: Target,
    },
    {
      num: "6",
      title: "ค่าคอมมิชชั่นประจำปี UNOGROUP",
      shortTitle: "ค่าคอมฯ ปี UNOGROUP",
      value: data?.sumPointAllYear || 0,
      icon: Users,
    },
  ];

  const quickLinks = [
    {
      title: "รายละเอียดประวัติการขายลูกค้า",
      href: "/dashboard/points/detail",
    },
    {
      title: "รายงานการขาย",
      href: "/dashboard/sales",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 sm:space-y-10"
    >
      {/* Header with Logo */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 blur-3xl opacity-20 rounded-full"></div>
          <div className="relative w-44 h-32 sm:w-60 sm:h-40 md:w-72 md:h-48 mx-auto">
            <Image
              src="/icons/logo-header2.png"
              alt="UNOGROUP Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>
      </motion.div>

      {/* Personal Stats - Cards with gradient borders */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <motion.div
              key={stat.num}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.03, 
                y: -8,
                transition: { type: "spring", stiffness: 400 }
              }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <div className={`relative rounded-2xl p-[2px] bg-gradient-to-br ${stat.gradient} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-5 sm:p-6 h-full backdrop-blur-sm`}>
                  {/* Number badge */}
                  <div className={`absolute -top-3 -left-2 w-8 h-8 rounded-full bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {stat.num}
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pt-2">
                      <p className="text-sm sm:text-base font-semibold text-gray-700 mb-3">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl sm:text-4xl font-bold ${stat.textColor}`}>
                          {formatNumber(stat.value, 2)}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          Points
                        </span>
                      </div>
                    </div>
                    
                    {/* Icon */}
                    <div className={`${stat.iconBg} p-3 sm:p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                  </div>
                  
                  {/* Decorative element */}
                  <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-tl-full`}></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* UNOGROUP Stats - Modern glass cards */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-100 via-orange-50 to-amber-100 rounded-3xl opacity-50"></div>
          
          <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-white/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">UNOGROUP Commission</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {unoStats.map((stat) => (
                <motion.div
                  key={stat.num}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group"
                >
                  <div className="relative bg-white rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
                    {/* Number badge */}
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow">
                      {stat.num}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 group-hover:from-red-100 group-hover:to-orange-100 transition-colors">
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2 sm:hidden">
                      {stat.shortTitle}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2 hidden sm:block">
                      {stat.title}
                    </p>
                    
                    {/* Value */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        {formatNumber(stat.value, 2)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400">
                        Points
                      </span>
                    </div>
                    
                    {/* Bottom gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* PriceList Button - Modern style */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-[2px]">
          <div className="bg-white rounded-2xl">
            <div className="flex items-center justify-between p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium">รายการที่ 7</span>
                  <p className="text-lg sm:text-xl font-bold text-gray-800">PriceList</p>
                </div>
              </div>
              <Link href="/dashboard/price-list">
                <Button className="h-11 sm:h-12 px-6 sm:px-8 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <span>Click</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Links - Pill buttons */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
          {quickLinks.map((link, index) => (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-full border border-blue-200 hover:border-blue-300 transition-all duration-300 cursor-pointer group"
              >
                <span className="text-blue-600 font-medium text-sm sm:text-base group-hover:text-blue-700">
                  {link.title}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* PWA Install Prompt - Mobile only */}
      <motion.div variants={itemVariants} className="sm:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-teal-500 to-cyan-500 p-5 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Smartphone size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-lg">ติดตั้งแอพ</p>
              <p className="text-sm text-white/80">
                เพิ่มไปที่หน้าจอหลักเพื่อเข้าถึงได้เร็วขึ้น
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Admin User Selector */}
      {session?.user?.isAdmin && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-200 to-yellow-200 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
            <CardHeader className="pb-2 sm:pb-4 relative">
              <CardTitle className="text-base sm:text-lg text-amber-800 flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-amber-700 mb-3 sm:mb-4 text-sm sm:text-base">
                เลือกพนักงานขายเพื่อดูข้อมูล
              </p>
              <select className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all text-sm sm:text-base">
                <option value="">เลือกพนักงาน...</option>
              </select>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}