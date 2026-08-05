"use client";

import { useEffect, useState } from "react";
import { EditContentPanel } from "@/components/admin/EditContentPanel";
import { ImageField } from "@/components/admin/ImageField";
import { adminBtn } from "@/components/admin/AdminCmsForm";
import type { PageMediaBundle } from "@/data/admin";
import type { MediaFolder } from "@/data/media";

type PageKey = "contact" | "footer" | "login" | "register" | "cart" | "favorites";

const SLOT_LABELS: Record<string, string> = {
  banner: "Banner",
  facade: "Foto da fachada",
  mapImage: "Mapa",
  background: "Imagem de fundo",
  sideBanner: "Banner lateral",
  logo: "Logo",
  footerBg: "Fundo do rodapé",
  socialIconPack: "Ícones sociais",
};

export function PageMediaEditor({
  pageKey,
  folder,
  slots,
  title,
}: {
  pageKey: PageKey;
  folder: MediaFolder;
  slots: Array<keyof PageMediaBundle>;
  title: string;
}) {
  const [media, setMedia] = useState<PageMediaBundle>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setMedia(cms.pageMedia?.[pageKey] || {}));
  }, [pageKey]);

  async function save() {
    const cmsRes = await fetch("/api/admin/cms");
    const cms = await cmsRes.json();
    const pageMedia = { ...(cms.pageMedia || {}), [pageKey]: media };
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "pageMedia",
        data: pageMedia,
        action: `Mídias ${pageKey}`,
        detail: title,
      }),
    });
    setMsg(res.ok ? "Imagens salvas." : "Erro ao salvar.");
  }

  return (
    <EditContentPanel title={title}>
      <div className="grid gap-4 lg:grid-cols-2">
        {slots.map((slot) => (
          <ImageField
            key={slot}
            label={SLOT_LABELS[slot] || String(slot)}
            value={media[slot]}
            onChange={(url) => setMedia({ ...media, [slot]: url })}
            folder={folder}
            usedIn={`${pageKey} · ${slot}`}
          />
        ))}
      </div>
      <button type="button" className={`${adminBtn} mt-3`} onClick={() => void save()}>
        Salvar imagens
      </button>
      {msg ? <p className="mt-2 text-[13px] text-[#C8A96A]">{msg}</p> : null}
    </EditContentPanel>
  );
}
