import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import { getBackupSettings, setBackupSettings } from "@/lib/externalBackup";
import { auditMetaFromRequest, writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const auth = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return NextResponse.json(await getBackupSettings());
}

export async function PUT(request: Request) {
  const jar = await cookies();
  const auth = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const next = await setBackupSettings({
    dailyHour: body.dailyHour !== undefined ? Number(body.dailyHour) : undefined,
    retentionDaily:
      body.retentionDaily !== undefined
        ? Number(body.retentionDaily)
        : undefined,
    retentionWeekly:
      body.retentionWeekly !== undefined
        ? Number(body.retentionWeekly)
        : undefined,
    retentionMonthly:
      body.retentionMonthly !== undefined
        ? Number(body.retentionMonthly)
        : undefined,
    maxSizeMb:
      body.maxSizeMb !== undefined ? Number(body.maxSizeMb) : undefined,
    zip: body.zip !== undefined ? Boolean(body.zip) : undefined,
    encryption:
      body.encryption !== undefined ? Boolean(body.encryption) : undefined,
    encryptionKey:
      body.encryptionKey !== undefined
        ? String(body.encryptionKey)
        : undefined,
    emailOnSuccess:
      body.emailOnSuccess !== undefined
        ? Boolean(body.emailOnSuccess)
        : undefined,
    emailOnFailure:
      body.emailOnFailure !== undefined
        ? Boolean(body.emailOnFailure)
        : undefined,
    notifyEmail:
      body.notifyEmail !== undefined ? String(body.notifyEmail) : undefined,
  });
  await writeAuditLog("Config backup", "Configurações de backup salvas", {
    user: auth.username,
    ...auditMetaFromRequest(request),
  });
  return NextResponse.json(next);
}
