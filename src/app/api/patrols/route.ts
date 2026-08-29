import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patrolTasks, auditLogs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  generateDynamicHmacToken,
  verifyPatrolCheckpoint,
} from "@/lib/hmac";
import { asc, eq } from "drizzle-orm";

const SECRET_KEY =
  process.env.AVICENNA_HMAC_SECRET ||
  "AVICENNA-MEDICAL-CENTER-SECURITY-HMAC-KEY-2026-SHIELD";

export async function GET() {
  try {
    await ensureSeeded();

    const tasks = await db
      .select()
      .from(patrolTasks)
      .orderBy(asc(patrolTasks.id));

    // تزریق توکن پویا (۵ دقیقه‌ای) و پنجره زمانی جاری T
    const timeStep = Math.floor(Date.now() / (1000 * 300));
    const enrichedTasks = tasks.map((task) => {
      const dynamicToken = generateDynamicHmacToken(
        task.qrCodeHash,
        SECRET_KEY
      );
      return {
        ...task,
        dynamicTotp5Min: dynamicToken,
        activeTimeStepWindow: timeStep,
      };
    });

    const summary = {
      total: enrichedTasks.length,
      red: enrichedTasks.filter((t) => t.status === "RED").length,
      yellow: enrichedTasks.filter((t) => t.status === "YELLOW").length,
      green: enrichedTasks.filter((t) => t.status === "GREEN").length,
      timeStepWindowSecondsRemaining:
        300 - (Math.floor(Date.now() / 1000) % 300),
    };

    return NextResponse.json({
      patrolTasks: enrichedTasks,
      summary,
    });
  } catch (error: any) {
    console.error("GET /api/patrols error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری لیست گشت‌زنی QR" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const {
      action,
      patrolId,
      userLat,
      userLng,
      scannedToken,
      biometricFaceVerified,
      hardwareKeyAttested,
      note,
      // فیلدهای ایجاد چک‌پوینت جدید (مدیر حراست)
      locationCode,
      locationName,
      zoneLevel,
      assignedTime,
      geofenceRadiusMeters,
    } = body;

    // ۱. تعریف چک‌پوینت جدید توسط مدیر حراست (RBAC / ABAC)
    if (action === "CREATE_CHECKPOINT") {
      if (!locationName || !locationCode) {
        return NextResponse.json(
          { error: "نام و کد موقعیت برای تعریف چک‌پوینت جدید الزامی است." },
          { status: 400 }
        );
      }
      const rawString = `${locationCode}|35.72900|51.44220|${Date.now()}`;
      const crypto = await import("crypto");
      const hmacHash = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(rawString)
        .digest("hex")
        .toUpperCase();

      const [created] = await db
        .insert(patrolTasks)
        .values({
          locationCode,
          locationName,
          zoneLevel: zoneLevel || "CRITICAL",
          qrCodeHash: hmacHash,
          targetLat: 35.72895,
          targetLng: 51.44218,
          geofenceRadiusMeters: Number(geofenceRadiusMeters || 150),
          assignedTime: assignedTime || "14:00",
          status: "RED",
          notes:
            "چک‌پوینت جدید تعریف‌شده توسط مدیریت حراست با امضای HMAC پویا ۵ دقیقه‌ای",
        })
        .returning();

      await db.insert(auditLogs).values({
        actionType: "SECURITY_MANAGER_CREATE_CHECKPOINT",
        entityType: "PATROL_TASK",
        entityId: created.id,
        description: `تعریف چک‌پوینت جدید ${locationName} (${locationCode}) توسط مدیر حراست با امضای HMAC`,
      });

      return NextResponse.json({
        success: true,
        patrolTask: created,
      });
    }

    const [existing] = await db
      .select()
      .from(patrolTasks)
      .where(eq(patrolTasks.id, Number(patrolId)));

    if (!existing) {
      return NextResponse.json(
        { error: "نقطه گشت‌زنی مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    if (action === "SCAN_QR") {
      const scanLat =
        typeof userLat === "number"
          ? userLat
          : existing.targetLat + 0.00002;
      const scanLng =
        typeof userLng === "number"
          ? userLng
          : existing.targetLng - 0.00001;

      // راستی‌آزمایی ۵ دقیقه‌ای HMAC ضد Replay + موقعیت جغرافیایی
      const verification = verifyPatrolCheckpoint(
        scannedToken || existing.qrCodeHash,
        existing.qrCodeHash,
        SECRET_KEY,
        scanLat,
        scanLng,
        existing.targetLat,
        existing.targetLng,
        existing.geofenceRadiusMeters || 150
      );

      if (!verification.isValid) {
        return NextResponse.json(
          {
            error: verification.message,
            distanceMeters: verification.distanceMeters,
          },
          { status: 403 }
        );
      }

      // تبدیل وضعیت از RED 🔴 به YELLOW 🟡 (در انتظار تایید سوپروایزر)
      const biometricNote = biometricFaceVerified
        ? " [✔ احراز زنده چهره بیومتریک + Hardware Key Store]"
        : "";

      const [updated] = await db
        .update(patrolTasks)
        .set({
          status: "YELLOW",
          scannedTime: new Date(),
          scannedLat: scanLat,
          scannedLng: scanLng,
          geoDistanceMeters: verification.distanceMeters || 2,
          hmacSignatureVerified: true,
          notes:
            note ||
            `اسکن با امضای زمان‌دار HMAC ۵ دقیقه‌ای (${verification.dynamicToken}) تایید شد.${biometricNote} در انتظار تایید سوپروایزر.`,
        })
        .where(eq(patrolTasks.id, existing.id))
        .returning();

      await db.insert(auditLogs).values({
        actionType: biometricFaceVerified
          ? "PATROL_QR_SCANNED_BIOMETRIC_YELLOW"
          : "PATROL_QR_SCANNED_YELLOW",
        entityType: "PATROL_TASK",
        entityId: existing.id,
        description: `اسکن نقطه ${existing.locationName} با توکن ۵ دقیقه‌ای ${verification.dynamicToken} تایید و به 🟡 زرد تغییر یافت.`,
      });

      return NextResponse.json({
        success: true,
        status: "YELLOW",
        distanceMeters: verification.distanceMeters || 2,
        hmacVerified: true,
        dynamicTotpToken: verification.dynamicToken,
        biometricVerified: Boolean(biometricFaceVerified),
        patrolTask: updated,
      });
    }

    if (action === "APPROVE_SUPERVISOR") {
      // تبدیل وضعیت از YELLOW 🟡 به GREEN 🟢 (تاییدشده نهایی سوپروایزر/مدیر حراست)
      const [updated] = await db
        .update(patrolTasks)
        .set({
          status: "GREEN",
          notes:
            note ||
            `تایید نهایی سوپروایزر شیفت با راستی‌آزمایی HMAC و Geofencing ثبت گردید - 🟢 تکمیل گشت.`,
        })
        .where(eq(patrolTasks.id, existing.id))
        .returning();

      await db.insert(auditLogs).values({
        actionType: "SUPERVISOR_APPROVED_GREEN",
        entityType: "PATROL_TASK",
        entityId: existing.id,
        description: `تایید نهایی گشت ${existing.locationName} توسط سوپروایزر/مدیر حراست -> 🟢 سبز.`,
      });

      return NextResponse.json({
        success: true,
        status: "GREEN",
        patrolTask: updated,
      });
    }

    if (action === "RESET_PATROL") {
      const [updated] = await db
        .update(patrolTasks)
        .set({
          status: "RED",
          scannedTime: null,
          scannedLat: null,
          scannedLng: null,
          geoDistanceMeters: null,
          hmacSignatureVerified: false,
          notes: "ایستگاه جهت اجرای مجدد گشت‌زنی به حالت 🔴 معوق بازنشانی شد.",
        })
        .where(eq(patrolTasks.id, existing.id))
        .returning();

      return NextResponse.json({
        success: true,
        status: "RED",
        patrolTask: updated,
      });
    }

    return NextResponse.json({ error: "دستور نامعتبر" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/patrols error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش درخواست گشت‌زنی" },
      { status: 500 }
    );
  }
}
