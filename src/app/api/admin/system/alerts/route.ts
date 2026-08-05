import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import {
  evaluateSystemAlerts,
  listActiveAlerts,
  listAllAlerts,
  resolveAlertById,
} from "@/lib/systemAlerts";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  if (refresh) await evaluateSystemAlerts();
  const [active, all, settings] = await Promise.all([
    listActiveAlerts(),
    listAllAlerts(80),
    prisma.siteSetting.findUnique({ where: { key: "alert_settings" } }),
  ]);
  return NextResponse.json({
    active,
    items: all,
    settings: settings?.value || { emailEnabled: false, emailTo: "" },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    resolve?: boolean;
    settings?: { emailEnabled?: boolean; emailTo?: string };
  };
  if (body.settings) {
    await prisma.siteSetting.upsert({
      where: { key: "alert_settings" },
      create: { key: "alert_settings", value: body.settings },
      update: { value: body.settings },
    });
    return NextResponse.json({ ok: true });
  }
  if (body.id && body.resolve) {
    await resolveAlertById(body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
}
