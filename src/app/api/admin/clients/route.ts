import { NextResponse } from "next/server";
import { readCustomers } from "@/lib/customerStore";
import { publicCustomer } from "@/lib/customerStore";

export const runtime = "nodejs";

export async function GET() {
  const customers = await readCustomers();
  return NextResponse.json({
    cpf: customers.map((c) => ({
      ...publicCustomer(c),
      orders: c.orders,
    })),
  });
}
