"use client";

let deferredPrompt: any = null;

export function initServiceWorker(): void {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("PWA Service Worker registration failed:", err);
        });
    });
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export async function promptPwaInstall(): Promise<boolean> {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === "accepted";
  }
  return false;
}

export function triggerHapticFeedback(pattern: number | number[] = 50): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // نادیده گرفتن در صورت عدم پشتیبانی مرورگر
    }
  }
}
