"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { adminBtn, adminInput, adminLabel } from "@/components/admin/AdminCmsForm";
import { GalleryField, ImageField } from "@/components/admin/ImageField";
import { useAdminToast } from "@/components/admin/AdminToast";
import type { AdminCategory, AdminProduct } from "@/data/adminCatalog";
import { PRODUCT_COLOR_PRESETS } from "@/data/adminCatalog";

type CategoryRow = AdminCategory & { productCount?: number };

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AdminWholesaleCatalog() {
  const toast = useAdminToast();
  const [tab, setTab] = useState<"produtos" | "categorias">("produtos");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [q, setQ] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [productForm, setProductForm] = useState<Partial<AdminProduct> & { name: string }>({
    name: "",
    colors: [],
  });
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#C8A96A");
  const [categoryForm, setCategoryForm] = useState<
    Partial<AdminCategory> & { name: string }
  >({ name: "" });
  const [deleteCat, setDeleteCat] = useState<CategoryRow | null>(null);
  const [moveToId, setMoveToId] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/catalog");
    const data = await res.json();
    setProducts((data.products || []) as AdminProduct[]);
    setCategories((data.categories || []) as CategoryRow[]);
  }

  useEffect(() => {
    void load();
  }, []);

  const catName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) || id;
  }, [categories]);

  const productList = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products
      .filter((p) => !p.deletedAt)
      .filter((p) => {
        if (!term) return true;
        return (
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          catName(p.categoryId).toLowerCase().includes(term)
        );
      });
  }, [products, q, catName]);

  const categoryList = useMemo(() => {
    const term = q.trim().toLowerCase();
    return categories
      .filter((c) => !c.deletedAt)
      .filter((c) => !term || c.name.toLowerCase().includes(term))
      .sort((a, b) => a.order - b.order);
  }, [categories, q]);

  function openEditProduct(p: AdminProduct) {
    setProductForm({
      ...p,
      colors: p.colors || [],
      defaultColor: p.defaultColor || p.colors?.[0]?.name || "",
    });
    setCustomColorName("");
    setCustomColorHex("#C8A96A");
    setProductFormOpen(true);
  }

  function openEditCategory(c: CategoryRow) {
    setCategoryForm({ ...c });
    setCategoryFormOpen(true);
  }

  async function saveProduct() {
    if (!productForm.name?.trim()) {
      toast.push("Informe o nome do produto.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "product",
          action: "save",
          data: productForm,
          user: "Administrador",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error || "Erro ao salvar produto.", "error");
        return;
      }
      toast.push("Produto de atacado atualizado.");
      setProductFormOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveCategory() {
    if (!categoryForm.name?.trim()) {
      toast.push("Informe o nome da categoria.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "category",
          action: "save",
          data: categoryForm,
          user: "Administrador",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error || "Erro ao salvar categoria.", "error");
        return;
      }
      toast.push("Categoria de atacado atualizada.");
      setCategoryFormOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleProductActive(p: AdminProduct) {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "product",
        action: "bulk",
        ids: [p.id],
        patch: { active: !p.active },
        user: "Administrador",
      }),
    });
    if (!res.ok) {
      toast.push("Falha ao alterar status.", "error");
      return;
    }
    toast.push(p.active ? "Produto desativado no atacado." : "Produto ativado no atacado.");
    await load();
  }

  async function toggleCategoryActive(c: CategoryRow) {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "category",
        action: c.active ? "hide" : "show",
        id: c.id,
        user: "Administrador",
      }),
    });
    if (!res.ok) {
      toast.push("Falha ao alterar status da categoria.", "error");
      return;
    }
    toast.push(c.active ? "Categoria desativada." : "Categoria ativada.");
    await load();
  }

  async function deleteProduct(p: AdminProduct) {
    if (!window.confirm(`Excluir o produto "${p.name}"?`)) return;
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "product",
        action: "delete",
        ids: [p.id],
        user: "Administrador",
      }),
    });
    if (!res.ok) {
      toast.push("Falha ao excluir produto.", "error");
      return;
    }
    toast.push("Produto excluído.");
    await load();
  }

  async function confirmDeleteCategory(mode: "move" | "force") {
    if (!deleteCat) return;
    if (mode === "move" && !moveToId) {
      toast.push("Escolha a categoria de destino.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "category",
          action: "delete",
          id: deleteCat.id,
          mode,
          moveToId: mode === "move" ? moveToId : undefined,
          user: "Administrador",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error || "Falha ao excluir categoria.", "error");
        return;
      }
      toast.push("Categoria excluída.");
      setDeleteCat(null);
      setMoveToId("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openDeleteCategory(c: CategoryRow) {
    setDeleteCat(c);
    const other = categories.find((x) => x.id !== c.id && !x.deletedAt);
    setMoveToId(other?.id || "");
  }

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-[#151515] p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C8A96A]">
            Catálogo atacado
          </p>
          <h2 className="mt-1 font-display text-2xl text-[#F8F8F6]">
            Produtos e categorias
          </h2>
          <p className="mt-1 max-w-xl text-[13px] text-white/55">
            Edite preço de atacado, pedido mínimo, estoque e ative ou desative itens
            do portal do revendedor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("produtos")}
            className={`rounded-xl px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition ${
              tab === "produtos"
                ? "bg-[#C8A96A] text-[#0F0F10]"
                : "border border-white/15 text-white/70 hover:border-[#C8A96A]/hover:text-[#C8A96A]"
            }`}
          >
            Produtos
          </button>
          <button
            type="button"
            onClick={() => setTab("categorias")}
            className={`rounded-xl px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition ${
              tab === "categorias"
                ? "bg-[#C8A96A] text-[#0F0F10]"
                : "border border-white/15 text-white/70 hover:border-[#C8A96A]/hover:text-[#C8A96A]"
            }`}
          >
            Categorias
          </button>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={
          tab === "produtos"
            ? "Buscar produto, SKU ou categoria..."
            : "Buscar categoria..."
        }
        className={`${adminInput} mb-4 max-w-md`}
      />

      {tab === "produtos" ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-3 font-medium">Foto</th>
                <th className="px-3 py-3 font-medium">Produto</th>
                <th className="px-3 py-3 font-medium">Categoria</th>
                <th className="px-3 py-3 font-medium">Atacado</th>
                <th className="px-3 py-3 font-medium">Mín.</th>
                <th className="px-3 py-3 font-medium">Estoque</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((p) => (
                <tr key={p.id} className="border-t border-white/8 text-[#F8F8F6]">
                  <td className="px-3 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {p.wholesaleImage || p.image || p.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.wholesaleImage || p.image || p.cover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                          —
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[11px] text-white/40">{p.sku}</div>
                    {(p.colors || []).length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(p.colors || []).slice(0, 5).map((c) => (
                          <span
                            key={c.name}
                            title={c.name}
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-white/65">{catName(p.categoryId)}</td>
                  <td className="px-3 py-3 font-semibold text-[#C8A96A]">
                    {brl(p.wholesalePrice || 0)}
                    <div className="text-[11px] font-normal text-white/35 line-through">
                      {brl(p.retailPrice || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-3">{p.minQty} un.</td>
                  <td className="px-3 py-3">{p.stock}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase ${
                        p.active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/10 text-white/45"
                      }`}
                    >
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditProduct(p)}
                        className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/75 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleProductActive(p)}
                        className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/75 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                      >
                        {p.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProduct(p)}
                        className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-[11px] text-red-300/90 hover:border-red-400 hover:text-red-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!productList.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-white/40">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-3 font-medium">Categoria</th>
                <th className="px-3 py-3 font-medium">Produtos</th>
                <th className="px-3 py-3 font-medium">Pedido mín.</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categoryList.map((c) => (
                <tr key={c.id} className="border-t border-white/8 text-[#F8F8F6]">
                  <td className="px-3 py-3 font-medium">{c.name}</td>
                  <td className="px-3 py-3 text-white/65">{c.productCount ?? 0}</td>
                  <td className="px-3 py-3">{c.minQty ?? 3} un.</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase ${
                        c.active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/10 text-white/45"
                      }`}
                    >
                      {c.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditCategory(c)}
                        className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/75 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleCategoryActive(c)}
                        className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/75 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                      >
                        {c.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteCategory(c)}
                        className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-[11px] text-red-300/90 hover:border-red-400 hover:text-red-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!categoryList.length ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-white/40">
                    Nenhuma categoria encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={productFormOpen}
        title="Editar produto (atacado)"
        onClose={() => setProductFormOpen(false)}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={adminLabel}>Nome</span>
            <input
              className={adminInput}
              value={productForm.name || ""}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Preço varejo (R$)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              className={adminInput}
              value={productForm.retailPrice ?? 0}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  retailPrice: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Preço atacado (R$)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              className={adminInput}
              value={productForm.wholesalePrice ?? 0}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  wholesalePrice: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Pedido mínimo (un.)</span>
            <input
              type="number"
              min={1}
              className={adminInput}
              value={productForm.minQty ?? 3}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  minQty: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Estoque</span>
            <input
              type="number"
              min={0}
              className={adminInput}
              value={productForm.stock ?? 0}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  stock: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Categoria</span>
            <select
              className={adminInput}
              value={productForm.categoryId || ""}
              onChange={(e) =>
                setProductForm({ ...productForm, categoryId: e.target.value })
              }
            >
              {categories
                .filter((c) => !c.deletedAt)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-[13px] text-white/75">
            <input
              type="checkbox"
              checked={productForm.active ?? true}
              onChange={(e) =>
                setProductForm({ ...productForm, active: e.target.checked })
              }
            />
            Produto ativo no catálogo
          </label>

          <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8A96A]">
              Cores do produto
            </p>
            <p className="mt-1 text-[12px] text-white/45">
              Selecione as cores disponíveis. A cor padrão aparece marcada.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRODUCT_COLOR_PRESETS.map((preset) => {
                const selected = (productForm.colors || []).some(
                  (c) => c.name === preset.name,
                );
                const isDefault = productForm.defaultColor === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      const current = productForm.colors || [];
                      if (selected) {
                        const next = current.filter((c) => c.name !== preset.name);
                        setProductForm({
                          ...productForm,
                          colors: next,
                          defaultColor:
                            productForm.defaultColor === preset.name
                              ? next[0]?.name || ""
                              : productForm.defaultColor,
                        });
                      } else {
                        const next = [...current, preset];
                        setProductForm({
                          ...productForm,
                          colors: next,
                          defaultColor: productForm.defaultColor || preset.name,
                        });
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
                      aria-hidden
                    />
                    {preset.name}
                    {isDefault ? (
                      <span className="text-[10px] uppercase tracking-wide text-[#C8A96A]">
                        padrão
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {(productForm.colors || []).length > 0 ? (
              <div className="mt-3">
                <span className={adminLabel}>Cor padrão</span>
                <select
                  className={adminInput}
                  value={productForm.defaultColor || ""}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      defaultColor: e.target.value,
                    })
                  }
                >
                  {(productForm.colors || []).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <label className="block">
                <span className={adminLabel}>Cor personalizada</span>
                <input
                  className={adminInput}
                  placeholder="Ex: Terracota"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className={adminLabel}>Hex</span>
                <input
                  type="color"
                  className="h-11 w-full cursor-pointer rounded-xl border border-white/15 bg-transparent p-1 sm:w-16"
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="rounded-xl border border-[#C8A96A]/50 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-[#C8A96A] hover:bg-[#C8A96A]/10"
                onClick={() => {
                  const name = customColorName.trim();
                  if (!name) {
                    toast.push("Informe o nome da cor.", "error");
                    return;
                  }
                  const current = productForm.colors || [];
                  if (current.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
                    toast.push("Essa cor já está na lista.", "error");
                    return;
                  }
                  const next = [...current, { name, hex: customColorHex }];
                  setProductForm({
                    ...productForm,
                    colors: next,
                    defaultColor: productForm.defaultColor || name,
                  });
                  setCustomColorName("");
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8A96A]">
            Fotos só para atacado (CNPJ)
          </p>
          <p className="mb-3 text-[12px] text-white/45">
            Estas imagens não aparecem para cliente CPF — só no portal do revendedor.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ImageField
              label="Foto principal (atacado)"
              value={productForm.wholesaleImage || ""}
              onChange={(url) =>
                setProductForm((f) => ({
                  ...f,
                  wholesaleImage: url,
                  wholesaleGallery: f.wholesaleGallery?.length
                    ? f.wholesaleGallery
                    : url
                      ? [url]
                      : [],
                }))
              }
              folder="produtos"
              productId={productForm.id}
              usedIn={`Atacado · ${productForm.name || "produto"}`}
            />
            <ImageField
              label="Capa (atacado)"
              value={productForm.wholesaleCover || ""}
              onChange={(url) =>
                setProductForm((f) => ({ ...f, wholesaleCover: url }))
              }
              folder="produtos"
              productId={productForm.id}
              usedIn={`Atacado capa · ${productForm.name || "produto"}`}
            />
          </div>
          <div className="mt-3">
            <GalleryField
              label="Galeria (atacado)"
              value={productForm.wholesaleGallery || []}
              onChange={(urls) =>
                setProductForm((f) => ({
                  ...f,
                  wholesaleGallery: urls,
                  wholesaleImage: urls[0] || f.wholesaleImage,
                }))
              }
              folder="produtos"
              productId={productForm.id}
              usedIn={`Atacado galeria · ${productForm.name || "produto"}`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70"
            onClick={() => setProductFormOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={adminBtn}
            disabled={busy}
            onClick={() => void saveProduct()}
          >
            Salvar
          </button>
        </div>
      </AdminModal>

      <AdminModal
        open={categoryFormOpen}
        title="Editar categoria (atacado)"
        onClose={() => setCategoryFormOpen(false)}
      >
        <div className="grid gap-3">
          <label className="block">
            <span className={adminLabel}>Nome</span>
            <input
              className={adminInput}
              value={categoryForm.name || ""}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Pedido mínimo padrão (un.)</span>
            <input
              type="number"
              min={1}
              className={adminInput}
              value={categoryForm.minQty ?? 3}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  minQty: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-white/75">
            <input
              type="checkbox"
              checked={categoryForm.active ?? true}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, active: e.target.checked })
              }
            />
            Categoria ativa no catálogo
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70"
            onClick={() => setCategoryFormOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={adminBtn}
            disabled={busy}
            onClick={() => void saveCategory()}
          >
            Salvar
          </button>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(deleteCat)}
        title="Excluir categoria"
        onClose={() => setDeleteCat(null)}
      >
        {deleteCat ? (
          <>
            <p className="text-[13px] text-white/65">
              A categoria <strong className="text-[#F8F8F6]">{deleteCat.name}</strong>{" "}
              tem {deleteCat.productCount ?? 0} produto(s). Escolha como excluir:
            </p>
            {(deleteCat.productCount ?? 0) > 0 ? (
              <label className="mt-4 block">
                <span className={adminLabel}>Mover produtos para</span>
                <select
                  className={adminInput}
                  value={moveToId}
                  onChange={(e) => setMoveToId(e.target.value)}
                >
                  {categories
                    .filter((c) => c.id !== deleteCat.id && !c.deletedAt)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/15 px-4 py-2 text-[12px] text-white/70"
                onClick={() => setDeleteCat(null)}
              >
                Cancelar
              </button>
              {(deleteCat.productCount ?? 0) > 0 ? (
                <button
                  type="button"
                  className={adminBtn}
                  disabled={busy}
                  onClick={() => void confirmDeleteCategory("move")}
                >
                  Mover e excluir
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-[12px] font-semibold text-red-200"
                disabled={busy}
                onClick={() => void confirmDeleteCategory("force")}
              >
                {(deleteCat.productCount ?? 0) > 0
                  ? "Excluir forçado"
                  : "Confirmar exclusão"}
              </button>
            </div>
          </>
        ) : null}
      </AdminModal>
    </div>
  );
}
