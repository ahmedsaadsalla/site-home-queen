"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

type Dash = {
  lastLogin: { username: string; name: string; at: string | null } | null;
  stats: {
    loginsToday: number;
    failedLoginsToday: number;
    lockedIps: number;
    activeSessions: number;
    connectedAdmins: number;
    suspiciousAttempts: number;
  };
  lockedAttempts: Array<{ key: string; count: number; lockedUntil: number | null }>;
  suspicious: Array<{ key: string; count: number; updatedAt: string }>;
};

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold text-[#C8A96A]">{value}</p>
    </div>
  );
}

export default function SistemaSegurancaPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/admin/system/sessions")
      .then((r) => r.json())
      .then(setData);
    const t = setInterval(() => {
      fetch("/api/admin/system/sessions")
        .then((r) => r.json())
        .then(setData);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const s = data?.stats;

  return (
    <AdminShell
      title="Segurança"
      subtitle="Dashboard de segurança · dados do mesmo núcleo de /admin/seguranca"
    >
      <p className="mb-4 text-[12px] text-white/40">
        Gestão completa de usuários e políticas permanece em{" "}
        <Link href="/admin/seguranca" className="text-[#C8A96A] hover:underline">
          Segurança (menu principal)
        </Link>
        . Sessões ativas:{" "}
        <Link href="/admin/sistema/sessoes" className="text-[#C8A96A] hover:underline">
          Sistema · Sessões
        </Link>
        .
      </p>

      {!data ? (
        <p className="text-white/40">Carregando…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Tile label="Logins hoje" value={s?.loginsToday ?? 0} />
            <Tile label="Logins com erro" value={s?.failedLoginsToday ?? 0} />
            <Tile label="IPs bloqueados" value={s?.lockedIps ?? 0} />
            <Tile label="Sessões ativas" value={s?.activeSessions ?? 0} />
            <Tile label="Admins conectados" value={s?.connectedAdmins ?? 0} />
            <Tile label="Tentativas suspeitas" value={s?.suspiciousAttempts ?? 0} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px]">
            <h3 className="font-semibold text-[#C8A96A]">Último acesso</h3>
            <p className="mt-2 text-white/75">
              {data.lastLogin
                ? `${data.lastLogin.name} (${data.lastLogin.username}) · ${
                    data.lastLogin.at
                      ? new Date(data.lastLogin.at).toLocaleString("pt-BR")
                      : "—"
                  }`
                : "—"}
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
              <h3 className="text-[13px] font-semibold text-[#C8A96A]">
                IPs / usuários bloqueados
              </h3>
              <ul className="mt-3 space-y-2 text-[12px] text-white/70">
                {(data.lockedAttempts || []).length === 0 ? (
                  <li className="text-white/35">Nenhum bloqueio ativo</li>
                ) : (
                  data.lockedAttempts.map((a) => (
                    <li key={a.key} className="flex justify-between gap-2">
                      <span className="break-all">{a.key}</span>
                      <span>{a.count}x</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
              <h3 className="text-[13px] font-semibold text-[#C8A96A]">
                Tentativas suspeitas
              </h3>
              <ul className="mt-3 space-y-2 text-[12px] text-white/70">
                {(data.suspicious || []).length === 0 ? (
                  <li className="text-white/35">Nenhuma</li>
                ) : (
                  data.suspicious.map((a) => (
                    <li key={a.key} className="flex justify-between gap-2">
                      <span className="break-all">{a.key}</span>
                      <span>{a.count} tentativas</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
