import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { publicCustomer, readCustomers, writeCustomers } from "@/lib/customerStore";

export const runtime = "nodejs";

async function getSessionCustomer() {
  const jar = await cookies();
  const id = jar.get("hq_customer_session")?.value;
  if (!id) return null;
  const customers = await readCustomers();
  return customers.find((c) => c.id === id) || null;
}

export async function GET() {
  const customer = await getSessionCustomer();
  if (!customer) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    customer: publicCustomer(customer),
  });
}

export async function PATCH(request: Request) {
  try {
    const customer = await getSessionCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<{
      name: string;
      phone: string;
      whatsapp: string;
      email: string;
      favoriteProductIds: string[];
      addresses: typeof customer.addresses;
    }>;

    const customers = await readCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx < 0) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const current = customers[idx];
    customers[idx] = {
      ...current,
      name: body.name !== undefined ? String(body.name).trim() : current.name,
      phone: body.phone !== undefined ? String(body.phone).trim() : current.phone,
      whatsapp:
        body.whatsapp !== undefined
          ? String(body.whatsapp).trim()
          : current.whatsapp,
      email:
        body.email !== undefined
          ? String(body.email).trim().toLowerCase()
          : current.email,
      favoriteProductIds: Array.isArray(body.favoriteProductIds)
        ? body.favoriteProductIds.map(String)
        : current.favoriteProductIds,
      addresses: Array.isArray(body.addresses)
        ? body.addresses
        : current.addresses,
      updatedAt: new Date().toISOString(),
    };

    await writeCustomers(customers);
    return NextResponse.json({
      ok: true,
      customer: publicCustomer(customers[idx]),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar." },
      { status: 500 },
    );
  }
}
