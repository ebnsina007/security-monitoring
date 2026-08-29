"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  Moon,
  Sun,
  Radio,
  Lock,
  KeyRound,
  Smartphone,
  Monitor,
  Maximize2,
  Sparkles,
  Download,
  Apple,
  Cpu,
} from "lucide-react";
import { getOfflineScans } from "@/lib/offline-queue";
import { promptPwaInstall, triggerHapticFeedback } from "@/lib/pwa";
import { DeviceStyle } from "./NativeDeviceNav";

interface CommandHeaderProps {
  deviceStyle: DeviceStyle;
  onChangeDeviceStyle: (style: DeviceStyle) => void;
  activeRole: string;
  onChangeRole: (newRole: string) => void;
  patrolCounts: { red: number; yellow: number; green: number; total: number };
  activeTab: "SHIFT_REPORT" | "PATROL_QR" | "EXAMS" | "REPORTS";
  onChangeTab: (
    tab: "SHIFT_REPORT" | "PATROL_QR" | "EXAMS" | "REPORTS"
  ) => void;
  onSyncOffline: () => void;
  isSimulatedOffline: boolean;
  onToggleOffline: () => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  currentTheme: "sleek" | "dark";
  onToggleTheme: () => void;
}

export const ROLE_PROFILES: Record<
  string,
  {
    code: string;
    name: string;
    post: string;
    roleTitle: string;
    badgeColor: string;
  }
> = {
  security_manager: {
    code: "100101",
    name: "دکتر علیرضا بهرامی",
    post: "مدیریت حراست بیمارستان",
    roleTitle: "مدیر ارشد / مدیر حراست",
    badgeColor: "bg-[#0061A4]/15 text-[#0061A4] dark:bg-sky-500/20 dark:text-sky-300",
  },
  crisis_secretary: {
    code: "150290",
    name: "سرهنگ مهدی طاهری",
    post: "دبیرخانه ستاد بحران",
    roleTitle: "دبیر بحران (HICS Officer)",
    badgeColor: "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  },
  supervisor: {
    code: "200201",
    name: "رضا فرهادی",
    post: "فرماندهی شیفت ۲۴ ساعته",
    roleTitle: "سوپروایزر / سرشیفت وقت",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  security_officer: {
    code: "583742",
    name: "علی محمدی",
    post: "پست ۲ (ورودی اورژانس)",
    roleTitle: "نگهبان / افسر حراست",
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  trainee: {
    code: "440112",
    name: "سارا موسوی",
    post: "کارآموز جدیدالورود",
    roleTitle: "نگهبان جدیدالورود (دوره ۱۴ روزه)",
    badgeColor: "bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  },
};

export default function CommandHeader({
  deviceStyle,
  onChangeDeviceStyle,
  activeRole,
  onChangeRole,
  patrolCounts,
  activeTab,
  onChangeTab,
  onSyncOffline,
  isSimulatedOffline,
  onToggleOffline,
  isPhoneFrame,
  onTogglePhoneFrame,
  currentTheme,
  onToggleTheme,
}: CommandHeaderProps) {
  const [timeString, setTimeString] = useState<string>("");
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [installModalOpen, setInstallModalOpen] = useState<boolean>(false);
  const [loginPersonnelCode, setLoginPersonnelCode] = useState<string>("583742");
  const [jwtStatus, setJwtStatus] = useState<string | null>(null);

  const currentProfile =
    ROLE_PROFILES[activeRole] || ROLE_PROFILES.security_officer;

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkOffline = async () => {
      const scans = await getOfflineScans();
      setOfflineCount(scans.length);
    };
    checkOffline();
    const iv = setInterval(checkOffline, 2500);
    return () => clearInterval(iv);
  }, []);

  const handleSecureJwtLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJwtStatus("در حال امضای توکن امنیتی JWT (HS256)...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelCode: loginPersonnelCode,
          biometricVerified: true,
          hardwareKeyAttestation: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJwtStatus(`❌ ${data.error}`);
        return;
      }
      setJwtStatus(`✔ ورود امن کاربر «${data.user.fullName}» تایید شد.`);
      if (data.user.role && ROLE_PROFILES[data.user.role]) {
        onChangeRole(data.user.role);
      }
      setTimeout(() => setAuthModalOpen(false), 1200);
    } catch {
      setJwtStatus("خطای اتصال به سرور");
    }
  };

  const handleInstallClick = async () => {
    triggerHapticFeedback(60);
    const installed = await promptPwaInstall();
    if (!installed) {
      setInstallModalOpen(true);
    }
  };

  const isDesktopMode = deviceStyle === "DESKTOP";

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5">
        {/* نوار اصلی نوار ابزار بالا (AppBar) */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          {/* لوگو و مشخصات مرکز درمانی ابن‌سینا */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0061A4] dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-[#0061A4]/25">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-[#1A1C1E] dark:text-white tracking-tight">
                  {isDesktopMode
                    ? "سامانه جامع انتظامات و حراست ابن‌سینا (نسخه وب‌اپلیکیشن)"
                    : deviceStyle === "IOS"
                    ? "اپلیکیشن iOS انتظامات و مانیتورینگ ابن‌سینا"
                    : "اپلیکیشن اندروید انتظامات و مانیتورینگ ابن‌سینا"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#0061A4]/15 dark:bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold text-[#0061A4] dark:text-cyan-300">
                  <Sparkles className="h-3 w-3" />
                  {isDesktopMode ? "داشبورد وب" : deviceStyle === "IOS" ? "Native iOS" : "Material 3"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                کاربر:{" "}
                <span className="font-bold text-[#1A1C1E] dark:text-white">
                  {currentProfile.name}
                </span>{" "}
                ({currentProfile.post}) — کد:{" "}
                <span className="font-mono-num text-[#0061A4] dark:text-cyan-400 font-bold">
                  {currentProfile.code}
                </span>
              </p>
            </div>
          </div>

          {/* سوئیچر پلتفرم‌های محلی و ابزارهای کاربردی */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* انتخابگر ظاهر پلتفرم محلی (iOS / Android / Desktop) */}
            <div className="flex items-center rounded-2xl border border-black/10 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(40);
                  onChangeDeviceStyle("IOS");
                }}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 font-bold transition-all ${
                  deviceStyle === "IOS"
                    ? "bg-[#007AFF] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="مشاهده در قالب اپلیکیشن محلی آیفون (Apple iOS)"
              >
                <Apple className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">iOS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(40);
                  onChangeDeviceStyle("ANDROID");
                }}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 font-bold transition-all ${
                  deviceStyle === "ANDROID"
                    ? "bg-[#0061A4] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="مشاهده در قالب اپلیکیشن محلی اندروید (Material 3)"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">اندروید</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(40);
                  onChangeDeviceStyle("DESKTOP");
                }}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 font-bold transition-all ${
                  deviceStyle === "DESKTOP"
                    ? "bg-[#0061A4] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title="مشاهده در قالب وب‌اپلیکیشن دسکتاپ اتاق مانیتورینگ"
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">دسکتاپ</span>
              </button>
            </div>

            {/* در حالت موبایل: دکمه تغییر اندازه فریم گوشی */}
            {!isDesktopMode && (
              <button
                type="button"
                onClick={onTogglePhoneFrame}
                className={`flex items-center gap-1 rounded-2xl border px-2.5 py-1.5 font-bold transition-all shadow-sm ${
                  isPhoneFrame
                    ? "border-[#0061A4] bg-[#0061A4]/15 text-[#0061A4] dark:text-cyan-300"
                    : "border-black/10 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                }`}
                title="تغییر نما به شبیه‌ساز فریم فیزیکی گوشی"
              >
                {isPhoneFrame ? (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">تمام‌صفحه</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">فریم گوشی</span>
                  </>
                )}
              </button>
            )}

            {/* دکمه نصب اپلیکیشن PWA */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 shadow-sm"
              title="نصب اپلیکیشن بر روی گوشی یا کامپیوتر"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">نصب اپلیکیشن</span>
            </button>

            {/* سوییچ تم رابط کاربری شیک (Sleek) / تاریک (Dark) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1 rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-sm"
              title="تغییر تم بین Sleek Interface و Tactical Dark"
            >
              {currentTheme === "sleek" ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">تاریک</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span className="hidden sm:inline">شیک</span>
                </>
              )}
            </button>

            {/* انتخاب نقش سازمانی RBAC */}
            <select
              value={activeRole}
              onChange={(e) => onChangeRole(e.target.value)}
              className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-[#1A1C1E] dark:text-slate-200 focus:border-[#0061A4] focus:outline-none shadow-sm"
            >
              <option value="security_officer">
                🛡️ علی محمدی (نگهبان / افسر حراست)
              </option>
              <option value="supervisor">
                ⭐ رضا فرهادی (سوپروایزر / سرشیفت)
              </option>
              <option value="security_manager">
                🏛️ دکتر بهرامی (مدیر ارشد حراست)
              </option>
              <option value="crisis_secretary">
                🚨 سرهنگ طاهری (دبیر ستاد بحران)
              </option>
              <option value="trainee">
                🎓 سارا موسوی (نگهبان جدیدالورود)
              </option>
            </select>

            {/* ورود امن JWT */}
            <button
              type="button"
              onClick={() => {
                setJwtStatus(null);
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-1 rounded-2xl border border-[#0061A4]/30 bg-[#0061A4]/10 px-2.5 py-1.5 font-bold text-[#0061A4] dark:text-cyan-400 hover:bg-[#0061A4]/20"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden md:inline">JWT امضاشده</span>
            </button>
          </div>
        </div>

        {/* نوار تکمیلی در حالت وب‌اپلیکیشن دسکتاپ: تب‌های افقی و شاخص‌های شیفت ۲۴ ساعته */}
        {isDesktopMode && (
          <div className="mt-3 border-t border-black/10 dark:border-white/10 pt-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <nav className="flex overflow-x-auto gap-1">
                {[
                  {
                    id: "SHIFT_REPORT",
                    label: "TAB 1: فرم گزارش ۲۴ساعته شیفت",
                    badge: "۱۰ بخش",
                  },
                  {
                    id: "PATROL_QR",
                    label: "TAB 2: گشت‌زنی QR ضد تقلب",
                    badge: `🔴 ${patrolCounts.red} / 🟢 ${patrolCounts.green}`,
                  },
                  {
                    id: "EXAMS",
                    label: "TAB 3: آزمون‌ها، لاگ‌بوک و بیومتریک HIS",
                    badge: "تایمر ۳۰m",
                  },
                  {
                    id: "REPORTS",
                    label: "TAB 4: داشبورد کلان و ماتریس RBAC",
                    badge: "گزارشات",
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback(30);
                        onChangeTab(tab.id as any);
                      }}
                      className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? "bg-[#0061A4] text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.2 font-mono-num text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-mono-num font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl">
                  [ شیفت جاری: {timeString} ]
                </span>
                <span className="flex items-center gap-1 font-mono-num text-xs bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl">
                  <span className="text-red-600">🔴 {patrolCounts.red}</span>
                  <span className="text-amber-600">🟡 {patrolCounts.yellow}</span>
                  <span className="text-emerald-600">🟢 {patrolCounts.green}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* مودال ورود امن JWT */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="sleek-card w-full max-w-md border border-black/15 dark:border-white/15 bg-white dark:bg-[#121826] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#0061A4] dark:text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold text-[#1A1C1E] dark:text-white">
                  احراز هویت استاندارد JWT (HS256)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                بستن (Esc)
              </button>
            </div>

            <form onSubmit={handleSecureJwtLogin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                  انتخاب پرسنل بیمارستان ابن‌سینا
                </label>
                <select
                  value={loginPersonnelCode}
                  onChange={(e) => setLoginPersonnelCode(e.target.value)}
                  className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2.5 text-xs text-[#1A1C1E] dark:text-white"
                >
                  <option value="583742">
                    علی محمدی (کد 583742) — نگهبان / افسر حراست
                  </option>
                  <option value="200201">
                    رضا فرهادی (کد 200201) — سوپروایزر / سرشیفت وقت
                  </option>
                  <option value="100101">
                    دکتر علیرضا بهرامی (کد 100101) — مدیر ارشد / مدیر حراست
                  </option>
                  <option value="440112">
                    سارا موسوی (کد 440112) — نگهبان جدیدالورود (آنبوردینگ)
                  </option>
                </select>
              </div>

              {jwtStatus && (
                <div className="rounded-2xl border border-[#0061A4]/30 bg-[#0061A4]/10 p-3 text-xs text-[#0061A4] dark:text-cyan-300 font-bold">
                  {jwtStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#0061A4] dark:bg-cyan-500 px-5 py-2 text-xs font-bold text-white dark:text-slate-950"
                >
                  تایید ورود امن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال راهنمای نصب PWA برای اپل iOS و اندروید */}
      {installModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="sleek-card w-full max-w-md border border-black/15 dark:border-white/15 bg-white dark:bg-[#121826] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold text-[#1A1C1E] dark:text-white">
                  نصب اپلیکیشن روی دستگاه شما
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInstallModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                بستن (Esc)
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-3.5 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-[#007AFF]">
                  <Apple className="h-4 w-4" />
                  راهنمای نصب روی آیفون و آیپد (iOS Safari):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pr-1">
                  <li>در مرورگر سافاری روی دکمه اشتراک‌گذاری (Share) در پایین بزنید.</li>
                  <li>گزینه <strong>«Add to Home Screen (افزودن به صفحه اصلی)»</strong> را انتخاب کنید.</li>
                  <li>آیکون رسمی اپل تاچ انتظامات ابن‌سینا روی صفحه دستگاه ظاهر می‌شود.</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-3.5 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-[#0061A4] dark:text-cyan-400">
                  <Smartphone className="h-4 w-4" />
                  راهنمای نصب روی گوشی‌های اندروید (Chrome):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pr-1">
                  <li>روی منوی سه‌نقطه (⋮) مرورگر کروم بزنید.</li>
                  <li>گزینه <strong>«نصب برنامه / Install app»</strong> را لمس کنید.</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setInstallModalOpen(false)}
                className="rounded-2xl bg-[#0061A4] dark:bg-cyan-500 px-5 py-2 text-xs font-bold text-white dark:text-slate-950"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
