"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn, adminInput, adminLabel } from "@/components/admin/AdminCmsForm";
import type { IntegrationSettings } from "@/data/admin";

export default function AdminIntegracoesPage() {
  const [form, setForm] = useState<IntegrationSettings | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setForm(cms.integrations));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "integrations",
        data: form,
        action: "Integrações",
        detail: "Credenciais atualizadas",
      }),
    });
    setMsg("Integrações salvas.");
  }

  if (!form) {
    return (
      <AdminShell title="Integrações" subtitle="Carregando…">
        <p className="text-white/50">…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Integrações"
      subtitle="Bling, pagamentos, Google (GA4, GTM, Search Console), Pixel, SMTP e Maps"
    >
      <form onSubmit={save} className="grid max-w-[900px] gap-4">
        {(
          [
            ["bling", "Bling ERP", "apiKey"],
            ["mercadoPago", "Mercado Pago", "accessToken"],
            ["asaas", "Asaas", "apiKey"],
            ["analytics", "Google Analytics 4", "measurementId"],
            ["tagManager", "Google Tag Manager", "containerId"],
            ["metaPixel", "Meta Pixel", "pixelId"],
          ] as const
        ).map(([key, title, field]) => (
          <div
            key={key}
            className="rounded-2xl border border-white/10 bg-[#151515] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{title}</h3>
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={Boolean((form[key] as { enabled?: boolean }).enabled)}
                  onChange={(e) =>
                    setForm((f) =>
                      f
                        ? {
                            ...f,
                            [key]: {
                              ...(f[key] as object),
                              enabled: e.target.checked,
                            },
                          }
                        : f,
                    )
                  }
                  className="accent-[#C8A96A]"
                />
                Ativo
              </label>
            </div>
            <div className="mt-3">
              <label className={adminLabel}>
                {key === "analytics"
                  ? "GA4 Measurement ID (G-XXXXXXXX)"
                  : key === "tagManager"
                    ? "GTM Container ID (GTM-XXXX)"
                    : field}
              </label>
              <input
                className={adminInput}
                value={String(
                  ((form[key] as unknown as Record<string, unknown>)[field] as
                    | string
                    | undefined) || "",
                )}
                onChange={(e) =>
                  setForm((f) =>
                    f
                      ? {
                          ...f,
                          [key]: {
                            ...(f[key] as object),
                            [field]: e.target.value,
                          },
                        }
                      : f,
                  )
                }
              />
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
          <h3 className="font-semibold">Google Search Console</h3>
          <p className="mt-1 text-[12px] text-white/45">
            Cole apenas o conteúdo do meta de verificação (sem as tags HTML).
          </p>
          <div className="mt-3">
            <label className={adminLabel}>Verification Meta Tag content</label>
            <input
              className={adminInput}
              value={form.searchConsole?.verificationMeta || ""}
              onChange={(e) =>
                setForm((f) =>
                  f
                    ? {
                        ...f,
                        searchConsole: { verificationMeta: e.target.value },
                      }
                    : f,
                )
              }
              placeholder="código-fornecido-pelo-search-console"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
          <h3 className="font-semibold">WhatsApp / SMTP / Maps</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={adminLabel}>WhatsApp</label>
              <input
                className={adminInput}
                value={form.whatsapp.number}
                onChange={(e) =>
                  setForm((f) =>
                    f
                      ? { ...f, whatsapp: { number: e.target.value } }
                      : f,
                  )
                }
              />
            </div>
            <div>
              <label className={adminLabel}>SMTP From</label>
              <input
                className={adminInput}
                value={form.smtp.from}
                onChange={(e) =>
                  setForm((f) =>
                    f
                      ? { ...f, smtp: { ...f.smtp, from: e.target.value } }
                      : f,
                  )
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={adminLabel}>Google Maps embed URL</label>
              <input
                className={adminInput}
                value={form.googleMaps.embedUrl}
                onChange={(e) =>
                  setForm((f) =>
                    f
                      ? {
                          ...f,
                          googleMaps: { embedUrl: e.target.value },
                        }
                      : f,
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className={adminBtn}>
            Salvar integrações
          </button>
          {msg ? <span className="text-[13px] text-[#C8A96A]">{msg}</span> : null}
        </div>
      </form>
    </AdminShell>
  );
}
