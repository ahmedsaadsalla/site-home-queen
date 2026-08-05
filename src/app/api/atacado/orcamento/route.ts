import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { WholesaleQuote } from "@/data/wholesale";
import {
  readDealers,
  readWholesaleQuotes,
  writeWholesaleQuotes,
} from "@/lib/wholesaleStore";

export const runtime = "nodejs";

export async function GET() {
  const quotes = await readWholesaleQuotes();
  quotes.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json(quotes);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<WholesaleQuote>;
    const name = String(body.name ?? "").trim();
    const company = String(body.company ?? "").trim();
    const cnpj = String(body.cnpj ?? "").trim();
    const email = String(body.email ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const product = String(body.product ?? "").trim();
    const category = String(body.category ?? "").trim();
    const model = String(body.model ?? "").trim();
    const type = String(body.type ?? "").trim();
    const size = String(body.size ?? "").trim();
    const color = String(body.color ?? "").trim();
    const mattress = String(body.mattress ?? "").trim();
    const quantity = Math.max(1, Number(body.quantity) || 1);
    const notes = String(body.notes ?? "").trim();
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.map((a) => String(a).trim()).filter(Boolean)
      : [];

    if (!name || !company || !whatsapp || !product) {
      return NextResponse.json(
        { error: "Nome, empresa, WhatsApp e produto são obrigatórios." },
        { status: 400 },
      );
    }

    const jar = await cookies();
    const sessionId = jar.get("hq_dealer_session")?.value;
    const dealers = await readDealers();
    const dealer = dealers.find((d) => d.id === sessionId);

    const quote: WholesaleQuote = {
      id: `wq_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      dealerId: dealer?.id,
      name,
      company,
      cnpj,
      email,
      whatsapp,
      product,
      category,
      model,
      type,
      size,
      color,
      mattress,
      quantity,
      notes,
      attachments,
    };

    const quotes = await readWholesaleQuotes();
    quotes.push(quote);
    await writeWholesaleQuotes(quotes);

    console.info("[atacado] Nova cotação:", quote.id, quote.product);

    return NextResponse.json({ ok: true, id: quote.id });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar a cotação." },
      { status: 500 },
    );
  }
}
