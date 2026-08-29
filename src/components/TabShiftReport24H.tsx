"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Users,
  AlertTriangle,
  Radio,
  Truck,
  ShieldAlert,
  UserCheck,
  Building2,
  CheckCircle2,
  Plus,
  HeartPulse,
  Flame,
  BadgeCheck,
  Clock,
  Filter,
  Send,
  Printer,
  CheckCircle,
  Sparkles,
  Search,
  Download,
} from "lucide-react";
import {
  addShiftEventToRoom,
  getAllShiftEventsFromRoom,
  ShiftEventEntity,
} from "@/lib/room-db";

interface TabShiftReport24HProps {
  shiftReport: any;
  activeRole: string;
  onRefreshReport: () => void;
}

export default function TabShiftReport24H({
  shiftReport,
  activeRole,
  onRefreshReport,
}: TabShiftReport24HProps) {
  const [activeSection, setActiveSection] = useState<string>("eventsLog");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // سیستم ثبت و مدیریت آنی وقایع شیفت (Daily Shift Security Event Manager)
  const [localRoomEvents, setLocalRoomEvents] = useState<ShiftEventEntity[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventSeverity, setEventSeverity] = useState<
    "NORMAL" | "WARNING" | "CRITICAL"
  >("NORMAL");
  const [eventLocation, setEventLocation] = useState("ورودی اورژانس و تریاژ");
  const [eventFilter, setEventFilter] = useState<
    "ALL" | "NORMAL" | "WARNING" | "CRITICAL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [supervisorCommentInput, setSupervisorCommentInput] = useState(
    shiftReport?.supervisorComment || "وضعیت حراستی مرکز درمانی ابن‌سینا در ۲۴ ساعت گذشته پایدار و گزارشات ثبت گردید."
  );

  // بارگذاری وقایع از Room IndexedDB محلی
  useEffect(() => {
    const loadRoomEvents = async () => {
      const list = await getAllShiftEventsFromRoom();
      setLocalRoomEvents(list);
    };
    loadRoomEvents();
  }, []);

  const handleAddShiftEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDesc.trim()) return;
    setSubmitting(true);

    try {
      const finalTitle =
        eventTitle.trim() ||
        (eventSeverity === "CRITICAL"
          ? "رویداد بحرانی شیفت"
          : eventSeverity === "WARNING"
          ? "اخطار و هشدار شیفت"
          : "گزارش وضعیت جاری");

      // ۱. ذخیره در دیتابیس محلی اتاق (Room Local Db)
      const newRoomEvent = await addShiftEventToRoom(
        `[${finalTitle}] ${eventDesc} (${eventLocation})`,
        eventSeverity,
        "علی محمدی (پست ۲)",
        eventLocation
      );
      setLocalRoomEvents((prev) => [newRoomEvent, ...prev]);

      // ۲. سنکرون با سرور PostgreSQL
      await fetch("/api/shift-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_SECTION_ENTRY",
          reportId: shiftReport?.id || 1,
          sectionKey: "eventsLog",
          newEntry: {
            time: newRoomEvent.timeDisplay,
            title: finalTitle,
            description: `${eventDesc} — مکان: ${eventLocation}`,
            severity: eventSeverity,
          },
        }),
      });

      setEventTitle("");
      setEventDesc("");
      onRefreshReport();
    } finally {
      setSubmitting(false);
    }
  };

  // قالب‌های سریع برای ثبت فوری وقایع توسط نگهبان
  const setQuickTemplate = (
    title: string,
    desc: string,
    sev: "NORMAL" | "WARNING" | "CRITICAL",
    loc: string
  ) => {
    setEventTitle(title);
    setEventDesc(desc);
    setEventSeverity(sev);
    setEventLocation(loc);
  };

  // تایید و امضای رسمی سوپروایزر وقت
  const handleSupervisorSign = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/shift-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUPERVISOR_SIGNOFF",
          reportId: shiftReport?.id || 1,
          comment: supervisorCommentInput,
        }),
      });
      onRefreshReport();
    } finally {
      setSubmitting(false);
    }
  };

  const isReadonly = activeRole === "super_admin";
  const canSupervisorSign =
    activeRole === "supervisor" || activeRole === "security_manager";

  const sections = [
    {
      key: "eventsLog",
      title: "ثبت وقایع شیفت (Room Event DB)",
      icon: FileText,
      count:
        (shiftReport?.eventsLog?.length || 0) + localRoomEvents.length,
      badgeColor: "bg-[#0061A4]/15 text-[#0061A4] dark:bg-cyan-500/20 dark:text-cyan-300",
    },
    {
      key: "personnelStatus",
      title: "پست‌بندی و حضور پرسنل",
      icon: Users,
      count: shiftReport?.personnelStatus?.length || 0,
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "incidentsLog",
      title: "کدهای اورژانس (سفید، قرمز، ۳۳)",
      icon: ShieldAlert,
      count: shiftReport?.incidentsLog?.length || 0,
      badgeColor: "bg-red-500/15 text-red-700 dark:text-red-300",
    },
    {
      key: "equipmentCheck",
      title: "تجهیزات و بی‌سیم‌ها",
      icon: Radio,
      count: shiftReport?.equipmentCheck?.length || 0,
      badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "contractorsLog",
      title: "پیمانکاران و پرمیت کار گرم",
      icon: Flame,
      count: shiftReport?.contractorsLog?.length || 0,
      badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    {
      key: "facilityChecklist",
      title: "بازرسی اماکن (موتورخانه)",
      icon: Building2,
      count: shiftReport?.facilityChecklist?.length || 0,
      badgeColor: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    },
  ];

  // ترکیب وقایع محلی و سروری
  const allEvents = [
    ...localRoomEvents.map((e) => ({
      time: e.timeDisplay,
      title:
        e.severity === "CRITICAL"
          ? "رویداد بحرانی (محلی Room)"
          : e.severity === "WARNING"
          ? "هشدار شیفت (محلی Room)"
          : "گزارش عادی (محلی Room)",
      description: e.description,
      severity: e.severity,
      isLocal: true,
    })),
    ...(shiftReport?.eventsLog || []),
  ];

  const filteredEvents = allEvents.filter((ev) => {
    const matchesFilter = eventFilter === "ALL" ? true : ev.severity === eventFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (ev.title && ev.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* کارت سربرگ مشخصات شیفت با استایل Sleek Interface */}
      <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-2xl bg-[#0061A4]/15 dark:bg-cyan-500/20 px-3 py-1 font-mono-num text-xs font-bold text-[#0061A4] dark:text-cyan-300 border border-[#0061A4]/20">
                {shiftReport?.shiftCode || "IBN-SINA-24H"}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-[#1A1C1E] dark:text-white">
                پنل ثبت گزارش روزانه ۲۴ ساعته انتظامات بیمارستان ابن‌سینا
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              دوره شیفت:{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {shiftReport?.shiftType || "۰۷:۰۰ الی ۰۷:۰۰ روز بعد"}
              </span>{" "}
              | تاریخ:{" "}
              <span className="font-mono-num font-bold text-[#1A1C1E] dark:text-white">
                {shiftReport?.shiftDate || "1403/12/05"}
              </span>{" "}
              | سوپروایزر مسئول:{" "}
              <span className="font-bold text-[#1A1C1E] dark:text-white">
                رضا فرهادی (کد 200201)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-2xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
            >
              <Printer className="h-4 w-4" />
              چاپ دفتر شیفت
            </button>

            <span className="rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle className="h-3.5 w-3.5" />
              دفتر الکترونیک فعال
            </span>
          </div>
        </div>
      </div>

      {/* فرم ثبت گزارش روزانه با انتخاب الگوهای سریع نگهبانان */}
      {!isReadonly && (
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#0061A4] dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-[#1A1C1E] dark:text-white">
                ثبت رویداد جدید در دفتر روزانه (گزارش‌دهنده: نگهبان شیفت)
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              ثبت زنده: {new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {/* الگوهای آماده پرکاربرد برای سهولت و سرعت نگهبانان */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] font-bold">الگوهای سریع:</span>
            <button
              type="button"
              onClick={() =>
                setQuickTemplate(
                  "تحویل و تحول پست و بی‌سیم",
                  "تجهیزات بی‌سیم دیجیتال، گیت بازرسی و کلیدهای حفاظتی سالم تحویل گرفته شد.",
                  "NORMAL",
                  "پست ۲ - ورودی اورژانس"
                )
              }
              className="rounded-xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              🔄 تحویل شیفت و بی‌سیم
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickTemplate(
                  "اعلام کد سفید (تنش در تریاژ)",
                  "همراه بیمار در تریاژ دچار تنش کلامی شد؛ مداخله سریع انتظامات و آرام‌سازی انجام شد.",
                  "CRITICAL",
                  "تریاژ اورژانس مرکزی"
                )
              }
              className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:text-red-300 hover:bg-red-100"
            >
              🚨 کد سفید اورژانس
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickTemplate(
                  "بازرسی ایمنی موتورخانه و اکسیژن",
                  "فشار مخزن اکسیژن مایع روی ۵.۵ بار و دمای اتاق بویلر نرمال بررسی شد.",
                  "NORMAL",
                  "موتورخانه مرکزی زیرزمین"
                )
              }
              className="rounded-xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              ⚙️ بازرسی تاسیسات
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickTemplate(
                  "اخطار توقف غیرمجاز در مسیر آمبولانس",
                  "خودرو در مسیر ورودی رمپ اورژانس توقف کرده بود؛ با تماس حراست جابجا شد.",
                  "WARNING",
                  "رمپ ورود آمبولانس"
                )
              }
              className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100"
            >
              ⚠️ سد معبر آمبولانس
            </button>
          </div>

          <form onSubmit={handleAddShiftEvent} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                  عنوان واقعه
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="مثال: بازرسی موتورخانه یا اعلام کد سفید"
                  className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs text-[#1A1C1E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                  مکان رویداد در بیمارستان
                </label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="پست ۲ - اورژانس / موتورخانه / گیت اصلی"
                  className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs text-[#1A1C1E] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1C1E] dark:text-slate-300 mb-1">
                شرح دقیق گزارش عینی نگهبان
              </label>
              <textarea
                rows={2}
                required
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                placeholder="توضیحات واقعه، اقدامات انجام‌شده، افراد درگیر و نتیجه..."
                className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-[#F7F9FF] dark:bg-slate-900 px-3 py-2 text-xs text-[#1A1C1E] dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-bold">سطح شدت:</span>
                {[
                  {
                    id: "NORMAL",
                    label: "🟢 عادی",
                    color: "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
                  },
                  {
                    id: "WARNING",
                    label: "🟡 هشدار",
                    color: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
                  },
                  {
                    id: "CRITICAL",
                    label: "🔴 بحرانی",
                    color: "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300",
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setEventSeverity(s.id as any)}
                    className={`rounded-xl border px-3 py-1 font-bold text-xs ${
                      eventSeverity === s.id
                        ? `${s.color} ring-1 ring-[#0061A4]`
                        : "border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting || !eventDesc.trim()}
                className="flex items-center gap-1.5 rounded-2xl bg-[#0061A4] dark:bg-cyan-500 px-6 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "در حال ثبت..." : "ثبت گزارش در دفتر شیفت"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ناوبری بخش‌های ۱۰ گانه گزارش ۲۴ ساعته */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => setActiveSection(sec.key)}
              className={`sleek-card flex flex-col items-center justify-center p-3 text-center transition-all ${
                isActive
                  ? "border-2 border-[#0061A4] dark:border-cyan-400 bg-white dark:bg-[#121826] shadow-md"
                  : "border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                  isActive
                    ? "bg-[#0061A4] dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="mt-2 text-xs font-bold text-[#1A1C1E] dark:text-white line-clamp-1">
                {sec.title}
              </span>
              <span
                className={`mt-1 rounded-full px-2 py-0.2 font-mono-num text-[11px] font-bold ${sec.badgeColor}`}
              >
                {sec.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* بخش نمایش و جستجوی وقایع روزانه شیفت */}
      {activeSection === "eventsLog" && (
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 dark:border-white/10 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1A1C1E] dark:text-white">
                دفتر ثبت وقایع شیفت ۲۴ ساعته ({filteredEvents.length} رویداد)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مشاهده لحظه‌ای وقایع ثبت‌شده در اتاق دیتابیس محلی و دیتابیس مرکزی
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* کادر جستجو */}
              <div className="relative">
                <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در رویدادها..."
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 pr-8 pl-3 py-1 text-xs text-[#1A1C1E] dark:text-white focus:outline-none"
                />
              </div>

              {/* فیلتر سطح اهمیت */}
              <div className="flex items-center gap-1 text-xs">
                {[
                  { id: "ALL", label: "همه" },
                  { id: "CRITICAL", label: "🔴 بحرانی" },
                  { id: "WARNING", label: "🟡 هشدار" },
                  { id: "NORMAL", label: "🟢 عادی" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEventFilter(f.id as any)}
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                      eventFilter === f.id
                        ? "bg-[#0061A4] dark:bg-cyan-500 text-white dark:text-slate-950"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredEvents.map((ev, idx) => {
              const isCrit = ev.severity === "CRITICAL";
              const isWarn = ev.severity === "WARNING";

              return (
                <div
                  key={idx}
                  className={`sleek-card flex flex-col gap-2 p-4 transition border ${
                    isCrit
                      ? "border-red-500/40 bg-red-50/70 dark:bg-red-950/20"
                      : isWarn
                      ? "border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20"
                      : "border-black/10 dark:border-white/10 bg-white dark:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono-num text-xs font-bold text-[#0061A4] dark:text-cyan-400">
                        <Clock className="h-3.5 w-3.5" />
                        {ev.time}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1A1C1E] dark:text-white">
                        {ev.title}
                      </h4>
                    </div>

                    <span
                      className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                        isCrit
                          ? "bg-red-600 text-white"
                          : isWarn
                          ? "bg-amber-500 text-slate-950"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {isCrit ? "بحرانی" : isWarn ? "هشدار" : "عادی"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                    {ev.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* بخش امضا و تایید نهایی شیفت توسط سوپروایزر وقت */}
          <div className="mt-6 border-t border-black/5 dark:border-white/10 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1A1C1E] dark:text-white">
                    نظریه و امضای سوپروایزر شیفت ۲۴ ساعته
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {shiftReport?.supervisorComment || supervisorCommentInput}
                  </p>
                </div>
              </div>

              {canSupervisorSign && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSupervisorSign}
                  className="rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-5 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md"
                >
                  امضا و امهار رسمی شیفت ۲۴ ساعته
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* سایر تب‌های گزارش روزانه */}
      {activeSection === "personnelStatus" && (
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#1A1C1E] dark:text-white mb-3">
            حضور و غیاب پرسنل در ۱۲ پست حفاظتی بیمارستان ابن‌سینا
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-slate-500">
                  <th className="py-2 px-3">نام پست</th>
                  <th className="py-2 px-3">نام پرسنل</th>
                  <th className="py-2 px-3">کد پرسنلی</th>
                  <th className="py-2 px-3">ساعت تحویل</th>
                  <th className="py-2 px-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {(shiftReport?.personnelStatus || []).map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-[#1A1C1E] dark:text-white">
                      {p.post}
                    </td>
                    <td className="py-3 px-3 text-[#0061A4] dark:text-cyan-400 font-semibold">
                      {p.officerName}
                    </td>
                    <td className="py-3 px-3 font-mono-num text-slate-600 dark:text-slate-300">
                      {p.personnelCode}
                    </td>
                    <td className="py-3 px-3 font-mono-num text-slate-600 dark:text-slate-300">
                      {p.handoverTime}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                        🟢 حاضر در پست
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === "incidentsLog" && (
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
            گزارش کدهای هشدار بیمارستانی (کد سفید، کد قرمز، کد ۳۳)
          </h3>
          {(shiftReport?.incidentsLog || []).map((inc: any, i: number) => (
            <div
              key={i}
              className="sleek-card border border-red-300 dark:border-red-500/30 bg-red-50/70 dark:bg-red-950/20 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="beacon-pulse-red rounded-xl bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {inc.code}
                </span>
                <span className="font-mono-num text-xs text-slate-500">
                  ساعت {inc.time}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-[#1A1C1E] dark:text-white">
                {inc.title}
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                اقدام: {inc.resolution}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeSection === "equipmentCheck" && (
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#1A1C1E] dark:text-white mb-3">
            وضعیت تجهیزات، بی‌سیم‌ها و گیت‌های حراست
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(shiftReport?.equipmentCheck || []).map((eqItem: any, i: number) => (
              <div
                key={i}
                className="sleek-card border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[#1A1C1E] dark:text-white">
                    {eqItem.item}
                  </h4>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.2 text-[10px] font-bold">
                    {eqItem.batteryLevel || "سالم"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {eqItem.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "contractorsLog" && (
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3">
            پیمانکاران و پرمیت‌های کار گرم
          </h3>
          {(shiftReport?.contractorsLog || []).map((c: any, i: number) => (
            <div
              key={i}
              className="sleek-card border border-amber-300 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-[#1A1C1E] dark:text-white">
                  {c.company}
                </h4>
                <span className="font-mono-num text-xs font-bold text-amber-700 dark:text-amber-400">
                  پرمیت: {c.permitNumber}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                نوع کار: {c.workType} | ورود: {c.entryTime} | اسکورت: {c.escortOfficer}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeSection === "facilityChecklist" && (
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#0061A4] dark:text-cyan-400 mb-3">
            چک‌لیست بازرسی اماکن حساس (موتورخانه، اکسیژن، سرور)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(shiftReport?.facilityChecklist || []).map((fc: any, i: number) => (
              <div
                key={i}
                className="sleek-card border border-black/10 dark:border-white/10 bg-[#F7F9FF] dark:bg-slate-900 p-3.5"
              >
                <span className="text-xs font-bold text-[#1A1C1E] dark:text-white block">
                  {fc.zone}
                </span>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {fc.notes}
                </p>
                <span className="mt-2 text-[10px] text-slate-400 block font-mono-num">
                  بازدید: {fc.checkedBy} ساعت {fc.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
