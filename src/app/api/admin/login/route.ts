import { NextResponse } from "next/server";
import {
  authenticateUser,
  createSession,
} from "@/lib/adminAuthStore";
import { ADMIN_COOKIE, signSession } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    if (!username.trim() || !password) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 400 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;

    const result = await authenticateUser(username, password, ip);
    if (!result.ok) {
      const { writeAuditLog, auditMetaFromRequest } = await import("@/lib/audit");
      await writeAuditLog(
        "Erro de login",
        `Tentativa inválida / bloqueio para ${username.trim().toLowerCase()}`,
        { user: username || "desconhecido", ...auditMetaFromRequest(request) },
      );
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: result.code === "locked" ? 429 : 401 },
      );
    }

    const session = await createSession(
      result.user,
      ip,
      request.headers.get("user-agent") || undefined,
    );
    const token = await signSession({
      sid: session.sid,
      uid: result.user.id,
      username: result.user.username,
      name: result.user.name,
      role: result.user.role,
      a: Date.now(),
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        role: result.user.role,
        email: result.user.email,
      },
    });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos." },
      { status: 500 },
    );
  }
}
