"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Ver = {
  id: string;
  version: string;
  description: string;
  author: string;
  releasedAt: string;
  isCurrent: boolean;
};

/** Painel de atualizações — reutiliza SystemVersion (mesma API de Versão) */
export default function SistemaAtualizacoesPage() {
  const [current, setCurrent] = useState<Ver | null>(null);
  const [history, setHistory] = useState<Ver[]>([]);

  useEffect(() => {
    fetch("/api/admin/system/versions")
      .then((r) => r.json())
      .then((d) => {
        setCurrent(d.current || null);
        setHistory(d.history || []);
      });
  }, []);

  return (
    <AdminShell
      title="Atualizações"
      subtitle="Histórico de versões do sistema"
    >
      <div className="rounded-2xl border border-white/10 bg-[#151515] p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
          Versão atual
        </p>
        <p className="mt-2 font-display text-[42px] text-[#C8A96A]">
          {current?.version || "—"}
        </p>
        {current?.description ? (
          <p className="mt-2 max-w-xl text-[14px] text-white/65">
            {current.description}
          </p>
        ) : null}
      </div>

      <div className="mt-8 space-y-0">
        {history.map((v, i) => (
          <div key={v.id}>
            <div className="py-5">
              <p className="font-display text-[28px] text-[#C8A96A]">
                {v.version}
              </p>
              <p className="mt-1 text-[12px] text-white/40">
                {new Date(v.releasedAt).toLocaleDateString("pt-BR")} ·{" "}
                {v.author}
                {v.isCurrent ? " · atual" : ""}
              </p>
              <p className="mt-2 text-[14px] text-white/75">{v.description}</p>
            </div>
            {i < history.length - 1 ? (
              <div className="border-t border-dashed border-white/15" />
            ) : null}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
