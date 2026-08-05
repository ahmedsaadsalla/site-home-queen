"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn } from "@/components/admin/AdminCmsForm";

type Settings = {
  dailyHour: number;
  retentionDaily: number;
  retentionWeekly: number;
  retentionMonthly: number;
  maxSizeMb: number;
  zip: boolean;
  encryption: boolean;
  encryptionKey: string;
  emailOnSuccess: boolean;
  emailOnFailure: boolean;
  notifyEmail: string;
};

const input =
  "mt-1 w-full rounded-xl border border-white/15 bg-[#0F0F10] px-3 py-2 text-[13px]";

export default function ConfigBackupPage() {
  const [form, setForm] = useState<Settings>({
    dailyHour: 2,
    retentionDaily: 30,
    retentionWeekly: 12,
    retentionMonthly: 12,
    maxSizeMb: 512,
    zip: false,
    encryption: false,
    encryptionKey: "",
    emailOnSuccess: false,
    emailOnFailure: true,
    notifyEmail: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/system/backup-settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setForm((f) => ({ ...f, ...d }));
      });
  }, []);

  async function save() {
    const res = await fetch("/api/admin/system/backup-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMsg(data.error || "Configurações salvas.");
    if (!data.error) setForm((f) => ({ ...f, ...data }));
  }

  return (
    <AdminShell
      title="Configurações · Backup"
      subtitle="Horário, retenção, criptografia e notificações"
    >
      <p className="mb-4 text-[12px] text-white/40">
        Destino cloud e provedores em{" "}
        <Link href="/admin/backup" className="text-[#C8A96A] hover:underline">
          Backup
        </Link>
        .
      </p>

      <div className="max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#151515] p-6">
        <label className="block text-[12px] text-white/50">
          Horário do backup diário (0–23)
          <input
            type="number"
            min={0}
            max={23}
            className={input}
            value={form.dailyHour}
            onChange={(e) =>
              setForm((f) => ({ ...f, dailyHour: Number(e.target.value) }))
            }
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["retentionDaily", "Retenção diários"],
              ["retentionWeekly", "Retenção semanais"],
              ["retentionMonthly", "Retenção mensais"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-[12px] text-white/50">
              {label}
              <input
                type="number"
                min={1}
                className={input}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
                }
              />
            </label>
          ))}
        </div>
        <label className="block text-[12px] text-white/50">
          Tamanho máximo (MB)
          <input
            type="number"
            min={1}
            className={input}
            value={form.maxSizeMb}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxSizeMb: Number(e.target.value) }))
            }
          />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-white/70">
          <input
            type="checkbox"
            checked={form.zip}
            onChange={(e) => setForm((f) => ({ ...f, zip: e.target.checked }))}
          />
          Compactação ZIP (reservado — JSON por padrão)
        </label>
        <label className="flex items-center gap-2 text-[13px] text-white/70">
          <input
            type="checkbox"
            checked={form.encryption}
            onChange={(e) =>
              setForm((f) => ({ ...f, encryption: e.target.checked }))
            }
          />
          Criptografia AES-256 no envio cloud
        </label>
        {form.encryption ? (
          <label className="block text-[12px] text-white/50">
            Chave de criptografia
            <input
              type="password"
              className={input}
              value={form.encryptionKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, encryptionKey: e.target.value }))
              }
            />
          </label>
        ) : null}
        <label className="block text-[12px] text-white/50">
          E-mail de notificação
          <input
            className={input}
            value={form.notifyEmail}
            onChange={(e) =>
              setForm((f) => ({ ...f, notifyEmail: e.target.value }))
            }
          />
        </label>
        <div className="flex flex-wrap gap-4 text-[13px] text-white/70">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.emailOnSuccess}
              onChange={(e) =>
                setForm((f) => ({ ...f, emailOnSuccess: e.target.checked }))
              }
            />
            E-mail em sucesso
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.emailOnFailure}
              onChange={(e) =>
                setForm((f) => ({ ...f, emailOnFailure: e.target.checked }))
              }
            />
            E-mail em falha
          </label>
        </div>
        <button type="button" className={adminBtn} onClick={() => void save()}>
          Salvar
        </button>
        {msg ? <p className="text-[13px] text-[#C8A96A]">{msg}</p> : null}
      </div>
    </AdminShell>
  );
}
