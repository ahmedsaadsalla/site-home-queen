"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

const input =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-[#C8A96A]";
const label = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]";
const btn =
  "rounded-xl bg-[#C8A96A] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F]";

export function AdminCmsForm({
  title,
  subtitle,
  section,
  fields,
  extras,
  bare = false,
}: {
  title: string;
  subtitle?: string;
  section: string;
  fields: Array<{
    key: string;
    label: string;
    type?: "text" | "textarea" | "checkbox";
  }>;
  extras?: ReactNode;
  bare?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const fieldKeys = fields.map((f) => `${f.key}:${f.type || "text"}`).join("|");

  useEffect(() => {
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => {
        const block = (cms?.[section] || {}) as Record<string, unknown>;
        const next: Record<string, string | boolean> = {};
        for (const f of fields) {
          const v = block[f.key];
          if (f.type === "checkbox") next[f.key] = Boolean(v);
          else if (Array.isArray(v)) next[f.key] = v.join("\n");
          else next[f.key] = String(v ?? "");
        }
        setValues(next);
      });
    // fieldKeys estabiliza a lista; fields é definido inline nas páginas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, fieldKeys]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const cmsRes = await fetch("/api/admin/cms");
      const cms = await cmsRes.json();
      const current = { ...(cms?.[section] || {}) } as Record<string, unknown>;
      for (const f of fields) {
        if (f.type === "checkbox") current[f.key] = Boolean(values[f.key]);
        else if (
          f.key === "benefits" ||
          f.key === "gallery" ||
          String(values[f.key] || "").includes("\n")
        ) {
          const raw = String(values[f.key] || "");
          if (f.key === "benefits" || f.key === "gallery") {
            current[f.key] = raw
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            current[f.key] = raw;
          }
        } else {
          current[f.key] = values[f.key];
        }
      }
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          data: current,
          action: `Editar ${title}`,
          detail: `${title} atualizado pelo painel`,
        }),
      });
      if (!res.ok) throw new Error("fail");
      setMsg("Salvo com sucesso. Alterações disponíveis no CMS.");
    } catch {
      setMsg("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  const form = (
      <form
        onSubmit={onSave}
        className="max-w-[820px] space-y-4 rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6"
      >
        {!bare ? null : (
          <div className="mb-1">
            <h2 className="text-[15px] font-semibold text-[#F8F8F6]">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-[12px] text-white/45">{subtitle}</p>
            ) : null}
          </div>
        )}
        {fields.map((f) => (
          <div key={f.key}>
            <label className={label}>{f.label}</label>
            {f.type === "checkbox" ? (
              <label className="flex items-center gap-2 text-[13px] text-white/80">
                <input
                  type="checkbox"
                  checked={Boolean(values[f.key])}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.checked }))
                  }
                  className="accent-[#C8A96A]"
                />
                Ativo / visível
              </label>
            ) : f.type === "textarea" ? (
              <textarea
                className={`${input} min-h-[110px]`}
                value={String(values[f.key] ?? "")}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            ) : (
              <input
                className={input}
                value={String(values[f.key] ?? "")}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
        {extras}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" disabled={busy} className={btn}>
            {busy ? "Salvando…" : "Salvar alterações"}
          </button>
          {msg ? <p className="text-[13px] text-[#C8A96A]">{msg}</p> : null}
        </div>
      </form>
  );

  if (bare) return form;

  return (
    <AdminShell title={title} subtitle={subtitle}>
      {form}
    </AdminShell>
  );
}

export { input as adminInput, label as adminLabel, btn as adminBtn };
