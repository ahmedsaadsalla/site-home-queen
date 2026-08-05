"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageField } from "@/components/admin/ImageField";
import {
  SiteEditorTabs,
  SiteField,
  SiteSaveBar,
  siteInput,
  siteTextarea,
} from "@/components/admin/SiteEditor";
import type { QuotePageCms } from "@/data/admin";

export default function AdminOrcamentoCmsPage() {
  const [data, setData] = useState<QuotePageCms | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setData(cms.quotePage));
  }, []);

  async function save() {
    if (!data) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "quotePage",
          data,
          action: "Orçamento",
          detail: "Página de orçamento atualizada",
        }),
      });
      if (!res.ok) throw new Error("fail");
      setMsg("Salvo! Já aparece no site.");
    } catch {
      setMsg("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <AdminShell title="Orçamento">
        <p className="text-white/50">Carregando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Editar Orçamento"
      subtitle="Textos e banner da página /orcamento"
    >
      <Link
        href="/admin/site"
        className="mb-4 inline-block text-[12px] text-white/45 hover:text-[#C8A96A]"
      >
        ← Todas as páginas
      </Link>

      <SiteEditorTabs
        tabs={[
          {
            id: "textos",
            label: "1. Textos",
            content: (
              <div className="max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#151515] p-5">
                <SiteField label="Título">
                  <input
                    className={siteInput}
                    value={data.title}
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                  />
                </SiteField>
                <SiteField label="Subtítulo">
                  <textarea
                    className={siteTextarea}
                    value={data.subtitle}
                    onChange={(e) =>
                      setData({ ...data, subtitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Título dos diferenciais">
                  <input
                    className={siteInput}
                    value={data.trustTitle}
                    onChange={(e) =>
                      setData({ ...data, trustTitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Itens de confiança (um por linha)">
                  <textarea
                    className={siteTextarea}
                    value={(data.trustItems || []).join("\n")}
                    onChange={(e) =>
                      setData({
                        ...data,
                        trustItems: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </SiteField>
                <SiteField label="Título após envio">
                  <input
                    className={siteInput}
                    value={data.successTitle}
                    onChange={(e) =>
                      setData({ ...data, successTitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Texto após envio">
                  <textarea
                    className={siteTextarea}
                    value={data.successText}
                    onChange={(e) =>
                      setData({ ...data, successText: e.target.value })
                    }
                  />
                </SiteField>
              </div>
            ),
          },
          {
            id: "foto",
            label: "2. Banner",
            content: (
              <ImageField
                label="Banner da página de orçamento"
                value={data.banner}
                onChange={(url) => setData({ ...data, banner: url })}
                folder="banners"
                usedIn="Orçamento · Banner"
              />
            ),
          },
        ]}
      />

      <SiteSaveBar
        onSave={() => void save()}
        busy={busy}
        msg={msg}
        previewHref="/orcamento"
      />
    </AdminShell>
  );
}
