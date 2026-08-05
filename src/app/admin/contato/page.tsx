"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageField } from "@/components/admin/ImageField";
import {
  SiteEditorTabs,
  SiteField,
  SiteSaveBar,
  siteInput,
  siteTextarea,
} from "@/components/admin/SiteEditor";
import type { ContactPageCms, PageMediaBundle } from "@/data/admin";
import {
  DEFAULT_CONTACT_SETTINGS,
  type ContactSettings,
} from "@/data/contact";

export default function AdminContatoPage() {
  const [media, setMedia] = useState<PageMediaBundle>({});
  const [page, setPage] = useState<ContactPageCms | null>(null);
  const [settings, setSettings] = useState<ContactSettings>(
    DEFAULT_CONTACT_SETTINGS,
  );
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/cms").then((r) => r.json()),
      fetch("/api/contato/settings").then((r) => r.json()),
    ]).then(([cms, s]) => {
      setMedia(cms.pageMedia?.contact || {});
      setPage(cms.contactPage);
      setSettings({ ...DEFAULT_CONTACT_SETTINGS, ...(s as ContactSettings) });
    });
  }, []);

  async function saveAll() {
    if (!page) return;
    setBusy(true);
    setMsg("");
    try {
      const cmsRes = await fetch("/api/admin/cms");
      const cms = await cmsRes.json();
      const pageMedia = { ...(cms.pageMedia || {}), contact: media };

      const [r1, r2, r3] = await Promise.all([
        fetch("/api/admin/cms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "pageMedia",
            data: pageMedia,
            action: "Contato mídias",
            detail: "Imagens contato",
          }),
        }),
        fetch("/api/admin/cms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "contactPage",
            data: page,
            action: "Contato textos",
            detail: "Textos da página contato",
          }),
        }),
        fetch("/api/contato/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }),
      ]);
      if (!r1.ok || !r2.ok || !r3.ok) throw new Error("fail");
      setMsg("Salvo! Textos, fotos e dados de contato.");
    } catch {
      setMsg("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (!page) {
    return (
      <AdminShell title="Contato">
        <p className="text-white/50">Carregando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Editar Contato"
      subtitle="Textos, banners, fotos e telefones — cada campo separado"
    >
      <Link
        href="/admin/site"
        className="mb-4 inline-block text-[12px] text-white/45 hover:text-[#C8A96A]"
      >
        ← Todas as páginas
      </Link>

      <SiteEditorTabs
        tabs={[
          {
            id: "textos",
            label: "1. Textos da página",
            content: (
              <div className="max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#151515] p-5">
                <SiteField label="Título do banner">
                  <input
                    className={siteInput}
                    value={page.heroTitle}
                    onChange={(e) =>
                      setPage({ ...page, heroTitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Subtítulo do banner">
                  <textarea
                    className={siteTextarea}
                    value={page.heroSubtitle}
                    onChange={(e) =>
                      setPage({ ...page, heroSubtitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Título do formulário">
                  <input
                    className={siteInput}
                    value={page.formTitle}
                    onChange={(e) =>
                      setPage({ ...page, formTitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Texto do formulário">
                  <textarea
                    className={siteTextarea}
                    value={page.formSubtitle}
                    onChange={(e) =>
                      setPage({ ...page, formSubtitle: e.target.value })
                    }
                  />
                </SiteField>
              </div>
            ),
          },
          {
            id: "fotos",
            label: "2. Banners e fotos",
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                <ImageField
                  label="Banner da página"
                  value={media.banner}
                  onChange={(url) => setMedia({ ...media, banner: url })}
                  folder="contato"
                  usedIn="Contato · Banner"
                />
                <ImageField
                  label="Foto da fachada"
                  value={media.facade}
                  onChange={(url) => setMedia({ ...media, facade: url })}
                  folder="contato"
                  usedIn="Contato · Fachada"
                />
                <ImageField
                  label="Imagem do mapa"
                  value={media.mapImage}
                  onChange={(url) => setMedia({ ...media, mapImage: url })}
                  folder="contato"
                  usedIn="Contato · Mapa"
                />
              </div>
            ),
          },
          {
            id: "dados",
            label: "3. Telefones e e-mails",
            content: (
              <div className="max-w-2xl space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                {(
                  [
                    ["phoneCommercial", "Telefone comercial"],
                    ["phoneSales", "Telefone vendas"],
                    ["phoneWholesale", "Telefone atacado"],
                    ["whatsappDisplay", "WhatsApp (exibição)"],
                    ["whatsappNumber", "WhatsApp (número full)"],
                    ["emailSales", "E-mail comercial"],
                    ["emailSupport", "E-mail suporte"],
                    ["emailFinance", "E-mail financeiro"],
                    ["addressLine1", "Endereço linha 1"],
                    ["addressLine2", "Endereço linha 2"],
                    ["cep", "CEP"],
                    ["hoursWeekdays", "Horário semana"],
                    ["hoursSaturday", "Horário sábado"],
                    ["mapsQuery", "Busca do Google Maps"],
                    ["mapsEmbedUrl", "URL embed do mapa"],
                  ] as const
                ).map(([key, label]) => (
                  <SiteField key={key} label={label}>
                    <input
                      className={siteInput}
                      value={settings[key] || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  </SiteField>
                ))}
              </div>
            ),
          },
          {
            id: "faq",
            label: "4. FAQ",
            content: (
              <div className="max-w-2xl space-y-3">
                {(page.faq || []).map((item, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-2xl border border-white/10 bg-[#151515] p-4"
                  >
                    <SiteField label={`Pergunta ${i + 1}`}>
                      <input
                        className={siteInput}
                        value={item.q}
                        onChange={(e) => {
                          const faq = [...page.faq];
                          faq[i] = { ...item, q: e.target.value };
                          setPage({ ...page, faq });
                        }}
                      />
                    </SiteField>
                    <SiteField label="Resposta">
                      <textarea
                        className={siteTextarea}
                        value={item.a}
                        onChange={(e) => {
                          const faq = [...page.faq];
                          faq[i] = { ...item, a: e.target.value };
                          setPage({ ...page, faq });
                        }}
                      />
                    </SiteField>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-full bg-[#C8A96A] px-4 py-2 text-[12px] font-bold text-[#0F0F10]"
                  onClick={() =>
                    setPage({
                      ...page,
                      faq: [
                        ...(page.faq || []),
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
        ]}
      />

      <SiteSaveBar
        onSave={() => void saveAll()}
        busy={busy}
        msg={msg}
        previewHref="/contato"
      />
    </AdminShell>
  );
}
