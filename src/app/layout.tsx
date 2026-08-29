import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "سامانه جامع انتظامات و حراست ابن‌سینا | مانیتورینگ ۲۴ ساعته و ارزیابی شایستگی",
  description:
    "سامانه هوشمند مانیتورینگ ۲۴ ساعته انتظامات، گشت‌زنی QR ضد تقلب با امضای HMAC زمان‌دار و ژئوفنسینگ، احراز هویت بیومتریک و پلتفرم آزمون شایستگی مرکز درمانی ابن‌سینا",
  manifest: "/manifest.json",
  applicationName: "انتظامات ابن‌سینا",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "انتظامات ابن‌سینا",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#091428" },
    { media: "(prefers-color-scheme: light)", color: "#0061A4" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <head>
        {/* متاتگ‌های اختصاصی وب‌اپلیکیشن اپل برای تجربه بومی iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="انتظامات ابن‌سینا" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[#F7F9FF] dark:bg-[#090D16] text-[#1A1C1E] dark:text-[#F8FAFC] antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
