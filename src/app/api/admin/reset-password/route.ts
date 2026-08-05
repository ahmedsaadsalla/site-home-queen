import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/adminAuthStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (!token || password.length < 6) {
      return NextResponse.json(
        { error: "Token inválido ou senha muito curta." },
        { status: 400 },
      );
    }
    await resetPasswordWithToken(token, password);
    return NextResponse.json({
      ok: true,
      message: "Senha atualizada. Faça login com a nova senha.",
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
