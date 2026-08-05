"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Session = {
  id: string;
  username: string;
  name: string;
  role: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActivityAt: string;
  connectedMs: number;
};

function browserFromUa(ua: string | null) {
  if (!ua) return "—";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return ua.slice(0, 40) + (ua.length > 40 ? "…" : "");
}

function fmtDur(ms: number) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function SistemaSessoesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/system/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.activeSessions || []));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function revoke(id: string) {
    if (!window.confirm("Encerrar esta sessão?")) return;
    setBusy(id);
    try {
      await fetch("/api/admin/system/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", sessionId: id }),
      });
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell
      title="Sessões ativas"
      subtitle="Usuário, navegador, IP e tempo conectado"
    >
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Navegador</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Início</th>
              <th className="px-4 py-3">Atividade</th>
              <th className="px-4 py-3">Tempo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-white/40">
                  Nenhuma sessão ativa
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white/90">{s.name}</p>
                    <p className="text-[11px] text-white/40">
                      {s.username} · {s.role}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {browserFromUa(s.userAgent)}
                  </td>
                  <td className="px-4 py-3 text-white/60">{s.ip || "—"}</td>
                  <td className="px-4 py-3 text-white/55">
                    {new Date(s.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-white/55">
                    {new Date(s.lastActivityAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {fmtDur(s.connectedMs)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy === s.id}
                      onClick={() => void revoke(s.id)}
                      className="rounded-full border border-red-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Encerrar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-white/35">
        Cidade/geoIP: disponível quando o provedor de IP geolocation for
        configurado no ambiente (não embutido por padrão).
      </p>
    </AdminShell>
  );
}
