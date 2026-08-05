import { readFile } from "fs/promises";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manutenção | Home Queen",
  robots: { index: false, follow: false },
};

type MaintFlag = {
  enabled?: boolean;
  message?: string;
  eta?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
};

async function readFlag(): Promise<MaintFlag> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "maintenance.json"),
      "utf8",
    );
    return JSON.parse(raw) as MaintFlag;
  } catch {
    return {};
  }
}

export default async function ManutencaoPage() {
  const m = await readFlag();
  const message =
    m.message ||
    "Estamos realizando melhorias em nosso site.\n\nVoltaremos em breve.\n\nObrigado pela compreensão.";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0F0F10] px-6 py-16 text-center text-[#F8F8F6]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(200,169,106,0.18), transparent 60%)",
        }}
      />
      <div className="relative z-10 max-w-lg">
        <p className="font-display text-[28px] tracking-[0.08em] text-[#C8A96A] sm:text-[36px]">
          Home Queen
        </p>
        <div className="mx-auto mt-4 h-px w-16 bg-[#C8A96A]/50" />
        <div className="mt-8 whitespace-pre-line text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
          {message}
        </div>
        {m.eta ? (
          <p className="mt-6 text-[13px] text-white/45">
            Retorno estimado: {m.eta}
          </p>
        ) : null}
        <div className="mt-10 space-y-1 text-[13px] text-white/50">
          {m.phone ? <p>Tel: {m.phone}</p> : null}
          {m.whatsapp ? <p>WhatsApp: {m.whatsapp}</p> : null}
          {m.email ? <p>{m.email}</p> : null}
        </div>
      </div>
    </main>
  );
}
