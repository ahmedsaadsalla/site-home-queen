"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_CONTACT_SETTINGS,
  type ContactMessage,
  type ContactSettings,
} from "@/data/contact";

const inputClass =
  "w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#C5A059]";

export function AdminContactView() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/contato/settings").then((r) => r.json()),
      fetch("/api/contato").then((r) => r.json()),
    ])
      .then(([s, m]) => {
        setSettings({ ...DEFAULT_CONTACT_SETTINGS, ...(s as ContactSettings) });
        setMessages(Array.isArray(m) ? (m as ContactMessage[]) : []);
      })
      .catch(() => setError("Não foi possível carregar os dados."));
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/contato/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("fail");
      const next = (await res.json()) as ContactSettings;
      setSettings(next);
      setSaved(true);
    } catch {
      setError("Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] sm:text-[34px]">
            Painel de contato
          </h1>
          <p className="mt-2 text-[14px] text-[#6B6B6B]">
            Edite telefones, e-mails, endereço e WhatsApp exibidos na página
            Contato.
          </p>
        </div>
        <a
          href="/contato"
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C5A059]"
        >
          Ver página →
        </a>
      </div>

      <form
        onSubmit={onSave}
        className="mt-8 rounded-[16px] border border-[#EAEAEA] bg-white p-6 shadow-[0_8px_24px_rgba(15,15,16,0.04)]"
      >
        <h2 className="text-[16px] font-bold">Dados de contato</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["addressLine1", "Endereço (linha 1)"],
              ["addressLine2", "Cidade / UF"],
              ["cep", "CEP"],
              ["mapsQuery", "Busca do Google Maps"],
              ["mapsEmbedUrl", "URL do mapa (embed)"],
              ["phoneCommercial", "Telefone comercial"],
              ["phoneSales", "Telefone vendas"],
              ["phoneWholesale", "Telefone atacado"],
              ["whatsappNumber", "WhatsApp (somente números, ex: 5549999999999)"],
              ["whatsappDisplay", "WhatsApp (exibição)"],
              ["emailSales", "E-mail vendas"],
              ["emailSupport", "E-mail atendimento"],
              ["emailFinance", "E-mail financeiro"],
              ["hoursWeekdays", "Horário semana"],
              ["hoursSaturday", "Horário sábado"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block sm:col-span-1">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B6B6B]">
                {label}
              </span>
              <input
                className={inputClass}
                value={settings[key]}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>

        {error ? <p className="mt-4 text-[13px] text-red-600">{error}</p> : null}
        {saved ? (
          <p className="mt-4 text-[13px] text-emerald-700">
            Configurações salvas.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-md bg-[#C5A059] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar contatos"}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="font-display text-[24px]">Mensagens recebidas</h2>
        <div className="mt-4 overflow-x-auto rounded-[14px] border border-[#EAEAEA] bg-white">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-[#EAEAEA] bg-[#F8F8F6] text-[11px] uppercase tracking-[0.08em] text-[#6B6B6B]">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Assunto</th>
                <th className="px-4 py-3">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6B6B6B]">
                    Nenhuma mensagem ainda.
                  </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className="border-b border-[#F0F0F0] align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-[#6B6B6B]">
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{m.helpIntent}</td>
                    <td className="px-4 py-3">
                      {m.name || "—"}
                      {m.company ? (
                        <span className="block text-[#6B6B6B]">{m.company}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {m.email || "—"}
                      <span className="block text-[#6B6B6B]">
                        {m.whatsapp || m.phone || ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.subject}</td>
                    <td className="max-w-[280px] px-4 py-3 text-[#2E2E2E]">
                      {m.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
