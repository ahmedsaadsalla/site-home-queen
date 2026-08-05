import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import { getMonitoringDashboard } from "@/lib/health";
import { getBackupStatus } from "@/lib/backupService";

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
  try {
    const [dashboard, backup] = await Promise.all([
      getMonitoringDashboard(),
      getBackupStatus(),
    ]);
    return NextResponse.json({ ...dashboard, backupDetail: backup });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no status." },
      { status: 500 },
    );
  }
}
