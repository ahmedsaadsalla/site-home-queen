import { prisma } from "@/lib/prisma";
import { runHealthCheck } from "@/lib/health";
import { getBackupStatus } from "@/lib/backupService";
import { getExternalBackupConfig } from "@/lib/externalBackup";
import { getLatestIntegrityReport } from "@/lib/integrityCheck";
import { getSecurityDashboard } from "@/lib/adminAuthStore";

export async function buildSystemReport() {
  const [health, backup, external, integrity, security] = await Promise.all([
    runHealthCheck(),
    getBackupStatus().catch(() => null),
    getExternalBackupConfig(),
    getLatestIntegrityReport(),
    getSecurityDashboard().catch(() => null),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    backup: {
      localStatus: external.lastLocalStatus || "n/a",
      localAt: external.lastLocalAt || backup?.lastManualAt || backup?.lastDailyAt,
      localFile: external.lastLocalFile || backup?.latest?.file || null,
      localSize: external.lastLocalSize || backup?.latest?.size || null,
      cloudStatus: external.lastCloudStatus || "n/a",
      cloudAt: external.lastCloudAt,
      cloudFile: external.lastCloudFile,
      cloudSize: external.lastCloudSize,
      provider: external.provider,
      count: backup?.count ?? 0,
    },
    integrity: {
      status: integrity?.status || "n/a",
      summary: integrity?.summary || "Sem relatório",
      checkedAt: integrity?.checkedAt || null,
    },
    security: {
      activeSessions: security?.stats?.activeSessions ?? 0,
      lockedIps: security?.stats?.lockedIps ?? 0,
      loginsToday: security?.stats?.loginsToday ?? 0,
      lastLogin: security?.lastLogin || null,
    },
    database: {
      status: health.database,
      prisma: health.prisma,
      latencyMs: health.databaseLatencyMs,
    },
    storage: health.storage,
    smtp: health.smtp,
    bling: health.bling,
    environment: health.environment,
    version: health.version,
    memory: health.memory,
    uptimeMs: health.uptimeMs,
  };
}

export function reportToCsv(report: Awaited<ReturnType<typeof buildSystemReport>>) {
  const rows: string[][] = [
    ["Seção", "Campo", "Valor"],
    ["Backup", "Local status", String(report.backup.localStatus)],
    ["Backup", "Local em", String(report.backup.localAt || "")],
    ["Backup", "Cloud status", String(report.backup.cloudStatus)],
    ["Backup", "Cloud em", String(report.backup.cloudAt || "")],
    ["Backup", "Provedor", String(report.backup.provider)],
    ["Integridade", "Status", String(report.integrity.status)],
    ["Integridade", "Resumo", String(report.integrity.summary)],
    ["Segurança", "Sessões", String(report.security.activeSessions)],
    ["Segurança", "IPs bloqueados", String(report.security.lockedIps)],
    ["Banco", "PostgreSQL", String(report.database.status)],
    ["Banco", "Prisma", String(report.database.prisma)],
    ["Espaço", "Usado", String(report.storage.used)],
    ["Espaço", "Livre", String(report.storage.free)],
    ["Espaço", "%", String(report.storage.percent)],
    ["SMTP", "Status", String(report.smtp)],
    ["Bling", "Status", String(report.bling)],
  ];
  return rows
    .map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

/** SpreadsheetML simples (abre no Excel) */
export function reportToXlsxXml(
  report: Awaited<ReturnType<typeof buildSystemReport>>,
) {
  const csv = reportToCsv(report);
  const lines = csv.split("\n").map((l) =>
    l.split(",").map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"')),
  );
  const rows = lines
    .map(
      (cols) =>
        `<Row>${cols.map((c) => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join("")}</Row>`,
    )
    .join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Relatorio"><Table>${rows}</Table></Worksheet>
</Workbook>`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** PDF texto mínimo (sem lib) */
export function reportToPdf(
  report: Awaited<ReturnType<typeof buildSystemReport>>,
) {
  const lines = [
    "Home Queen — Relatorio do Sistema",
    `Gerado: ${report.generatedAt}`,
    "",
    `Backup local: ${report.backup.localStatus} · ${report.backup.localAt || "-"}`,
    `Backup cloud: ${report.backup.cloudStatus} · ${report.backup.provider}`,
    `Integridade: ${report.integrity.status} — ${report.integrity.summary}`,
    `Seguranca: sessoes=${report.security.activeSessions} bloqueios=${report.security.lockedIps}`,
    `Banco: ${report.database.status} / Prisma ${report.database.prisma}`,
    `Espaco: ${report.storage.used} usado / ${report.storage.free} livre (${report.storage.percent}%)`,
    `SMTP: ${report.smtp} · Bling: ${report.bling}`,
    `Versao: ${report.version} · Ambiente: ${report.environment}`,
  ];

  const content = lines
    .map((l, i) => `BT /F1 11 Tf 40 ${750 - i * 16} Td (${escapePdf(l)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function escapePdf(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

void prisma;
