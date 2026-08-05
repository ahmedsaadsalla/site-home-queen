import { NextResponse } from "next/server";
import { BRAZIL_STATES } from "@/data/contact";
import type { DealerRecord } from "@/data/wholesale";
import {
  createPasswordHash,
  onlyDigits,
  publicDealer,
  readDealers,
  writeDealers,
} from "@/lib/wholesaleStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      companyName: string;
      tradeName: string;
      cnpj: string;
      stateRegistration: string;
      contactName: string;
      email: string;
      phone: string;
      whatsapp: string;
      state: string;
      city: string;
      password: string;
      passwordConfirm: string;
      acceptTerms: boolean;
    }>;

    const companyName = String(body.companyName ?? "").trim();
    const tradeName = String(body.tradeName ?? "").trim();
    const cnpj = onlyDigits(String(body.cnpj ?? ""));
    const stateRegistration = String(body.stateRegistration ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const state = String(body.state ?? "").trim().toUpperCase();
    const city = String(body.city ?? "").trim();
    const password = String(body.password ?? "").trim();
    const passwordConfirm = String(body.passwordConfirm ?? "").trim();

    if (
      !companyName ||
      !cnpj ||
      !contactName ||
      !email ||
      !whatsapp ||
      !state ||
      !city ||
      !password
    ) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios, incluindo senha de acesso." },
        { status: 400 },
      );
    }

    if (!body.acceptTerms) {
      return NextResponse.json(
        { error: "Aceite os termos para continuar." },
        { status: 400 },
      );
    }

    if (cnpj.length !== 14) {
      return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
    }

    if (!BRAZIL_STATES.includes(state as (typeof BRAZIL_STATES)[number])) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
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

    const dealers = await readDealers();
    if (dealers.some((d) => d.cnpj === cnpj)) {
      return NextResponse.json(
        { error: "Já existe cadastro com este CNPJ." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const dealer: DealerRecord = {
      id: `d_${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
      status: "Pendente",
      cnpj,
      passwordHash: await createPasswordHash(password),
      companyName,
      tradeName: tradeName || companyName,
      contactName,
      email,
      phone,
      whatsapp,
      state,
      city,
      stateRegistration: stateRegistration || undefined,
      blocked: false,
      priceTable: "Padrão",
      discountPercent: 28,
      globalMinOrder: 0,
    };

    dealers.push(dealer);
    await writeDealers(dealers);

    return NextResponse.json({
      ok: true,
      message:
        "Cadastro enviado. Nossa equipe analisará seu CNPJ. Você receberá um e-mail quando sua conta for aprovada.",
      dealer: publicDealer(dealer),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar o cadastro." },
      { status: 500 },
    );
  }
}
