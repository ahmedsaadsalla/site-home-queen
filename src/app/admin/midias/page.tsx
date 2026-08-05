"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { MEDIA_FOLDERS, type MediaAsset, type MediaFolder } from "@/data/media";
import { adminBtn, adminInput } from "@/components/admin/AdminCmsForm";
import { ImageCropModal } from "@/components/admin/ImageCropModal";

export default function AdminMediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<MediaFolder | "">("");
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState<File | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (folder) params.set("folder", folder);
    const res = await fetch(`/api/admin/media?${params}`);
    const data = await res.json();
    setAssets(data.assets || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload(file: File, rotate = 0) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder || "geral");
    if (rotate) fd.append("rotate", String(rotate));
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setMsg("Upload concluído (WebP + miniatura gerados).");
      setPending(null);
      await load();
    } else setMsg(data.error || "Falha no upload");
  }

  async function rename(asset: MediaAsset) {
    const name = window.prompt("Novo nome do arquivo:", asset.name);
    if (!name) return;
    await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: asset.id, name }),
    });
    await load();
  }

  async function remove(asset: MediaAsset, force = false) {
    if (
      !force &&
      !window.confirm(
        "Tem certeza que deseja excluir esta imagem?\n\nEla poderá estar sendo utilizada em outras páginas.",
      )
    ) {
      return;
    }
    const res = await fetch(
      `/api/admin/media?id=${asset.id}${force ? "&force=1" : ""}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (res.status === 409) {
      const ok = window.confirm(
        `Esta imagem está em uso em:\n${(data.usedIn || []).join("\n")}\n\nExcluir mesmo assim?`,
      );
      if (ok) await remove(asset, true);
      return;
    }
    if (res.ok) {
      setMsg("Imagem excluída.");
      await load();
    } else setMsg(data.error || "Erro");
  }

  return (
    <AdminShell
      title="Biblioteca de Mídia"
      subtitle="Todas as imagens do site — busca, filtros e uso"
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className={`${adminInput} max-w-[240px]`}
          placeholder="Buscar imagens…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <select
          className={`${adminInput} max-w-[180px]`}
          value={folder}
          onChange={(e) => setFolder(e.target.value as MediaFolder | "")}
        >
          <option value="">Todas as pastas</option>
          {MEDIA_FOLDERS.map((f) => (
            <option key={f} value={f} className="bg-[#0F0F10]">
              {f}
            </option>
          ))}
        </select>
        <button type="button" className={adminBtn} onClick={() => void load()}>
          Filtrar
        </button>
        <label className={`${adminBtn} cursor-pointer`}>
          Enviar imagem
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setPending(f);
            }}
          />
        </label>
      </div>
      {msg ? <p className="mb-3 text-[13px] text-[#C8A96A]">{msg}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.length === 0 ? (
          <p className="col-span-full text-[13px] text-white/45">
            Nenhuma mídia ainda. Envie pela biblioteca ou pelos módulos.
          </p>
        ) : (
          assets.map((a) => (
            <div
              key={a.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#151515]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.thumbUrl || a.url}
                alt={a.name}
                className="h-36 w-full object-cover"
              />
              <div className="space-y-1 p-3 text-[12px]">
                <p className="truncate font-semibold text-[#F8F8F6]">{a.name}</p>
                <p className="text-white/40">
                  {a.folder}
                  {a.width ? ` · ${a.width}×${a.height}` : ""}
                </p>
                {a.usedIn.length ? (
                  <p className="text-[11px] text-[#C8A96A]">
                    Usada em: {a.usedIn.join(", ")}
                  </p>
                ) : (
                  <p className="text-[11px] text-white/35">Sem uso registrado</p>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-white/15 px-2 py-0.5 text-[10px]"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => void rename(a)}
                    className="rounded border border-white/15 px-2 py-0.5 text-[10px]"
                  >
                    Renomear
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(a)}
                    className="rounded border border-red-400/30 px-2 py-0.5 text-[10px] text-red-300"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pending ? (
        <ImageCropModal
          file={pending}
          onCancel={() => setPending(null)}
          onConfirm={({ file, rotate }) => void upload(file, rotate)}
        />
      ) : null}
    </AdminShell>
  );
}
