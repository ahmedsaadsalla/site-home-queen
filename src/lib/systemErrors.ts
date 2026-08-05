import { prisma } from "@/lib/prisma";
import { auditMetaFromRequest, requestAuditMeta } from "@/lib/audit";

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

const RETENTION_DAYS = 90;

export async function logSystemError(opts: {
  message: string;
  severity?: ErrorSeverity;
  source?: string;
  stack?: string | null;
  url?: string | null;
  user?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
  request?: Request;
}) {
  try {
    const fromReq = opts.request
      ? auditMetaFromRequest(opts.request)
      : opts.ip === undefined
        ? await requestAuditMeta()
        : { ip: opts.ip ?? null, userAgent: opts.userAgent ?? null };

    await prisma.systemError.create({
      data: {
        message: opts.message.slice(0, 2000),
        severity: opts.severity || "error",
        source: opts.source || "api",
        stack: opts.stack?.slice(0, 8000) || null,
        url: opts.url || null,
        user: opts.user || null,
        ip: fromReq.ip,
        userAgent: fromReq.userAgent?.slice(0, 500) || null,
        meta: opts.meta
          ? (opts.meta as object)
          : undefined,
      },
    });

    // Retenção
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    await prisma.systemError.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  } catch (e) {
    console.error("[systemError] falha ao registrar", e);
  }
}

export async function captureException(
  err: unknown,
  ctx: { source?: string; url?: string; user?: string; request?: Request } = {},
) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : null;
  await logSystemError({
    message,
    stack,
    severity: "error",
    source: ctx.source || "api",
    url: ctx.url,
    user: ctx.user,
    request: ctx.request,
  });
}
