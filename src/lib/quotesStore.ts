import { promises as fs } from "fs";
import path from "path";
import type { QuoteRecord } from "@/data/quotes";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/db/mappers";
import type { Prisma } from "@prisma/client";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads", "orcamentos");

async function ensureUploads() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function readQuotes(): Promise<QuoteRecord[]> {
  const rows = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((q) => ({
    id: q.id,
    number: q.number,
    createdAt: iso(q.createdAt),
    updatedAt: iso(q.updatedAt),
    status: q.status as QuoteRecord["status"],
    responsible: q.responsible,
    customer: q.customer as QuoteRecord["customer"],
    product: q.product as QuoteRecord["product"],
    message: q.message,
    attachments: (Array.isArray(q.attachments)
      ? q.attachments
      : []) as QuoteRecord["attachments"],
    emailToCompany: q.emailToCompany,
    emailToCustomer: q.emailToCustomer,
  }));
}

export async function writeQuotes(quotes: QuoteRecord[]) {
  await prisma.$transaction(async (tx) => {
    await tx.quote.deleteMany({});
    for (const q of quotes) {
      await tx.quote.create({
        data: {
          id: q.id,
          number: q.number,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt || q.createdAt),
          status: q.status,
          responsible: q.responsible || "",
          customer: q.customer as unknown as Prisma.InputJsonValue,
          product: q.product as unknown as Prisma.InputJsonValue,
          message: q.message || "",
          attachments: (q.attachments || []) as Prisma.InputJsonValue,
          emailToCompany: Boolean(q.emailToCompany),
          emailToCustomer: Boolean(q.emailToCustomer),
        },
      });
    }
  });
}

export async function nextQuoteNumber(quotes: QuoteRecord[]) {
  const year = new Date().getFullYear();
  const prefix = `ORC-${year}-`;
  const seq = quotes
    .map((q) => q.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n));
  // also check DB for race safety
  const latest = await prisma.quote.findMany({
    where: { number: { startsWith: prefix } },
    select: { number: true },
  });
  for (const row of latest) {
    const n = Number(row.number.slice(prefix.length));
    if (!Number.isNaN(n)) seq.push(n);
  }
  const next = (seq.length ? Math.max(...seq) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function saveQuoteAttachment(
  quoteId: string,
  file: File,
): Promise<{ name: string; size: number; type: string; storedAs: string }> {
  await ensureUploads();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedAs = `${quoteId}-${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, storedAs), buffer);
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    storedAs,
  };
}

export async function notifyQuoteCreated(quote: QuoteRecord) {
  console.info("[orçamento] Salvo no painel:", quote.number);
  console.info("[orçamento] E-mail Home Queen (stub):", {
    to: "contato@homequeen.com.br",
    subject: `Novo orçamento ${quote.number}`,
    product: quote.product.name,
  });
  if (quote.customer.email) {
    console.info("[orçamento] Confirmação ao cliente (stub):", {
      to: quote.customer.email,
      subject: `Recebemos sua solicitação ${quote.number}`,
    });
  }
}
