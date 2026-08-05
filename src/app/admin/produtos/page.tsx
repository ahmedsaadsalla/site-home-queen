"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminModal } from "@/components/admin/AdminModal";
import { EditContentPanel } from "@/components/admin/EditContentPanel";
import { GalleryField, ImageField } from "@/components/admin/ImageField";
import { adminBtn, adminInput, adminLabel } from "@/components/admin/AdminCmsForm";
import { useAdminToast } from "@/components/admin/AdminToast";
import type { AdminCategory, AdminProduct } from "@/data/adminCatalog";
import { PRODUCT_COLOR_PRESETS, slugify } from "@/data/adminCatalog";
import { SeoScoreBadge } from "@/components/SeoChrome";
import { scoreSeo } from "@/lib/seo";

type SortKey = "name" | "sku" | "retailPrice" | "stock" | "order" | "categoryId";

const PAGE_SIZE = 12;

const emptyProduct = (): Partial<AdminProduct> & { name: string } => ({
  name: "",
  sku: "",
  code: "",
  categoryId: "",
  brand: "Home Queen",
  image: "",
  cover: "",
  gallery: [],
  video: "",
  colors: [
    { name: "Preto", hex: "#1A1A1A" },
    { name: "Bege", hex: "#C8B89A" },
    { name: "Cinza", hex: "#C5C5C5" },
    { name: "Marrom", hex: "#5C4033" },
  ],
  defaultColor: "Preto",
  retailPrice: 0,
  wholesalePrice: 0,
  minQty: 3,
  stock: 0,
  active: true,
  featured: false,
  promotion: false,
  launch: false,
  description: "",
  order: 1,
});

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminProductsPage() {
  const toast = useAdminToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkBrand, setBulkBrand] = useState("");

  async function load() {
    const res = await fetch("/api/admin/catalog");
    const data = await res.json();
    setProducts(data.products || []);
    setCategories(data.categories || []);
    setBrands(data.brands || []);
  }

  useEffect(() => {
    void load();
  }, []);

  const catName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) || id;
  }, [categories]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = products.filter((p) => !p.deletedAt);

    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          catName(p.categoryId).toLowerCase().includes(term),
      );
    }
    if (filterCategory) list = list.filter((p) => p.categoryId === filterCategory);
    if (filterBrand) list = list.filter((p) => p.brand === filterBrand);
    if (filterStatus === "ativo") list = list.filter((p) => p.active);
    if (filterStatus === "inativo") list = list.filter((p) => !p.active);
    if (filterStatus === "sem-estoque") list = list.filter((p) => p.stock <= 0);
    if (filterStatus === "promocao") list = list.filter((p) => p.promotion);
    if (filterStatus === "lancamento") list = list.filter((p) => p.launch);

    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "pt-BR")
        : String(bv).localeCompare(String(av), "pt-BR");
    });
    return list;
  }, [
    products,
    q,
    filterCategory,
    filterBrand,
    filterStatus,
    sortKey,
    sortDir,
    catName,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, filterCategory, filterBrand, filterStatus]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    const ids = pageItems.map((p) => p.id);
    const all = ids.every((id) => selected.includes(id));
    setSelected((prev) =>
      all ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])],
    );
  }

  function openCreate() {
    setForm({
      ...emptyProduct(),
      categoryId: categories[0]?.id || "",
      order: products.length + 1,
    });
    setFormOpen(true);
  }

  function openEdit(p: AdminProduct) {
    setForm({ ...p });
    setFormOpen(true);
  }

  async function saveForm() {
    if (!form.name.trim()) {
      toast.push("Informe o nome do produto.", "error");
      return;
    }
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "product",
        action: "save",
        data: form,
        user: "Administrador",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.push(data.error || "Erro ao salvar.", "error");
      return;
    }
    toast.push(form.id ? "Produto alterado." : "Produto criado.");
    setFormOpen(false);
    await load();
  }

  async function runBulk(action: string, patch?: Partial<AdminProduct>) {
    if (!selected.length) {
      toast.push("Selecione ao menos um produto.", "error");
      return;
    }
    if (action === "delete") {
      if (!window.confirm(`Excluir ${selected.length} produto(s)?`)) return;
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "product",
          action: "delete",
          ids: selected,
          user: "Administrador",
        }),
      });
      if (!res.ok) {
        toast.push("Falha ao excluir.", "error");
        return;
      }
      toast.push("Produtos excluídos.");
      setSelected([]);
      await load();
      return;
    }
    if (action === "duplicate") {
      for (const id of selected) {
        await fetch("/api/admin/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "product",
            action: "duplicate",
            id,
            user: "Administrador",
          }),
        });
      }
      toast.push("Produtos duplicados.");
      setSelected([]);
      await load();
      return;
    }
    if (action === "export") {
      const rows = products.filter((p) => selected.includes(p.id));
      const csv = [
        "id,name,sku,code,category,brand,price,stock,active",
        ...rows.map(
          (p) =>
            `${p.id},"${p.name}",${p.sku},${p.code},${p.categoryId},${p.brand},${p.retailPrice},${p.stock},${p.active}`,
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produtos-home-queen-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.push("Exportação gerada.");
      return;
    }

    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "product",
        action: "bulk",
        ids: selected,
        patch,
        user: "Administrador",
      }),
    });
    if (!res.ok) {
      toast.push("Falha na ação em massa.", "error");
      return;
    }
    toast.push("Ação em massa aplicada.");
    setSelected([]);
    setBulkOpen(false);
    await load();
  }

  return (
    <AdminShell
      title="Produtos"
      subtitle="Catálogo completo com busca, filtros e ações em massa · sync Bling automático"
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${adminInput} max-w-[320px]`}
          placeholder="Buscar nome, SKU, código ou categoria…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={`${adminInput} max-w-[180px]`}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="" className="bg-[#0F0F10]">
            Categoria
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#0F0F10]">
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={`${adminInput} max-w-[160px]`}
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
        >
          <option value="" className="bg-[#0F0F10]">
            Marca
          </option>
          {brands.map((b) => (
            <option key={b} value={b} className="bg-[#0F0F10]">
              {b}
            </option>
          ))}
        </select>
        <select
          className={`${adminInput} max-w-[170px]`}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="" className="bg-[#0F0F10]">
            Status
          </option>
          <option value="ativo" className="bg-[#0F0F10]">
            Ativo
          </option>
          <option value="inativo" className="bg-[#0F0F10]">
            Inativo
          </option>
          <option value="sem-estoque" className="bg-[#0F0F10]">
            Sem Estoque
          </option>
          <option value="promocao" className="bg-[#0F0F10]">
            Promoção
          </option>
          <option value="lancamento" className="bg-[#0F0F10]">
            Lançamento
          </option>
        </select>
        <button type="button" className={adminBtn} onClick={openCreate}>
          Criar Produto
        </button>
      </div>

      {selected.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-4 py-3">
          <span className="text-[12px] text-[#C8A96A]">
            {selected.length} selecionado(s)
          </span>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase"
            onClick={() => void runBulk("bulk", { active: true })}
          >
            Ativar
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase"
            onClick={() => void runBulk("bulk", { active: false })}
          >
            Desativar
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase"
            onClick={() => void runBulk("bulk", { promotion: true })}
          >
            Promoção
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase"
            onClick={() => setBulkOpen(true)}
          >
            Alterar Categoria/Marca
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase"
            onClick={() => void runBulk("duplicate")}
          >
            Duplicar
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase"
            onClick={() => void runBulk("export")}
          >
            Exportar
          </button>
          <button
            type="button"
            className="rounded-full border border-red-400/40 px-3 py-1 text-[10px] font-bold uppercase text-red-300"
            onClick={() => void runBulk("delete")}
          >
            Excluir
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#151515]">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.08em] text-white/45">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={
                    pageItems.length > 0 &&
                    pageItems.every((p) => selected.includes(p.id))
                  }
                  onChange={toggleSelectAll}
                  className="accent-[#C8A96A]"
                />
              </th>
              <th className="px-3 py-3">Foto</th>
              {(
                [
                  ["name", "Nome"],
                  ["sku", "SKU"],
                  ["categoryId", "Categoria"],
                  ["retailPrice", "Preço"],
                  ["stock", "Estoque"],
                  ["order", "Ordem"],
                ] as const
              ).map(([key, label]) => (
                <th key={key} className="px-3 py-3">
                  <button
                    type="button"
                    className="hover:text-[#C8A96A]"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="accent-[#C8A96A]"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="h-11 w-11 overflow-hidden rounded-lg bg-black/40">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-[11px] text-white/40">{p.code}</p>
                </td>
                <td className="px-3 py-3 text-white/70">{p.sku}</td>
                <td className="px-3 py-3">{catName(p.categoryId)}</td>
                <td className="px-3 py-3">{brl(p.retailPrice)}</td>
                <td className="px-3 py-3">
                  <span className={p.stock <= 0 ? "text-red-300" : ""}>{p.stock}</span>
                </td>
                <td className="px-3 py-3">{p.order}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      p.active
                        ? "bg-[#C8A96A]/20 text-[#C8A96A]"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="rounded-full border border-white/15 px-3 py-1 text-[11px] hover:border-[#C8A96A]"
                    onClick={() => openEdit(p)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-white/40">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/50">
        <p>
          {filtered.length} produto(s) · página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-full border border-white/15 px-3 py-1 disabled:opacity-30"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded-full border border-white/15 px-3 py-1 disabled:opacity-30"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próxima
          </button>
        </div>
      </div>

      <AdminModal
        open={formOpen}
        title={form.id ? "Editar Produto" : "Criar Produto"}
        onClose={() => setFormOpen(false)}
        wide
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={adminLabel}>Nome</span>
              <input
                className={adminInput}
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug:
                      !f.id || !f.slug
                        ? slugify(name)
                        : f.slug,
                  }));
                }}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={adminLabel}>Slug (URL amigável)</span>
              <input
                className={adminInput}
                value={form.slug || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) || e.target.value }))
                }
                placeholder="cama-box-premium-king"
              />
              <span className="mt-1 block text-[11px] text-white/35">
                URL pública: /produto/{form.slug || "…"}
              </span>
            </label>
            <label>
              <span className={adminLabel}>SKU</span>
              <input
                className={adminInput}
                value={form.sku || ""}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </label>
            <label>
              <span className={adminLabel}>Código</span>
              <input
                className={adminInput}
                value={form.code || ""}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </label>
            <label>
              <span className={adminLabel}>Categoria</span>
              <select
                className={adminInput}
                value={form.categoryId || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0F0F10]">
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={adminLabel}>Marca</span>
              <input
                className={adminInput}
                value={form.brand || ""}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                list="brand-list"
              />
              <datalist id="brand-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>
            <label>
              <span className={adminLabel}>Preço varejo</span>
              <input
                type="number"
                className={adminInput}
                value={form.retailPrice ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, retailPrice: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              <span className={adminLabel}>Preço atacado</span>
              <input
                type="number"
                className={adminInput}
                value={form.wholesalePrice ?? 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    wholesalePrice: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label>
              <span className={adminLabel}>Estoque</span>
              <input
                type="number"
                className={adminInput}
                value={form.stock ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              <span className={adminLabel}>Pedido mínimo</span>
              <input
                type="number"
                className={adminInput}
                value={form.minQty ?? 3}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minQty: Number(e.target.value) }))
                }
              />
            </label>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8A96A]">
              Cores do produto
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRODUCT_COLOR_PRESETS.map((preset) => {
                const selected = (form.colors || []).some(
                  (c) => c.name === preset.name,
                );
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      const current = form.colors || [];
                      if (selected) {
                        const next = current.filter((c) => c.name !== preset.name);
                        setForm((f) => ({
                          ...f,
                          colors: next,
                          defaultColor:
                            f.defaultColor === preset.name
                              ? next[0]?.name || ""
                              : f.defaultColor,
                        }));
                      } else {
                        setForm((f) => ({
                          ...f,
                          colors: [...current, preset],
                          defaultColor: f.defaultColor || preset.name,
                        }));
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] transition ${
                      selected
                        ? "border-[#C8A96A] bg-[#C8A96A]/15 text-[#F8F8F6]"
                        : "border-white/15 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {preset.name}
                  </button>
                );
              })}
            </div>
            {(form.colors || []).length > 0 ? (
              <label className="mt-3 block max-w-xs">
                <span className={adminLabel}>Cor padrão</span>
                <select
                  className={adminInput}
                  value={form.defaultColor || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, defaultColor: e.target.value }))
                  }
                >
                  {(form.colors || []).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <label className="block">
            <span className={adminLabel}>Descrição</span>
            <textarea
              className={adminInput}
              rows={3}
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8A96A]">
                SEO do produto
              </p>
              <SeoScoreBadge
                {...(() => {
                  const s = scoreSeo({
                    title: form.seoTitle || form.name,
                    description: form.seoDescription || form.description,
                    slug: form.slug,
                    ogImage: form.ogImage || form.cover || form.image,
                    keywords: form.seoKeywords,
                    content: form.description,
                    hasImage: Boolean(form.image || form.cover),
                    hasAlt: true,
                  });
                  return { score: s.score, label: s.label, color: s.color };
                })()}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={adminLabel}>Título SEO</span>
                <input
                  className={adminInput}
                  value={form.seoTitle || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seoTitle: e.target.value }))
                  }
                  placeholder={`${form.name || "Produto"} | Home Queen`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={adminLabel}>Descrição SEO</span>
                <textarea
                  className={adminInput}
                  rows={2}
                  value={form.seoDescription || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seoDescription: e.target.value }))
                  }
                />
              </label>
              <label>
                <span className={adminLabel}>Keywords</span>
                <input
                  className={adminInput}
                  value={form.seoKeywords || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seoKeywords: e.target.value }))
                  }
                />
              </label>
              <label>
                <span className={adminLabel}>Imagem social (OG)</span>
                <input
                  className={adminInput}
                  value={form.ogImage || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ogImage: e.target.value }))
                  }
                  placeholder="URL da capa"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.indexable !== false}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, indexable: e.target.checked }))
                  }
                  className="accent-[#C8A96A]"
                />
                Indexar no Google
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-[13px]">
            {(
              [
                ["active", "Ativo"],
                ["featured", "Destaque"],
                ["promotion", "Promoção"],
                ["launch", "Lançamento"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.checked }))
                  }
                  className="accent-[#C8A96A]"
                />
                {label}
              </label>
            ))}
          </div>

          <EditContentPanel title="Fotos do produto" defaultOpen>
            <div className="grid gap-3 lg:grid-cols-2">
              <ImageField
                label="Foto principal"
                value={form.image}
                onChange={(url) =>
                  setForm((f) => ({
                    ...f,
                    image: url,
                    gallery: f.gallery?.length ? f.gallery : url ? [url] : [],
                  }))
                }
                folder="produtos"
                productId={form.id}
                usedIn={`Produto · ${form.name || "novo"}`}
              />
              <ImageField
                label="Capa"
                value={form.cover}
                onChange={(url) => setForm((f) => ({ ...f, cover: url }))}
                folder="produtos"
                productId={form.id}
                usedIn={`Produto capa · ${form.name || "novo"}`}
              />
            </div>
            <GalleryField
              label="Galeria"
              value={form.gallery || []}
              onChange={(urls) =>
                setForm((f) => ({
                  ...f,
                  gallery: urls,
                  image: urls[0] || f.image,
                }))
              }
              folder="produtos"
              productId={form.id}
              usedIn={`Produto galeria · ${form.name || "novo"}`}
            />
          </EditContentPanel>

          <button type="button" className={adminBtn} onClick={() => void saveForm()}>
            Salvar produto
          </button>
        </div>
      </AdminModal>

      <AdminModal
        open={bulkOpen}
        title="Alterar categoria / marca"
        onClose={() => setBulkOpen(false)}
      >
        <div className="space-y-3">
          <label className="block">
            <span className={adminLabel}>Nova categoria</span>
            <select
              className={adminInput}
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
            >
              <option value="" className="bg-[#0F0F10]">
                Manter
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0F0F10]">
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={adminLabel}>Nova marca</span>
            <input
              className={adminInput}
              value={bulkBrand}
              onChange={(e) => setBulkBrand(e.target.value)}
              placeholder="Manter se vazio"
            />
          </label>
          <button
            type="button"
            className={adminBtn}
            onClick={() => {
              const patch: Partial<AdminProduct> = {};
              if (bulkCategory) patch.categoryId = bulkCategory;
              if (bulkBrand.trim()) patch.brand = bulkBrand.trim();
              if (!Object.keys(patch).length) {
                toast.push("Nada para alterar.", "info");
                return;
              }
              void runBulk("bulk", patch);
            }}
          >
            Aplicar
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
