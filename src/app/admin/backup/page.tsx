"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn } from "@/components/admin/AdminCmsForm";

type BackupItem = { file: string; size: number; mtime: string };
type BackupStatus = {
  lastManualAt: string | null;
  lastDailyAt: string | null;
  lastWeeklyAt: string | null;
  lastMonthlyAt: string | null;
  nextDailyAt: string | null;
  count: number;
  retention: { daily: number; weekly: number; monthly: number };
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleString("pt-BR");
}

export default function AdminBackupPage() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/backup");
    const data = await res.json();
    setItems(data.items || []);
    setStatus(data.status || null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createBackup() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg(`Backup criado: ${data.file}`);
        await load();
      } else setMsg(data.error || "Falha no backup.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(file: string) {
    if (
      !window.confirm(
        `Restaurar o backup "${file}"?\nDados do banco serão atualizados a partir deste arquivo.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", file }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg(`Restauração concluída: ${file}`);
      } else setMsg(data.error || "Falha na restauração.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title="Backup"
      subtitle="Manual, diário (02:00), semanal (domingo) e mensal (dia 1)"
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
          <p className="text-[11px] uppercase tracking-wide text-white/40">
            Último backup
          </p>
          <p className="mt-1 text-white/85">
            {fmtDate(status?.lastManualAt || status?.lastDailyAt)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
          <p className="text-[11px] uppercase tracking-wide text-white/40">
            Próximo (diário)
          </p>
          <p className="mt-1 text-white/85">{fmtDate(status?.nextDailyAt)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
          <p className="text-[11px] uppercase tracking-wide text-white/40">
            Arquivos
          </p>
          <p className="mt-1 text-white/85">{status?.count ?? items.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
          <p className="text-[11px] uppercase tracking-wide text-white/40">
            Retenção
          </p>
          <p className="mt-1 text-white/85">
            {status
              ? `${status.retention.daily}d / ${status.retention.weekly}s / ${status.retention.monthly}m`
              : "30 / 12 / 12"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
        <button
          type="button"
          className={adminBtn}
          disabled={busy}
          onClick={() => void createBackup()}
        >
          Executar backup
        </button>
        {msg ? <p className="mt-3 text-[13px] text-[#C8A96A]">{msg}</p> : null}
        <p className="mt-3 text-[12px] text-white/40">
          Agende o cron:{" "}
          <code className="text-white/55">GET /api/cron/backup</code> com{" "}
          <code className="text-white/55">Authorization: Bearer CRON_SECRET</code>{" "}
          (diariamente após 02:00).
        </p>
        <h3 className="mt-6 text-[14px] font-semibold">Arquivos</h3>
        <ul className="mt-3 space-y-2 text-[13px]">
          {items.length === 0 ? (
            <li className="text-white/40">Nenhum backup ainda.</li>
          ) : (
            items.map((f) => (
              <li
                key={f.file}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-2 text-white/80"
              >
                <div className="min-w-0">
                  <p className="break-all">{f.file}</p>
                  <p className="text-[11px] text-white/40">
                    {fmtBytes(f.size)} · {fmtDate(f.mtime)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/admin/backup?download=${encodeURIComponent(f.file)}`}
                    className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                  >
                    Baixar
                  </a>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-[#C8A96A]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#C8A96A] hover:bg-[#C8A96A]/10 disabled:opacity-50"
                    onClick={() => void restore(f.file)}
                  >
                    Restaurar
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <ExternalBackupPanel />
    </AdminShell>
  );
}

function ExternalBackupPanel() {
  const [cfg, setCfg] = useState({
    provider: "none",
    enabled: false,
    connected: false,
    destinationMode: "local",
    bucket: "",
    region: "auto",
    endpoint: "",
    accessKeyId: "",
    secretAccessKey: "",
    prefix: "homequeen/",
    gdriveAccessToken: "",
    gdriveFolderId: "",
    lastCloudAt: null as string | null,
    lastCloudFile: null as string | null,
    lastCloudSize: null as number | null,
    lastCloudStatus: null as string | null,
    lastLocalAt: null as string | null,
    lastLocalFile: null as string | null,
    lastLocalSize: null as number | null,
    lastLocalStatus: null as string | null,
    lastError: null as string | null,
  });
  const [cloud, setCloud] = useState<
    Array<{ id: string; file: string; size: number; mtime: string }>
  >([]);
  const [restoreOrigin, setRestoreOrigin] = useState<"local" | "cloud">("local");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(listCloud = false) {
    const res = await fetch(
      `/api/admin/system/backup-external${listCloud ? "?list=cloud" : ""}`,
    );
    const data = await res.json();
    if (data.config) setCfg((c) => ({ ...c, ...data.config }));
    if (data.cloud) setCloud(data.cloud);
  }

  useEffect(() => {
    void load(true);
  }, []);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/system/backup-external", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      setMsg(data.ok ? "Backup externo salvo." : data.error || "Falha.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function act(action: string, provider?: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/system/backup-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, provider }),
      });
      const data = await res.json();
      setMsg(
        data.ok
          ? action === "disconnect"
            ? "Desconectado."
            : "Conexão OK."
          : data.error || "Falha.",
      );
      await load(true);
    } finally {
      setBusy(false);
    }
  }

  async function restoreCloud(item: {
    id: string;
    file: string;
  }) {
    if (
      !window.confirm(
        `Restaurar backup cloud "${item.file}"?\nEsta ação atualiza dados do banco.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/system/backup-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore_cloud",
          id: item.id,
          file: item.file,
        }),
      });
      const data = await res.json();
      setMsg(
        data.ok
          ? `Restauração cloud concluída: ${item.file}`
          : data.error || "Falha.",
      );
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-white/15 bg-[#0F0F10] px-3 py-2 text-[13px]";

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px]">
          <p className="font-semibold text-[#C8A96A]">Backup Local</p>
          <p className="mt-2 text-white/80">
            {cfg.lastLocalStatus === "ok" ? "✔ Concluído" : cfg.lastLocalStatus || "—"}
          </p>
          <p className="mt-1 text-white/45">
            {cfg.lastLocalAt
              ? new Date(cfg.lastLocalAt).toLocaleString("pt-BR")
              : "—"}
          </p>
          <p className="text-[11px] text-white/35">
            {cfg.lastLocalFile || ""}{" "}
            {cfg.lastLocalSize
              ? `· ${(cfg.lastLocalSize / 1024).toFixed(1)} KB`
              : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-[13px]">
          <p className="font-semibold text-[#C8A96A]">
            Cloud {cfg.provider !== "none" ? `(${cfg.provider})` : ""}
          </p>
          <p className="mt-2 text-white/80">
            {cfg.lastCloudStatus === "ok"
              ? "✔ Sincronizado"
              : cfg.lastCloudStatus === "error"
                ? "✖ Erro"
                : cfg.lastCloudStatus || "—"}
          </p>
          <p className="mt-1 text-white/45">
            {cfg.lastCloudAt
              ? new Date(cfg.lastCloudAt).toLocaleString("pt-BR")
              : "—"}
          </p>
          <p className="text-[11px] text-white/35">
            Status: {cfg.connected ? "Conectado" : "Desconectado"}
            {cfg.lastError ? ` · ${cfg.lastError}` : ""}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
        <h3 className="text-[14px] font-semibold text-[#C8A96A]">
          Backup Externo
        </h3>
        <p className="mt-1 text-[12px] text-white/45">
          Amazon S3 · Cloudflare R2 · Backblaze B2 · Google Drive. Credenciais
          também podem vir do .env.
        </p>

        <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-white/40">
          Destino do Backup
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-white/75">
          {(
            [
              ["local", "Somente Local"],
              ["local_cloud", "Local + Cloud"],
              ["cloud", "Somente Cloud"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex items-center gap-2">
              <input
                type="radio"
                name="dest"
                checked={cfg.destinationMode === v}
                onChange={() =>
                  setCfg((c) => ({ ...c, destinationMode: v }))
                }
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-[12px] text-white/50">
            Provedor
            <select
              className={input}
              value={cfg.provider}
              onChange={(e) =>
                setCfg((c) => ({ ...c, provider: e.target.value }))
              }
            >
              <option value="none">Nenhum</option>
              <option value="s3">Amazon S3</option>
              <option value="r2">Cloudflare R2</option>
              <option value="b2">Backblaze B2</option>
              <option value="gdrive">Google Drive</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2 pb-1">
            <button
              type="button"
              disabled={busy}
              className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/70 hover:border-[#C8A96A] hover:text-[#C8A96A]"
              onClick={() => void act("test", cfg.provider)}
            >
              Testar conexão
            </button>
            <button
              type="button"
              disabled={busy || cfg.provider === "none"}
              className="rounded-full border border-[#C8A96A]/40 px-3 py-1.5 text-[11px] uppercase tracking-wide text-[#C8A96A]"
              onClick={() => void act("connect", cfg.provider)}
            >
              Conectar
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-full border border-red-400/30 px-3 py-1.5 text-[11px] uppercase tracking-wide text-red-200/80"
              onClick={() => void act("disconnect")}
            >
              Desconectar
            </button>
          </div>

          {cfg.provider !== "gdrive" && cfg.provider !== "none" ? (
            <>
              <label className="text-[12px] text-white/50">
                Bucket
                <input
                  className={input}
                  value={cfg.bucket}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, bucket: e.target.value }))
                  }
                />
              </label>
              <label className="text-[12px] text-white/50">
                Region
                <input
                  className={input}
                  value={cfg.region}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, region: e.target.value }))
                  }
                />
              </label>
              <label className="text-[12px] text-white/50 sm:col-span-2">
                Endpoint (R2/B2)
                <input
                  className={input}
                  value={cfg.endpoint}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, endpoint: e.target.value }))
                  }
                />
              </label>
              <label className="text-[12px] text-white/50">
                Access Key
                <input
                  className={input}
                  value={cfg.accessKeyId}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, accessKeyId: e.target.value }))
                  }
                />
              </label>
              <label className="text-[12px] text-white/50">
                Secret Key
                <input
                  className={input}
                  type="password"
                  value={cfg.secretAccessKey}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, secretAccessKey: e.target.value }))
                  }
                />
              </label>
              <label className="text-[12px] text-white/50 sm:col-span-2">
                Prefixo
                <input
                  className={input}
                  value={cfg.prefix}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, prefix: e.target.value }))
                  }
                />
              </label>
            </>
          ) : null}

          {cfg.provider === "gdrive" ? (
            <>
              <label className="text-[12px] text-white/50 sm:col-span-2">
                Access / Refresh Token
                <input
                  className={input}
                  type="password"
                  value={cfg.gdriveAccessToken}
                  onChange={(e) =>
                    setCfg((c) => ({
                      ...c,
                      gdriveAccessToken: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-[12px] text-white/50 sm:col-span-2">
                Folder ID
                <input
                  className={input}
                  value={cfg.gdriveFolderId}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, gdriveFolderId: e.target.value }))
                  }
                />
              </label>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className={`${adminBtn} mt-4`}
          disabled={busy}
          onClick={() => void save()}
        >
          Salvar destino externo
        </button>
        {msg ? <p className="mt-2 text-[13px] text-[#C8A96A]">{msg}</p> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
        <h3 className="text-[14px] font-semibold text-[#C8A96A]">Restaurar</h3>
        <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-white/75">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={restoreOrigin === "local"}
              onChange={() => setRestoreOrigin("local")}
            />
            Backup Local (use a lista acima)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={restoreOrigin === "cloud"}
              onChange={() => {
                setRestoreOrigin("cloud");
                void load(true);
              }}
            />
            Backup Cloud
          </label>
        </div>
        {restoreOrigin === "cloud" ? (
          <ul className="mt-4 space-y-2 text-[13px]">
            {cloud.length === 0 ? (
              <li className="text-white/40">Nenhum backup cloud listado.</li>
            ) : (
              cloud.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-2"
                >
                  <div>
                    <p className="text-white/85">{f.file}</p>
                    <p className="text-[11px] text-white/40">
                      {(f.size / 1024).toFixed(1)} KB ·{" "}
                      {new Date(f.mtime).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-[#C8A96A]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#C8A96A]"
                    onClick={() => void restoreCloud(f)}
                  >
                    Restaurar
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : (
          <p className="mt-3 text-[12px] text-white/40">
            Use o botão Restaurar na lista de arquivos locais.
          </p>
        )}
      </div>
    </div>
  );
}
