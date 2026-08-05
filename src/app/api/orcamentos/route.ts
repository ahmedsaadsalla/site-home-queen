import { NextResponse } from "next/server";
import { emptyCustomer, QUOTE_STATUSES, type QuoteRecord } from "@/data/quotes";
import {
  nextQuoteNumber,
  notifyQuoteCreated,
  readQuotes,
  saveQuoteAttachment,
  writeQuotes,
} from "@/lib/quotesStore";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const quotes = await readQuotes();
  quotes.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json(quotes);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const payloadRaw = String(form.get("payload") ?? "");
    if (!payloadRaw) {
      return NextResponse.json(
        { error: "Payload inválido." },
        { status: 400 },
      );
    }

    const payload = JSON.parse(payloadRaw) as {
      customer?: Partial<QuoteRecord["customer"]>;
      product?: QuoteRecord["product"];
      message?: string;
    };

    if (!payload.product?.name) {
      return NextResponse.json(
        { error: "Produto é necessário para o orçamento." },
        { status: 400 },
      );
    }

    const quotes = await readQuotes();
    const now = new Date().toISOString();
    const id = `q_${Date.now().toString(36)}`;
    const number = await nextQuoteNumber(quotes);

    const attachments: QuoteRecord["attachments"] = [];
    const files = form.getAll("files");
    for (const entry of files) {
      if (!(entry instanceof File) || entry.size === 0) continue;
      if (entry.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `Arquivo ${entry.name} excede 10MB.` },
          { status: 400 },
        );
      }
      if (entry.type && !ALLOWED_TYPES.has(entry.type)) {
        return NextResponse.json(
          { error: `Tipo não permitido: ${entry.name}` },
          { status: 400 },
        );
      }
      attachments.push(await saveQuoteAttachment(id, entry));
    }

    const customer = { ...emptyCustomer(), ...payload.customer };
    const quote: QuoteRecord = {
      id,
      number,
      createdAt: now,
      updatedAt: now,
      status: "Novo",
      responsible: "",
      customer,
      product: {
        ...payload.product,
        quantity: Math.max(1, Number(payload.product.quantity) || 1),
      },
      message: String(payload.message ?? "").trim(),
      attachments,
      emailToCompany: true,
      emailToCustomer: Boolean(customer.email),
    };

    quotes.push(quote);
    await writeQuotes(quotes);
    await notifyQuoteCreated(quote);

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    console.error("[orçamento] POST failed", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o orçamento." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: string;
      responsible?: string;
    };
    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    const quotes = await readQuotes();
    const index = quotes.findIndex((q) => q.id === body.id);
    if (index < 0) {
      return NextResponse.json(
        { error: "Orçamento não encontrado." },
        { status: 404 },
      );
    }

    if (
      body.status &&
      QUOTE_STATUSES.includes(body.status as (typeof QUOTE_STATUSES)[number])
    ) {
      quotes[index].status = body.status as QuoteRecord["status"];
    }
    if (typeof body.responsible === "string") {
      quotes[index].responsible = body.responsible;
    }
    quotes[index].updatedAt = new Date().toISOString();
    await writeQuotes(quotes);
    return NextResponse.json({ ok: true, quote: quotes[index] });
  } catch (error) {
    console.error("[orçamento] PATCH failed", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar." },
      { status: 500 },
    );
  }
}
