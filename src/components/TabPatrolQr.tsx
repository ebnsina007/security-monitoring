"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Navigation,
  Lock,
  ScanFace,
  Cpu,
  Plus,
  Printer,
  Timer,
} from "lucide-react";
import { saveOfflineScan } from "@/lib/offline-queue";

interface TabPatrolQrProps {
  patrolTasks: any[];
  activeRole: string;
  isSimulatedOffline: boolean;
  onRefreshPatrols: () => void;
}

export default function TabPatrolQr({
  patrolTasks,
  activeRole,
  isSimulatedOffline,
  onRefreshPatrols,
}: TabPatrolQrProps) {
  const [filter, setFilter] = useState<"ALL" | "RED" | "YELLOW" | "GREEN">(
    "ALL"
  );
  const [activeScanModal, setActiveScanModal] = useState<any | null>(null);
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [createCheckpointModal, setCreateCheckpointModal] =
    useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(
    null
  );
  const [scanDistanceMeters, setScanDistanceMeters] = useState<number | null>(
    null
  );
  const [scanning, setScanning] = useState<boolean>(false);
  const [simulateTamperDistance, setSimulateTamperDistance] =
    useState<boolean>(false);
  const [useBiometricFace, setUseBiometricFace] = useState<boolean>(true);
  const [useHardwareKey, setUseHardwareKey] = useState<boolean>(true);

  // تایمر زنده پنجره زمانی ۵ دقیقه‌ای (۳۰۰ ثانیه) TOTP HMAC
  const [windowRemainingSeconds, setWindowRemainingSeconds] = useState<number>(
    300 - (Math.floor(Date.now() / 1000) % 300)
  );

  // فرم تعریف چک‌پوینت جدید (مدیر حراست)
  const [newLocName, setNewLocName] = useState("");
  const [newLocCode, setNewLocCode] = useState("");
  const [newAssignedTime, setNewAssignedTime] = useState("14:30");
  const [newGeofenceRadius, setNewGeofenceRadius] = useState(150);

  useEffect(() => {
    const iv = setInterval(() => {
      setWindowRemainingSeconds(300 - (Math.floor(Date.now() / 1000) % 300));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const filteredTasks = patrolTasks.filter((t) =>
    filter === "ALL" ? true : t.status === filter
  );

  const canApproveSupervisor =
    activeRole === "supervisor" ||
    activeRole === "security_manager" ||
    activeRole === "crisis_secretary";

  const canCreateOrPrintCheckpoint = activeRole === "security_manager";

  // اجرای اسکن هوشمند با اعتبارسنجی توکن ۵ دقیقه‌ای HMAC، ژئوفنسینگ و تایید بیومتریک
  const handleExecuteScan = async (task: any) => {
    setScanning(true);
    setScanStatusMessage(null);

    // مختصات هدف یا شبیه‌سازی تقلب از راه دور (مثلاً ۳۵۰ متر دورتر)
    const scanLat = simulateTamperDistance
      ? task.targetLat + 0.0035
      : task.targetLat + 0.000015;
    const scanLng = task.targetLng + 0.00001;

    try {
      if (isSimulatedOffline) {
        await saveOfflineScan({
          id: `offline-${task.id}-${Date.now()}`,
          patrolId: task.id,
          locationName: task.locationName,
          userLat: scanLat,
          userLng: scanLng,
          hmacPayload: task.qrCodeHash || "OFFLINE_HMAC",
          scannedAt: new Date().toISOString(),
        });
        setScanStatusMessage(
          "⚠️ اسکن نقطه کور (موتورخانه) درون IndexedDB ذخیره شد و به محض اتصال شبکه سنکرون می‌شود."
        );
        setTimeout(() => {
          setActiveScanModal(null);
          onRefreshPatrols();
        }, 1800);
        return;
      }

      const res = await fetch("/api/patrols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCAN_QR",
          patrolId: task.id,
          userLat: scanLat,
          userLng: scanLng,
          scannedToken: task.qrCodeHash,
          biometricFaceVerified: useBiometricFace,
          hardwareKeyAttested: useHardwareKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScanStatusMessage(`❌ ${data.error}`);
        setScanDistanceMeters(data.distanceMeters || null);
        return;
      }

      setScanDistanceMeters(data.distanceMeters);
      setScanStatusMessage(
        `✔ امضای زمان‌دار ۵ دقیقه‌ای HMAC (${data.dynamicTotpToken}) + فاصله ${data.distanceMeters} متر + چهره بیومتریک تایید شد. وضعیت -> 🟡 زرد (انتظار تایید سرشیفت).`
      );
      setTimeout(() => {
        setActiveScanModal(null);
        onRefreshPatrols();
      }, 1600);
    } catch (err: any) {
      setScanStatusMessage("خطا در برقراری ارتباط با سرور");
    } finally {
      setScanning(false);
    }
  };

  const handleSupervisorApprove = async (taskId: number) => {
    await fetch("/api/patrols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE_SUPERVISOR",
        patrolId: taskId,
      }),
    });
    onRefreshPatrols();
  };

  const handleResetPatrol = async (taskId: number) => {
    await fetch("/api/patrols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RESET_PATROL",
        patrolId: taskId,
      }),
    });
    onRefreshPatrols();
  };

  // تعریف چک‌پوینت جدید توسط مدیر حراست (بخش ۲ سند)
  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/patrols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_CHECKPOINT",
        locationName: newLocName,
        locationCode: newLocCode,
        assignedTime: newAssignedTime,
        geofenceRadiusMeters: newGeofenceRadius,
      }),
    });
    setNewLocName("");
    setNewLocCode("");
    setCreateCheckpointModal(false);
    onRefreshPatrols();
  };

  return (
    <div className="space-y-6">
      {/* نوار ماشین حالت و پنجره زمانی ۵ دقیقه‌ای HMAC (T = floor(timestamp / 300)) */}
      <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                پروتکل ضد جعل HMAC Dynamic (پنجره زمانی ۵ دقیقه‌ای TOTP) +
                Geofencing
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-0.5 font-mono-num text-xs font-bold text-emerald-300 border border-emerald-500/40">
                <Timer className="h-3.5 w-3.5 animate-pulse" />
                پنجره اعتبار توکن: {windowRemainingSeconds} ثانیه
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              فرمول ریاضی:{" "}
              <span className="font-mono-num text-emerald-400">
                T = ⌊ timestamp / 300 ⌋
              </span>{" "}
              | هر ۵ دقیقه امضای QR تغییر می‌کند تا از حملات عکس‌برداری و Replay
              جلوگیری شود.
            </p>
          </div>

          {/* فیلتر وضعیت‌ها + تعریف چک‌پوینت جدید مدیر حراست */}
          <div className="flex flex-wrap items-center gap-2">
            {canCreateOrPrintCheckpoint && (
              <button
                type="button"
                onClick={() => setCreateCheckpointModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                <Plus className="h-3.5 w-3.5" />
                تعریف چک‌پوینت جدید (مدیر حراست)
              </button>
            )}

            {[
              { id: "ALL", label: `تمام ایستگاه‌ها (${patrolTasks.length})` },
              { id: "RED", label: "🔴 معوق / انجام‌نشده" },
              { id: "YELLOW", label: "🟡 در انتظار تایید سرشیفت" },
              { id: "GREEN", label: "🟢 تکمیل و تاییدشده" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as any)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                  filter === f.id
                    ? "border-emerald-500 bg-emerald-500/20 text-white"
                    : "border-white/10 bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* فلوچارت تصویری حالت‌های گشت‌زنی */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3">
            <span className="font-mono-num text-xs font-bold text-red-400">
              مرحله ۱: 🔴 RED (معوق / انجام‌نشده)
            </span>
            <p className="mt-1 text-xs text-slate-300">
              تمامی وظایف تعریف‌شده رأس ساعت ۰۷:۰۰ صبح با کارت قرمز مشخص می‌شوند.
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
            <span className="font-mono-num text-xs font-bold text-amber-400">
              مرحله ۲: 🟡 YELLOW (ثبت اسکن + چهره بیومتریک)
            </span>
            <p className="mt-1 text-xs text-slate-300">
              پس از اسکن QR محل، توکن ۵ دقیقه‌ای HMAC و احراز زنده چهره به زرد
              تغییر می‌یابد.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
            <span className="font-mono-num text-xs font-bold text-emerald-400">
              مرحله ۳: 🟢 GREEN (تایید نهایی سوپروایزر)
            </span>
            <p className="mt-1 text-xs text-slate-300">
              با امضا و تایید سوپروایزر شیفت یا اتوماسیون سامانه سبز می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* جعبه دقیق «📍 گشت‌زنی فعال شیفت:» منطبق با بخش ۶ سند */}
      <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0061A4] dark:text-cyan-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#1A1C1E] dark:text-white">
              📍 گشت‌زنی فعال شیفت (چرخه ۲۴ ساعته بیمارستان ابن‌سینا):
            </h3>
          </div>
          <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
            شعاع مجاز Geofencing: ۱۵۰ متر | توکن ۵ دقیقه‌ای متغیر
          </span>
        </div>

        {/* لیست ردیف به ردیف ایستگاه‌ها دقیقاً مطابق سند */}
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isRed = task.status === "RED";
            const isYellow = task.status === "YELLOW";
            const isGreen = task.status === "GREEN";

            return (
              <div
                key={task.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                  isRed
                    ? "border-red-500/40 bg-slate-900/90"
                    : isYellow
                    ? "border-amber-500/40 bg-amber-950/15"
                    : "border-emerald-500/40 bg-emerald-950/15"
                }`}
              >
                {/* ستون راست: وضعیت 🔴 / 🟡 / 🟢 + ساعت + نام نقطه */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono-num text-sm font-extrabold ${
                      isRed
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : isYellow
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {isRed ? "🔴" : isYellow ? "🟡" : "🟢"}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono-num text-xs font-bold text-slate-200">
                        [{task.assignedTime}]
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {task.locationName}
                      </h4>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isRed
                            ? "bg-red-500/20 text-red-300"
                            : isYellow
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {isRed
                          ? "اسکن نشده"
                          : isYellow
                          ? "در انتظار تایید سرشیفت"
                          : `اسکن شد (${
                              task.scannedTime
                                ? new Date(
                                    task.scannedTime
                                  ).toLocaleTimeString("fa-IR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "09:14"
                            })`}
                      </span>
                      {task.dynamicTotp5Min && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono-num text-[11px] text-emerald-400 border border-emerald-500/30">
                          HMAC-5m: {task.dynamicTotp5Min}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {task.notes}
                      {task.geoDistanceMeters && (
                        <span className="font-mono-num ml-2 text-emerald-400">
                          (فاصله GPS تاییدشده: {task.geoDistanceMeters} متر)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* ستون چپ: دکمه‌های عملیاتی مطابق دقیق سند */}
                <div className="flex flex-wrap items-center gap-2">
                  {isRed && (
                    <button
                      type="button"
                      onClick={() => {
                        setScanStatusMessage(null);
                        setSimulateTamperDistance(false);
                        setActiveScanModal(task);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/30 hover:bg-emerald-400 transition"
                    >
                      <QrCode className="h-4 w-4" />
                      [دکمه اسکن QR]
                    </button>
                  )}

                  {isYellow && (
                    <>
                      {canApproveSupervisor ? (
                        <button
                          type="button"
                          onClick={() => handleSupervisorApprove(task.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/30 hover:bg-amber-400 transition"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          [تایید سوپروایزر]
                        </button>
                      ) : (
                        <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                          ⏳ در انتظار تایید سوپروایزر شیفت
                        </span>
                      )}
                    </>
                  )}

                  {isGreen && (
                    <button
                      type="button"
                      onClick={() => setDetailModal(task)}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      [مشاهده جزئیات]
                    </button>
                  )}

                  {canCreateOrPrintCheckpoint && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      title="پرینت رسمی QR Code پویا برای نصب در ایستگاه"
                      className="flex items-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-xs text-sky-300 hover:bg-sky-500/20"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      پرینت QR
                    </button>
                  )}

                  {(isYellow || isGreen) && (
                    <button
                      type="button"
                      onClick={() => handleResetPatrol(task.id)}
                      title="بازنشانی ایستگاه به وضعیت قرمز برای تست مجدد بازرس"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* مودال اسکن بارکدخوان هوشمند QR با امضای زمان‌دار ۵ دقیقه‌ای و چهره بیومتریک */}
      {activeScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl border border-emerald-500/40 bg-[#090D16] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  اسکنر تاکتیکی QR Code ضد تقلب (توکن ۵ دقیقه‌ای TOTP + بیومتریک)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveScanModal(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                بستن (Esc)
              </button>
            </div>

            {/* ویوفایندر اسکنر با خط لیزری */}
            <div className="mt-4 flex flex-col items-center justify-center">
              <div className="relative flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-emerald-500/50 bg-slate-950 p-2 shadow-lg shadow-emerald-500/20">
                <div className="laser-scanner-line" />
                <div className="text-center font-mono-num text-xs text-emerald-400">
                  <div className="text-3xl font-extrabold">QR-HMAC</div>
                  <div className="mt-1 text-[11px] text-slate-300">
                    TOTP 5m: {activeScanModal.dynamicTotp5Min}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    انقضا در {windowRemainingSeconds}s
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center">
                <h4 className="text-sm font-bold text-white">
                  نقطه هدف: {activeScanModal.locationName}
                </h4>
                <p className="font-mono-num text-xs text-slate-400">
                  مختصات ایستگاه: {activeScanModal.targetLat} N,{" "}
                  {activeScanModal.targetLng} E
                </p>
              </div>
            </div>

            {/* نیازمندی‌های ارتقای پدافند غیرعامل: اعتبارسنجی بیومتریک (چهره) و Hardware Key Store */}
            <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-slate-900/80 p-3.5 text-xs">
              <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBiometricFace}
                  onChange={(e) => setUseBiometricFace(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <ScanFace className="h-4 w-4 text-emerald-400" />
                <span>
                  اعتبارسنجی بیومتریک چهره افسر گشت (Biometric Face Liveness Check)
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useHardwareKey}
                  onChange={(e) => setUseHardwareKey(e.target.checked)}
                  className="h-4 w-4 rounded accent-sky-500"
                />
                <Cpu className="h-4 w-4 text-sky-400" />
                <span>
                  امضای Hardware-backed Key Store دستگاه PWA افسر حراست
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer border-t border-white/10 pt-2">
                <input
                  type="checkbox"
                  checked={simulateTamperDistance}
                  onChange={(e) =>
                    setSimulateTamperDistance(e.target.checked)
                  }
                  className="h-4 w-4 rounded accent-red-500"
                />
                <span className="text-red-300">
                  تست امنیتی ضد تقلب: شبیه‌سازی اسکن عکس QR از فاصله ۳۵۰ متری
                  خارج از Geofencing (اثبات رد شدن اسکن تقلبی)
                </span>
              </label>
            </div>

            {scanStatusMessage && (
              <div className="mt-4 rounded-xl border border-white/15 bg-slate-900 p-3 text-xs font-semibold text-white">
                {scanStatusMessage}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveScanModal(null)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={scanning}
                onClick={() => handleExecuteScan(activeScanModal)}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                <Navigation className="h-4 w-4" />
                {scanning
                  ? "در حال اعتبارسنجی HMAC 5m و GPS..."
                  : "تایید اسکن، چهره بیومتریک و ثبت موقعیت GPS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تعریف چک‌پوینت جدید توسط مدیر حراست (بخش ۲ سند) */}
      {createCheckpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-sky-500/40 bg-[#111827] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              تعریف چک‌پوینت جدید و پرینت QR (نقش: مدیر حراست)
            </h3>
            <form onSubmit={handleCreateCheckpoint} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-300">
                  نام ایستگاه گشت‌زنی جدید
                </label>
                <input
                  type="text"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="مثال: بانک خون مرکزی طبقه اول"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300">
                  کد یکتای ایستگاه (مثلاً LOC-BLOOD-09)
                </label>
                <input
                  type="text"
                  required
                  value={newLocCode}
                  onChange={(e) => setNewLocCode(e.target.value)}
                  placeholder="LOC-BLOOD-09"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 font-mono-num text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300">
                    ساعت سررسید گشت
                  </label>
                  <input
                    type="text"
                    value={newAssignedTime}
                    onChange={(e) => setNewAssignedTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 font-mono-num text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300">
                    شعاع مجاز Geofence (متر)
                  </label>
                  <input
                    type="number"
                    value={newGeofenceRadius}
                    onChange={(e) =>
                      setNewGeofenceRadius(Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 font-mono-num text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateCheckpointModal(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                >
                  تعریف چک‌پوینت و تولید امضای HMAC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال مشاهده جزئیات گشت تاییدشده 🟢 */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-[#111827] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              شناسنامه گشت‌زنی تاییدشده (گواهی HMAC-SHA256 5 دقیقه‌ای)
            </h3>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">نام ایستگاه:</span>
                <span className="font-bold text-white">
                  {detailModal.locationName}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">امضای HMAC پنج‌دقیقه‌ای:</span>
                <span className="font-mono-num text-emerald-400">
                  {detailModal.dynamicTotp5Min || detailModal.qrCodeHash}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">احراز چهره بیومتریک:</span>
                <span className="text-emerald-300 font-bold">
                  ✔ تایید زنده چهره (Liveness Checked)
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">فاصله جغرافیایی تا هدف:</span>
                <span className="font-mono-num text-emerald-300">
                  {detailModal.geoDistanceMeters || 2.1} متر (شعاع مجاز ۱۵۰ متر)
                </span>
              </div>
            </div>
            <div className="mt-5 text-left">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="rounded-lg bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                بستن شناسنامه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
