"use client";

import React from "react";
import {
  FileText,
  QrCode,
  AlertOctagon,
  BarChart2,
  Shield,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";

interface AndroidBottomNavProps {
  activeTab: "SHIFT_REPORT" | "PATROL_QR" | "EXAMS" | "REPORTS";
  onChangeTab: (tab: "SHIFT_REPORT" | "PATROL_QR" | "EXAMS" | "REPORTS") => void;
  redCount: number;
  yellowCount: number;
  greenCount: number;
}

export function AndroidStatusBar() {
  const [time, setTime] = React.useState("۰۸:۳۰");

  React.useEffect(() => {
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
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
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

export default function AndroidBottomNav({
  activeTab,
  onChangeTab,
  redCount,
  yellowCount,
  greenCount,
}: AndroidBottomNavProps) {
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
      label: "خبر فوری و آزمون‌ها",
      subLabel: "ارزیابی EQ/IQ",
      icon: AlertOctagon,
      badge: "۸۶/۱۰۰",
      badgeColor: "bg-amber-500 text-slate-950 font-mono-num font-bold",
    },
    {
      id: "REPORTS",
      label: "داشبورد و آمار",
      subLabel: "RBAC و شایستگی",
      icon: BarChart2,
      badge: null,
    },
  ];

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
              onClick={() => onChangeTab(item.id as any)}
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
                    ? "bg-[#D1E4FF] dark:bg-cyan-950/80 text-[#001D36] dark:text-cyan-300 shadow-sm"
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
