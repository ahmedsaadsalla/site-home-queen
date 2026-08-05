import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AuditMeta = {
  user?: string;
  actorId?: string;
  ip?: string | null;
  userAgent?: string | null;
};

/** Extrai IP e User-Agent do request atual (App Router). */
export async function requestAuditMeta(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = fwd || h.get("x-real-ip") || null;
    const userAgent = h.get("user-agent");
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export function auditMetaFromRequest(request: Request): {
  ip: string | null;
  userAgent: string | null;
} {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: fwd || request.headers.get("x-real-ip") || null,
    userAgent: request.headers.get("user-agent"),
  };
}

/**
 * Registro de auditoria completo.
 * Mantém compatibilidade com appendAdminLog(action, detail, user).
 */
export async function writeAuditLog(
  action: string,
  detail: string,
  meta: AuditMeta = {},
) {
  const fromReq =
    meta.ip === undefined || meta.userAgent === undefined
      ? await requestAuditMeta()
      : { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null };

  const log = await prisma.adminLog.create({
    data: {
      user: meta.user || "Sistema",
      action,
      detail,
      ip: fromReq.ip,
      userAgent: fromReq.userAgent?.slice(0, 500) || null,
      actorId: meta.actorId || null,
    },
  });

  // Mantém ~500 registros recentes
  const older = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: 500,
    select: { id: true },
  });
  if (older.length) {
    await prisma.adminLog.deleteMany({
      where: { id: { in: older.map((o) => o.id) } },
    });
  }

  return log;
}
