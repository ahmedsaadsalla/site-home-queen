"use client";

import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EditContentPanel } from "@/components/admin/EditContentPanel";
import { PageMediaEditor } from "@/components/admin/PageMediaEditor";
import type { PageMediaBundle } from "@/data/admin";
import type { MediaFolder } from "@/data/media";

type PageKey = "contact" | "footer" | "login" | "register" | "cart" | "favorites";

export function AdminModuleStub({
  title,
  subtitle,
  bullets,
  mediaPageKey,
  mediaFolder,
  mediaSlots,
  extra,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  mediaPageKey?: PageKey;
  mediaFolder?: MediaFolder;
  mediaSlots?: Array<keyof PageMediaBundle>;
  extra?: ReactNode;
}) {
  return (
    <AdminShell title={title} subtitle={subtitle}>
      {mediaPageKey && mediaFolder && mediaSlots ? (
        <PageMediaEditor
          pageKey={mediaPageKey}
          folder={mediaFolder}
          slots={mediaSlots}
          title={`Imagens · ${title}`}
        />
      ) : !extra ? (
        <EditContentPanel title={`Imagens · ${title}`}>
          <p className="text-[13px] text-white/55">
            Use a Biblioteca de Mídia para enviar arquivos e associe-os nos
            módulos de Site (Home, Produtos, Categorias, Banners).
          </p>
        </EditContentPanel>
      ) : null}
      {extra}
      <div className="rounded-2xl border border-white/10 bg-[#151515] p-6">
        <p className="text-[14px] text-white/70">
          Módulo operacional do painel Home Queen.
        </p>
        <ul className="mt-5 space-y-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-white/80"
            >
              <span className="mr-2 text-[#C8A96A]">●</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
