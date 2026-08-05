"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn } from "@/components/admin/AdminCmsForm";

type ErrItem = {
  id: string;
  createdAt: string;
  severity: string;
  source: string;
  message: string;
  stack: string | null;
  url: string | null;
  user: string | null;
  ip: string | null;
  userAgent: string | null;
};

export default function AdminSystemLogsPage() {
  const [items, setItems] = useState<ErrItem[]>([]);
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (severity) params.set("severity", severity);
    if (source) params.set("source", source);
    params.set("limit", "100");
    fetch(`/api/admin/system/errors?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, [q, severity, source]);

  useEffect(() => {
    load();
  }, [load]);

  async function purgeOld() {
    if (!window.confirm("Excluir erros com mais de 90 dias?")) return;
    setBusy(true);
    try {
      await fetch("/api/admin/system/errors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThanDays: 90 }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const params = new URLSearchParams({ export: "csv" });
    if (q) params.set("q", q);
    if (severity) params.set("severity", severity);
    if (source) params.set("source", source);
    window.open(`/api/admin/system/errors?${params}`, "_blank");
  }

  return (
    <AdminShell
      title="Logs de erros"
      subtitle="Monitoramento centralizado · retenção 90 dias"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar…"
          className="min-w-[180px] flex-1 rounded-xl border border-white/15 bg-[#0F0F10] px-3 py-2 text-[13px] outline-none focus:border-[#C8A96A]"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="rounded-xl border border-white/15 bg-[#0F0F10] px-3 py-2 text-[13px]"
        >
          <option value="">Severidade</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
          <option value="critical">critical</option>
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-xl border border-white/15 bg-[#0F0F10] px-3 py-2 text-[13px]"
        >
          <option value="">Origem</option>
          <option value="api">api</option>
          <option value="postgresql">postgresql</option>
          <option value="prisma">prisma</option>
          <option value="smtp">smtp</option>
          <option value="bling">bling</option>
          <option value="uploads">uploads</option>
          <option value="backup">backup</option>
          <option value="client">client</option>
        </select>
        <button type="button" className={adminBtn} onClick={() => load()}>
          Filtrar
        </button>
        <button
          type="button"
          className="rounded-full border border-white/20 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white/70 hover:border-[#C8A96A] hover:text-[#C8A96A]"
          onClick={exportCsv}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-full border border-red-400/30 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-red-200/80 hover:bg-red-500/10 disabled:opacity-50"
          onClick={() => void purgeOld()}
        >
          Limpar +90d
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-[14px] text-white/45">Nenhum erro registrado.</p>
        ) : (
          items.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#C8A96A]">
                  {e.severity}
                </span>
                <span className="text-[11px] text-white/40">{e.source}</span>
                <span className="ml-auto text-[11px] text-white/35">
                  {new Date(e.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-2 font-medium text-white/90">{e.message}</p>
              <p className="mt-1 text-[11px] text-white/40">
                {[e.user, e.ip, e.url].filter(Boolean).join(" · ") || "—"}
              </p>
              {e.userAgent ? (
                <p className="mt-0.5 truncate text-[10px] text-white/30">
                  {e.userAgent}
                </p>
              ) : null}
              {e.stack ? (
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] text-white/50">
                  {e.stack}
                </pre>
              ) : null}
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
