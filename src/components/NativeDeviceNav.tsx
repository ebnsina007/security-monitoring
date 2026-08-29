"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  QrCode,
  AlertOctagon,
  BarChart2,
  Shield,
  Wifi,
  Battery,
  Signal,
  CheckCircle,
} from "lucide-react";
import { triggerHapticFeedback } from "@/lib/pwa";

export type DeviceStyle = "AUTO" | "IOS" | "ANDROID" | "DESKTOP";

interface NativeDeviceNavProps {
  deviceStyle: DeviceStyle;
  activeTab: "SHIFT_REPORT" | "PATROL_QR" | "EXAMS" | "REPORTS";
  onChangeTab: (tab: "SHIFT_REPORT" | "PATROL_QR" | "EXAMS" | "REPORTS") => void;
  redCount: number;
  yellowCount: number;
  greenCount: number;
}

/**
 * نوار وضعیت بومی اپل (iOS Status Bar) با ساعت، سیگنال آنتن، وای‌فای و باتری آیفون
 */
export function IOSStatusBar() {
  const [time, setTime] = useState("09:41");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const iv = setInterval(update, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center justify-between px-7 pt-3 pb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200 select-none">
      {/* ساعت گوشه بالا سمت چپ به سبک آیفون */}
      <span className="font-mono-num font-bold tracking-tight">{time}</span>

      {/* بریدگی یا سنسور جزیره پویا در وسط */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>ابن‌سینا امن</span>
      </div>

      {/* نمادهای سیستم‌عامل iOS (آنتن، 5G، باتری با نوار افقی) */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-0.5 h-3">
          <span className="w-0.5 h-1 bg-current rounded-sm" />
          <span className="w-0.5 h-1.5 bg-current rounded-sm" />
          <span className="w-0.5 h-2 bg-current rounded-sm" />
          <span className="w-0.5 h-3 bg-current rounded-sm" />
        </div>
        <span className="text-[11px] font-mono-num font-bold">5G</span>
        <div className="w-5 h-2.5 rounded-[3px] border border-current p-0.5 flex items-center">
          <div className="h-full w-4/5 bg-current rounded-[1px]" />
        </div>
      </div>
    </div>
  );
}

/**
 * نوار وضعیت بومی اندروید (Android Material Status Bar)
 */
export function AndroidStatusBar() {
  const [time, setTime] = useState("۰۸:۳۰");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    update();
    const iv = setInterval(update, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 py-2 text-[12px] font-mono-num font-semibold text-slate-700 dark:text-slate-300 border-b border-black/5 dark:border-white/5 select-none">
      <div className="flex items-center gap-1.5 font-bold">
        <span>{time}</span>
        <span className="text-[10px] text-[#0061A4] dark:text-cyan-400 font-sans">
          ابن‌سینا
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <span className="text-[10px] font-sans font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.2 rounded-md">
          5G پدافند
        </span>
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <div className="flex items-center gap-0.5">
          <span className="text-[10px]">۹۴٪</span>
          <Battery className="h-3.5 w-3.5 text-emerald-500" />
        </div>
      </div>
    </div>
  );
}

export default function NativeDeviceNav({
  deviceStyle,
  activeTab,
  onChangeTab,
  redCount,
  yellowCount,
  greenCount,
}: NativeDeviceNavProps) {
  const isIOS = deviceStyle === "IOS";

  const navItems = [
    {
      id: "SHIFT_REPORT",
      label: "گزارش شیفت",
      subLabel: "ثبت وقایع",
      icon: FileText,
      badge: null,
    },
    {
      id: "PATROL_QR",
      label: "گشت و کیوآر",
      subLabel: "HMAC & GPS",
      icon: QrCode,
      badge: redCount > 0 ? `🔴 ${redCount}` : `🟢 ${greenCount}`,
      badgeColor: redCount > 0 ? "bg-red-500 text-white" : "bg-emerald-600 text-white",
    },
    {
      id: "EXAMS",
      label: "آزمون‌ها",
      subLabel: "ارزیابی شایستگی",
      icon: AlertOctagon,
      badge: "۸۶/۱۰۰",
      badgeColor: "bg-amber-500 text-slate-950 font-mono-num font-bold",
    },
    {
      id: "REPORTS",
      label: "داشبورد و آمار",
      subLabel: "مدیریتی",
      icon: BarChart2,
      badge: null,
    },
  ];

  if (isIOS) {
    // نوار ناوبری شفاف شیشه‌ای اختصاصی اپل (Apple iOS Frosted Glass TabBar) با پشتیبانی از Safe Area
    return (
      <nav className="sticky bottom-0 z-40 w-full border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#161B26]/80 backdrop-blur-2xl shadow-xl pb-[env(safe-area-inset-bottom,12px)]">
        <div className="mx-auto flex max-w-md items-center justify-around px-3 pt-2 pb-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(40);
                  onChangeTab(item.id as any);
                }}
                className={`relative flex flex-1 flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "text-[#007AFF] dark:text-cyan-400 font-bold"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-6 w-6 transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  {item.badge && (
                    <span
                      className={`absolute -top-1 -right-2 rounded-full px-1 py-0.1 text-[9px] font-bold ${
                        item.badgeColor || "bg-red-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[10px] tracking-tight font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* خط شاخص هوم آیفون (Home Indicator) */}
        <div className="mx-auto w-32 h-1 bg-slate-400/40 dark:bg-slate-500/40 rounded-full my-1" />
      </nav>
    );
  }

  // نوار ناوبری استاندارد اندروید (Material 3 Bottom Navigation)
  return (
    <nav className="sticky bottom-0 z-40 w-full border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-lg shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                triggerHapticFeedback(50);
                onChangeTab(item.id as any);
              }}
              className={`relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 rounded-2xl ${
                isActive
                  ? "text-[#0061A4] dark:text-cyan-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {/* کپسول فعال استاندارد Material 3 */}
              <div
                className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#D1E4FF] dark:bg-cyan-950/80 text-[#001D36] dark:text-cyan-300 shadow-sm scale-105"
                    : "bg-transparent"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span
                    className={`absolute -top-1 -right-1 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                      item.badgeColor || "bg-red-500 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="mt-1 text-[11px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
