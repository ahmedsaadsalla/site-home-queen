"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn } from "@/components/admin/AdminCmsForm";

type Alert = {
  id: string;
  code: string;
  severity: string;
  title: string;
  message: string;
  source: string;
  active: boolean;
  createdAt: string;
  emailSent: boolean;
};

export default function AdminAlertsPage() {
  const [active, setActive] = useState<Alert[]>([]);
  const [items, setItems] = useState<Alert[]>([]);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/system/alerts?refresh=1")
      .then((r) => r.json())
      .then((d) => {
        setActive(d.active || []);
        setItems(d.items || []);
        setEmailEnabled(Boolean(d.settings?.emailEnabled));
        setEmailTo(String(d.settings?.emailTo || ""));
      });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function resolve(id: string) {
    await fetch("/api/admin/system/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolve: true }),
    });
    load();
  }

  async function saveSettings() {
    await fetch("/api/admin/system/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: { emailEnabled, emailTo },
      }),
    });
    setMsg("Preferências de e-mail salvas.");
  }

  return (
    <AdminShell
      title="Central de Alertas"
      subtitle="Backup, banco, SMTP, Bling, disco e logins · auto 30s"
    >
      {active.length > 0 ? (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px] text-red-100">
          ● {active.length} alerta(s) ativo(s) exigem atenção
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-100">
          Nenhum alerta crítico no momento
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-white/10 bg-[#151515] p-5">
        <p className="text-[13px] font-semibold text-[#C8A96A]">
          E-mail opcional ao administrador
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-white/70">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
            />
            Enviar e-mail
          </label>
          <input
            className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-[#0F0F10] px-3 py-2 text-[13px]"
            placeholder="admin@empresa.com"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
          <button type="button" className={adminBtn} onClick={() => void saveSettings()}>
            Salvar
          </button>
        </div>
        {msg ? <p className="mt-2 text-[12px] text-[#C8A96A]">{msg}</p> : null}
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-white/40">Nenhum alerta registrado.</p>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border px-4 py-3 text-[13px] ${
                a.active
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-white/10 bg-[#151515]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#C8A96A]">{a.title}</span>
                <span className="text-[10px] uppercase text-white/40">
                  {a.severity} · {a.source}
                </span>
                {!a.active ? (
                  <span className="text-[10px] text-white/30">resolvido</span>
                ) : null}
                <span className="ml-auto text-[11px] text-white/35">
                  {new Date(a.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-1 text-white/75">{a.message}</p>
              {a.active ? (
                <button
                  type="button"
                  className="mt-2 text-[11px] uppercase tracking-wide text-[#C8A96A] hover:underline"
                  onClick={() => void resolve(a.id)}
                >
                  Resolver
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
