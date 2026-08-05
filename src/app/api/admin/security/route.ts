import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSecurityDashboard } from "@/lib/adminAuthStore";
import { readAdminCms } from "@/lib/adminStore";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const payload = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!payload) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const [dash, cms] = await Promise.all([
    getSecurityDashboard(),
    readAdminCms(),
  ]);

  const recentLogs = (cms.logs || []).slice(0, 30).map((l) => ({
    id: l.id,
    user: l.user,
    action: l.action,
    detail: l.detail,
    createdAt: l.createdAt,
  }));

  return NextResponse.json({
    ...dash,
    recentLogs,
  });
}
