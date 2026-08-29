import { NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";

export async function GET() {
  try {
    await ensureSeeded();
    const allUsers = await db.select().from(users);
    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری کاربران" },
      { status: 500 }
    );
  }
}
