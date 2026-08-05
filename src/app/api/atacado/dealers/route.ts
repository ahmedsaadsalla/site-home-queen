import { NextResponse } from "next/server";
import type { DealerStatus } from "@/data/wholesale";
import {
  publicDealer,
  readDealers,
  writeDealers,
} from "@/lib/wholesaleStore";

export const runtime = "nodejs";

export async function GET() {
  const dealers = await readDealers();
  dealers.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json(dealers.map(publicDealer));
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: DealerStatus;
      blocked?: boolean;
      priceTable?: string;
      globalMinOrder?: number;
      discountPercent?: number;
      creditLimit?: number;
      carrier?: string;
      region?: string;
      paymentMethod?: string;
    };
    if (!body.id) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const dealers = await readDealers();
    const idx = dealers.findIndex((d) => d.id === body.id);
    if (idx < 0) {
      return NextResponse.json(
        { error: "Revendedor não encontrado." },
        { status: 404 },
      );
    }

    if (
      body.status &&
      !["Pendente", "Aprovado", "Recusado"].includes(body.status)
    ) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const current = dealers[idx];
    dealers[idx] = {
      ...current,
      status: body.status ?? current.status,
      blocked:
        typeof body.blocked === "boolean" ? body.blocked : current.blocked,
      priceTable:
        body.priceTable !== undefined
          ? String(body.priceTable).trim()
          : current.priceTable,
      globalMinOrder:
        body.globalMinOrder !== undefined
          ? Number(body.globalMinOrder) || undefined
          : current.globalMinOrder,
      discountPercent:
        body.discountPercent !== undefined
          ? Number(body.discountPercent) || undefined
          : current.discountPercent,
      creditLimit:
        body.creditLimit !== undefined
          ? Number(body.creditLimit) || undefined
          : current.creditLimit,
      carrier:
        body.carrier !== undefined
          ? String(body.carrier).trim()
          : current.carrier,
      region:
        body.region !== undefined ? String(body.region).trim() : current.region,
      paymentMethod:
        body.paymentMethod !== undefined
          ? String(body.paymentMethod).trim()
          : current.paymentMethod,
      updatedAt: new Date().toISOString(),
    };
    await writeDealers(dealers);
    return NextResponse.json(publicDealer(dealers[idx]));
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar." },
      { status: 500 },
    );
  }
}
