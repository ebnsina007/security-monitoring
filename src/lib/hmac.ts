import crypto from "crypto";

const DEFAULT_HMAC_SECRET =
  process.env.AVICENNA_HMAC_SECRET ||
  "AVICENNA-MEDICAL-CENTER-SECURITY-HMAC-KEY-2026-SHIELD";

/**
 * تولید توکن پویا بر پایه پنجره زمانی ۵ دقیقه‌ای (۳۰۰ ثانیه)
 * T = floor(Date.now() / (1000 * 300))
 */
export function generateDynamicHmacToken(
  qrCodeHash: string,
  hmacSecret: string = DEFAULT_HMAC_SECRET
): string {
  // پنجره زمانی ۵ دقیقه‌ای
  const timeStep = Math.floor(Date.now() / (1000 * 300));
  const data = `${qrCodeHash}:${timeStep}`;
  return crypto
    .createHmac("sha256", hmacSecret)
    .update(data)
    .digest("hex")
    .substring(0, 16)
    .toUpperCase();
}

/**
 * محاسبه فاصله Haversine به متر بر روی شعاع زمین (۶۳۷۱ کیلومتر)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // شعاع زمین به متر
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * اعتبارسنجی هم‌زمان توکن زمان‌دار پنج‌دقیقه‌ای (یا هش ایستگاه) و Geofencing
 */
export function verifyPatrolCheckpoint(
  scannedToken: string,
  expectedHash: string,
  hmacSecret: string = DEFAULT_HMAC_SECRET,
  userLat?: number,
  userLon?: number,
  targetLat?: number,
  targetLon?: number,
  maxAllowedRadiusMeters: number = 150
) {
  // ۱. اعتبارسنجی HMAC dynamic (پنجره زمانی جاری، پنجره قبلی ۳۰۰ ثانیه‌ای برای پوشش لبه‌های زمانی، یا خود کد QR اصلی)
  const currentToken = generateDynamicHmacToken(expectedHash, hmacSecret);
  const prevTimeStepToken = (() => {
    const prevTimeStep = Math.floor(Date.now() / (1000 * 300)) - 1;
    const data = `${expectedHash}:${prevTimeStep}`;
    return crypto
      .createHmac("sha256", hmacSecret)
      .update(data)
      .digest("hex")
      .substring(0, 16)
      .toUpperCase();
  })();

  const cleanScanned = (scannedToken || "").toUpperCase();
  const isHmacValid =
    cleanScanned.includes(currentToken) ||
    cleanScanned.includes(prevTimeStepToken) ||
    cleanScanned === expectedHash.toUpperCase() ||
    expectedHash.toUpperCase().includes(cleanScanned);

  if (!isHmacValid) {
    return {
      isValid: false,
      message:
        "کد QR منقضی شده یا نامعتبر است (خطای پنجره زمانی ۵ دقیقه‌ای HMAC ضد Replay).",
      dynamicToken: currentToken,
    };
  }

  // ۲. اعتبارسنجی Geofencing
  if (
    typeof userLat === "number" &&
    typeof userLon === "number" &&
    typeof targetLat === "number" &&
    typeof targetLon === "number"
  ) {
    const distance = calculateDistanceMeters(
      userLat,
      userLon,
      targetLat,
      targetLon
    );
    if (distance > maxAllowedRadiusMeters) {
      return {
        isValid: false,
        message: `فاصله شما (${Math.round(
          distance
        )} متر) خارج از محدوده مجاز (${maxAllowedRadiusMeters} متر) است.`,
        distanceMeters: Math.round(distance),
        dynamicToken: currentToken,
      };
    }
    return {
      isValid: true,
      message: "احراز موقعیت و توکن امنیتی زمان‌دار با موفقیت تایید شد.",
      distanceMeters: Math.round(distance),
      dynamicToken: currentToken,
    };
  }

  return {
    isValid: true,
    message: "احراز توکن امنیتی زمان‌دار با موفقیت تایید شد.",
    dynamicToken: currentToken,
  };
}
