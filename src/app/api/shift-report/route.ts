import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shiftReports, patrolTasks, users, auditLogs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    await ensureSeeded();

    const reports = await db
      .select()
      .from(shiftReports)
      .orderBy(desc(shiftReports.createdAt))
      .limit(5);

    const activeReport = reports[0];
    let patrols: typeof patrolTasks.$inferSelect[] = [];
    if (activeReport) {
      patrols = await db
        .select()
        .from(patrolTasks)
        .where(eq(patrolTasks.shiftReportId, activeReport.id))
        .orderBy(patrolTasks.assignedTime);
    }

    const redCount = patrols.filter((p) => p.status === "RED").length;
    const yellowCount = patrols.filter((p) => p.status === "YELLOW").length;
    const greenCount = patrols.filter((p) => p.status === "GREEN").length;

    return NextResponse.json({
      shiftReport: activeReport,
      patrolSummary: {
        total: patrols.length,
        red: redCount,
        yellow: yellowCount,
        green: greenCount,
        patrols,
      },
    });
  } catch (error: any) {
    console.error("GET /api/shift-report error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت گزارش شیفت ۲۴ ساعته" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { action, reportId, sectionKey, newEntry, comment } = body;

    const currentReports = await db
      .select()
      .from(shiftReports)
      .orderBy(desc(shiftReports.createdAt))
      .limit(1);

    const active = currentReports[0];
    if (!active) {
      return NextResponse.json(
        { error: "گزارش شیفت فعالی یافت نشد" },
        { status: 404 }
      );
    }

    if (action === "ADD_SECTION_ENTRY" && sectionKey && newEntry) {
      const currentList: any[] = Array.isArray((active as any)[sectionKey])
        ? (active as any)[sectionKey]
        : [];
      const updatedList = [
        ...currentList,
        {
          ...newEntry,
          loggedAt: new Date().toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];

      const updateData: Record<string, any> = {
        [sectionKey]: updatedList,
        updatedAt: new Date(),
      };

      const [updated] = await db
        .update(shiftReports)
        .set(updateData)
        .where(eq(shiftReports.id, active.id))
        .returning();

      await db.insert(auditLogs).values({
        actionType: "SHIFT_REPORT_ENTRY_ADDED",
        entityType: "SHIFT_REPORT",
        entityId: active.id,
        description: `افزودن ردیف جدید در بخش ${sectionKey} گزارش ۲۴ ساعته ابن‌سینا`,
      });

      return NextResponse.json({
        success: true,
        shiftReport: updated,
      });
    }

    if (action === "SUPERVISOR_SIGNOFF") {
      const [updated] = await db
        .update(shiftReports)
        .set({
          supervisorComment: comment || "تاییدیه سوپروایزر ثبت شد",
          isFinalized: true,
          updatedAt: new Date(),
        })
        .where(eq(shiftReports.id, active.id))
        .returning();

      return NextResponse.json({
        success: true,
        shiftReport: updated,
      });
    }

    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/shift-report error:", error);
    return NextResponse.json(
      { error: "خطا در ذخیره‌سازی تغییرات گزارش شیفت" },
      { status: 500 }
    );
  }
}
