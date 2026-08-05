import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminSession";
import { writeAuditLog, auditMetaFromRequest } from "@/lib/audit";

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

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const severity = searchParams.get("severity") || "";
  const source = searchParams.get("source") || "";
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
  const exportFmt = searchParams.get("export");

  const where: Record<string, unknown> = {};
  if (severity) where.severity = severity;
  if (source) where.source = source;
  if (q) {
    where.OR = [
      { message: { contains: q, mode: "insensitive" } },
      { url: { contains: q, mode: "insensitive" } },
      { user: { contains: q, mode: "insensitive" } },
      { ip: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.systemError.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: exportFmt === "csv" ? 2000 : limit,
  });

  if (exportFmt === "csv") {
    const header =
      "id,createdAt,severity,source,message,url,user,ip,userAgent\n";
    const rows = items
      .map((e) =>
        [
          e.id,
          e.createdAt.toISOString(),
          e.severity,
          e.source,
          JSON.stringify(e.message),
          JSON.stringify(e.url || ""),
          JSON.stringify(e.user || ""),
          JSON.stringify(e.ip || ""),
          JSON.stringify(e.userAgent || ""),
        ].join(","),
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="system-errors.csv"`,
      },
    });
  }

  return NextResponse.json({ items, total: items.length });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    olderThanDays?: number;
    all?: boolean;
  };

  if (body.id) {
    await prisma.systemError.delete({ where: { id: body.id } }).catch(() => null);
  } else if (body.all) {
    await prisma.systemError.deleteMany();
  } else if (body.olderThanDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - body.olderThanDays);
    await prisma.systemError.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  } else {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  await writeAuditLog("Logs de sistema", "Limpeza de erros", {
    user: auth.username,
    ...auditMetaFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
