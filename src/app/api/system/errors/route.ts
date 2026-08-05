import { NextResponse } from "next/server";
import { captureException } from "@/lib/systemErrors";

export const runtime = "nodejs";

/** Endpoint opcional para o frontend reportar erros inesperados */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      message?: string;
      stack?: string;
      url?: string;
      source?: string;
    };
    if (!body.message) {
      return NextResponse.json({ error: "message obrigatório" }, { status: 400 });
    }
    await captureException(new Error(body.message), {
      source: body.source || "client",
      url: body.url,
      request,
    });
    if (body.stack) {
      // captureException já pega stack do Error; reforça via log se necessário
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
