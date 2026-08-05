"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type About = {
  name: string;
  version: string;
  environment: string;
  database: string;
  orm: string;
  framework: string;
  node: string;
  prisma: string;
  postgresql: string;
  lastBackup: string | null;
  uptimeMs: number;
  tables: number;
  records: number;
  platform: string;
  memory: string;
  cpu: number | null;
  score: string;
};

function fmtUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SistemaSobrePage() {
  const [data, setData] = useState<About | null>(null);

  useEffect(() => {
    fetch("/api/admin/system/about")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <AdminShell title="Sobre o sistema" subtitle="Home Queen · stack e avaliação">
      {!data ? (
        <p className="text-white/40">Carregando…</p>
      ) : (
        <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#151515] p-6">
          <p className="font-display text-[32px] text-[#C8A96A]">{data.name}</p>
          <dl className="mt-6 space-y-3 text-[13px]">
            {[
              ["Versão", data.version],
              ["Ambiente", data.environment],
              ["Banco", data.database],
              ["ORM", data.orm],
              ["Framework", data.framework],
              ["Node.js", data.node],
              ["Prisma", data.prisma],
              ["PostgreSQL", data.postgresql],
              [
                "Último backup",
                data.lastBackup
                  ? new Date(data.lastBackup).toLocaleString("pt-BR")
                  : "—",
              ],
              ["Uptime", fmtUptime(data.uptimeMs)],
              ["Tabelas", String(data.tables)],
              ["Registros (aprox.)", String(data.records)],
              ["Plataforma", `${data.platform} · RAM ${data.memory}`],
              ["Avaliação", data.score],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-white/5 pb-2"
              >
                <dt className="text-white/45">{k}</dt>
                <dd className="text-right text-white/90">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </AdminShell>
  );
}
