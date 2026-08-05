import { NextResponse } from "next/server";
import { resetCustomerPasswordWithToken } from "@/lib/customerPasswordReset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
    };
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (!token || password.length < 6) {
      return NextResponse.json(
        { error: "Informe o token e uma senha com ao menos 6 caracteres." },
        { status: 400 },
      );
    }
    await resetCustomerPasswordWithToken(token, password);
    return NextResponse.json({
      ok: true,
      message: "Senha redefinida. Você já pode entrar.",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Não foi possível redefinir a senha.",
      },
      { status: 400 },
    );
  }
}
