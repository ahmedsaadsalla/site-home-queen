import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getCurrentVersion } from "@/lib/systemSettings";
import { getDatabaseHostInfo } from "@/lib/databaseUrl";
import { logSystemError } from "@/lib/systemErrors";
import { sampleCpuPercent } from "@/lib/cpuSample";

export type ServiceStatus = "connected" | "offline" | "warning" | "ok" | "n/a";

const startedAt = Date.now();

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

async function checkDatabase() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "connected" as const,
      latencyMs: Date.now() - t0,
      ok: true,
      error: "",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB offline";
    await logSystemError({
      message,
      source: "postgresql",
      severity: "critical",
      stack: e instanceof Error ? e.stack : null,
    });
    return {
      status: "offline" as const,
      latencyMs: Date.now() - t0,
      ok: false,
      error: message.replace(/postgresql:\/\/[^@]+@/gi, "postgresql://***@").slice(0, 280),
    };
  }
}

async function checkUploads() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    const probe = path.join(uploadDir, ".health");
    await fs.writeFile(probe, String(Date.now()));
    await fs.unlink(probe).catch(() => undefined);
    return { status: "ok" as const, ok: true };
  } catch (e) {
    await logSystemError({
      message: e instanceof Error ? e.message : "Uploads falhou",
      source: "uploads",
      severity: "error",
    });
    return { status: "offline" as const, ok: false };
  }
}

async function checkSmtp() {
  if (!env.smtp.host) {
    return { status: "n/a" as const, ok: true, note: "não configurado" };
  }
  // Sem conexão TCP real para não bloquear; presença de credenciais = connected
  const configured = Boolean(env.smtp.host && env.smtp.user);
  return {
    status: (configured ? "connected" : "warning") as ServiceStatus,
    ok: configured,
    note: configured ? "credenciais presentes" : "incompleto",
  };
}

async function checkBling() {
  try {
    const cms = await prisma.cmsSection.findUnique({
      where: { key: "integrations" },
    });
    const data = (cms?.data || {}) as {
      bling?: { enabled?: boolean; apiKey?: string };
    };
    const enabled = Boolean(data.bling?.enabled);
    const hasKey = Boolean(
      data.bling?.apiKey || env.bling.clientId || env.bling.clientSecret,
    );
    if (!enabled) {
      return { status: "n/a" as const, ok: true, note: "desativado" };
    }
    return {
      status: (hasKey ? "connected" : "warning") as ServiceStatus,
      ok: hasKey,
      note: hasKey ? "configurado" : "sem API key",
    };
  } catch {
    return { status: "warning" as const, ok: false };
  }
}

async function diskStats() {
  try {
    // Node 18+ — fallback se indisponível
    const root = process.cwd();
    const { execSync } = await import("child_process");
    if (process.platform === "win32") {
      const drive = path.parse(root).root.replace("\\", "");
      const out = execSync(
        `powershell -NoProfile -Command "(Get-PSDrive -Name '${drive.replace(":", "")}').Used; (Get-PSDrive -Name '${drive.replace(":", "")}').Free"`,
        { encoding: "utf8" },
      );
      const lines = out
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map(Number);
      const used = lines[0] || 0;
      const free = lines[1] || 0;
      const total = used + free;
      return {
        status: "ok" as const,
        used: formatBytes(used),
        free: formatBytes(free),
        total: formatBytes(total),
        percent: total ? Math.round((used / total) * 100) : 0,
        usedBytes: used,
        freeBytes: free,
      };
    }
    const out = execSync(`df -k "${root}" | tail -1`, { encoding: "utf8" });
    const parts = out.trim().split(/\s+/);
    const totalK = Number(parts[1]) || 0;
    const usedK = Number(parts[2]) || 0;
    const freeK = Number(parts[3]) || 0;
    return {
      status: "ok" as const,
      used: formatBytes(usedK * 1024),
      free: formatBytes(freeK * 1024),
      total: formatBytes(totalK * 1024),
      percent: totalK ? Math.round((usedK / totalK) * 100) : 0,
      usedBytes: usedK * 1024,
      freeBytes: freeK * 1024,
    };
  } catch {
    return {
      status: "warning" as const,
      used: "n/d",
      free: "n/d",
      total: "n/d",
      percent: 0,
      usedBytes: 0,
      freeBytes: 0,
    };
  }
}

export function getUptimeMs() {
  return Date.now() - startedAt;
}

export async function runHealthCheck() {
  const [database, uploads, smtp, bling, storage, version] = await Promise.all([
    checkDatabase(),
    checkUploads(),
    checkSmtp(),
    checkBling(),
    diskStats(),
    getCurrentVersion().catch(() => null),
  ]);

  const mem = process.memoryUsage();
  const load =
    typeof os.loadavg === "function" ? os.loadavg()[0] : undefined;

  const criticalOk = database.ok && uploads.ok;
  const softOk = smtp.ok && bling.ok;
  const status = !criticalOk ? "error" : !softOk ? "warning" : "ok";

  return {
    status,
    database: database.status,
    prisma: database.ok ? "connected" : "offline",
    smtp: smtp.status,
    bling: bling.status,
    storage: {
      status: storage.status,
      used: storage.used,
      free: storage.free,
      total: storage.total,
      percent: storage.percent,
    },
    uploads: uploads.status,
    memory: formatBytes(mem.rss),
    memoryDetail: {
      rss: formatBytes(mem.rss),
      heapUsed: formatBytes(mem.heapUsed),
    },
    cpu: load !== undefined ? { load1m: Number(load.toFixed(2)) } : null,
    cpuPercent: sampleCpuPercent(),
    environment: process.env.NODE_ENV || "development",
    version: version?.version || "1.0.0",
    uptimeMs: getUptimeMs(),
    databaseLatencyMs: database.latencyMs,
    databaseError: "error" in database ? database.error : "",
    databaseTarget: getDatabaseHostInfo(),
    timestamp: new Date().toISOString(),
  };
}

export async function getMonitoringDashboard() {
  const health = await runHealthCheck();
  const [
    products,
    categories,
    customers,
    dealers,
    orders,
    quotes,
    admins,
    backupMeta,
    integrationsRow,
    integrity,
    external,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.customer.count(),
    prisma.dealer.count(),
    prisma.order.count(),
    prisma.quote.count(),
    prisma.adminUser.count(),
    prisma.backupMeta.findUnique({ where: { id: 1 } }),
    prisma.cmsSection.findUnique({ where: { key: "integrations" } }),
    prisma.integrityReport.findFirst({ orderBy: { createdAt: "desc" } }),
    import("@/lib/externalBackup").then((m) => m.getExternalBackupConfig()),
  ]);

  const integrations = (integrationsRow?.data || {}) as Record<
    string,
    { enabled?: boolean; measurementId?: string; containerId?: string }
  >;

  const uploadsOk = health.uploads === "ok";

  return {
    health,
    stats: {
      products,
      categories,
      customers,
      dealers,
      orders,
      quotes,
      admins,
    },
    backup: {
      lastBackupAt:
        backupMeta?.lastManualAt ||
        backupMeta?.lastDailyAt ||
        null,
      lastDailyAt: backupMeta?.lastDailyAt || null,
      lastWeeklyAt: backupMeta?.lastWeeklyAt || null,
      lastMonthlyAt: backupMeta?.lastMonthlyAt || null,
      nextDailyAt: backupMeta?.nextDailyAt || null,
      installedAt: backupMeta?.installedAt || null,
    },
    enterprise: {
      integrity: {
        status: integrity?.status || "n/a",
        summary: integrity?.summary || "Sem verificação",
        checkedAt: integrity?.checkedAt || null,
        healthy: integrity?.status === "ok",
      },
      backups: {
        local: {
          status: external.lastLocalStatus || "n/a",
          at: external.lastLocalAt,
          file: external.lastLocalFile,
        },
        cloud: {
          status: external.lastCloudStatus || "n/a",
          at: external.lastCloudAt,
          provider: external.provider,
          file: external.lastCloudFile,
        },
      },
      uploads: {
        status: uploadsOk ? "ok" : "error",
        label: uploadsOk ? "OK" : "Falha",
      },
      database: {
        status: health.database === "connected" ? "ok" : "error",
        label: health.database === "connected" ? "OK" : "Offline",
      },
    },
    integrations: {
      postgresql: health.database,
      prisma: health.prisma,
      smtp: health.smtp,
      bling: health.bling,
      mercadoPago: integrations.mercadoPago?.enabled
        ? "connected"
        : "n/a",
      googleAnalytics:
        integrations.analytics?.enabled || env.googleAnalyticsId
          ? "connected"
          : "n/a",
      googleSearchConsole: env.googleSearchConsole ? "connected" : "n/a",
      googleTagManager:
        integrations.tagManager?.enabled || env.googleTagManager
          ? "connected"
          : "n/a",
    },
    system: {
      version: health.version,
      environment: health.environment,
      uptimeMs: health.uptimeMs,
      installedAt: backupMeta?.installedAt || null,
      updatedAt: new Date().toISOString(),
    },
  };
}
