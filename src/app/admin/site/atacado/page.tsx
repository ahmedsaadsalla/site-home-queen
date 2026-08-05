"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { GalleryField, ImageField } from "@/components/admin/ImageField";
import {
  SiteEditorTabs,
  SiteField,
  SiteSaveBar,
  siteInput,
  siteTextarea,
} from "@/components/admin/SiteEditor";
import type { WholesaleCms } from "@/data/admin";

export default function AdminSiteAtacadoPage() {
  const [wholesale, setWholesale] = useState<WholesaleCms | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setWholesale(cms.wholesale));
  }, []);

  async function save() {
    if (!wholesale) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "wholesale",
          data: wholesale,
          action: "Atacado conteúdo",
          detail: "Textos e mídias do portal atacado",
        }),
      });
      if (!res.ok) throw new Error("fail");
      setMsg("Salvo! Já aparece no portal atacado.");
    } catch {
      setMsg("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (!wholesale) {
    return (
      <AdminShell title="Atacado">
        <p className="text-white/50">Carregando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Editar Atacado (textos e fotos)"
      subtitle="Conteúdo do portal do revendedor — campos separados"
    >
      <div className="mb-4 flex flex-wrap gap-3 text-[12px]">
        <Link href="/admin/site" className="text-white/45 hover:text-[#C8A96A]">
          ← Todas as páginas
        </Link>
        <Link
          href="/admin/atacado"
          className="rounded-full border border-[#C8A96A]/50 px-3 py-1.5 font-semibold text-[#C8A96A]"
        >
          Produtos / revendedores →
        </Link>
      </div>

      <SiteEditorTabs
        tabs={[
          {
            id: "textos",
            label: "1. Textos do banner",
            content: (
              <div className="max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#151515] p-5">
                <SiteField label="Título do banner">
                  <input
                    className={siteInput}
                    value={wholesale.bannerTitle}
                    onChange={(e) =>
                      setWholesale({
                        ...wholesale,
                        bannerTitle: e.target.value,
                      })
                    }
                  />
                </SiteField>
                <SiteField label="Texto do banner">
                  <textarea
                    className={siteTextarea}
                    value={wholesale.bannerText}
                    onChange={(e) =>
                      setWholesale({
                        ...wholesale,
                        bannerText: e.target.value,
                      })
                    }
                  />
                </SiteField>
                <SiteField label="Nota de pedido mínimo">
                  <input
                    className={siteInput}
                    value={wholesale.minOrderNote}
                    onChange={(e) =>
                      setWholesale({
                        ...wholesale,
                        minOrderNote: e.target.value,
                      })
                    }
                  />
                </SiteField>
                <SiteField label="Benefícios (um por linha)">
                  <textarea
                    className={siteTextarea}
                    value={(wholesale.benefits || []).join("\n")}
                    onChange={(e) =>
                      setWholesale({
                        ...wholesale,
                        benefits: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </SiteField>
              </div>
            ),
          },
          {
            id: "faq",
            label: "2. Perguntas (FAQ)",
            content: (
              <div className="max-w-2xl space-y-3">
                {(wholesale.faq || []).map((item, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-2xl border border-white/10 bg-[#151515] p-4"
                  >
                    <SiteField label={`Pergunta ${i + 1}`}>
                      <input
                        className={siteInput}
                        value={item.q}
                        onChange={(e) => {
                          const faq = [...wholesale.faq];
                          faq[i] = { ...item, q: e.target.value };
                          setWholesale({ ...wholesale, faq });
                        }}
                      />
                    </SiteField>
                    <SiteField label="Resposta">
                      <textarea
                        className={siteTextarea}
                        value={item.a}
                        onChange={(e) => {
                          const faq = [...wholesale.faq];
                          faq[i] = { ...item, a: e.target.value };
                          setWholesale({ ...wholesale, faq });
                        }}
                      />
                    </SiteField>
                    <button
                      type="button"
                      className="text-[11px] text-red-300"
                      onClick={() =>
                        setWholesale({
                          ...wholesale,
                          faq: wholesale.faq.filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-full bg-[#C8A96A] px-4 py-2 text-[12px] font-bold text-[#0F0F10]"
                  onClick={() =>
                    setWholesale({
                      ...wholesale,
                      faq: [
                        ...(wholesale.faq || []),
                        { q: "Nova pergunta?", a: "Resposta..." },
                      ],
                    })
                  }
                >
                  + Adicionar pergunta
                </button>
              </div>
            ),
          },
          {
            id: "fotos",
            label: "3. Fotos e banners",
            content: (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <ImageField
                    label="Imagem do banner"
                    value={wholesale.bannerImage}
                    onChange={(url) =>
                      setWholesale({ ...wholesale, bannerImage: url })
                    }
                    folder="atacado"
                    usedIn="Atacado · Banner"
                  />
                  <ImageField
                    label="Fundo da página"
                    value={wholesale.background}
                    onChange={(url) =>
                      setWholesale({ ...wholesale, background: url })
                    }
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
              </div>
            ),
          },
        ]}
      />

      <SiteSaveBar
        onSave={() => void save()}
        busy={busy}
        msg={msg}
        previewHref="/atacado"
      />
    </AdminShell>
  );
}
