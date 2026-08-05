import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { markBackupNow } from "@/lib/adminAuthStore";
import { writeAuditLog } from "@/lib/audit";

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

export type BackupKind = "manual" | "daily" | "weekly" | "monthly";

const RETENTION: Record<Exclude<BackupKind, "manual">, number> = {
  daily: 30,
  weekly: 12,
  monthly: 12,
};

export async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  return BACKUP_DIR;
}

/** Próximo backup diário (hora configurável) */
export function computeNextDailyAt(from = new Date(), hour = 2) {
  const next = new Date(from);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

async function ensureBackupMeta() {
  return prisma.backupMeta.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      nextDailyAt: computeNextDailyAt(),
    },
    update: {},
  });
}

async function updateBackupMeta(kind: BackupKind) {
  const now = new Date();
  const data: Record<string, Date> = {
    nextDailyAt: computeNextDailyAt(now),
  };
  if (kind === "manual") data.lastManualAt = now;
  if (kind === "daily") data.lastDailyAt = now;
  if (kind === "weekly") data.lastWeeklyAt = now;
  if (kind === "monthly") data.lastMonthlyAt = now;

  await prisma.backupMeta.upsert({
    where: { id: 1 },
    create: { id: 1, ...data, installedAt: now },
    update: data,
  });
}

/** Remove backups antigos conforme política de retenção */
export async function pruneOldBackups() {
  await ensureBackupDir();
  const files = await listBackupFiles();
  const deleted: string[] = [];
  const { getBackupSettings } = await import("@/lib/externalBackup");
  const settings = await getBackupSettings();
  const retention = {
    daily: settings.retentionDaily || RETENTION.daily,
    weekly: settings.retentionWeekly || RETENTION.weekly,
    monthly: settings.retentionMonthly || RETENTION.monthly,
  };

  for (const kind of ["daily", "weekly", "monthly"] as const) {
    const keep = retention[kind];
    const matching = files.filter((f) =>
      f.file.includes(`backup_${kind}_`),
    );
    const excess = matching.slice(keep);
    for (const item of excess) {
      await fs.unlink(path.join(BACKUP_DIR, item.file)).catch(() => undefined);
      deleted.push(item.file);
    }
  }
  return deleted;
}

/**
 * Decide quais backups agendados devem rodar agora.
 * Diário: todos os dias a partir das 02:00 (se ainda não rodou no dia).
 * Semanal: domingo + diário.
 * Mensal: dia 1 + diário.
 */
export function resolveDueBackupKinds(now = new Date()): BackupKind[] {
  const kinds: BackupKind[] = [];
  // horário configurável via backup_settings (lido async no runner)
  kinds.push("daily");
  if (now.getDay() === 0) kinds.push("weekly");
  if (now.getDate() === 1) kinds.push("monthly");
  return kinds;
}

export async function resolveDueBackupKindsAsync(now = new Date()) {
  const { getBackupSettings } = await import("@/lib/externalBackup");
  const settings = await getBackupSettings();
  const hour = now.getHours();
  if (hour < (settings.dailyHour ?? 2)) return [] as BackupKind[];
  return resolveDueBackupKinds(now);
}

export async function runScheduledBackups(opts?: { force?: boolean }) {
  await ensureBackupMeta();
  const meta = await prisma.backupMeta.findUnique({ where: { id: 1 } });
  const now = new Date();
  const due = opts?.force
    ? (["daily", "weekly", "monthly"] as BackupKind[])
    : await resolveDueBackupKindsAsync(now);

  const created: string[] = [];
  const skipped: string[] = [];

  for (const kind of due) {
    if (kind === "manual") continue;
    const lastKey =
      kind === "daily"
        ? meta?.lastDailyAt
        : kind === "weekly"
          ? meta?.lastWeeklyAt
          : meta?.lastMonthlyAt;

    if (!opts?.force && lastKey) {
      const sameDay =
        lastKey.getFullYear() === now.getFullYear() &&
        lastKey.getMonth() === now.getMonth() &&
        lastKey.getDate() === now.getDate();
      if (sameDay) {
        skipped.push(kind);
        continue;
      }
    }

    const result = await createBackupFile({
      user: "Sistema",
      kind,
    });
    created.push(result.file);
  }

  const pruned = await pruneOldBackups();
  await prisma.backupMeta.update({
    where: { id: 1 },
    data: { nextDailyAt: computeNextDailyAt(now) },
  });

  return { created, skipped, pruned, nextDailyAt: computeNextDailyAt(now) };
}

export async function getBackupStatus() {
  const meta = await ensureBackupMeta();
  const files = await listBackupFiles();
  const latest = files[0] || null;
  return {
    lastManualAt: meta.lastManualAt,
    lastDailyAt: meta.lastDailyAt,
    lastWeeklyAt: meta.lastWeeklyAt,
    lastMonthlyAt: meta.lastMonthlyAt,
    nextDailyAt: meta.nextDailyAt || computeNextDailyAt(),
    installedAt: meta.installedAt,
    count: files.length,
    latest,
    retention: RETENTION,
  };
}

export function getBackupFilePath(filename: string) {
  const safe = path.basename(filename);
  if (!safe.endsWith(".json") || safe.includes("..")) {
    throw new Error("Arquivo inválido.");
  }
  return path.join(BACKUP_DIR, safe);
}

/** Snapshot completo do sistema (JSON) — fonte: PostgreSQL */
export async function buildFullBackupPayload() {
  const [
    sections,
    categories,
    products,
    brands,
    variants,
    banners,
    coupons,
    adminUsers,
    customers,
    dealers,
    quotes,
    wholesaleQuotes,
    contactMessages,
    contactSettings,
    media,
    orders,
    logs,
    security,
  ] = await Promise.all([
    prisma.cmsSection.findMany(),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.brand.findMany(),
    prisma.productVariant.findMany(),
    prisma.banner.findMany(),
    prisma.coupon.findMany(),
    prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.customer.findMany({
      include: {
        addresses: true,
        orders: { include: { items: true } },
        warranties: true,
      },
    }),
    prisma.dealer.findMany(),
    prisma.quote.findMany(),
    prisma.wholesaleQuote.findMany(),
    prisma.contactMessage.findMany(),
    prisma.contactSettings.findMany(),
    prisma.mediaAsset.findMany(),
    prisma.order.findMany({ include: { items: true } }),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
    prisma.securitySettings.findMany(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: "homequeen-full-backup",
    sections,
    categories,
    products,
    brands,
    variants,
    banners,
    coupons,
    adminUsers,
    customers,
    dealers,
    quotes,
    wholesaleQuotes,
    contactMessages,
    contactSettings,
    media,
    orders,
    logs,
    security,
  };
}

export async function createBackupFile(opts?: {
  user?: string;
  automatic?: boolean;
  kind?: BackupKind;
}) {
  const t0 = Date.now();
  const user = opts?.user || "Sistema";
  await writeAuditLog("Backup iniciado", `Tipo: ${opts?.kind || "manual"}`, {
    user,
  });

  try {
    await ensureBackupDir();
    const payload = await buildFullBackupPayload();
    const kind: BackupKind =
      opts?.kind || (opts?.automatic ? "daily" : "manual");
    const file = `backup_${kind}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const full = path.join(BACKUP_DIR, file);
    await fs.writeFile(full, JSON.stringify(payload, null, 2), "utf8");
    const size = (await fs.stat(full)).size;
    await markBackupNow();
    await updateBackupMeta(kind);
    if (kind !== "manual") {
      await pruneOldBackups();
    }

    const {
      pushBackupExternal,
      getExternalBackupConfig,
      setExternalBackupConfig,
      getBackupSettings,
    } = await import("@/lib/externalBackup");

    await setExternalBackupConfig({
      lastLocalAt: new Date().toISOString(),
      lastLocalFile: file,
      lastLocalSize: size,
      lastLocalStatus: "ok",
    });

    try {
      await pushBackupExternal(full, file, { user });
    } catch (e) {
      const { raiseBackupFailure } = await import("@/lib/systemAlerts");
      const msg =
        e instanceof Error
          ? `Backup local OK; envio externo falhou: ${e.message}`
          : "Falha no backup externo";
      await raiseBackupFailure(msg);
      await writeAuditLog("Backup com erro", msg, { user });
      const settings = await getBackupSettings();
      if (settings.emailOnFailure && settings.notifyEmail) {
        const { sendMail } = await import("@/lib/mailer");
        await sendMail({
          to: settings.notifyEmail,
          subject: "[Home Queen] Backup com erro",
          text: msg,
        });
      }
    }

    const durationMs = Date.now() - t0;
    await writeAuditLog(
      "Backup concluído",
      `${file} · ${size} bytes · ${durationMs}ms`,
      { user },
    );

    const settings = await getBackupSettings();
    if (settings.emailOnSuccess && settings.notifyEmail) {
      const { sendMail } = await import("@/lib/mailer");
      const ext = await getExternalBackupConfig();
      await sendMail({
        to: settings.notifyEmail,
        subject: "[Home Queen] Backup concluído",
        text: `Arquivo: ${file}\nTamanho: ${size}\nCloud: ${ext.lastCloudStatus || "n/a"}\nDuração: ${durationMs}ms`,
      });
    }

    let finalSize = size;
    try {
      finalSize = (await fs.stat(full)).size;
    } catch {
      finalSize = size;
    }

    return { file, path: full, size: finalSize, kind, durationMs };
  } catch (e) {
    await writeAuditLog(
      "Backup com erro",
      e instanceof Error ? e.message : "Falha",
      { user },
    );
    throw e;
  }
}

export async function listBackupFiles() {
  await ensureBackupDir();
  const files = await fs.readdir(BACKUP_DIR);
  const json = files.filter((f) => f.endsWith(".json"));
  const detailed = await Promise.all(
    json.map(async (f) => {
      const st = await fs.stat(path.join(BACKUP_DIR, f));
      return { file: f, size: st.size, mtime: st.mtime.toISOString() };
    }),
  );
  return detailed.sort((a, b) => b.mtime.localeCompare(a.mtime));
}

/**
 * Restaura backup JSON (não apaga uploads em disco).
 * Estratégia: upsert por id nas entidades principais.
 */
export async function restoreBackupFromFile(
  filename: string,
  user = "Admin",
) {
  const safe = path.basename(filename);
  if (!safe.endsWith(".json") || safe.includes("..")) {
    throw new Error("Arquivo inválido.");
  }
  const full = path.join(BACKUP_DIR, safe);
  const raw = await fs.readFile(full, "utf8");
  const data = JSON.parse(raw) as Record<string, unknown>;

  // CMS sections
  for (const s of (data.sections as Array<{ key: string; data: unknown }>) || []) {
    await prisma.cmsSection.upsert({
      where: { key: s.key },
      create: { key: s.key, data: s.data as object },
      update: { data: s.data as object },
    });
  }

  for (const c of (data.categories as Array<Record<string, unknown>>) || []) {
    const id = String(c.id);
    await prisma.category.upsert({
      where: { id },
      create: {
        id,
        name: String(c.name),
        slug: String(c.slug),
        banner: String(c.banner || ""),
        icon: String(c.icon || ""),
        image: String(c.image || ""),
        order: Number(c.order || 0),
        description: String(c.description || ""),
        seoTitle: String(c.seoTitle || ""),
        seoDescription: String(c.seoDescription || ""),
        seoKeywords: String(c.seoKeywords || ""),
        ogImage: String(c.ogImage || ""),
        indexable: c.indexable !== false,
        minQty: Number(c.minQty || 3),
        active: c.active !== false,
      },
      update: {
        name: String(c.name),
        slug: String(c.slug),
        active: c.active !== false,
      },
    });
  }

  for (const p of (data.products as Array<Record<string, unknown>>) || []) {
    try {
      await prisma.product.upsert({
        where: { id: String(p.id) },
        create: {
          id: String(p.id),
          name: String(p.name),
          slug: String(p.slug),
          sku: String(p.sku || ""),
          code: String(p.code || ""),
          categoryId: String(p.categoryId),
          brand: String(p.brand || "Home Queen"),
          image: String(p.image || ""),
          cover: String(p.cover || ""),
          gallery: Array.isArray(p.gallery) ? (p.gallery as string[]) : [],
          retailPrice: Number(p.retailPrice || 0),
          wholesalePrice: Number(p.wholesalePrice || 0),
          stock: Number(p.stock || 0),
          active: p.active !== false,
          description: String(p.description || ""),
          order: Number(p.order || 0),
        },
        update: {
          name: String(p.name),
          stock: Number(p.stock || 0),
          retailPrice: Number(p.retailPrice || 0),
          wholesalePrice: Number(p.wholesalePrice || 0),
        },
      });
    } catch {
      /* skip orphan products */
    }
  }

  for (const u of (data.adminUsers as Array<Record<string, unknown>>) || []) {
    await prisma.adminUser.upsert({
      where: { id: String(u.id) },
      create: {
        id: String(u.id),
        name: String(u.name),
        username: String(u.username),
        email: String(u.email),
        passwordHash: String(u.passwordHash),
        role: String(u.role || "Administrador"),
        active: u.active !== false,
      },
      update: {
        name: String(u.name),
        email: String(u.email),
        passwordHash: String(u.passwordHash),
        role: String(u.role || "Administrador"),
        active: u.active !== false,
      },
    });
  }

  await writeAuditLog("Restauração", `Backup restaurado: ${safe}`, { user });
  await markBackupNow();
  return { ok: true, file: safe };
}
