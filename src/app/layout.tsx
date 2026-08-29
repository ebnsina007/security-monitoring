import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "سامانه جامع انتظامات و حراست ابن‌سینا | مانیتورینگ ۲۴ ساعته و ارزیابی شایستگی",
  description:
    "سامانه هوشمند مانیتورینگ ۲۴ ساعته انتظامات، گشت‌زنی ضد تقلب HMAC-QR با ژئوفنسینگ و پلتفرم آزمون شایستگی و هوش هیجانی اختصاصی مرکز درمانی ابن‌سینا",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#090D16",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="min-h-screen bg-[#090D16] text-[#F8FAFC] antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
