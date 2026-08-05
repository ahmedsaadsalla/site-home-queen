import type { DealerRecord, WholesaleQuote } from "@/data/wholesale";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/db/mappers";
import type { Prisma } from "@prisma/client";
import {
  createPasswordHash,
  verifyPassword,
} from "@/lib/password";

export { createPasswordHash, verifyPassword };

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function readDealers(): Promise<DealerRecord[]> {
  const rows = await prisma.dealer.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((d) => ({
    id: d.id,
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
    status: d.status as DealerRecord["status"],
    cnpj: d.cnpj,
    passwordHash: d.passwordHash,
    companyName: d.companyName,
    tradeName: d.tradeName,
    contactName: d.contactName,
    email: d.email,
    phone: d.phone,
    whatsapp: d.whatsapp,
    state: d.state,
    city: d.city,
    stateRegistration: d.stateRegistration || undefined,
    blocked: d.blocked,
    priceTable: d.priceTable || undefined,
    globalMinOrder: d.globalMinOrder ?? undefined,
    discountPercent: d.discountPercent ?? undefined,
    creditLimit: d.creditLimit ?? undefined,
    carrier: d.carrier || undefined,
    region: d.region || undefined,
    paymentMethod: d.paymentMethod || undefined,
  }));
}

export async function writeDealers(dealers: DealerRecord[]) {
  await prisma.$transaction(async (tx) => {
    await tx.dealer.deleteMany({});
    for (const d of dealers) {
      await tx.dealer.create({
        data: {
          id: d.id,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt || d.createdAt),
          status: d.status,
          cnpj: d.cnpj,
          passwordHash: d.passwordHash,
          companyName: d.companyName,
          tradeName: d.tradeName || "",
          contactName: d.contactName || "",
          email: d.email,
          phone: d.phone || "",
          whatsapp: d.whatsapp || "",
          state: d.state || "",
          city: d.city || "",
          stateRegistration: d.stateRegistration || null,
          blocked: Boolean(d.blocked),
          priceTable: d.priceTable || null,
          globalMinOrder: d.globalMinOrder ?? null,
          discountPercent: d.discountPercent ?? null,
          creditLimit: d.creditLimit ?? null,
          carrier: d.carrier || null,
          region: d.region || null,
          paymentMethod: d.paymentMethod || null,
        },
      });
    }
  });
}

export async function readWholesaleQuotes(): Promise<WholesaleQuote[]> {
  const rows = await prisma.wholesaleQuote.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((q) => ({
    id: q.id,
    createdAt: iso(q.createdAt),
    dealerId: q.dealerId || undefined,
    name: q.name,
    company: q.company,
    cnpj: q.cnpj,
    email: q.email,
    whatsapp: q.whatsapp,
    product: q.product,
    category: q.category || undefined,
    model: q.model || undefined,
    type: q.type || undefined,
    size: q.size || undefined,
    color: q.color || undefined,
    mattress: q.mattress || undefined,
    quantity: q.quantity,
    notes: q.notes,
    attachments: Array.isArray(q.attachments)
      ? (q.attachments as WholesaleQuote["attachments"])
      : undefined,
  }));
}

export async function writeWholesaleQuotes(quotes: WholesaleQuote[]) {
  await prisma.$transaction(async (tx) => {
    await tx.wholesaleQuote.deleteMany({});
    for (const q of quotes) {
      await tx.wholesaleQuote.create({
        data: {
          id: q.id,
          createdAt: new Date(q.createdAt),
          dealerId: q.dealerId || null,
          name: q.name,
          company: q.company || "",
          cnpj: q.cnpj || "",
          email: q.email || "",
          whatsapp: q.whatsapp || "",
          product: q.product || "",
          category: q.category || null,
          model: q.model || null,
          type: q.type || null,
          size: q.size || null,
          color: q.color || null,
          mattress: q.mattress || null,
          quantity: q.quantity || 1,
          notes: q.notes || "",
          attachments: (q.attachments || []) as Prisma.InputJsonValue,
        },
      });
    }
  });
}

export function publicDealer(dealer: DealerRecord) {
  const { passwordHash: _, ...rest } = dealer;
  return rest;
}
