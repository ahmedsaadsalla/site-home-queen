import { NextResponse } from "next/server";
import {
  BRAZIL_STATES,
  CONTACT_SUBJECTS,
  HELP_OPTIONS,
  type ContactMessage,
  type HelpIntent,
} from "@/data/contact";
import {
  notifyContactCreated,
  readContactMessages,
  writeContactMessages,
} from "@/lib/contactStore";

export const runtime = "nodejs";

export async function GET() {
  const messages = await readContactMessages();
  messages.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactMessage>;
    const message = String(body.message ?? "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "A mensagem é obrigatória." },
        { status: 400 },
      );
    }

    const helpIntent = (body.helpIntent || "cliente") as HelpIntent;
    if (!HELP_OPTIONS.some((o) => o.id === helpIntent)) {
      return NextResponse.json(
        { error: "Tipo de atendimento inválido." },
        { status: 400 },
      );
    }

    const email = String(body.email ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const state = String(body.state ?? "").trim().toUpperCase();
    if (state && !BRAZIL_STATES.includes(state as (typeof BRAZIL_STATES)[number])) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    const subject = String(body.subject ?? "").trim();
    const record: ContactMessage = {
      id: `c_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      helpIntent,
      name: String(body.name ?? "").trim(),
      company: String(body.company ?? "").trim(),
      document: String(body.document ?? "").trim(),
      email,
      phone: String(body.phone ?? "").trim(),
      whatsapp: String(body.whatsapp ?? "").trim(),
      city: String(body.city ?? "").trim(),
      state,
      subject:
        subject ||
        HELP_OPTIONS.find((o) => o.id === helpIntent)?.subject ||
        CONTACT_SUBJECTS[0],
      message,
    };

    const messages = await readContactMessages();
    messages.push(record);
    await writeContactMessages(messages);
    await notifyContactCreated(record);

    return NextResponse.json({ ok: true, id: record.id });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar a mensagem." },
      { status: 500 },
    );
  }
}
