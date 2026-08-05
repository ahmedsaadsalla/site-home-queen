"use client";

import { useEffect, useState } from "react";
import { AdminCmsForm } from "@/components/admin/AdminCmsForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminWholesaleCatalog } from "@/components/admin/AdminWholesaleCatalog";
import { AdminWholesaleView } from "@/components/AdminWholesaleView";
import { EditContentPanel } from "@/components/admin/EditContentPanel";
import { GalleryField, ImageField } from "@/components/admin/ImageField";
import { adminBtn } from "@/components/admin/AdminCmsForm";
import type { WholesaleCms } from "@/data/admin";

export default function AdminAtacadoPage() {
  const [wholesale, setWholesale] = useState<WholesaleCms | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setWholesale(cms.wholesale));
  }, []);

  async function saveMedia() {
    if (!wholesale) return;
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "wholesale",
        data: wholesale,
        action: "Atacado mídias",
        detail: "Imagens do portal atacado",
      }),
    });
    setMsg(res.ok ? "Mídias do atacado salvas." : "Erro.");
  }

  return (
    <AdminShell
      title="Atacado"
      subtitle="Catálogo, conteúdo do portal e aprovação de revendedores"
    >
      <AdminWholesaleCatalog />
      {wholesale ? (
        <EditContentPanel title="Imagens do portal Atacado">
          <div className="grid gap-4 lg:grid-cols-2">
            <ImageField
              label="Banner"
              value={wholesale.bannerImage}
              onChange={(url) => setWholesale({ ...wholesale, bannerImage: url })}
              folder="atacado"
              usedIn="Atacado · Banner"
            />
            <ImageField
              label="Fundo da página"
              value={wholesale.background}
              onChange={(url) => setWholesale({ ...wholesale, background: url })}
              folder="atacado"
              usedIn="Atacado · Fundo"
            />
          </div>
          <GalleryField
            label="Imagens dos benefícios"
            value={wholesale.benefitImages || []}
            onChange={(urls) =>
              setWholesale({ ...wholesale, benefitImages: urls })
            }
            folder="atacado"
            usedIn="Atacado · Benefícios"
          />
          <GalleryField
            label="Logos de parceiros"
            value={wholesale.partnerLogos || []}
            onChange={(urls) =>
              setWholesale({ ...wholesale, partnerLogos: urls })
            }
            folder="atacado"
            usedIn="Atacado · Parceiros"
          />
          <button type="button" className={adminBtn} onClick={() => void saveMedia()}>
            Salvar imagens
          </button>
          {msg ? <p className="mt-2 text-[13px] text-[#C8A96A]">{msg}</p> : null}
        </EditContentPanel>
      ) : null}

      <div className="mb-8">
        <AdminCmsForm
          bare
          title="Conteúdo do portal Atacado"
          subtitle="Banner, benefícios e pedido mínimo"
          section="wholesale"
          fields={[
            { key: "bannerTitle", label: "Título do banner" },
            { key: "bannerText", label: "Texto do banner", type: "textarea" },
            { key: "minOrderNote", label: "Nota de pedido mínimo" },
            {
              key: "benefits",
              label: "Benefícios (um por linha)",
              type: "textarea",
            },
          ]}
        />
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#F8F8F6] text-[#0F0F10]">
        <AdminWholesaleView />
      </div>
    </AdminShell>
  );
}
