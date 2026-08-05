import { NextResponse } from "next/server";
import {
  appendAdminLog,
  getDashboardStats,
  readAdminCms,
  writeAdminCms,
} from "@/lib/adminStore";
import type { AdminCms } from "@/data/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "cms";

  if (view === "dashboard") {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  }

  const cms = await readAdminCms();
  return NextResponse.json(cms);
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      section?: keyof AdminCms;
      data?: unknown;
      action?: string;
      detail?: string;
      full?: AdminCms;
    };

    if (body.full) {
      await writeAdminCms(body.full);
      await appendAdminLog(body.action || "Atualização CMS", body.detail || "CMS completo");
      return NextResponse.json({ ok: true, cms: body.full });
    }

    if (!body.section || body.data === undefined) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const cms = await readAdminCms();
    (cms as Record<string, unknown>)[body.section] = body.data;
    await writeAdminCms(cms);
    await appendAdminLog(
      body.action || `Editar ${String(body.section)}`,
      body.detail || `Seção ${String(body.section)} atualizada`,
    );
    return NextResponse.json({ ok: true, cms });
  } catch {
    return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });
  }
}
