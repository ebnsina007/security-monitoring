"use client";

import React, { useState, useEffect, useCallback } from "react";
import CommandHeader, { AppDisplayMode } from "@/components/CommandHeader";
import AndroidBottomNav, { AndroidStatusBar } from "@/components/AndroidBottomNav";
import TabShiftReport24H from "@/components/TabShiftReport24H";
import TabPatrolQr from "@/components/TabPatrolQr";
import TabCompetencyExams from "@/components/TabCompetencyExams";
import TabExecutiveReports from "@/components/TabExecutiveReports";
import { getOfflineScans, clearOfflineScan } from "@/lib/offline-queue";
import { initServiceWorker } from "@/lib/pwa";
import {
  Monitor,
  Smartphone,
  Shield,
  Activity,
  Server,
  Download,
  Printer,
  Sparkles,
} from "lucide-react";

export default function AvicennaSecurityApp() {
  const [appDisplayMode, setAppDisplayMode] = useState<AppDisplayMode>("ANDROID_MOBILE");
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

  // ثبت PWA Service Worker
  useEffect(() => {
    initServiceWorker();
  }, []);

  // اعمال تم به المان ریشه html
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
            note: "اسکن آفلاین سنکرون‌شده از Room/IndexedDB",
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
        appDisplayMode === "ANDROID_MOBILE" && isPhoneFrame
          ? "bg-slate-900/90 py-6 px-2 flex flex-col items-center justify-center"
          : "bg-[#F7F9FF] dark:bg-[#090D16] text-[#1A1C1E] dark:text-[#F8FAFC]"
      }`}
    >
      {/* در حالت فریم گوشی اندروید: نمایش فریم ۴۴dp و پانچ‌هول دوربین */}
      <div
        className={`w-full transition-all duration-300 ${
          appDisplayMode === "ANDROID_MOBILE" && isPhoneFrame
            ? "max-w-[450px] android-phone-frame bg-[#F7F9FF] dark:bg-[#090D16] text-[#1A1C1E] dark:text-[#F8FAFC] overflow-hidden border-4 border-slate-700 relative my-auto shadow-2xl"
            : "min-h-screen flex flex-col justify-between"
        }`}
      >
        {/* پانچ‌هول دوربین در حالت فریم گوشی اندروید */}
        {appDisplayMode === "ANDROID_MOBILE" && isPhoneFrame && (
          <div className="android-camera-punchhole" />
        )}

        {/* نوار وضعیت سیستم اندروید (ساعت، باتری، 5G پدافند) در حالت اپلیکیشن موبایل */}
        {appDisplayMode === "ANDROID_MOBILE" && <AndroidStatusBar />}

        {/* سربرگ هوشمند با سوئیچر وب‌اپلیکیشن / اپلیکیشن موبایل */}
        <CommandHeader
          appDisplayMode={appDisplayMode}
          onChangeAppDisplayMode={setAppDisplayMode}
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

        {/* نوار اطلاع‌رسانی ویژه حالت وب‌اپلیکیشن دسکتاپ */}
        {appDisplayMode === "WEB_DASHBOARD" && (
          <div className="border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#121826]/70 backdrop-blur-sm px-4 py-2">
            <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-sky-700 dark:text-sky-300">
                  <Server className="h-4 w-4" />
                  دروازه ارتباطی PACS/HIS بیمارستان ابن‌سینا: فعال (14ms)
                </span>
                <span className="hidden md:inline text-slate-400">|</span>
                <span className="hidden md:flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <Activity className="h-4 w-4" />
                  سامانه پایش ۲۴ ساعته ستاد بحران پدافند غیرعامل
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAppDisplayMode("ANDROID_MOBILE")}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0061A4] dark:text-cyan-400 hover:underline"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  تغییر سریع به نسخه اپلیکیشن اندروید (Mobile App)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* محتوای فعال ۴ بخش اصلی سامانه */}
        <main
          className={`flex-1 w-full mx-auto pb-20 ${
            appDisplayMode === "WEB_DASHBOARD"
              ? "max-w-7xl px-4 sm:px-6 py-6"
              : "max-w-4xl px-3 sm:px-5 py-4"
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

        {/* در حالت اپلیکیشن موبایل: ناوبری پایین Material 3 */}
        {appDisplayMode === "ANDROID_MOBILE" ? (
          <AndroidBottomNav
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            redCount={patrolSummary.red}
            yellowCount={patrolSummary.yellow}
            greenCount={patrolSummary.green}
          />
        ) : (
          /* در حالت وب‌اپلیکیشن: فوتر کامل مانیتورینگ اتاق کنترل */
          <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#090D16] py-4 text-xs text-slate-500 transition-colors">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                <Shield className="h-4 w-4 text-[#0061A4] dark:text-cyan-400" />
                <span>
                  سامانه جامع انتظامات و حراست مرکز درمانی ابن‌سینا (نسخه وب‌اپلیکیشن و اپلیکیشن اندروید)
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                <span>HMAC-SHA256 Dynamic (5m)</span>
                <span>•</span>
                <span>PWA ServiceWorker Offline</span>
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
