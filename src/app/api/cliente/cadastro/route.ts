import { NextResponse } from "next/server";
import type { CustomerRecord } from "@/data/customer";
import {
  createPasswordHash,
  isValidCpfLength,
  onlyDigits,
  publicCustomer,
  readCustomers,
  writeCustomers,
} from "@/lib/customerStore";
import { formatCpf } from "@/lib/wholesalePricing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      name: string;
      cpf: string;
      email: string;
      phone: string;
      whatsapp: string;
      password: string;
      passwordConfirm: string;
      acceptTerms: boolean;
    }>;

    const name = String(body.name ?? "").trim();
    const cpf = onlyDigits(String(body.cpf ?? ""));
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const password = String(body.password ?? "").trim();
    const passwordConfirm = String(body.passwordConfirm ?? "").trim();

    if (!name || !cpf || !email || !password) {
      return NextResponse.json(
        { error: "Preencha nome, CPF, e-mail e senha." },
        { status: 400 },
      );
    }
    if (!body.acceptTerms) {
      return NextResponse.json(
        { error: "Aceite os termos para continuar." },
        { status: 400 },
      );
    }
    if (!isValidCpfLength(cpf)) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter ao menos 6 caracteres." },
        { status: 400 },
      );
    }
    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "As senhas não coincidem." },
        { status: 400 },
      );
    }

    const customers = await readCustomers();
    if (customers.some((c) => c.cpf === cpf)) {
      return NextResponse.json(
        { error: "Já existe cadastro com este CPF." },
        { status: 409 },
      );
    }
    if (customers.some((c) => c.email === email)) {
      return NextResponse.json(
        { error: "Já existe cadastro com este e-mail." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const customer: CustomerRecord = {
      id: `c_${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
      name,
      cpf,
      email,
      phone,
      whatsapp: whatsapp || phone,
      passwordHash: await createPasswordHash(password),
      addresses: [],
      favoriteProductIds: [],
      orders: [],
      warranties: [],
    };

    customers.push(customer);
    await writeCustomers(customers);

    const res = NextResponse.json({
      ok: true,
      message: "Conta criada com sucesso.",
      customer: publicCustomer(customer),
      formattedCpf: formatCpf(cpf),
    });
    res.cookies.set("hq_customer_session", customer.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar a conta." },
      { status: 500 },
    );
  }
}
