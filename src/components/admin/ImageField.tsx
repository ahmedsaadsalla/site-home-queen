"use client";

import { useRef, useState } from "react";
import type { MediaFolder } from "@/data/media";
import { ImageCropModal } from "@/components/admin/ImageCropModal";

async function uploadFile(
  file: File,
  opts: {
    folder?: MediaFolder;
    usedIn?: string;
    productId?: string;
    categoryId?: string;
    rotate?: number;
  },
) {
  const fd = new FormData();
  fd.append("file", file);
  if (opts.folder) fd.append("folder", opts.folder);
  if (opts.usedIn) fd.append("usedIn", opts.usedIn);
  if (opts.productId) fd.append("productId", opts.productId);
  if (opts.categoryId) fd.append("categoryId", opts.categoryId);
  if (opts.rotate) fd.append("rotate", String(opts.rotate));
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Falha no upload");
  return data.asset.url as string;
}

export function ImageField({
  label,
  value,
  onChange,
  folder = "geral",
  usedIn,
  productId,
  categoryId,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: MediaFolder;
  usedIn?: string;
  productId?: string;
  categoryId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(file: File, rotate = 0) {
    setBusy(true);
    setErr("");
    try {
      const url = await uploadFile(file, {
        folder,
        usedIn,
        productId,
        categoryId,
        rotate,
      });
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  function remove() {
    if (!value) return;
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta imagem?\n\nEla poderá estar sendo utilizada em outras páginas.",
      )
    ) {
      return;
    }
    onChange("");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-white/40">Imagem Atual</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setPending(f);
        }}
        className={`mt-3 flex min-h-[140px] items-center justify-center overflow-hidden rounded-xl border border-dashed ${
          drag ? "border-[#C8A96A] bg-[#C8A96A]/10" : "border-white/15 bg-black/20"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="max-h-[180px] w-full object-contain" />
        ) : (
          <p className="px-4 text-center text-[12px] text-white/40">
            Arraste e solte uma imagem aqui
            <br />
            JPG, PNG, WEBP ou SVG
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {value ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] hover:border-[#C8A96A]"
          >
            Visualizar
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-[#C8A96A] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0F0F10]"
        >
          {busy ? "Enviando…" : value ? "Alterar" : "Selecionar"}
        </button>
        {value ? (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] hover:border-[#C8A96A]"
            >
              Cortar
            </button>
            <button
              type="button"
              onClick={remove}
              className="rounded-lg border border-red-400/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-300"
            >
              Remover
            </button>
          </>
        ) : null}
      </div>
      {err ? <p className="mt-2 text-[12px] text-red-300">{err}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setPending(f);
        }}
      />

      {pending ? (
        <ImageCropModal
          file={pending}
          onCancel={() => setPending(null)}
          onConfirm={({ file, rotate }) => void handleFile(file, rotate)}
        />
      ) : null}

      {previewOpen && value ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setPreviewOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}

export function GalleryField({
  label,
  value,
  onChange,
  folder = "geral",
  usedIn,
  productId,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: MediaFolder;
  usedIn?: string;
  productId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function addFiles(files: FileList | File[]) {
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, { folder, usedIn, productId });
        urls.push(url);
      }
      onChange([...value, ...urls]);
    } finally {
      setBusy(false);
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function removeAt(i: number) {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta imagem?\n\nEla poderá estar sendo utilizada em outras páginas.",
      )
    ) {
      return;
    }
    onChange(value.filter((_, idx) => idx !== i));
  }

  function setPrimary(i: number) {
    if (i === 0) return;
    const next = [...value];
    const [item] = next.splice(i, 1);
    onChange([item, ...next]);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
          {label}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-[#C8A96A] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0F0F10]"
        >
          {busy ? "Enviando…" : "Adicionar fotos"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
        }}
      >
        {value.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-[12px] text-white/40">
            Arraste imagens ou clique em Adicionar fotos
          </p>
        ) : (
          value.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-32 w-full object-cover" />
              <div className="flex flex-wrap gap-1 p-2">
                {i === 0 ? (
                  <span className="rounded bg-[#C8A96A] px-2 py-0.5 text-[10px] font-bold text-[#0F0F10]">
                    Principal
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className="rounded border border-white/15 px-2 py-0.5 text-[10px]"
                  >
                    Definir principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  className="rounded border border-white/15 px-2 py-0.5 text-[10px]"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  className="rounded border border-white/15 px-2 py-0.5 text-[10px]"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="rounded border border-red-400/30 px-2 py-0.5 text-[10px] text-red-300"
                >
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
