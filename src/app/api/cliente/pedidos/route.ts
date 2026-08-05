import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CustomerAddress, CustomerOrder } from "@/data/customer";
import { syncCustomerToBlingAfterFirstPurchase } from "@/lib/blingCustomer";
import {
  publicCustomer,
  readCustomers,
  writeCustomers,
} from "@/lib/customerStore";

export const runtime = "nodejs";

async function getSessionCustomer() {
  const jar = await cookies();
  const id = jar.get("hq_customer_session")?.value;
  if (!id) return null;
  const customers = await readCustomers();
  return { customers, customer: customers.find((c) => c.id === id) || null };
}

/** Lista pedidos do cliente logado */
export async function GET() {
  const session = await getSessionCustomer();
  if (!session?.customer) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({ orders: session.customer.orders });
}

/**
 * Cria pedido local e, na 1ª compra, sincroniza cliente no Bling (stub).
 * Também usado para demos de rastreamento.
 */
export async function POST(request: Request) {
  try {
    const session = await getSessionCustomer();
    if (!session?.customer) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<{
      items: CustomerOrder["items"];
      total: number;
      demo?: boolean;
    }>;

    const items = Array.isArray(body.items) ? body.items : [];
    const total = Number(body.total) || 0;
    if (!items.length && !body.demo) {
      return NextResponse.json({ error: "Pedido vazio." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const orderId = `ped_${Date.now().toString(36)}`;
    const isFirst = session.customer.orders.length === 0;

    let order: CustomerOrder = {
      id: orderId,
      createdAt: now,
      status: body.demo ? "Em trânsito" : "Recebido",
      trackingCode: body.demo ? `HQ${Date.now().toString().slice(-8)}` : undefined,
      carrier: body.demo ? "Home Queen Express" : undefined,
      eta: body.demo ? "5 a 8 dias úteis" : undefined,
      total:
        total ||
        items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) ||
        (body.demo ? 1890 : 0),
      items: items.length
        ? items
        : [
            {
              name: "Cama Box Baú Premium",
              quantity: 1,
              unitPrice: 1890,
            },
          ],
      invoiceUrl: body.demo ? "#" : undefined,
    };

    const idx = session.customers.findIndex((c) => c.id === session.customer!.id);
    let customer = session.customers[idx];

    if (isFirst || !customer.blingContactId) {
      const bling = await syncCustomerToBlingAfterFirstPurchase(customer, orderId);
      order = {
        ...order,
        blingOrderId: bling.blingOrderId,
        invoiceUrl: order.invoiceUrl || "#",
      };
      customer = {
        ...customer,
        blingContactId: bling.blingContactId,
        blingSyncedAt: now,
      };
    }

    customer = {
      ...customer,
      orders: [order, ...customer.orders],
      updatedAt: now,
    };
    session.customers[idx] = customer;
    await writeCustomers(session.customers);

    return NextResponse.json({
      ok: true,
      order,
      customer: publicCustomer(customer),
      blingSynced: Boolean(customer.blingContactId),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registrar o pedido." },
      { status: 500 },
    );
  }
}

export type { CustomerAddress };
