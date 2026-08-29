"use client";

import React, { useState, useEffect, useCallback } from "react";
import CommandHeader from "@/components/CommandHeader";
import NativeDeviceNav, {
  DeviceStyle,
  IOSStatusBar,
  AndroidStatusBar,
} from "@/components/NativeDeviceNav";
import TabShiftReport24H from "@/components/TabShiftReport24H";
import TabPatrolQr from "@/components/TabPatrolQr";
import TabCompetencyExams from "@/components/TabCompetencyExams";
import TabExecutiveReports from "@/components/TabExecutiveReports";
import { getOfflineScans, clearOfflineScan } from "@/lib/offline-queue";
import { initServiceWorker } from "@/lib/pwa";
import {
  Shield,
  Activity,
  Server,
  Smartphone,
  Apple,
} from "lucide-react";

export default function AvicennaSecurityApp() {
  const [deviceStyle, setDeviceStyle] = useState<DeviceStyle>("AUTO");
  const [detectedPlatform, setDetectedPlatform] = useState<"IOS" | "ANDROID" | "DESKTOP">("DESKTOP");
  const [activeTab, setActiveTab] = useState<
    "SHIFT_REPORT" | "PATROL_QR" | "EXAMS" | "REPORTS"
  >("SHIFT_REPORT");
  const [activeRole, setActiveRole] = useState<string>("security_officer");
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<"sleek" | "dark">("sleek");

  const [shiftReport, setShiftReport] = useState<any | null>(null);
  const [patrolTasks, setPatrolTasks] = useState<any[]>([]);
  const [patrolSummary, setPatrolSummary] = useState({
    red: 4,
    yellow: 2,
    green: 12,
    total: 18,
  });

  const [examSessions, setExamSessions] = useState<any[]>([]);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // ثبت PWA Service Worker و تشخیص خودکار دیوایس کاربر (User Agent Detection)
  useEffect(() => {
    initServiceWorker();

    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const isMobile = isIOS || isAndroid || window.innerWidth <= 768;

      if (isIOS) {
        setDetectedPlatform("IOS");
      } else if (isAndroid) {
        setDetectedPlatform("ANDROID");
      } else {
        setDetectedPlatform("DESKTOP");
      }

      // به طور پیش‌فرض، اگر کاربر با موبایل وارد شد، فریم شبیه‌ساز را خاموش و حالت بومی را فعال می‌کنیم
      if (isMobile) {
        setIsPhoneFrame(false);
      }
    }
  }, []);

  // پلتفرم فعال برای رندرینگ: اگر روی AUTO باشد، بر اساس دیوایس واقعی تنظیم می‌شود
  const effectivePlatform: "IOS" | "ANDROID" | "DESKTOP" =
    deviceStyle === "AUTO" ? detectedPlatform : (deviceStyle as any);

  const isDesktopMode = effectivePlatform === "DESKTOP";
  const isIOSMode = effectivePlatform === "IOS";
  const isAndroidMode = effectivePlatform === "ANDROID";

  // اعمال تم رنگی به المان root
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      currentTheme === "sleek" ? "sleek" : "dark"
    );
    if (currentTheme === "sleek") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => (prev === "sleek" ? "dark" : "sleek"));
  };

  const fetchAllData = useCallback(async () => {
    try {
      const [shiftRes, patrolRes, examRes, userRes] = await Promise.all([
        fetch("/api/shift-report"),
        fetch("/api/patrols"),
        fetch("/api/exams"),
        fetch("/api/users"),
      ]);

      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        setShiftReport(shiftData.shiftReport);
      }

      if (patrolRes.ok) {
        const patrolData = await patrolRes.json();
        setPatrolTasks(patrolData.patrolTasks || []);
        if (patrolData.summary) {
          setPatrolSummary(patrolData.summary);
        }
      }

      if (examRes.ok) {
        const examData = await examRes.json();
        setExamSessions(examData.sessions || []);
        setExamQuestions(examData.questions || []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUsersList(userData.users || []);
      }
    } catch (err) {
      console.error("Error loading Avicenna Hospital Security data:", err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSyncOffline = async () => {
    const offlineScans = await getOfflineScans();
    for (const scan of offlineScans) {
      try {
        await fetch("/api/patrols", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SCAN_QR",
            patrolId: scan.patrolId,
            userLat: scan.userLat,
            userLng: scan.userLng,
            note: "اسکن آفلاین سنکرون‌شده از دیتابیس محلی PWA",
          }),
        });
        await clearOfflineScan(scan.id);
      } catch (err) {
        console.error("Failed syncing offline scan:", err);
      }
    }
    fetchAllData();
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        !isDesktopMode && isPhoneFrame
          ? "bg-slate-900/90 py-6 px-2 flex flex-col items-center justify-center"
          : "bg-[#F7F9FF] dark:bg-[#090D16] text-[#1A1C1E] dark:text-[#F8FAFC]"
      }`}
      style={{
        paddingTop: !isPhoneFrame ? "env(safe-area-inset-top, 0px)" : undefined,
      }}
    >
      {/* بدنه اپلیکیشن: در حالت Phone Frame شبیه‌ساز فریم گوشی با لبه‌های ۴۶dp */}
      <div
        className={`w-full transition-all duration-300 ${
          !isDesktopMode && isPhoneFrame
            ? "max-w-[450px] android-phone-frame bg-[#F7F9FF] dark:bg-[#090D16] text-[#1A1C1E] dark:text-[#F8FAFC] overflow-hidden border-4 border-slate-700 relative my-auto shadow-2xl"
            : "min-h-screen flex flex-col justify-between"
        }`}
      >
        {/* پانچ‌هول دوربین در حالت فریم گوشی اندروید */}
        {!isDesktopMode && isPhoneFrame && isAndroidMode && (
          <div className="android-camera-punchhole" />
        )}

        {/* نوار وضعیت سیستم متناسب با پلتفرم: iOS یا Android */}
        {!isDesktopMode && isIOSMode && <IOSStatusBar />}
        {!isDesktopMode && isAndroidMode && <AndroidStatusBar />}

        {/* سربرگ هوشمند سیستم با سوییچر پلتفرم و تم */}
        <CommandHeader
          deviceStyle={deviceStyle}
          onChangeDeviceStyle={setDeviceStyle}
          activeRole={activeRole}
          onChangeRole={setActiveRole}
          patrolCounts={patrolSummary}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onSyncOffline={handleSyncOffline}
          isSimulatedOffline={isSimulatedOffline}
          onToggleOffline={() => setIsSimulatedOffline((prev) => !prev)}
          isPhoneFrame={isPhoneFrame}
          onTogglePhoneFrame={() => setIsPhoneFrame((prev) => !prev)}
          currentTheme={currentTheme}
          onToggleTheme={toggleTheme}
        />

        {/* نوار اطلاع‌رسانی ویژه حالت دسکتاپ اتاق مانیتورینگ */}
        {isDesktopMode && (
          <div className="border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#121826]/70 backdrop-blur-sm px-4 py-2">
            <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-sky-700 dark:text-sky-300">
                  <Server className="h-4 w-4" />
                  دروازه ارتباطی HIS/PACS مرکز درمانی ابن‌سینا: آنلاین و متصل (14ms)
                </span>
                <span className="hidden md:inline text-slate-400">|</span>
                <span className="hidden md:flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <Activity className="h-4 w-4" />
                  ستاد فرماندهی پدافند غیرعامل و مانیتورینگ ۲۴ ساعته
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeviceStyle("IOS")}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#007AFF] hover:underline"
                >
                  <Apple className="h-3.5 w-3.5" />
                  نمای آیفون (iOS)
                </button>
                <span className="text-slate-300">/</span>
                <button
                  type="button"
                  onClick={() => setDeviceStyle("ANDROID")}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0061A4] dark:text-cyan-400 hover:underline"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  نمای اندروید
                </button>
              </div>
            </div>
          </div>
        )}

        {/* محتوای فعال ۴ بخش اصلی سامانه با ارگونومی کاملاً محلی */}
        <main
          className={`flex-1 w-full mx-auto ${
            isDesktopMode
              ? "max-w-7xl px-4 sm:px-6 py-6 pb-20"
              : "max-w-4xl px-3 sm:px-5 py-4 pb-28"
          }`}
        >
          {activeTab === "SHIFT_REPORT" && (
            <TabShiftReport24H
              shiftReport={shiftReport}
              activeRole={activeRole}
              onRefreshReport={fetchAllData}
            />
          )}

          {activeTab === "PATROL_QR" && (
            <TabPatrolQr
              patrolTasks={patrolTasks}
              activeRole={activeRole}
              isSimulatedOffline={isSimulatedOffline}
              onRefreshPatrols={fetchAllData}
            />
          )}

          {activeTab === "EXAMS" && (
            <TabCompetencyExams
              sessions={examSessions}
              questions={examQuestions}
              onRefreshExams={fetchAllData}
              activeRole={activeRole}
            />
          )}

          {activeTab === "REPORTS" && (
            <TabExecutiveReports
              shiftReport={shiftReport}
              patrolSummary={patrolSummary}
              usersList={usersList}
            />
          )}
        </main>

        {/* در حالت موبایل: نوار ناوبری محلی بر اساس سیستم‌عامل (Apple iOS یا Android Material 3) */}
        {!isDesktopMode ? (
          <NativeDeviceNav
            deviceStyle={effectivePlatform}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            redCount={patrolSummary.red}
            yellowCount={patrolSummary.yellow}
            greenCount={patrolSummary.green}
          />
        ) : (
          /* در حالت دسکتاپ: فوتر سازمانی مانیتورینگ اتاق کنترل */
          <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#090D16] py-4 text-xs text-slate-500 transition-colors">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                <Shield className="h-4 w-4 text-[#0061A4] dark:text-cyan-400" />
                <span>
                  سامانه جامع انتظامات و حراست مرکز درمانی ابن‌سینا (Vercel Ready & Native Responsive)
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                <span>HMAC-SHA256 Dynamic (5m)</span>
                <span>•</span>
                <span>PWA iOS & Android</span>
                <span>•</span>
                <span>HICS Hospital Certified</span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
