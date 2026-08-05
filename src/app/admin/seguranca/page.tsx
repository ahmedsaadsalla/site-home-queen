"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type SecurityData = {
  lastLogin: { username: string; name: string; at: string | null } | null;
  activeSessions: Array<{
    sid: string;
    username: string;
    name: string;
    role: string;
    lastActivityAt: string;
    createdAt: string;
  }>;
  lockedAttempts: Array<{
    key: string;
    lockedUntil: number | null;
    count: number;
  }>;
  lastBackupAt: string | null;
  userCount: number;
  recentLogs: Array<{
    id: string;
    user: string;
    action: string;
    detail: string;
    createdAt: string;
  }>;
};

function fmt(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/security")
      .then(async (r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Não foi possível carregar os dados de segurança."));
  }, []);

  return (
    <AdminShell
      title="Segurança"
      subtitle="Sessões, bloqueios, logs e último backup"
    >
      {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
      {!data && !error ? (
        <p className="text-white/50">Carregando…</p>
      ) : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Último login
              </p>
              <p className="mt-2 font-semibold text-[#F8F8F6]">
                {data.lastLogin?.name || "—"}
              </p>
              <p className="text-[12px] text-white/50">
                {data.lastLogin?.username}
              </p>
              <p className="mt-1 text-[12px] text-[#C8A96A]">
                {fmt(data.lastLogin?.at)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Usuários conectados
              </p>
              <p className="mt-2 font-display text-[28px] text-[#C8A96A]">
                {data.activeSessions.length}
              </p>
              <p className="text-[12px] text-white/50">
                sessões ativas no painel
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Logins bloqueados
              </p>
              <p className="mt-2 font-display text-[28px] text-[#C8A96A]">
                {data.lockedAttempts.length}
              </p>
              <p className="text-[12px] text-white/50">
                bloqueios em vigor (15 min)
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Último backup
              </p>
              <p className="mt-2 text-[14px] font-semibold text-[#F8F8F6]">
                {fmt(data.lastBackupAt)}
              </p>
              <p className="text-[12px] text-white/50">
                {data.userCount} usuário(s) cadastrado(s)
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
            <h2 className="font-display text-xl">Sessões ativas</h2>
            <div className="mt-4 space-y-2">
              {data.activeSessions.length === 0 ? (
                <p className="text-[13px] text-white/45">Nenhuma sessão ativa.</p>
              ) : (
                data.activeSessions.map((s) => (
                  <div
                    key={s.sid}
                    className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 py-2 text-[13px]"
                  >
                    <div>
                      <p className="font-medium">
                        {s.name}{" "}
                        <span className="text-white/40">({s.username})</span>
                      </p>
                      <p className="text-[12px] text-white/45">{s.role}</p>
                    </div>
                    <p className="text-[12px] text-white/50">
                      Ativo: {fmt(s.lastActivityAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
            <h2 className="font-display text-xl">Tentativas bloqueadas</h2>
            <div className="mt-4 space-y-2">
              {data.lockedAttempts.length === 0 ? (
                <p className="text-[13px] text-white/45">Nenhum bloqueio agora.</p>
              ) : (
                data.lockedAttempts.map((a) => (
                  <div
                    key={a.key}
                    className="border-t border-white/8 py-2 text-[13px] text-white/70"
                  >
                    <p>{a.key}</p>
                    <p className="text-[12px] text-white/40">
                      Até {a.lockedUntil ? fmt(new Date(a.lockedUntil).toISOString()) : "—"} ·{" "}
                      {a.count} tentativas
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
            <h2 className="font-display text-xl">Registro de atividades</h2>
            <div className="mt-4 max-h-[420px] space-y-0 overflow-y-auto">
              {data.recentLogs.length === 0 ? (
                <p className="text-[13px] text-white/45">Sem registros ainda.</p>
              ) : (
                data.recentLogs.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[140px_1fr] gap-3 border-t border-white/8 py-2.5 text-[13px] sm:grid-cols-[160px_120px_1fr]"
                  >
                    <p className="text-white/45">{fmt(l.createdAt)}</p>
                    <p className="font-medium text-[#C8A96A]">{l.user}</p>
                    <p className="text-white/75">
                      <span className="font-semibold text-white/90">{l.action}</span>
                      {" · "}
                      {l.detail}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
