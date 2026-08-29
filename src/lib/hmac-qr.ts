import crypto from "crypto";

const SECRET_KEY =
  process.env.AVICENNA_HMAC_SECRET ||
  "AVICENNA-MEDICAL-CENTER-SECURITY-HMAC-KEY-2026-SHIELD";

export interface HmacQrPayload {
  locCode: string;
  locName: string;
  lat: number;
  lng: number;
  nonce: string;
  issuedAt: number;
  hmac: string;
}

/**
 * تولید امضای HMAC-SHA256 برای نقطه گشت‌زنی بیمارستان ابن‌سینا
 */
export function generatePatrolQrPayload(
  locCode: string,
  locName: string,
  lat: number,
  lng: number
): HmacQrPayload {
  const nonce = crypto.randomBytes(6).toString("hex").toUpperCase();
  const issuedAt = Date.now();
  const rawString = `${locCode}|${lat.toFixed(5)}|${lng.toFixed(5)}|${nonce}`;
  const hmac = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(rawString)
    .digest("hex")
    .toUpperCase();

  return {
    locCode,
    locName,
    lat,
    lng,
    nonce,
    issuedAt,
    hmac,
  };
}

/**
 * اعتبارسنجی امضای HMAC-SHA256
 */
export function verifyPatrolQrHmac(
  locCode: string,
  lat: number,
  lng: number,
  nonce: string,
  hmac: string
): boolean {
  const rawString = `${locCode}|${lat.toFixed(5)}|${lng.toFixed(5)}|${nonce}`;
  const expectedHmac = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(rawString)
    .digest("hex")
    .toUpperCase();

  return expectedHmac === hmac.toUpperCase();
}

/**
 * محاسبه فاصله Haversine به متر بین مختصات اسکنر و نقطه هدف گشت
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // شعاع زمین به متر
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * تولید SVG دترمینستیک و باکنتراست تاکتیکی برای برچسب QR Code ایستگاه گشت
 */
export function generateQrSvgPattern(code: string, color = "#10B981"): string {
  // الگوی قطعه‌ای ۲۱x۲۱ شبیه‌ساز واقعی QR Code به همراه چشم‌های یابنده (Finder patterns)
  const hash = crypto.createHash("sha256").update(code).digest();
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // رسم سه چشم اصلی QR (گوشه بالا چپ، بالا راست، پایین چپ)
  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[r0 + r][c0 + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, 14);
  drawFinder(14, 0);

  // پر کردن بدنه ماتریس از روی هش رمزنگاری
  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= 13) ||
        (r >= 13 && c < 8)
      ) {
        continue;
      }
      const byte = hash[Math.floor(bitIdx / 8) % hash.length];
      const bit = (byte >> bitIdx % 8) & 1;
      grid[r][c] = bit === 1;
      bitIdx++;
    }
  }

  return JSON.stringify(grid);
}
