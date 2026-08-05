import { prisma } from "@/lib/prisma";
import { runHealthCheck } from "@/lib/health";
import { sendMail } from "@/lib/mailer";
import { getBackupStatus } from "@/lib/backupService";

export type AlertCode =
  | "backup_failed"
  | "database_offline"
  | "smtp_offline"
  | "bling_offline"
  | "disk_critical"
  | "login_lockouts";

type AlertDef = {
  code: AlertCode;
  severity: "warning" | "critical";
  title: string;
  message: string;
  source: string;
};

async function getAlertSettings() {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "alert_settings" },
    });
    const v = (row?.value || {}) as {
      emailEnabled?: boolean;
      emailTo?: string;
    };
    return {
      emailEnabled: Boolean(v.emailEnabled),
      emailTo: String(v.emailTo || ""),
    };
  } catch {
    return { emailEnabled: false, emailTo: "" };
  }
}

async function raiseAlert(def: AlertDef, meta?: Record<string, unknown>) {
  const existing = await prisma.systemAlert.findFirst({
    where: { code: def.code, active: true },
  });
  if (existing) {
    await prisma.systemAlert.update({
      where: { id: existing.id },
      data: {
        message: def.message,
        severity: def.severity,
        meta: (meta as object) || undefined,
      },
    });
    return existing;
  }

  const created = await prisma.systemAlert.create({
    data: {
      code: def.code,
      severity: def.severity,
      title: def.title,
      message: def.message,
      source: def.source,
      active: true,
      meta: (meta as object) || undefined,
    },
  });

  const settings = await getAlertSettings();
  if (settings.emailEnabled && settings.emailTo) {
    const mail = await sendMail({
      to: settings.emailTo,
      subject: `[Home Queen] ${def.title}`,
      text: `${def.message}\n\nCódigo: ${def.code}\nSeveridade: ${def.severity}\nHorário: ${new Date().toISOString()}`,
    });
    if (mail.ok) {
      await prisma.systemAlert.update({
        where: { id: created.id },
        data: { emailSent: true },
      });
    }
  }

  return created;
}

async function resolveAlert(code: AlertCode) {
  await prisma.systemAlert.updateMany({
    where: { code, active: true },
    data: { active: false, resolvedAt: new Date() },
  });
}

/** Avalia saúde + segurança e sincroniza alertas ativos */
export async function evaluateSystemAlerts() {
  const [health, backup, lockouts] = await Promise.all([
    runHealthCheck(),
    getBackupStatus().catch(() => null),
    prisma.loginAttempt.count({
      where: { lockedUntil: { gt: new Date() } },
    }),
  ]);

  // Database
  if (health.database === "offline" || health.prisma === "offline") {
    await raiseAlert({
      code: "database_offline",
      severity: "critical",
      title: "Banco de dados desconectado",
      message: "PostgreSQL/Prisma não respondeu no health check.",
      source: "postgresql",
    });
  } else {
    await resolveAlert("database_offline");
  }

  // SMTP
  if (health.smtp === "offline") {
    await raiseAlert({
      code: "smtp_offline",
      severity: "warning",
      title: "SMTP offline",
      message: "Serviço de e-mail indisponível ou mal configurado.",
      source: "smtp",
    });
  } else {
    await resolveAlert("smtp_offline");
  }

  // Bling
  if (health.bling === "offline") {
    await raiseAlert({
      code: "bling_offline",
      severity: "warning",
      title: "Bling offline",
      message: "Integração Bling habilitada sem credenciais válidas.",
      source: "bling",
    });
  } else {
    await resolveAlert("bling_offline");
  }

  // Disco
  if ((health.storage?.percent || 0) >= 90) {
    await raiseAlert(
      {
        code: "disk_critical",
        severity: "critical",
        title: "Espaço em disco crítico",
        message: `Uso de disco em ${health.storage.percent}% (limite 90%).`,
        source: "storage",
      },
      { percent: health.storage.percent },
    );
  } else {
    await resolveAlert("disk_critical");
  }

  // Lockouts
  if (lockouts >= 3) {
    await raiseAlert(
      {
        code: "login_lockouts",
        severity: "warning",
        title: "Muitas tentativas de login",
        message: `${lockouts} IPs/usuários bloqueados por falhas de autenticação.`,
        source: "security",
      },
      { lockouts },
    );
  } else {
    await resolveAlert("login_lockouts");
  }

  // Backup atrasado (>36h sem nenhum)
  const last =
    backup?.lastManualAt ||
    backup?.lastDailyAt ||
    backup?.lastWeeklyAt ||
    null;
  if (last) {
    const ageH = (Date.now() - new Date(last).getTime()) / 3600000;
    if (ageH > 36) {
      await raiseAlert({
        code: "backup_failed",
        severity: "warning",
        title: "Backup atrasado",
        message: `Nenhum backup há mais de ${Math.floor(ageH)} horas.`,
        source: "backup",
      });
    } else {
      await resolveAlert("backup_failed");
    }
  }

  return listActiveAlerts();
}

export async function listActiveAlerts() {
  return prisma.systemAlert.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listAllAlerts(limit = 100) {
  return prisma.systemAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function resolveAlertById(id: string) {
  return prisma.systemAlert.update({
    where: { id },
    data: { active: false, resolvedAt: new Date() },
  });
}

export async function raiseBackupFailure(message: string) {
  await raiseAlert({
    code: "backup_failed",
    severity: "critical",
    title: "Backup falhou",
    message,
    source: "backup",
  });
}
