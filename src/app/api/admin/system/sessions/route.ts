import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import {
  getSecurityDashboard,
  revokeSessionById,
  unlockLoginAttempt,
} from "@/lib/adminAuthStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const dash = await getSecurityDashboard();
  return NextResponse.json(dash);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    action?: "revoke" | "unlock";
    sessionId?: string;
    key?: string;
  };

  try {
    if (body.action === "revoke" && body.sessionId) {
      await revokeSessionById(body.sessionId, auth.username);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "unlock" && body.key) {
      await unlockLoginAttempt(body.key, auth.username);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha." },
      { status: 500 },
    );
  }
}
