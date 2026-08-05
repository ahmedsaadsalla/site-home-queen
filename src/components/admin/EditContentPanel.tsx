"use client";

import { ReactNode, useState } from "react";

/** Botão padrão "Editar Conteúdo" — revela o painel de mídias da página. */
export function EditContentPanel({
  children,
  defaultOpen = false,
  title = "Gerenciamento de imagens e mídias",
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-6" id="editar-conteudo">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-[#C8A96A]/60 bg-[#C8A96A]/15 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8A96A] transition hover:bg-[#C8A96A] hover:text-[#0F0F10]"
      >
        {open ? "Fechar editor de conteúdo" : "Editar Conteúdo"}
      </button>
      {open ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-[#C8A96A]/25 bg-[#121214] p-4 sm:p-5">
          <div>
            <h2 className="font-display text-lg text-[#F8F8F6]">{title}</h2>
            <p className="mt-1 text-[12px] text-white/45">
              Substitua imagens por upload. Alterações entram no site após salvar.
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </div>
  );
}
