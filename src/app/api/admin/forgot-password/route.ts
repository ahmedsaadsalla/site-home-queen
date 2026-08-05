import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/adminAuthStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; username?: string };
    const identity = String(body.email || body.username || "").trim();
    if (!identity) {
      return NextResponse.json(
        { error: "Informe o e-mail ou usuário." },
        { status: 400 },
      );
    }
    const result = await requestPasswordReset(identity);
    return NextResponse.json({
      ok: true,
      message:
        "Se o cadastro existir, enviamos um link de redefinição. Verifique seu e-mail.",
      // Apenas em desenvolvimento para testes sem SMTP
      ...(result.link ? { devLink: result.link } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Falha ao processar." }, { status: 500 });
  }
}
