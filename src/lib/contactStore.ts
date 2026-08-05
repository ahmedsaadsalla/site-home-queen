import {
  DEFAULT_CONTACT_SETTINGS,
  type ContactMessage,
  type ContactSettings,
} from "@/data/contact";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/db/mappers";
import type { Prisma } from "@prisma/client";

export async function readContactMessages(): Promise<ContactMessage[]> {
  const rows = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((m) => ({
    id: m.id,
    createdAt: iso(m.createdAt),
    helpIntent: m.helpIntent as ContactMessage["helpIntent"],
    name: m.name,
    company: m.company,
    document: m.document,
    email: m.email,
    phone: m.phone,
    whatsapp: m.whatsapp,
    city: m.city,
    state: m.state,
    subject: m.subject,
    message: m.message,
  }));
}

export async function writeContactMessages(messages: ContactMessage[]) {
  await prisma.$transaction(async (tx) => {
    await tx.contactMessage.deleteMany({});
    if (!messages.length) return;
    await tx.contactMessage.createMany({
      data: messages.map((m) => ({
        id: m.id,
        createdAt: new Date(m.createdAt),
        helpIntent: m.helpIntent || "",
        name: m.name,
        company: m.company || "",
        document: m.document || "",
        email: m.email || "",
        phone: m.phone || "",
        whatsapp: m.whatsapp || "",
        city: m.city || "",
        state: m.state || "",
        subject: m.subject || "",
        message: m.message || "",
      })),
    });
  });
}

export async function readContactSettings(): Promise<ContactSettings> {
  const row = await prisma.contactSettings.findUnique({ where: { id: 1 } });
  if (!row) {
    await prisma.contactSettings.create({
      data: {
        id: 1,
        data: DEFAULT_CONTACT_SETTINGS as unknown as Prisma.InputJsonValue,
      },
    });
    return { ...DEFAULT_CONTACT_SETTINGS };
  }
  return {
    ...DEFAULT_CONTACT_SETTINGS,
    ...(row.data as ContactSettings),
  };
}

export async function writeContactSettings(settings: ContactSettings) {
  await prisma.contactSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      data: settings as unknown as Prisma.InputJsonValue,
    },
    update: { data: settings as unknown as Prisma.InputJsonValue },
  });
}

export async function notifyContactCreated(message: ContactMessage) {
  console.info("[contato] Nova mensagem:", message.id);
  console.info("[contato] E-mail Home Queen (stub):", {
    to: "contato@homequeen.com.br",
    subject: `[Contato] ${message.subject}`,
    from: message.email || "(sem e-mail)",
    helpIntent: message.helpIntent,
    preview: message.message.slice(0, 120),
  });
  if (message.email) {
    console.info("[contato] Confirmação ao cliente (stub):", {
      to: message.email,
      subject: "Recebemos sua mensagem — Home Queen",
    });
  }
}
