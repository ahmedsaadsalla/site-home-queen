"use client";

import { ReactNode, useState } from "react";

/** Abas simples para editar seções do site sem sobrecarregar a tela. */
export function SiteEditorTabs({
  tabs,
  defaultTab,
}: {
  tabs: Array<{ id: string; label: string; hint?: string; content: ReactNode }>;
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id || "");
  const current = tabs.find((t) => t.id === active) || tabs[0];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
              active === t.id
                ? "bg-[#C8A96A] text-[#0F0F10]"
                : "border border-white/15 text-white/65 hover:border-[#C8A96A]/50 hover:text-[#C8A96A]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {current?.hint ? (
        <p className="mb-4 text-[13px] text-white/45">{current.hint}</p>
      ) : null}
      <div className="animate-[fadeIn_0.25s_ease]">{current?.content}</div>
    </div>
  );
}

export function SiteField({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#F8F8F6]">
        {label}
      </span>
      {help ? <span className="mb-2 block text-[12px] text-white/40">{help}</span> : null}
      {children}
    </label>
  );
}

export function SiteSaveBar({
  onSave,
  busy,
  msg,
  previewHref,
}: {
  onSave: () => void;
  busy?: boolean;
  msg?: string;
  previewHref?: string;
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-[#C8A96A]/30 bg-[#121214]/95 p-3 shadow-2xl backdrop-blur">
      <button
        type="button"
        disabled={busy}
        onClick={onSave}
        className="rounded-full bg-[#C8A96A] px-6 py-2.5 text-[12px] font-bold text-[#0F0F10] transition hover:bg-[#B8934F] disabled:opacity-60"
      >
        {busy ? "Salvando…" : "Salvar alterações"}
      </button>
      {previewHref ? (
        <a
          href={previewHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/20 px-5 py-2.5 text-[12px] font-semibold text-white/80 hover:border-[#C8A96A] hover:text-[#C8A96A]"
        >
          Ver no site
        </a>
      ) : null}
      {msg ? <span className="text-[13px] text-[#C8A96A]">{msg}</span> : null}
    </div>
  );
}

export const siteInput =
  "w-full rounded-xl border border-white/12 bg-[#0F0F10] px-4 py-3 text-[14px] text-[#F8F8F6] outline-none placeholder:text-white/30 focus:border-[#C8A96A]/70";

export const siteTextarea = `${siteInput} min-h-[100px] resize-y leading-relaxed`;
