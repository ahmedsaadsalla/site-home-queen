"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CropRect = { left: number; top: number; width: number; height: number };

export function ImageCropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (payload: {
    file: File;
    rotate: number;
    crop?: CropRect;
  }) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState("");
  const [rotate, setRotate] = useState(0);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const apply = useCallback(() => {
    // Crop padrão: imagem inteira após rotação (resize/compress no servidor)
    onConfirm({ file, rotate });
  }, [file, rotate, onConfirm]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/15 bg-[#151515] p-5">
        <h3 className="font-display text-xl text-[#F8F8F6]">Cortar / Girar</h3>
        <p className="mt-1 text-[12px] text-white/45">
          Gire a imagem e confirme. Compressão e WebP são gerados no envio.
        </p>
        <div className="mt-4 flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-black/40">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt="Pré-visualização"
              style={{ transform: `rotate(${rotate}deg)`, maxHeight: 360 }}
              className="max-w-full object-contain"
              onLoad={(e) => {
                const el = e.currentTarget;
                setNatural({ w: el.naturalWidth, h: el.naturalHeight });
              }}
            />
          ) : null}
        </div>
        <p className="mt-2 text-[11px] text-white/40">
          {natural.w && natural.h ? `${natural.w}×${natural.h}px` : "…"} ·{" "}
          {(file.size / 1024).toFixed(0)} KB
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-2 text-[12px] hover:border-[#C8A96A]"
            onClick={() => setRotate((r) => (r + 90) % 360)}
          >
            Girar 90°
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-2 text-[12px] hover:border-[#C8A96A]"
            onClick={() => setRotate(0)}
          >
            Resetar
          </button>
          <div className="flex-1" />
          <button
            type="button"
            className="rounded-lg border border-white/15 px-4 py-2 text-[12px]"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#C8A96A] px-4 py-2 text-[12px] font-bold text-[#0F0F10]"
            onClick={apply}
          >
            Aplicar e enviar
          </button>
        </div>
      </div>
    </div>
  );
}
