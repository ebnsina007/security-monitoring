import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";
import { onboardingLogbooks, users, auditLogs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { asc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const traineePersonnelCode = searchParams.get("personnelCode") || "440112";

    const [trainee] = await db
      .select()
      .from(users)
      .where(eq(users.personnelCode, traineePersonnelCode));

    const targetTraineeId = trainee ? trainee.id : 4;

    const logbookEntries = await db
      .select()
      .from(onboardingLogbooks)
      .where(eq(onboardingLogbooks.traineeId, targetTraineeId))
      .orderBy(asc(onboardingLogbooks.dayNumber));

    return NextResponse.json({
      trainee: trainee || {
        personnelCode: "440112",
        fullName: "سارا موسوی",
        postName: "کارآموز جدیدالورود",
      },
      logbookEntries,
    });
  } catch (error: any) {
    console.error("GET /api/onboarding-logbook error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لاگ‌بوک ۱۴ روزه" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const {
      logbookId,
      action, // "TRAINER_EVALUATE" | "MANAGER_EVALUATE"
      trainerScorePractical,
      trainerScoreTheory,
      trainerComments,
      managerScoreConduct,
      managerRemarks,
    } = body;

    const [existing] = await db
      .select()
      .from(onboardingLogbooks)
      .where(eq(onboardingLogbooks.id, Number(logbookId)));

    if (!existing) {
      return NextResponse.json(
        { error: "ردیف لاگ‌بوک مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    if (action === "TRAINER_EVALUATE") {
      const [updated] = await db
        .update(onboardingLogbooks)
        .set({
          trainerScorePractical: Number(trainerScorePractical || 0),
          trainerScoreTheory: Number(trainerScoreTheory || 0),
          trainerComments: trainerComments || "ارزیابی مربی ثبت شد.",
          trainerApproved: true,
          trainerSignedAt: new Date(),
          status: existing.managerApproved ? "FINAL_APPROVED" : "TRAINER_APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(onboardingLogbooks.id, existing.id))
        .returning();

      await db.insert(auditLogs).values({
        actionType: "LOGBOOK_TRAINER_SIGNED",
        entityType: "ONBOARDING_LOGBOOK",
        entityId: existing.id,
        description: `ثبت دستی ارزیابی روز ${existing.dayNumber} توسط مربی آموزش حراست`,
      });

      return NextResponse.json({ success: true, entry: updated });
    }

    if (action === "MANAGER_EVALUATE") {
      const [updated] = await db
        .update(onboardingLogbooks)
        .set({
          managerScoreConduct: Number(managerScoreConduct || 0),
          managerRemarks: managerRemarks || "تایید انضباطی و حراستی ثبت شد.",
          managerApproved: true,
          managerSignedAt: new Date(),
          status: existing.trainerApproved ? "FINAL_APPROVED" : "MANAGER_APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(onboardingLogbooks.id, existing.id))
        .returning();

      await db.insert(auditLogs).values({
        actionType: "LOGBOOK_MANAGER_APPROVED",
        entityType: "ONBOARDING_LOGBOOK",
        entityId: existing.id,
        description: `تایید و ثبت دستی ارزیابی صلاحیت روز ${existing.dayNumber} توسط مدیر حراست`,
      });

      return NextResponse.json({ success: true, entry: updated });
    }

    return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/onboarding-logbook error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت دستی ارزیابی لاگ‌بوک" },
      { status: 500 }
    );
  }
}
