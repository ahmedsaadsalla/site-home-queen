import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { pruneOldBackups } from "@/lib/backupService";
import { writeAuditLog } from "@/lib/audit";
import { SESSION_IDLE_MS } from "@/lib/adminSession";

/**
 * Limpeza enterprise: backups antigos, logs, temp, uploads órfãos, sessões.
 */
export async function runSystemCleanup(opts?: { user?: string }) {
  const t0 = Date.now();
  let processed = 0;
  const details: Record<string, number> = {};

  await writeAuditLog("Limpeza executada", "Início da rotina de cleanup", {
    user: opts?.user || "Sistema",
  });

  // Backups por retenção
  const pruned = await pruneOldBackups();
  details.backupsPruned = pruned.length;
  processed += pruned.length;

  // System errors > 90 dias
  const errCutoff = new Date();
  errCutoff.setDate(errCutoff.getDate() - 90);
  const errs = await prisma.systemError.deleteMany({
    where: { createdAt: { lt: errCutoff } },
  });
  details.errorsDeleted = errs.count;
  processed += errs.count;

  // Admin logs > 180 dias
  const logCutoff = new Date();
  logCutoff.setDate(logCutoff.getDate() - 180);
  const logs = await prisma.adminLog.deleteMany({
    where: { createdAt: { lt: logCutoff } },
  });
  details.logsDeleted = logs.count;
  processed += logs.count;

  // Site views > 90 dias
  const viewCutoff = new Date();
  viewCutoff.setDate(viewCutoff.getDate() - 90);
  const views = await prisma.siteView
    .deleteMany({ where: { createdAt: { lt: viewCutoff } } })
    .catch(() => ({ count: 0 }));
  details.viewsDeleted = views.count;
  processed += views.count;

  // Resolved alerts > 60 dias
  const alertCutoff = new Date();
  alertCutoff.setDate(alertCutoff.getDate() - 60);
  const alerts = await prisma.systemAlert
    .deleteMany({
      where: { active: false, resolvedAt: { lt: alertCutoff } },
    })
    .catch(() => ({ count: 0 }));
  details.alertsDeleted = alerts.count;
  processed += alerts.count;

  // Sessões expiradas (idle)
  const sessionCutoff = new Date(Date.now() - SESSION_IDLE_MS);
  const sessions = await prisma.adminSession.deleteMany({
    where: { lastActivityAt: { lt: sessionCutoff } },
  });
  details.sessionsDeleted = sessions.count;
  processed += sessions.count;

  // Arquivos temporários
  const tmpDirs = [
    path.join(process.cwd(), "tmp"),
    path.join(process.cwd(), "data", "tmp"),
    path.join(process.cwd(), ".tmp"),
  ];
  let tmpDeleted = 0;
  for (const dir of tmpDirs) {
    try {
      const files = await fs.readdir(dir);
      for (const f of files) {
        await fs.unlink(path.join(dir, f)).catch(() => undefined);
        tmpDeleted++;
      }
    } catch {
      /* dir may not exist */
    }
  }
  details.tmpDeleted = tmpDeleted;
  processed += tmpDeleted;

  // Uploads órfãos: arquivos em public/uploads não referenciados (amostra limitada)
  let orphanUploads = 0;
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const referenced = new Set<string>();
    const products = await prisma.product.findMany({
      select: { image: true, gallery: true, cover: true },
      take: 5000,
    });
    for (const p of products) {
      for (const u of [p.image, p.cover, ...(p.gallery || [])]) {
        if (u?.startsWith("/uploads/")) referenced.add(u);
      }
    }
    const media = await prisma.mediaAsset.findMany({
      select: { url: true },
      take: 5000,
    }).catch(() => [] as Array<{ url?: string }>);
    for (const m of media) {
      if (m.url?.startsWith("/uploads/")) referenced.add(m.url);
    }

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          await walk(full);
          continue;
        }
        const rel = "/" + path.relative(path.join(process.cwd(), "public"), full).replace(/\\/g, "/");
        if (!referenced.has(rel) && !e.name.startsWith(".")) {
          // só remove arquivos .tmp / .partial / mais de 30 dias sem referência
          const st = await fs.stat(full);
          const ageDays = (Date.now() - st.mtimeMs) / 86400000;
          if (
            ageDays > 30 &&
            (e.name.endsWith(".tmp") || e.name.endsWith(".partial") || e.name.startsWith("orphan_"))
          ) {
            await fs.unlink(full).catch(() => undefined);
            orphanUploads++;
          }
        }
      }
    }
    await walk(uploadDir).catch(() => undefined);
  } catch {
    /* ignore */
  }
  details.orphanUploads = orphanUploads;
  processed += orphanUploads;

  // Integrity reports > 60 dias (manter últimos)
  const irCutoff = new Date();
  irCutoff.setDate(irCutoff.getDate() - 60);
  const irs = await prisma.integrityReport
    .deleteMany({ where: { createdAt: { lt: irCutoff } } })
    .catch(() => ({ count: 0 }));
  details.integrityReportsDeleted = irs.count;
  processed += irs.count;

  const durationMs = Date.now() - t0;
  await writeAuditLog(
    "Limpeza executada",
    `processados=${processed} · ${durationMs}ms · ${JSON.stringify(details)}`,
    { user: opts?.user || "Sistema" },
  );

  return {
    success: true,
    duration: `${(durationMs / 1000).toFixed(1)}s`,
    durationMs,
    processed,
    details,
  };
}
