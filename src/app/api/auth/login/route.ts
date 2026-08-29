import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSecureSessionToken } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const {
      personnelCode,
      biometricVerified = false,
      hardwareKeyAttestation = true,
    } = body;

    if (!personnelCode) {
      return NextResponse.json(
        { error: "کد پرسنلی الزامی است." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.personnelCode, personnelCode));
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "کاربر یافت نشد یا غیرفعال است." },
        { status: 404 }
      );
    }

    const userPayload = {
      id: user.id,
      personnelCode: user.personnelCode,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      hardwareKeyAttestation: Boolean(hardwareKeyAttestation),
    };

    const token = await createSecureSessionToken(userPayload);

    // ثبت لاگ حسابرسی پدافند غیرعامل
    await db.insert(auditLogs).values({
      userId: user.id,
      actionType: biometricVerified
        ? "SECURE_LOGIN_BIOMETRIC_JWT"
        : "SECURE_LOGIN_JWT",
      entityType: "USER_SESSION",
      entityId: user.id,
      description: `ورود امن کاربر ${user.fullName} (کد ${user.personnelCode}) با توکن امضاشده HS256 ${
        biometricVerified ? "+ تایید زنده بیومتریک چهره" : ""
      }`,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        ...userPayload,
        postName: user.postName,
        badgeNumber: user.badgeNumber,
      },
    });

    response.cookies.set("user_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 12, // ۱۲ ساعت اعتبار
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/user_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    const { verifySessionToken } = await import("@/lib/auth");
    const payload = await verifySessionToken(match[1]);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    return NextResponse.json({ authenticated: true, user: payload });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
