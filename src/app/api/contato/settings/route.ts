import { NextResponse } from "next/server";
import type { ContactSettings } from "@/data/contact";
import {
  readContactSettings,
  writeContactSettings,
} from "@/lib/contactStore";

export const runtime = "nodejs";

export async function GET() {
  const settings = await readContactSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactSettings>;
    const current = await readContactSettings();
    const next: ContactSettings = { ...current, ...body };
    await writeContactSettings(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar as configurações." },
      { status: 500 },
    );
  }
}
