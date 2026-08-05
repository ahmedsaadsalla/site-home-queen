import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export type MaintenanceSettings = {
  enabled: boolean;
  message: string;
  eta: string;
  phone: string;
  whatsapp: string;
  email: string;
};

const DEFAULT_MAINTENANCE: MaintenanceSettings = {
  enabled: false,
  message:
    "Estamos realizando melhorias em nosso site.\n\nVoltaremos em breve.\n\nObrigado pela compreensão.",
  eta: "",
  phone: "",
  whatsapp: "",
  email: "",
};

const FLAG_PATH = path.join(process.cwd(), "public", "maintenance.json");

/** Espelho estático para o middleware (Edge) ler sem Prisma */
export async function writeMaintenanceFlag(data: MaintenanceSettings) {
  try {
    await fs.writeFile(
      FLAG_PATH,
      JSON.stringify({
        enabled: data.enabled,
        message: data.message,
        eta: data.eta,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        updatedAt: new Date().toISOString(),
      }),
      "utf8",
    );
  } catch (e) {
    console.error("[maintenance] falha ao gravar flag", e);
  }
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "maintenance" },
    });
    if (!row) return { ...DEFAULT_MAINTENANCE };
    return { ...DEFAULT_MAINTENANCE, ...(row.value as object) };
  } catch {
    return { ...DEFAULT_MAINTENANCE };
  }
}

export async function setMaintenanceSettings(
  data: Partial<MaintenanceSettings>,
) {
  const current = await getMaintenanceSettings();
  const next = { ...current, ...data };
  await prisma.siteSetting.upsert({
    where: { key: "maintenance" },
    create: { key: "maintenance", value: next },
    update: { value: next },
  });
  await writeMaintenanceFlag(next);
  return next;
}

export async function ensureSystemVersionSeed() {
  const count = await prisma.systemVersion.count();
  if (count > 0) return;
  await prisma.systemVersion.create({
    data: {
      id: "ver_1_0_0",
      version: "1.0.0",
      description: "Primeira versão em produção.",
      author: "Sistema",
      isCurrent: true,
    },
  });
}

export async function getCurrentVersion() {
  await ensureSystemVersionSeed();
  const current = await prisma.systemVersion.findFirst({
    where: { isCurrent: true },
    orderBy: { releasedAt: "desc" },
  });
  return current;
}

export async function listVersions() {
  await ensureSystemVersionSeed();
  return prisma.systemVersion.findMany({
    orderBy: { releasedAt: "desc" },
  });
}
