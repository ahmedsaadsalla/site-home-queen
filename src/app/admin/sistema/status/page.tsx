"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

type Dash = {
  health: {
    status: string;
    database: string;
    prisma: string;
    smtp: string;
    bling: string;
    storage: { used: string; free: string; percent: number; status: string };
    memory: string;
    memoryDetail?: { rss: string; heapUsed: string };
    cpu?: { load1m: number } | null;
    cpuPercent?: number | null;
    environment: string;
    version: string;
    uptimeMs: number;
    databaseLatencyMs?: number;
    timestamp: string;
  };
  stats: Record<string, number>;
  backup: Record<string, string | null>;
  backupDetail?: { count: number; nextDailyAt: string | null };
  integrations: Record<string, string>;
  system: {
    version: string;
    environment: string;
    uptimeMs: number;
    installedAt: string | null;
    updatedAt: string;
  };
  enterprise?: {
    integrity: {
      status: string;
      summary: string;
      checkedAt: string | null;
      healthy: boolean;
    };
    backups: {
      local: { status: string; at?: string | null; file?: string | null };
      cloud: {
        status: string;
        at?: string | null;
        provider?: string;
        file?: string | null;
      };
    };
    uploads: { status: string; label: string };
    database: { status: string; label: string };
  };
};

function statusDot(s: string) {
  const v = (s || "").toLowerCase();
  if (v === "connected" || v === "ok")
    return { label: "Online", color: "#22c55e" };
  if (v === "n/a" || v === "warning")
    return { label: "Atenção", color: "#eab308" };
  return { label: "Offline", color: "#ef4444" };
}

function fmtUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function LiveTile({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: string;
}) {
  const d = status ? statusDot(status) : null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#151515] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-white/90">
        {d ? <span style={{ color: d.color }}>●</span> : null}
        {value}
      </p>
    </div>
  );
}

export default function AdminSystemStatusPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/system/status").then((r) => r.json()),
      fetch("/api/admin/system/alerts?refresh=1").then((r) => r.json()),
    ])
      .then(([d, a]) => {
        if (d.error) setErr(d.error);
        else {
          setData(d);
          setErr("");
        }
        setAlertCount((a.active || []).length);
        setTick((t) => t + 1);
      })
      .catch(() => setErr("Falha ao carregar status."));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const h = data?.health;

  return (
    <AdminShell
      title="Status do sistema"
      subtitle="Monitoramento em tempo real · atualiza a cada 30s (sem recarregar)"
    >
      {alertCount > 0 ? (
        <Link
          href="/admin/sistema/alertas"
          className="mb-4 flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px] text-red-200"
        >
          <span>
            ● {alertCount} alerta{alertCount > 1 ? "s" : ""} ativo
            {alertCount > 1 ? "s" : ""}
          </span>
          <span className="uppercase tracking-wide text-[11px]">Ver central →</span>
        </Link>
      ) : null}

      {err ? <p className="mb-4 text-[13px] text-red-300">{err}</p> : null}

      {!data ? (
        <p className="text-white/40">Carregando…</p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-[11px] text-white/35">
            <span>
              Atualizado {new Date(h?.timestamp || Date.now()).toLocaleTimeString("pt-BR")}
              {tick > 0 ? ` · #${tick}` : ""}
            </span>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-full border border-white/15 px-3 py-1 hover:border-[#C8A96A] hover:text-[#C8A96A]"
            >
              Atualizar agora
            </button>
          </div>

          <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <LiveTile
              label="CPU"
              value={
                h?.cpuPercent != null
                  ? `${h.cpuPercent}%`
                  : h?.cpu
                    ? `load ${h.cpu.load1m}`
                    : "n/d"
              }
            />
            <LiveTile label="Memória" value={h?.memory || "—"} />
            <LiveTile
              label="Disco"
              value={`${h?.storage.percent ?? 0}% · ${h?.storage.free || "—"} livre`}
              status={h?.storage.status}
            />
            <LiveTile
              label="PostgreSQL"
              value={statusDot(h?.database || "").label}
              status={h?.database}
            />
            <LiveTile
              label="Prisma"
              value={statusDot(h?.prisma || "").label}
              status={h?.prisma}
            />
            <LiveTile
              label="SMTP"
              value={statusDot(h?.smtp || "").label}
              status={h?.smtp}
            />
            <LiveTile
              label="Bling"
              value={statusDot(h?.bling || "").label}
              status={h?.bling}
            />
            <LiveTile
              label="Uptime"
              value={fmtUptime(h?.uptimeMs || 0)}
            />
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Última integridade
              </p>
              <p className="mt-2 text-[16px] font-semibold text-[#C8A96A]">
                {data.enterprise?.integrity.healthy
                  ? "✔ Saudável"
                  : data.enterprise?.integrity.status === "warning"
                    ? "⚠ Atenção"
                    : data.enterprise?.integrity.status === "error"
                      ? "✖ Problemas"
                      : "—"}
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                {data.enterprise?.integrity.checkedAt
                  ? new Date(
                      data.enterprise.integrity.checkedAt,
                    ).toLocaleString("pt-BR")
                  : "Sem verificação"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Backups
              </p>
              <p className="mt-2 text-white/80">
                Local:{" "}
                {data.enterprise?.backups.local.status === "ok"
                  ? "✔"
                  : data.enterprise?.backups.local.status || "—"}
              </p>
              <p className="text-white/80">
                Cloud:{" "}
                {data.enterprise?.backups.cloud.status === "ok"
                  ? "✔"
                  : data.enterprise?.backups.cloud.status || "—"}
                {data.enterprise?.backups.cloud.provider &&
                data.enterprise.backups.cloud.provider !== "none"
                  ? ` (${data.enterprise.backups.cloud.provider})`
                  : ""}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Uploads · Integridade
              </p>
              <p className="mt-2 text-[16px] font-semibold text-[#C8A96A]">
                {data.enterprise?.uploads.label === "OK"
                  ? "✔ OK"
                  : data.enterprise?.uploads.label || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Banco · Integridade
              </p>
              <p className="mt-2 text-[16px] font-semibold text-[#C8A96A]">
                {data.enterprise?.database.label === "OK"
                  ? "✔ OK"
                  : data.enterprise?.database.label || "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px]">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
                Banco
              </h3>
              <p className="mt-3 text-white/70">
                Latência: {h?.databaseLatencyMs ?? "—"} ms
              </p>
              <p className="text-white/50">
                Verificação:{" "}
                {h?.timestamp
                  ? new Date(h.timestamp).toLocaleString("pt-BR")
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px]">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
                Backup
              </h3>
              <p className="mt-3 text-white/70">
                Último:{" "}
                {data.backup.lastBackupAt || data.backup.lastDailyAt
                  ? new Date(
                      String(
                        data.backup.lastBackupAt || data.backup.lastDailyAt,
                      ),
                    ).toLocaleString("pt-BR")
                  : "—"}
              </p>
              <p className="text-white/50">
                Próximo:{" "}
                {data.backupDetail?.nextDailyAt
                  ? new Date(data.backupDetail.nextDailyAt).toLocaleString(
                      "pt-BR",
                    )
                  : "—"}
              </p>
              <p className="text-white/50">
                Arquivos: {data.backupDetail?.count ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px]">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
                Sistema
              </h3>
              <p className="mt-3 text-white/70">
                v{data.system.version} · {data.system.environment}
              </p>
              <p className="text-white/50">
                Saúde: <span className="text-[#C8A96A]">{h?.status}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px] xl:col-span-3">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
                Estatísticas
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
                {Object.entries(data.stats).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-black/30 px-3 py-2">
                    <p className="text-[10px] uppercase text-white/40">{k}</p>
                    <p className="text-[16px] font-semibold">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
