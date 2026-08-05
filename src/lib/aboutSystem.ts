import os from "os";
import { prisma } from "@/lib/prisma";
import { runHealthCheck, getUptimeMs } from "@/lib/health";
import { getCurrentVersion } from "@/lib/systemSettings";
import { getBackupStatus } from "@/lib/backupService";
import { sampleCpuPercent } from "@/lib/cpuSample";

async function countRecords() {
  const counts = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.customer.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.adminUser.count(),
    prisma.mediaAsset.count(),
    prisma.quote.count(),
    prisma.dealer.count(),
    prisma.cmsSection.count(),
  ]);
  return counts.reduce((a, b) => a + b, 0);
}

export async function getAboutSystem() {
  const [health, version, backup, recordCount] = await Promise.all([
    runHealthCheck(),
    getCurrentVersion(),
    getBackupStatus().catch(() => null),
    countRecords(),
  ]);

  const tableNames = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `.catch(() => [{ count: BigInt(0) }]);

  return {
    name: "Home Queen",
    version: version?.version || health.version,
    environment: health.environment,
    database: "PostgreSQL",
    orm: "Prisma",
    framework: "Next.js",
    node: process.version,
    prisma: "6.x",
    postgresql: "PostgreSQL",
    lastBackup: backup?.lastManualAt || backup?.lastDailyAt || null,
    uptimeMs: getUptimeMs(),
    tables: Number(tableNames[0]?.count || 0),
    records: recordCount,
    platform: os.platform(),
    arch: os.arch(),
    memory: health.memory,
    cpu: sampleCpuPercent(),
    score:
      health.status === "ok"
        ? "Excelente"
        : health.status === "warning"
          ? "Atenção"
          : "Crítico",
  };
}
