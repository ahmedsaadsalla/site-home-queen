import { NextResponse } from "next/server";
import { requestCustomerPasswordReset } from "@/lib/customerPasswordReset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      identity?: string;
      email?: string;
      cpf?: string;
    };
    const identity = String(
      body.identity || body.email || body.cpf || "",
    ).trim();
    if (!identity) {
      return NextResponse.json(
        { error: "Informe CPF ou e-mail." },
        { status: 400 },
      );
    }
    const result = await requestCustomerPasswordReset(identity);
    return NextResponse.json({
      ok: true,
      message:
        "Se o cadastro existir, enviamos um link de redefinição para o e-mail.",
      ...(result.link ? { devLink: result.link } : {}),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar a solicitação." },
      { status: 500 },
    );
  }
}
