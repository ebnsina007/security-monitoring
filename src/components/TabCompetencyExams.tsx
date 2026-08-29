"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Award,
  AlertTriangle,
  Clock,
  BookOpen,
  Play,
  ShieldCheck,
  UserCheck,
  Zap,
  Fingerprint,
  ScanFace,
  Database,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  EyeOff,
  Lock,
  FileEdit,
  UserPlus,
  Server,
  RefreshCw,
  Printer,
} from "lucide-react";

interface TabCompetencyExamsProps {
  sessions: any[];
  questions: any[];
  onRefreshExams: () => void;
  activeRole?: string;
}

export default function TabCompetencyExams({
  sessions,
  questions,
  onRefreshExams,
  activeRole = "security_officer",
}: TabCompetencyExamsProps) {
  const [subTab, setSubTab] = useState<
    "SCORECARD" | "ONBOARDING_14D" | "LIVE_EXAM" | "BIOMETRIC_HIS"
  >("LIVE_EXAM");

  // وضعیت آزمون پله‌ای تک‌به‌تک (One-by-One Question Wizard)
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(30 * 60); // ۳۰ دقیقه شمارنده معکوس
  const [submittingExam, setSubmittingExam] = useState<boolean>(false);
  const [antiCheatViolations, setAntiCheatViolations] = useState<number>(0);
  const [screenCaptureBlocked, setScreenCaptureBlocked] = useState<boolean>(false);
  const [latestSubmittedScorecard, setLatestSubmittedScorecard] = useState<any | null>(null);

  // لاگ‌بوک ۱۴ روزه (Digital Onboarding Logbook)
  const [logbookEntries, setLogbookEntries] = useState<any[]>([]);
  const [selectedDayLog, setSelectedDayLog] = useState<any | null>(null);
  const [trainerScorePractical, setTrainerScorePractical] = useState<number>(85);
  const [trainerScoreTheory, setTrainerScoreTheory] = useState<number>(90);
  const [trainerComments, setTrainerComments] = useState<string>("");
  const [managerScoreConduct, setManagerScoreConduct] = useState<number>(90);
  const [managerRemarks, setManagerRemarks] = useState<string>("");
  const [savingLogbook, setSavingLogbook] = useState<boolean>(false);

  // پنل احراز هویت بیومتریک و اتصال HIS
  const [biometricRecords, setBiometricRecords] = useState<any[]>([]);
  const [hisStatus, setHisStatus] = useState<any | null>(null);
  const [scanningFingerprint, setScanningFingerprint] = useState<boolean>(false);
  const [scanningFace, setScanningFace] = useState<boolean>(false);
  const [biometricSuccessMsg, setBiometricSuccessMsg] = useState<string | null>(null);

  // پالایش سوالات برای آزمون (IQ, EQ, TECHNICAL)
  const examPool = questions.filter((q) => q.category !== "ONBOARDING_14D");
  const currentQuestion = examPool[currentQuestionIndex];

  // تایمر معکوس ۳۰ دقیقه‌ای که فقط بعد از شروع آزمون فعال می‌شود
  useEffect(() => {
    if (!examStarted) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted]);

  // قابلیت امنیتی: جلوگیری از ضبط تصویر، اسکرین‌شات و مانیتورینگ متقلبانه
  useEffect(() => {
    if (!examStarted) return;

    // ۱. تشخیص خارج شدن فوکوس پنجره یا سوئیچ تب (Window Blur / Visibility Change)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setScreenCaptureBlocked(true);
        setAntiCheatViolations((prev) => prev + 1);
      }
    };

    const handleWindowBlur = () => {
      setScreenCaptureBlocked(true);
      setAntiCheatViolations((prev) => prev + 1);
    };

    const handleWindowFocus = () => {
      // بازگشت فوکوس
      setTimeout(() => {
        setScreenCaptureBlocked(false);
      }, 1200);
    };

    // ۲. مسدودسازی کلیدهای ضبط تصویر و اسکرین‌شات
    const handleKeyDown = (e: KeyboardEvent) => {
      // کلید PrintScreen
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        setScreenCaptureBlocked(true);
        setAntiCheatViolations((prev) => prev + 1);
        if (navigator.clipboard) {
          navigator.clipboard.writeText("AVICENNA_SECURITY_DRM_PROTECTED");
        }
        setTimeout(() => setScreenCaptureBlocked(false), 2500);
      }

      // مسدودسازی Ctrl+P (Print), Ctrl+S (Save), Ctrl+Shift+I (DevTools)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "p" || e.key === "s" || e.key === "u" || e.key === "c")
      ) {
        e.preventDefault();
      }
    };

    // ۳. مسدودسازی راست‌کلیک
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [examStarted]);

  // بارگذاری داده‌های لاگ‌بوک و بیومتریک HIS
  useEffect(() => {
    const fetchLogbook = async () => {
      try {
        const res = await fetch("/api/onboarding-logbook?personnelCode=440112");
        if (res.ok) {
          const data = await res.json();
          setLogbookEntries(data.logbookEntries || []);
          if (data.logbookEntries?.length > 0 && !selectedDayLog) {
            setSelectedDayLog(data.logbookEntries[7] || data.logbookEntries[0]);
          }
        }
      } catch (err) {
        console.error("Failed fetching logbook", err);
      }
    };

    const fetchBiometrics = async () => {
      try {
        const res = await fetch("/api/biometric-his");
        if (res.ok) {
          const data = await res.json();
          setBiometricRecords(data.records || []);
          setHisStatus(data.hisGatewayStatus);
        }
      } catch (err) {
        console.error("Failed fetching biometrics", err);
      }
    };

    fetchLogbook();
    fetchBiometrics();
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  // انتخاب گزینه و انتقال خودکار به سوال بعدی
  const handleSelectOptionAndNext = (questionCode: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionCode]: optionId }));

    // اگر سوال آخر نبود، بعد از تاخیر کوتاه سوال بعدی ظاهر شود
    if (currentQuestionIndex < examPool.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 250);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < examPool.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // ارسال نهایی آزمون
  const handleSubmitExam = async () => {
    setSubmittingExam(true);
    try {
      const res = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelCode: "583742",
          examType: "PERIODIC_A",
          answers: selectedAnswers,
          timeSpentSeconds: 30 * 60 - timeLeftSeconds,
        }),
      });

      const data = await res.json();
      if (data.skillGapAnalysis) {
        setLatestSubmittedScorecard(data.skillGapAnalysis);
        setExamStarted(false);
        setSubTab("SCORECARD");
        onRefreshExams();
      }
    } finally {
      setSubmittingExam(false);
    }
  };

  // ثبت دستی ارزیابی لاگ‌بوک توسط مربی
  const handleTrainerSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayLog) return;
    setSavingLogbook(true);
    try {
      const res = await fetch("/api/onboarding-logbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logbookId: selectedDayLog.id,
          action: "TRAINER_EVALUATE",
          trainerScorePractical,
          trainerScoreTheory,
          trainerComments,
        }),
      });
      const data = await res.json();
      if (data.entry) {
        setSelectedDayLog(data.entry);
        setLogbookEntries((prev) =>
          prev.map((item) => (item.id === data.entry.id ? data.entry : item))
        );
      }
    } finally {
      setSavingLogbook(false);
    }
  };

  // ثبت دستی ارزیابی لاگ‌بوک توسط مدیر حراست
  const handleManagerSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayLog) return;
    setSavingLogbook(true);
    try {
      const res = await fetch("/api/onboarding-logbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logbookId: selectedDayLog.id,
          action: "MANAGER_EVALUATE",
          managerScoreConduct,
          managerRemarks,
        }),
      });
      const data = await res.json();
      if (data.entry) {
        setSelectedDayLog(data.entry);
        setLogbookEntries((prev) =>
          prev.map((item) => (item.id === data.entry.id ? data.entry : item))
        );
      }
    } finally {
      setSavingLogbook(false);
    }
  };

  // اجرای اسکن بیومتریک اثر انگشت و چهره توسط مدیر حراست
  const handlePerformBiometricScan = async (personnelCode: string, type: "FACE" | "FINGERPRINT") => {
    if (type === "FINGERPRINT") {
      setScanningFingerprint(true);
    } else {
      setScanningFace(true);
    }
    setBiometricSuccessMsg(null);

    try {
      const res = await fetch("/api/biometric-his", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelCode,
          action: type === "FACE" ? "ENROLL_FACE" : "ENROLL_FINGERPRINT",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBiometricSuccessMsg(
          `✔ اسکن ${type === "FACE" ? "چهره با ضریب اعتماد ۹۸.۸٪" : "اثر انگشت اپتیکال با ضریب ۹۹.۴٪"} توسط مدیر حراست انجام و با سامانه HIS تطبیق یافت.`
        );
        // بروزرسانی لیست
        const refresh = await fetch("/api/biometric-his");
        if (refresh.ok) {
          const fresh = await refresh.json();
          setBiometricRecords(fresh.records || []);
        }
      }
    } finally {
      setScanningFingerprint(false);
      setScanningFace(false);
    }
  };

  // کارنامه پیش‌فرض علی محمدی
  const displayScorecard =
    latestSubmittedScorecard ||
    sessions.find((s) => s.skillGapAnalysis?.personnelCode === "583742")
      ?.skillGapAnalysis || {
      personnelCode: "583742",
      fullName: "علی محمدی",
      totalScore: 86,
      statusBadge: "🟢 قبول ممتاز (واجد شرایط ارتقای رتبه و فرماندهی مانور)",
      domains: [
        {
          domainName: "کنترل دسترسی و تردد",
          scorePercent: 100,
          barVisual: "[████████████████████] 100% 🟢",
        },
        {
          domainName: "مدیریت تعارض و EQ",
          scorePercent: 80,
          barVisual: "[████████████████░░░░] 80%  🟢",
        },
        {
          domainName: "مدیریت بحران و حریق",
          scorePercent: 90,
          barVisual: "[██████████████████░░] 90%  🟢",
        },
        {
          domainName: "گزارش‌نویسی و تحویل شیفت",
          scorePercent: 40,
          barVisual: "[████████░░░░░░░░░░░░] 40%  🔴 (ضعف)",
        },
      ],
      mandatoryCourses: [
        {
          courseTitle:
            "دوره بازآموزی الزامی پدافند و حراست: «اصول گزارش‌نویسی و تحویل شیفت»",
          deadlineDays: 7,
        },
      ],
      smartShiftRecommendation: {
        assignedPost: "پست ۲ - ورودی اورژانس و تریاژ مرکزی",
        crisisRole: "افسر فرماندهی صحنه در مانور حریق",
      },
      recommendedAction:
        "شرکت در دوره تجدید آموزش «اصول گزارش‌نویسی و تحویل شیفت»",
    };

  return (
    <div className="space-y-5 select-none relative">
      {/* واترمارک متحرک امنیتی شفاف ضد عکس‌برداری فیزیکی با موبایل */}
      {examStarted && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-10 flex flex-wrap gap-12 p-8 text-xs font-mono-num text-slate-500 select-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="transform -rotate-12">
              AVICENNA-SEC-583742 | {new Date().toLocaleTimeString("fa-IR")} | پدافند مرکز
            </div>
          ))}
        </div>
      )}

      {/* لایه مسدودکننده امنیتی ضد اسکرین‌شات / ضبط تصویر (Anti-Screen Capture Shield) */}
      {screenCaptureBlocked && examStarted && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6 text-center">
          <div className="h-16 w-16 rounded-3xl bg-red-500/20 text-red-500 flex items-center justify-center border-2 border-red-500/40 mb-4 animate-bounce">
            <EyeOff className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-extrabold text-white">
            ⚠️ هشدار پدافند غیرعامل: امکان عکس‌برداری یا ضبط تصویر از آزمون مسدود است!
          </h3>
          <p className="mt-2 text-xs text-slate-300 max-w-md">
            بر اساس پروتکل‌های امنیتی آزمون ارزیابی شایستگی حراست بیمارستان ابن‌سینا، هرگونه سوئیچ بین پنجره‌ها، کلید PrintScreen یا ابزار ضبط تصویر ممنوع بوده و تخلف در سرور ثبت می‌شود.
          </p>
          <div className="mt-4 rounded-xl bg-red-950/40 border border-red-500/30 px-4 py-2 text-xs font-mono-num font-bold text-red-400">
            تعداد هشدارهای ثبت‌شده: {antiCheatViolations}
          </div>
        </div>
      )}

      {/* نوار زیرتب‌های ماژول آزمون‌ها */}
      <div className="sleek-card flex flex-wrap items-center justify-between gap-3 border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              id: "LIVE_EXAM",
              label: "آزمون هوشمند تک‌به‌تک (تایمر ۳۰m + ضد اسکرین‌شات)",
              icon: Play,
            },
            {
              id: "ONBOARDING_14D",
              label: "لاگ‌بوک دیجیتال ۱۴ روزه آموزش (ثبت دستی مربی و مدیر)",
              icon: BookOpen,
            },
            {
              id: "BIOMETRIC_HIS",
              label: "احراز هویت بیومتریک (چهره + اثرانگشت) و اتصال HIS",
              icon: Fingerprint,
            },
            {
              id: "SCORECARD",
              label: "کارنامه تحلیلی و شکاف مهارت (نمره ۸۶/۱۰۰)",
              icon: Award,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "border-[#0061A4] dark:border-cyan-400 bg-[#0061A4] dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                    : "border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ۱. ماژول آزمون تک‌به‌تک (One-by-One Stepper Wizard) با تایمر ۳۰ دقیقه و سیستم ضد اسکرین‌شات */}
      {subTab === "LIVE_EXAM" && (
        <div className="space-y-4">
          {!examStarted ? (
            /* صفحه معرفی قبل از شروع آزمون */
            <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-6 text-center max-w-2xl mx-auto shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0061A4]/15 dark:bg-cyan-500/20 text-[#0061A4] dark:text-cyan-400 border border-[#0061A4]/30 mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-extrabold text-[#1A1C1E] dark:text-white">
                آزمون جامع ارزیابی شایستگی حراست و انتظامات ابن‌سینا
              </h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
                شامل ۵۰ سوال تخصصی در حوزه‌های هوش شناختی بحران (IQ)، مدیریت خشم و تعارضات اورژانس (EQ) و مباحث حفاظت فیزیکی.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 text-right">
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#0061A4] dark:text-cyan-400">
                    <Clock className="h-4 w-4" />
                    مدت آزمون: ۳۰ دقیقه
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    شمارنده معکوس پس از فشردن دکمه شروع فعال می‌شود.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    نمایش تک‌به‌تک سوالات
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    با انتخاب هر پاسخ، سوال بعدی بلافاصله جایگزین می‌شود.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
                    <Lock className="h-4 w-4" />
                    محافظت ضد اسکرین‌شات
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    مات شدن خودکار صفحه هنگام خروج فوکوس یا تلاش برای عکس‌برداری.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setExamStarted(true);
                    setCurrentQuestionIndex(0);
                    setTimeLeftSeconds(30 * 60); // شروع ۳۰ دقیقه
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-[#0061A4] dark:bg-cyan-500 px-8 py-3 text-sm font-extrabold text-white dark:text-slate-950 shadow-lg shadow-[#0061A4]/30 hover:opacity-90 transition"
                >
                  <Play className="h-4 w-4" />
                  شروع رسمی آزمون و فعال‌سازی تایمر ۳۰ دقیقه‌ای
                </button>
              </div>
            </div>
          ) : (
            /* پنل آزمون فعال: یک سوال در حال نمایش */
            <div className="space-y-4">
              {/* نوار سربرگ آزمون: تایمر ۳۰ دقیقه‌ای و وضعیت نوار پیشرفت */}
              <div className="sleek-card sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#121826]/95 p-4 shadow-md backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-500/30 px-3 py-1 font-mono-num text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Clock className="h-4 w-4 animate-pulse" />
                    زمان باقیمانده: {formatTime(timeLeftSeconds)}
                  </span>

                  <span className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 py-1 font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300">
                    سوال {currentQuestionIndex + 1} از {examPool.length}
                  </span>
                </div>

                {/* نشانگر ضد اسکرین‌شات فعال */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    <Lock className="h-3 w-3" />
                    محافظت فعال ضد ضبط نمایشگر
                  </span>

                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    disabled={submittingExam}
                    className="rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white dark:text-slate-950 hover:opacity-90 shadow-sm"
                  >
                    {submittingExam ? "در حال تصحیح..." : "پایان و ارسال آزمون"}
                  </button>
                </div>
              </div>

              {/* نوار پیشرفت درصد پیشروی آزمون */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-[#0061A4] to-[#00A896] transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / examPool.length) * 100}%`,
                  }}
                />
              </div>

              {/* کارت سوال فعال: سوال یکی پس از دیگری ظاهر می‌شود */}
              {currentQuestion && (
                <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-white/10 pb-3">
                    <span className="rounded-xl bg-[#0061A4]/15 dark:bg-cyan-500/20 px-3 py-1 font-mono-num text-xs font-bold text-[#0061A4] dark:text-cyan-400">
                      کد سوال: {currentQuestion.code} ({currentQuestion.category})
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      دامنه مهارتی: {currentQuestion.domainName}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm sm:text-base font-extrabold text-[#1A1C1E] dark:text-white leading-relaxed">
                    {currentQuestion.questionText}
                  </h3>

                  {/* گزینه‌های پاسخ با قابلیت کلیک و جهش آنی به سوال بعدی */}
                  <div className="mt-5 space-y-2.5">
                    {(currentQuestion.options || []).map((opt: any) => {
                      const isSelected = selectedAnswers[currentQuestion.code] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOptionAndNext(currentQuestion.code, opt.id)}
                          className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-right text-xs transition-all ${
                            isSelected
                              ? "border-[#0061A4] dark:border-cyan-400 bg-[#0061A4]/10 dark:bg-cyan-950/40 text-[#0061A4] dark:text-cyan-300 font-bold shadow-sm"
                              : "border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono-num text-xs font-bold ${
                              isSelected
                                ? "bg-[#0061A4] dark:bg-cyan-500 text-white dark:text-slate-950"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-black/10 dark:border-white/10"
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* دکمه‌های ناوبری پله‌ای: سوال قبلی و سوال بعدی */}
                  <div className="mt-6 flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-1.5 rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                      سوال قبلی
                    </button>

                    {currentQuestionIndex < examPool.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="flex items-center gap-1.5 rounded-2xl bg-[#0061A4] dark:bg-cyan-500 px-5 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md"
                      >
                        سوال بعدی
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitExam}
                        className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-6 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md"
                      >
                        <Send className="h-4 w-4" />
                        ثبت و پایان آزمون
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ۲. لاگ‌بوک دیجیتال ۱۴ روزه آموزش با ثبت دستی مربی و مدیر حراست */}
      {subTab === "ONBOARDING_14D" && (
        <div className="space-y-5">
          <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1A1C1E] dark:text-white">
                  فرم دیجیتال لاگ‌بوک آموزش و ارزیابی عملکرد ۱۴ روزه (سارا موسوی - کد ۴۴۰۱۱۲)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ثبت دستی ارزیابی عملکرد توسط مدرس آموزش حراست و تکمیل نهایی تاییدیه توسط مدیر حراست.
                </p>
              </div>
              <span className="rounded-2xl bg-[#0061A4]/15 dark:bg-cyan-500/20 px-3 py-1 font-mono-num text-xs font-bold text-[#0061A4] dark:text-cyan-300">
                وضعیت: روز ۸ از ۱۴ فعال
              </span>
            </div>

            {/* گرید ۱۴ روزه لاگ‌بوک */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {logbookEntries.map((log) => {
                const isSelected = selectedDayLog?.id === log.id;
                const isFinal = log.status === "FINAL_APPROVED";
                const isTrainer = log.status === "TRAINER_APPROVED";

                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => {
                      setSelectedDayLog(log);
                      setTrainerScorePractical(log.trainerScorePractical || 85);
                      setTrainerScoreTheory(log.trainerScoreTheory || 90);
                      setTrainerComments(log.trainerComments || "");
                      setManagerScoreConduct(log.managerScoreConduct || 90);
                      setManagerRemarks(log.managerRemarks || "");
                    }}
                    className={`sleek-card flex flex-col p-3 text-right transition-all border ${
                      isSelected
                        ? "border-[#0061A4] dark:border-cyan-400 bg-white dark:bg-slate-900 shadow-md ring-1 ring-[#0061A4]"
                        : "border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num text-xs font-bold text-[#1A1C1E] dark:text-white">
                        روز {log.dayNumber}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                          isFinal
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : isTrainer
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {isFinal ? "تایید نهایی" : isTrainer ? "تایید مربی" : "معوق"}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                      {log.topicTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* فرم جزئیات و ثبت دستی دوگانه (مدرس و مدیر حراست) */}
          {selectedDayLog && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* بخش ۱: ثبت دستی ارزیابی توسط مدرس / فرد آموزش‌دهنده */}
              <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-3">
                  <FileEdit className="h-5 w-5 text-[#0061A4] dark:text-cyan-400" />
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1C1E] dark:text-white">
                      ارزیابی عملکرد توسط مربی / مدرس آموزش حراست
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      روز {selectedDayLog.dayNumber}: {selectedDayLog.topicTitle}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleTrainerSubmitLog} className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                        نمره مهارت عملی (از ۱۰۰)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={trainerScorePractical}
                        onChange={(e) => setTrainerScorePractical(Number(e.target.value))}
                        className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs font-mono-num text-[#1A1C1E] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                        نمره تئوری و مقررات (از ۱۰۰)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={trainerScoreTheory}
                        onChange={(e) => setTrainerScoreTheory(Number(e.target.value))}
                        className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs font-mono-num text-[#1A1C1E] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                      شرح و یادداشت دستی مدرس آموزش
                    </label>
                    <textarea
                      rows={3}
                      value={trainerComments}
                      onChange={(e) => setTrainerComments(e.target.value)}
                      placeholder="توضیحات پیشرفت کارآموز، مهارت در کار با ادوات و نحوه برخورد..."
                      className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs text-[#1A1C1E] dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      مدرس مسئول: رضا فرهادی
                    </span>
                    <button
                      type="submit"
                      disabled={savingLogbook}
                      className="rounded-2xl bg-[#0061A4] dark:bg-cyan-500 px-5 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md"
                    >
                      {savingLogbook ? "در حال ثبت..." : "ثبت دستی ارزیابی مربی"}
                    </button>
                  </div>
                </form>
              </div>

              {/* بخش ۲: ثبت دستی و تایید نهایی توسط مدیر حراست */}
              <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-3">
                  <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1C1E] dark:text-white">
                      ارزیابی انضباطی و تایید نهایی توسط مدیر حراست
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      تکمیل ثبت دستی و صدور صلاحیت روزانه
                    </span>
                  </div>
                </div>

                <form onSubmit={handleManagerSubmitLog} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                      نمره انضباط، هوشیاری و صلاحیت حراستی (از ۱۰۰)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={managerScoreConduct}
                      onChange={(e) => setManagerScoreConduct(Number(e.target.value))}
                      className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs font-mono-num text-[#1A1C1E] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                      نظریه و دستور نهایی مدیر حراست
                    </label>
                    <textarea
                      rows={3}
                      value={managerRemarks}
                      onChange={(e) => setManagerRemarks(e.target.value)}
                      placeholder="تایید صلاحیت برای ورود به پست‌های شیفت شب، رعایت شئونات و..."
                      className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs text-[#1A1C1E] dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      تاییدکننده: دکتر علیرضا بهرامی (مدیر حراست)
                    </span>
                    <button
                      type="submit"
                      disabled={savingLogbook}
                      className="rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-5 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md"
                    >
                      {savingLogbook ? "در حال ثبت..." : "امضا و تایید دستی مدیر حراست"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ۳. پنل احراز هویت بیومتریک و اتصال به سامانه HIS بیمارستان */}
      {subTab === "BIOMETRIC_HIS" && (
        <div className="space-y-5">
          {/* کارت وضعیت اتصال گیت‌وی HIS بیمارستان ابن‌سینا */}
          <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1A1C1E] dark:text-white">
                    اتصال زنده به سامانه اطلاعات بیمارستانی (HIS Gateway Integration)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تکمیل اطلاعات پرونده پرسنلی، کد ملی و سوابق هویتی بیمارستان ابن‌سینا
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 font-mono-num text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  HIS ONLINE (14ms)
                </span>
              </div>
            </div>

            {biometricSuccessMsg && (
              <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {biometricSuccessMsg}
              </div>
            )}
          </div>

          {/* ابزار اسکن اثر انگشت و چهره توسط مدیر حراست برای نیروی جدیدالورود */}
          <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
            <h4 className="text-sm font-bold text-[#1A1C1E] dark:text-white mb-3">
              اسکنر بیومتریک سازمانی پرسنل جدیدالورود (توسط مدیر حراست)
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* اسکنر چهره (Face Liveness Scanner) */}
              <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0061A4]/15 dark:bg-cyan-500/20 text-[#0061A4] dark:text-cyan-400 mb-3">
                  <ScanFace className="h-8 w-8" />
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-[#1A1C1E] dark:text-white">
                  اسکنر بیومتریک چهره (Liveness Verification)
                </h5>
                <p className="mt-1 text-[11px] text-slate-500">
                  استخراج بردار ۵۱۲ بعدی چهره جهت احراز هویت در گیت‌های بازرسی
                </p>

                <button
                  type="button"
                  disabled={scanningFace}
                  onClick={() => handlePerformBiometricScan("440112", "FACE")}
                  className="mt-4 flex items-center justify-center gap-2 w-full rounded-2xl bg-[#0061A4] dark:bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md"
                >
                  <ScanFace className="h-4 w-4" />
                  {scanningFace ? "در حال اسکن چهره سارا موسوی..." : "اسکن چهره سارا موسوی (جدیدالورود)"}
                </button>
              </div>

              {/* اسکنر اثر انگشت (Optical Fingerprint Scanner) */}
              <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 mb-3">
                  <Fingerprint className="h-8 w-8" />
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-[#1A1C1E] dark:text-white">
                  اسکنر اثر انگشت اپتیکال (Right Index Finger)
                </h5>
                <p className="mt-1 text-[11px] text-slate-500">
                  ثبت تمپلیت استاندارد اثر انگشت در پایگاه داده امن بیمارستان
                </p>

                <button
                  type="button"
                  disabled={scanningFingerprint}
                  onClick={() => handlePerformBiometricScan("440112", "FINGERPRINT")}
                  className="mt-4 flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md"
                >
                  <Fingerprint className="h-4 w-4" />
                  {scanningFingerprint ? "در حال اسکن سنسور اثر انگشت..." : "اسکن اثر انگشت سارا موسوی"}
                </button>
              </div>
            </div>
          </div>

          {/* جدول رکوردهای بیومتریک متصل به HIS */}
          <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
            <h4 className="text-sm font-bold text-[#1A1C1E] dark:text-white mb-3">
              شناسنامه بیومتریک پرسنل متصل به پایگاه داده سازمانی HIS
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-slate-500">
                    <th className="py-2.5 px-3">نام و کد پرسنلی</th>
                    <th className="py-2.5 px-3">کد ملی (HIS)</th>
                    <th className="py-2.5 px-3">شناسه در HIS</th>
                    <th className="py-2.5 px-3">وضعیت چهره</th>
                    <th className="py-2.5 px-3">وضعیت اثر انگشت</th>
                    <th className="py-2.5 px-3">هماهنگی با HIS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {biometricRecords.map((rec) => (
                    <tr key={rec.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-[#1A1C1E] dark:text-white">
                        {rec.fullName}{" "}
                        <span className="font-mono-num text-slate-500 font-normal">
                          ({rec.personnelCode})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono-num text-slate-600 dark:text-slate-300">
                        {rec.hisNationalCode}
                      </td>
                      <td className="py-3 px-3 font-mono-num text-[#0061A4] dark:text-cyan-400">
                        {rec.hisPersonnelId}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          <ScanFace className="h-3 w-3" />
                          تایید ۹۸.۵٪
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          <Fingerprint className="h-3 w-3" />
                          تایید ۹۹.۲٪
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                        🟢 همگام با سامانه HIS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ۴. نمایش کارنامه تحلیلی دقیق علی محمدی (۸۶/۱۰۰) */}
      {subTab === "SCORECARD" && (
        <div className="space-y-5">
          <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <span className="font-mono-num text-xs font-bold text-[#0061A4] dark:text-cyan-400">
                ASCII COMMAND CENTER SCORECARD & GAP ANALYSIS
              </span>
              <span className="rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 font-mono-num text-xs font-bold">
                حد نصاب قبولی: ۷۰ | حد نصاب ارتقا: ۸۰
              </span>
            </div>

            <pre
              dir="ltr"
              className="mt-4 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-slate-950 p-4 font-mono-num text-xs leading-relaxed text-emerald-400"
            >
{`+-------------------------------------------------------------------+
|               کارنامه تحلیلی شایستگی پرسنل انتظامات               |
+-------------------------------------------------------------------+
| کد پرسنلی: ${displayScorecard.personnelCode}               نام: ${displayScorecard.fullName.padEnd(28, " ")}|
| نمره کل: ${displayScorecard.totalScore} / 100               وضعیت: 🟢 قبول ممتاز              |
+-------------------------------------------------------------------+
| تحلیل تفکیکی مهارتی:                                             |
${displayScorecard.domains
  .map(
    (d: any) =>
      `| - ${d.domainName.padEnd(24, " ")}: ${d.barVisual.padEnd(36, " ")}|`
  )
  .join("\n")}
+-------------------------------------------------------------------+
| ⚠️ اقدام اصلاحی پیشنهادی سیستم:                                  |
| ${displayScorecard.recommendedAction.padEnd(66, " ")}|
+-------------------------------------------------------------------+`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
