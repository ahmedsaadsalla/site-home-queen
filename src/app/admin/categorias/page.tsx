"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminModal } from "@/components/admin/AdminModal";
import { ImageField } from "@/components/admin/ImageField";
import { adminBtn, adminInput, adminLabel } from "@/components/admin/AdminCmsForm";
import { useAdminToast } from "@/components/admin/AdminToast";
import { slugify, type AdminCategory } from "@/data/adminCatalog";

type CategoryRow = AdminCategory & { productCount: number };

const emptyForm = (): Partial<AdminCategory> & { name: string } => ({
  name: "",
  slug: "",
  banner: "",
  icon: "",
  image: "",
  order: 1,
  parentId: null,
  description: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  minQty: 3,
  active: true,
});

export default function AdminCategoriesPage() {
  const toast = useAdminToast();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [moveToId, setMoveToId] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/catalog");
    const data = await res.json();
    setRows(data.categories || []);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term),
    );
  }, [rows, q]);

  function openCreate() {
    setForm({
      ...emptyForm(),
      order: rows.length + 1,
    });
    setFormOpen(true);
  }

  function openEdit(cat: CategoryRow) {
    setForm({ ...cat });
    setFormOpen(true);
    setMenuId(null);
  }

  async function saveForm() {
    if (!form.name.trim()) {
      toast.push("Informe o nome da categoria.", "error");
      return;
    }
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "category",
        action: "save",
        data: {
          ...form,
          slug: form.slug || slugify(form.name),
          seoTitle: form.seoTitle || `${form.name} | Home Queen`,
        },
        user: "Administrador",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.push(data.error || "Erro ao salvar.", "error");
      return;
    }
    toast.push(form.id ? "Categoria atualizada." : "Categoria criada.");
    setFormOpen(false);
    await load();
  }

  async function apiAction(action: string, id: string, extra?: object) {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "category",
        action,
        id,
        user: "Administrador",
        ...extra,
      }),
    });
    const data = await res.json();
    if (res.status === 409 && data.confirmRequired) {
      const cat = rows.find((c) => c.id === id) || null;
      setDeleteTarget(cat);
      setMoveToId(rows.find((c) => c.id !== id)?.id || "");
      return;
    }
    if (!res.ok) {
      toast.push(data.error || "Falha na ação.", "error");
      return;
    }
    toast.push("Ação concluída.");
    setMenuId(null);
    setDeleteTarget(null);
    await load();
  }

  async function confirmDelete(mode: "move" | "force") {
    if (!deleteTarget) return;
    await apiAction("delete", deleteTarget.id, {
      mode,
      moveToId: mode === "move" ? moveToId : undefined,
    });
  }

  async function moveOrder(id: string, dir: -1 | 1) {
    const ordered = [...rows].sort((a, b) => a.order - b.order);
    const i = ordered.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const orderedIds = ordered.map((c) => c.id);
    setRows(ordered.map((c, idx) => ({ ...c, order: idx + 1 })));
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "category",
        action: "reorder",
        orderedIds,
        user: "Administrador",
      }),
    });
  }

  return (
    <AdminShell
      title="Categorias"
      subtitle="Criar, organizar e gerenciar categorias do catálogo"
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className={`${adminInput} max-w-[280px]`}
          placeholder="Pesquisar categoria…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className={adminBtn} onClick={openCreate}>
          Criar Categoria
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#151515]">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.08em] text-white/45">
            <tr>
              <th className="px-4 py-3">Imagem</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Produtos</th>
              <th className="px-4 py-3">Ordem</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-white/5 align-middle">
                <td className="px-4 py-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-black/40">
                    {c.image || c.banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image || c.banner}
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
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#F8F8F6]">{c.name}</p>
                  <p className="text-[11px] text-white/40">/{c.slug}</p>
                </td>
                <td className="px-4 py-3 text-[#C8A96A]">{c.productCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span>{c.order}</span>
                    <button
                      type="button"
                      className="rounded border border-white/15 px-1.5 text-[10px]"
                      onClick={() => void moveOrder(c.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded border border-white/15 px-1.5 text-[10px]"
                      onClick={() => void moveOrder(c.id, 1)}
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      c.active
                        ? "bg-[#C8A96A]/20 text-[#C8A96A]"
                        : "bg-white/10 text-white/45"
                    }`}
                  >
                    {c.active ? "Ativa" : "Oculta"}
                  </span>
                </td>
                <td className="relative px-4 py-3">
                  <button
                    type="button"
                    className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold hover:border-[#C8A96A]"
                    onClick={() => setMenuId(menuId === c.id ? null : c.id)}
                  >
                    Menu
                  </button>
                  {menuId === c.id ? (
                    <div className="absolute right-4 z-20 mt-1 min-w-[150px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1c] shadow-2xl">
                      {(
                        [
                          ["Editar", () => openEdit(c)],
                          [
                            "Duplicar",
                            () => void apiAction("duplicate", c.id),
                          ],
                          [
                            c.active ? "Ocultar" : "Ativar",
                            () =>
                              void apiAction(c.active ? "hide" : "show", c.id),
                          ],
                          [
                            "Excluir",
                            () => {
                              setDeleteTarget(c);
                              setMoveToId(
                                rows.find((x) => x.id !== c.id)?.id || "",
                              );
                              setMenuId(null);
                            },
                          ],
                        ] as const
                      ).map(([label, fn]) => (
                        <button
                          key={label}
                          type="button"
                          className={`block w-full px-4 py-2.5 text-left text-[12px] hover:bg-white/5 ${
                            label === "Excluir" ? "text-red-300" : "text-white/80"
                          }`}
                          onClick={fn}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-white/40">
                  Nenhuma categoria encontrada.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminModal
        open={formOpen}
        title={form.id ? "Editar Categoria" : "Criar Categoria"}
        onClose={() => setFormOpen(false)}
        wide
      >
        <div className="space-y-3">
          <label className="block">
            <span className={adminLabel}>Nome</span>
            <input
              className={adminInput}
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  slug: f.id ? f.slug : slugify(name),
                }));
              }}
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Slug</span>
            <input
              className={adminInput}
              value={form.slug || ""}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={adminLabel}>Categoria Pai</span>
            <select
              className={adminInput}
              value={form.parentId || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  parentId: e.target.value || null,
                }))
              }
            >
              <option value="" className="bg-[#0F0F10]">
                Nenhuma
              </option>
              {rows
                .filter((c) => c.id !== form.id)
                .map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0F0F10]">
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className={adminLabel}>Ordem</span>
            <input
              type="number"
              className={adminInput}
              value={form.order ?? 1}
              onChange={(e) =>
                setForm((f) => ({ ...f, order: Number(e.target.value) || 1 }))
              }
            />
          </label>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <ImageField
              label="Banner"
              value={form.banner}
              onChange={(url) => setForm((f) => ({ ...f, banner: url }))}
              folder="categorias"
              usedIn={`Categoria · ${form.name || "nova"}`}
            />
            <ImageField
              label="Ícone"
              value={form.icon}
              onChange={(url) => setForm((f) => ({ ...f, icon: url }))}
              folder="categorias"
              usedIn={`Categoria ícone · ${form.name || "nova"}`}
            />
            <ImageField
              label="Imagem"
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
              folder="categorias"
              usedIn={`Categoria imagem · ${form.name || "nova"}`}
            />
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
              SEO
            </p>
            <label className="mb-2 block">
              <span className={adminLabel}>Título</span>
              <input
                className={adminInput}
                value={form.seoTitle || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seoTitle: e.target.value }))
                }
              />
            </label>
            <label className="mb-2 block">
              <span className={adminLabel}>Descrição</span>
              <textarea
                className={adminInput}
                rows={2}
                value={form.seoDescription || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seoDescription: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Palavras-chave</span>
              <input
                className={adminInput}
                value={form.seoKeywords || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seoKeywords: e.target.value }))
                }
              />
            </label>
            <label className="mt-2 block">
              <span className={adminLabel}>Imagem social (OG)</span>
              <input
                className={adminInput}
                value={form.ogImage || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ogImage: e.target.value }))
                }
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-[13px]">
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
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="accent-[#C8A96A]"
            />
            Categoria ativa / visível
          </label>
          <button type="button" className={adminBtn} onClick={() => void saveForm()}>
            Salvar categoria
          </button>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        title="Excluir Categoria"
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget ? (
          <div className="space-y-4 text-[13px] text-white/80">
            {deleteTarget.productCount > 0 ? (
              <>
                <p>
                  Esta categoria possui{" "}
                  <strong className="text-[#C8A96A]">
                    {deleteTarget.productCount} produtos
                  </strong>
                  .
                </p>
                <p>Deseja mover esses produtos para outra categoria?</p>
                <label className="block">
                  <span className={adminLabel}>Selecionar nova categoria</span>
                  <select
                    className={adminInput}
                    value={moveToId}
                    onChange={(e) => setMoveToId(e.target.value)}
                  >
                    {rows
                      .filter((c) => c.id !== deleteTarget.id)
                      .map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0F0F10]">
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            ) : (
              <p>Confirma a exclusão de “{deleteTarget.name}”?</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-bold uppercase"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              {deleteTarget.productCount > 0 ? (
                <button
                  type="button"
                  className={adminBtn}
                  onClick={() => void confirmDelete("move")}
                >
                  Mover e Excluir
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-red-400/40 px-4 py-2 text-[11px] font-bold uppercase text-red-300"
                onClick={() => void confirmDelete("force")}
              >
                Excluir Mesmo Assim
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </AdminShell>
  );
}
