import { NextResponse } from "next/server";
import {
  onlyDigits,
  publicCustomer,
  readCustomers,
  writeCustomers,
  verifyPassword,
} from "@/lib/customerStore";

export const runtime = "nodejs";

const COOKIE = "hq_customer_session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cpf?: string;
      email?: string;
      password?: string;
      remember?: boolean;
    };
    const cpf = onlyDigits(String(body.cpf ?? ""));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if ((!cpf && !email) || !password) {
      return NextResponse.json(
        { error: "Informe CPF ou e-mail e a senha." },
        { status: 400 },
      );
    }

    const customers = await readCustomers();
    const customer = customers.find(
      (c) => (cpf && c.cpf === cpf) || (email && c.email === email),
    );
    if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
      return NextResponse.json(
        { error: "CPF/e-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    // Migra hash legado → bcrypt no próximo login bem-sucedido
    const { isLegacyPasswordHash, createPasswordHash } = await import(
      "@/lib/password"
    );
    if (isLegacyPasswordHash(customer.passwordHash)) {
      customer.passwordHash = await createPasswordHash(password);
      customer.updatedAt = new Date().toISOString();
      await writeCustomers(customers);
    }

    const res = NextResponse.json({
      ok: true,
      customer: publicCustomer(customer),
    });
    res.cookies.set(COOKIE, customer.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: body.remember === false ? 60 * 60 * 12 : 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível entrar." },
      { status: 500 },
    );
  }
}
