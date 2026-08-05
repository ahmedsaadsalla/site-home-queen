"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn } from "@/components/admin/AdminCmsForm";

type Maint = {
  enabled: boolean;
  message: string;
  eta: string;
  phone: string;
  whatsapp: string;
  email: string;
};

const inputCls =
  "mt-1 w-full rounded-xl border border-white/15 bg-[#0F0F10] px-3 py-2 text-[13px] outline-none focus:border-[#C8A96A]";

export default function AdminSiteSettingsPage() {
  const [form, setForm] = useState<Maint>({
    enabled: false,
    message:
      "Estamos realizando melhorias em nosso site.\n\nVoltaremos em breve.\n\nObrigado pela compreensão.",
    eta: "",
    phone: "",
    whatsapp: "",
    email: "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/system/maintenance")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setForm((f) => ({ ...f, ...d }));
      });
  }, []);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/system/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) setMsg(data.error);
      else {
        setForm(data);
        setMsg(
          data.enabled
            ? "Modo manutenção ativado. Visitantes verão a página de aviso."
            : "Modo manutenção desativado. Site liberado.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title="Site"
      subtitle="Configurações gerais · modo manutenção"
    >
      <div className="max-w-2xl space-y-5 rounded-2xl border border-white/10 bg-[#151515] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold">Modo Manutenção</p>
            <p className="mt-1 text-[12px] text-white/45">
              Clientes veem página de aviso. Administradores autenticados
              continuam acessando normalmente.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.enabled}
            onClick={() =>
              setForm((f) => ({ ...f, enabled: !f.enabled }))
            }
            className={`relative h-8 w-14 rounded-full transition ${
              form.enabled ? "bg-[#C8A96A]" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-[#0F0F10] transition ${
                form.enabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <label className="block text-[12px] text-white/50">
          Mensagem
          <textarea
            rows={5}
            className={inputCls}
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
          />
        </label>

        <label className="block text-[12px] text-white/50">
          Tempo estimado de retorno (opcional)
          <input
            className={inputCls}
            value={form.eta}
            placeholder="Ex.: 2 horas / amanhã às 10h"
            onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-[12px] text-white/50">
            Telefone
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </label>
          <label className="block text-[12px] text-white/50">
            WhatsApp
            <input
              className={inputCls}
              value={form.whatsapp}
              onChange={(e) =>
                setForm((f) => ({ ...f, whatsapp: e.target.value }))
              }
            />
          </label>
          <label className="block text-[12px] text-white/50">
            E-mail
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </label>
        </div>

        <button
          type="button"
          className={adminBtn}
          disabled={busy}
          onClick={() => void save()}
        >
          Salvar
        </button>
        {msg ? <p className="text-[13px] text-[#C8A96A]">{msg}</p> : null}
      </div>
    </AdminShell>
  );
}
