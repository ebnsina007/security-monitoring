import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";
import { biometricEnrollments, users, auditLogs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const personnelCode = searchParams.get("personnelCode");

    const query = db
      .select({
        enrollmentId: biometricEnrollments.id,
        userId: users.id,
        fullName: users.fullName,
        personnelCode: users.personnelCode,
        role: users.role,
        department: users.department,
        postName: users.postName,
        hisSourceSystem: biometricEnrollments.hisSourceSystem,
        hisNationalCode: biometricEnrollments.hisNationalCode,
        hisPersonnelId: biometricEnrollments.hisPersonnelId,
        hisSyncStatus: biometricEnrollments.hisSyncStatus,
        faceTemplateHash: biometricEnrollments.faceTemplateHash,
        faceLivenessConfidence: biometricEnrollments.faceLivenessConfidence,
        faceScanDate: biometricEnrollments.faceScanDate,
        fingerprintHash: biometricEnrollments.fingerprintHash,
        fingerprintConfidence: biometricEnrollments.fingerprintConfidence,
        fingerprintScanDate: biometricEnrollments.fingerprintScanDate,
        fingerType: biometricEnrollments.fingerType,
        notes: biometricEnrollments.notes,
      })
      .from(biometricEnrollments)
      .innerJoin(users, eq(biometricEnrollments.userId, users.id));

    const records = await query;
    const filtered = personnelCode
      ? records.filter((r) => r.personnelCode === personnelCode)
      : records;

    return NextResponse.json({
      hisGatewayStatus: {
        gatewayUrl: "https://his.avicenna-hospital.ir/api/v4/security-gateway",
        systemName: "سامانه یکپارچه اطلاعات بیمارستانی ابن‌سینا (HIS)",
        connectionStatus: "ONLINE_ACTIVE",
        pacsIntegration: "CONNECTED",
        latencyMs: 14,
      },
      records: filtered,
    });
  } catch (error: any) {
    console.error("GET /api/biometric-his error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات بیومتریک و اتصال HIS" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const {
      personnelCode,
      action, // "SYNC_FROM_HIS" | "ENROLL_FACE" | "ENROLL_FINGERPRINT" | "FULL_ENROLLMENT"
      fingerType,
    } = body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.personnelCode, personnelCode || "440112"));

    if (!user) {
      return NextResponse.json(
        { error: "کاربر با این کد پرسنلی یافت نشد" },
        { status: 404 }
      );
    }

    const [existingEnrollment] = await db
      .select()
      .from(biometricEnrollments)
      .where(eq(biometricEnrollments.userId, user.id));

    const randomNonce = crypto.randomBytes(8).toString("hex").toUpperCase();
    const faceHash = `SHA256:FACE_${randomNonce}_${Date.now()}`;
    const fingerHash = `FING_OPTICAL_${fingerType || "RIGHT_INDEX"}_${randomNonce}`;

    if (existingEnrollment) {
      const [updated] = await db
        .update(biometricEnrollments)
        .set({
          faceTemplateHash: faceHash,
          faceLivenessConfidence: 0.988,
          faceScanDate: new Date(),
          fingerprintHash: fingerHash,
          fingerprintConfidence: 0.994,
          fingerprintScanDate: new Date(),
          fingerType: fingerType || "RIGHT_INDEX",
          hisSyncStatus: "SYNCHRONIZED",
          notes:
            "بروزرسانی و اسکن مجدد بیومتریک چهره و اثر انگشت توسط مدیر حراست با استعلام سامانه HIS",
        })
        .where(eq(biometricEnrollments.id, existingEnrollment.id))
        .returning();

      await db
        .update(users)
        .set({
          hasBiometricFace: true,
          hasBiometricFingerprint: true,
          biometricEnrolledAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await db.insert(auditLogs).values({
        userId: user.id,
        actionType: "BIOMETRIC_RESCAN_COMPLETED",
        entityType: "BIOMETRIC_ENROLLMENT",
        entityId: updated.id,
        description: `اسکن و تایید اثر انگشت و چهره بیومتریک کاربر ${user.fullName} (${user.personnelCode}) توسط مدیر حراست`,
      });

      return NextResponse.json({ success: true, enrollment: updated });
    } else {
      const [created] = await db
        .insert(biometricEnrollments)
        .values({
          userId: user.id,
          hisSourceSystem: "AVICENNA_HOSPITAL_HIS_V4",
          hisNationalCode: user.nationalId || "0018492011",
          hisPersonnelId: `HIS-EMP-${user.personnelCode}`,
          hisSyncStatus: "SYNCHRONIZED",
          faceTemplateHash: faceHash,
          faceLivenessConfidence: 0.985,
          faceScanDate: new Date(),
          fingerprintHash: fingerHash,
          fingerprintConfidence: 0.992,
          fingerprintScanDate: new Date(),
          fingerType: fingerType || "RIGHT_INDEX",
          notes: "ثبت اولیه بیومتریک برای نیروی جدیدالورود با تایید مدیر حراست",
        })
        .returning();

      return NextResponse.json({ success: true, enrollment: created });
    }
  } catch (error: any) {
    console.error("POST /api/biometric-his error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش اسکن بیومتریک یا اتصال HIS" },
      { status: 500 }
    );
  }
}
