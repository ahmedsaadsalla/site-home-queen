"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { SeoScoreBadge } from "@/components/SeoChrome";
import type { AdminCms, SeoPage } from "@/data/admin";
import { scoreSeo } from "@/lib/seo";

const emptySeo = (): SeoPage => ({
  title: "",
  description: "",
  keywords: "",
  slug: "",
  canonical: "",
  ogImage: "",
  ogTitle: "",
  ogDescription: "",
  indexable: true,
});

const pages = [
  { key: "home", label: "Home", pathHint: "/" },
  { key: "products", label: "Produtos / Catálogo", pathHint: "/" },
  { key: "wholesale", label: "Atacado / Revenda", pathHint: "/atacado" },
  { key: "factory", label: "Sobre", pathHint: "/sobre" },
  { key: "contact", label: "Contato", pathHint: "/contato" },
  { key: "quote", label: "Orçamento", pathHint: "/orcamento" },
] as const;

export default function AdminSeoPage() {
  const [cms, setCms] = useState<AdminCms | null>(null);
  const [msg, setMsg] = useState("");
  const [activeKey, setActiveKey] = useState<(typeof pages)[number]["key"]>("home");

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((d: AdminCms) => setCms(d));
  }, []);

  const activeRow = useMemo(() => {
    if (!cms) return emptySeo();
    return { ...emptySeo(), ...(cms.seo[activeKey] || {}) };
  }, [cms, activeKey]);

  const score = useMemo(
    () =>
      scoreSeo({
        title: activeRow.title,
        description: activeRow.description,
        slug: activeRow.canonical || activeRow.slug,
        ogImage: activeRow.ogImage,
        keywords: activeRow.keywords,
        content: activeRow.description,
        hasImage: Boolean(activeRow.ogImage),
        hasAlt: true,
      }),
    [activeRow],
  );

  function updateField<K extends keyof SeoPage>(field: K, value: SeoPage[K]) {
    if (!cms) return;
    const current = { ...emptySeo(), ...(cms.seo[activeKey] || {}) };
    setCms({
      ...cms,
      seo: {
        ...cms.seo,
        [activeKey]: { ...current, [field]: value },
      },
    });
  }

  async function save() {
    if (!cms) return;
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "seo",
        data: cms.seo,
        action: "SEO",
        detail: "Metadados das páginas atualizados",
      }),
    });
    setMsg(res.ok ? "SEO salvo." : "Erro ao salvar.");
  }

  if (!cms) {
    return (
      <AdminShell title="SEO">
        <p className="text-sm text-white/50">Carregando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="SEO"
      subtitle="Título, descrição, slug, canonical, Open Graph e indexação por página"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {pages.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setActiveKey(p.key)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                activeKey === p.key
                  ? "bg-[#C8A96A] text-[#0F0F10]"
                  : "border border-white/15 text-white/70 hover:border-[#C8A96A]/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <SeoScoreBadge
          score={score.score}
          label={score.label}
          color={score.color}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#161618] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg text-[#F8F8F6]">
            {pages.find((p) => p.key === activeKey)?.label}
          </h2>
          <p className="text-[12px] text-white/40">
            Caminho sugerido: {pages.find((p) => p.key === activeKey)?.pathHint}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-white/50">Título SEO</span>
            <input
              value={activeRow.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
            <span className="mt-1 block text-[11px] text-white/35">
              {activeRow.title.length} caracteres (ideal 30–65)
            </span>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-white/50">Meta Description</span>
            <textarea
              rows={3}
              value={activeRow.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
            <span className="mt-1 block text-[11px] text-white/35">
              {activeRow.description.length} caracteres (ideal 120–160)
            </span>
          </label>

          <label className="block text-sm">
            <span className="text-white/50">Slug / URL amigável</span>
            <input
              value={activeRow.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="/"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
          </label>

          <label className="block text-sm">
            <span className="text-white/50">Canonical</span>
            <input
              value={activeRow.canonical || ""}
              onChange={(e) => updateField("canonical", e.target.value)}
              placeholder="Ex.: /contato"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
          </label>

          <label className="block text-sm">
            <span className="text-white/50">Keywords</span>
            <input
              value={activeRow.keywords}
              onChange={(e) => updateField("keywords", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
          </label>

          <label className="block text-sm">
            <span className="text-white/50">Imagem social (Open Graph)</span>
            <input
              value={activeRow.ogImage}
              onChange={(e) => updateField("ogImage", e.target.value)}
              placeholder="/hero-home-queen.jpg"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
          </label>

          <label className="block text-sm">
            <span className="text-white/50">OG Title (opcional)</span>
            <input
              value={activeRow.ogTitle || ""}
              onChange={(e) => updateField("ogTitle", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
          </label>

          <label className="block text-sm">
            <span className="text-white/50">OG Description (opcional)</span>
            <input
              value={activeRow.ogDescription || ""}
              onChange={(e) => updateField("ogDescription", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F0F10] px-3 py-2 text-[#F8F8F6] outline-none focus:border-[#C8A96A]/50"
            />
          </label>

          <label className="flex items-center gap-2 pt-6 text-sm text-white/70 sm:col-span-2">
            <input
              type="checkbox"
              checked={activeRow.indexable !== false}
              onChange={(e) => updateField("indexable", e.target.checked)}
              className="accent-[#C8A96A]"
            />
            Indexar esta página (robots index)
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">
            Checklist SEO
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {score.checks.map((c) => (
              <li
                key={c.id}
                className={`text-[12px] ${c.ok ? "text-emerald-300/90" : "text-white/45"}`}
              >
                {c.ok ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          className="rounded-full bg-[#C8A96A] px-6 py-2.5 text-sm font-semibold text-[#0F0F10]"
        >
          Salvar SEO
        </button>
        {msg ? <p className="text-sm text-[#C8A96A]">{msg}</p> : null}
      </div>
    </AdminShell>
  );
}
