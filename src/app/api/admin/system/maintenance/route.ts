import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import {
  getMaintenanceSettings,
  setMaintenanceSettings,
} from "@/lib/systemSettings";
import { auditMetaFromRequest, writeAuditLog } from "@/lib/audit";

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
  const settings = await getMaintenanceSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<{
    enabled: boolean;
    message: string;
    eta: string;
    phone: string;
    whatsapp: string;
    email: string;
  }>;

  const next = await setMaintenanceSettings({
    enabled: Boolean(body.enabled),
    message:
      typeof body.message === "string" ? body.message : undefined,
    eta: typeof body.eta === "string" ? body.eta : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    whatsapp: typeof body.whatsapp === "string" ? body.whatsapp : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
  });

  await writeAuditLog(
    "Manutenção",
    next.enabled ? "Modo manutenção ativado" : "Modo manutenção desativado",
    { user: auth.username, ...auditMetaFromRequest(request) },
  );

  return NextResponse.json(next);
}
