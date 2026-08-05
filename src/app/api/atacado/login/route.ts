import { NextResponse } from "next/server";
import {
  onlyDigits,
  publicDealer,
  readDealers,
  writeDealers,
  verifyPassword,
} from "@/lib/wholesaleStore";

export const runtime = "nodejs";

const COOKIE = "hq_dealer_session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cnpj?: string;
      password?: string;
      remember?: boolean;
    };
    const cnpj = onlyDigits(String(body.cnpj ?? ""));
    const password = String(body.password ?? "");

    if (!cnpj || !password) {
      return NextResponse.json(
        { error: "Informe CNPJ e senha." },
        { status: 400 },
      );
    }

    const dealers = await readDealers();
    const dealer = dealers.find((d) => d.cnpj === cnpj);
    if (!dealer || !(await verifyPassword(password, dealer.passwordHash))) {
      return NextResponse.json(
        { error: "CNPJ ou senha incorretos." },
        { status: 401 },
      );
    }

    const { isLegacyPasswordHash, createPasswordHash } = await import(
      "@/lib/password"
    );
    if (isLegacyPasswordHash(dealer.passwordHash)) {
      dealer.passwordHash = await createPasswordHash(password);
      dealer.updatedAt = new Date().toISOString();
      await writeDealers(dealers);
    }

    if (dealer.status !== "Aprovado") {
      return NextResponse.json(
        {
          error:
            dealer.status === "Pendente"
              ? "Cadastro ainda em análise. Aguarde a aprovação."
              : "Cadastro não aprovado. Fale com o comercial.",
          status: dealer.status,
        },
        { status: 403 },
      );
    }

    if (dealer.blocked) {
      return NextResponse.json(
        { error: "Conta bloqueada. Fale com o comercial Home Queen." },
        { status: 403 },
      );
    }

    const res = NextResponse.json({
      ok: true,
      dealer: publicDealer(dealer),
    });
    res.cookies.set(COOKIE, dealer.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: body.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível entrar." },
      { status: 500 },
    );
  }
}
