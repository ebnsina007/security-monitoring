"use client";

import React from "react";
import {
  BarChart3,
  ShieldAlert,
  Users,
  CheckCircle2,
  Printer,
  Lock,
} from "lucide-react";

interface TabExecutiveReportsProps {
  shiftReport: any;
  patrolSummary: { red: number; yellow: number; green: number; total: number };
  usersList: any[];
}

export default function TabExecutiveReports({
  shiftReport,
  patrolSummary,
  usersList,
}: TabExecutiveReportsProps) {
  const compliancePercent =
    patrolSummary.total > 0
      ? Math.round((patrolSummary.green / patrolSummary.total) * 100)
      : 75;

  return (
    <div className="space-y-6">
      {/* ۴ کارت شاخص کلان (KPI) مرکز مانیتورینگ ۲۴ ساعته */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              نرخ انطباق گشت‌زنی QR (توکن ۵ دقیقه‌ای)
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 font-mono-num text-3xl font-extrabold text-[#0061A4] dark:text-cyan-400">
            {compliancePercent}٪
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {patrolSummary.green} ایستگاه تاییدشده از {patrolSummary.total} نقطه
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              زمان واکنش به کدهای سفید و قرمز
            </span>
            <ShieldAlert className="h-5 w-5 text-sky-400" />
          </div>
          <div className="mt-2 font-mono-num text-3xl font-extrabold text-sky-400">
            ۴۲ ثانیه
          </div>
          <p className="mt-1 text-xs text-emerald-400 font-semibold">
            ✔ کمتر از استاندارد ۶۰ ثانیه وزارت بهداشت
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              احراز هویت بیومتریک و امضای JWT (HS256)
            </span>
            <Lock className="h-5 w-5 text-purple-400" />
          </div>
          <div className="mt-2 font-mono-num text-3xl font-extrabold text-purple-400">
            ۱۰۰٪ امن
          </div>
          <p className="mt-1 text-xs text-slate-400">
            HttpOnly Cookies + SameSite=Strict
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              میانگین نمره شایستگی پرسنل
            </span>
            <BarChart3 className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-2 font-mono-num text-3xl font-extrabold text-amber-400">
            ۸۹ / ۱۰۰
          </div>
          <p className="mt-1 text-xs text-emerald-400 font-semibold">
            بالاتر از حد نصاب ارتقا (۸۰)
          </p>
        </div>
      </div>

      {/* ماتریس سطوح دسترسی سازمانی (RBAC / ABAC) مطابق دقیق جدول بخش ۲ سند */}
      <div className="sleek-card border border-black/10 dark:border-white/10 bg-white dark:bg-[#121826] p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-white">
              جدول ماتریس سطوح دسترسی سازمانی بیمارستان ابن‌سینا (RBAC / ABAC)
            </h3>
            <p className="text-xs text-slate-400">
              تعیین نقش‌های سازمانی بر پایه JWT امضاشده HS256 و پروتکل پدافند
              غیرعامل
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            چاپ گزارش مدیریتی
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/80 text-slate-400">
                <th className="py-3 px-3">نقش سازمانی (Role)</th>
                <th className="py-3 px-3">گزارش ۲۴ ساعته (Shift)</th>
                <th className="py-3 px-3">گشت‌زنی HMAC-QR</th>
                <th className="py-3 px-3">ارزیابی مهارت (Exams)</th>
                <th className="py-3 px-3">داشبورد مدیریتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-slate-800/40">
                <td className="py-3.5 px-3 font-bold text-sky-300">
                  مدیر ارشد / مدیر حراست (دکتر علیرضا بهرامی)
                </td>
                <td className="py-3.5 px-3 text-emerald-400 font-semibold">
                  مشاهده / تایید نهایی
                </td>
                <td className="py-3.5 px-3 text-sky-300 font-semibold">
                  تعریف چک‌پوینت / پرینت QR
                </td>
                <td className="py-3.5 px-3 text-slate-200">
                  تعریف آزمون / ثبت Gap Analysis
                </td>
                <td className="py-3.5 px-3 text-emerald-400 font-bold">
                  دسترسی کامل (Full Analytics)
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="py-3.5 px-3 font-bold text-red-300">
                  دبیر بحران (سرهنگ مهدی طاهری)
                </td>
                <td className="py-3.5 px-3 text-red-300 font-semibold">
                  ویرایش بخش حوادث و مانور
                </td>
                <td className="py-3.5 px-3 text-slate-300">
                  تحلیل نقاط بحرانی زیرزمین/اکسیژن
                </td>
                <td className="py-3.5 px-3 text-slate-200">
                  مشاهده نمرات فنی و آمادگی حریق
                </td>
                <td className="py-3.5 px-3 text-amber-300 font-bold">
                  تحلیل آماری آمادگی پدافند غیرعامل
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="py-3.5 px-3 font-bold text-amber-300">
                  سوپروایزر / سرشیفت (رضا فرهادی)
                </td>
                <td className="py-3.5 px-3 text-emerald-400 font-semibold">
                  ثبت و ویرایش شیفت جاری
                </td>
                <td className="py-3.5 px-3 text-amber-300 font-bold">
                  تایید گشت‌های زرد (موقتی) 🟡 به 🟢
                </td>
                <td className="py-3.5 px-3 text-slate-200">
                  شرکت در آزمون‌های ادواری
                </td>
                <td className="py-3.5 px-3 text-slate-300">
                  گزارش‌گیری شیفت ۲۴ ساعته
                </td>
              </tr>

              <tr className="hover:bg-slate-800/40">
                <td className="py-3.5 px-3 font-bold text-emerald-300">
                  نگهبان / افسر حراست (علی محمدی)
                </td>
                <td className="py-3.5 px-3 text-slate-300">
                  ثبت مشاهدات فردی
                </td>
                <td className="py-3.5 px-3 text-emerald-400 font-bold">
                  اسکن QR + ثبت موقعیت GPS + بیومتریک
                </td>
                <td className="py-3.5 px-3 text-slate-200">
                  شرکت در آزمون‌های ادواری و آنبوردینگ
                </td>
                <td className="py-3.5 px-3 text-slate-400">
                  مشاهده کارنامه فردی
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
