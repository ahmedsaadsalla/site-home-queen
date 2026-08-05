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
import type { FactoryCms } from "@/data/admin";

export default function AdminFactoryPage() {
  const [factory, setFactory] = useState<FactoryCms | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setFactory(cms.factory));
  }, []);

  async function save() {
    if (!factory) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "factory",
          data: factory,
          action: "Nossa Fábrica",
          detail: "Página fábrica atualizada",
        }),
      });
      if (!res.ok) throw new Error("fail");
      setMsg("Salvo! Já aparece no site.");
    } catch {
      setMsg("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  if (!factory) {
    return (
      <AdminShell title="Nossa Fábrica">
        <p className="text-white/50">Carregando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Editar Sobre / Fábrica"
      subtitle="Cada texto e foto da página /sobre em campo separado"
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
            label: "1. Textos",
            hint: "Títulos e textos institucionais.",
            content: (
              <div className="max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#151515] p-5">
                <SiteField label="Título da página">
                  <input
                    className={siteInput}
                    value={factory.title}
                    onChange={(e) =>
                      setFactory({ ...factory, title: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Subtítulo / chamada do banner">
                  <input
                    className={siteInput}
                    value={factory.subtitle || ""}
                    onChange={(e) =>
                      setFactory({ ...factory, subtitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="História">
                  <textarea
                    className={siteTextarea}
                    value={factory.history}
                    onChange={(e) =>
                      setFactory({ ...factory, history: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Missão">
                  <textarea
                    className={siteTextarea}
                    value={factory.mission}
                    onChange={(e) =>
                      setFactory({ ...factory, mission: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Visão">
                  <textarea
                    className={siteTextarea}
                    value={factory.vision}
                    onChange={(e) =>
                      setFactory({ ...factory, vision: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Valores">
                  <textarea
                    className={siteTextarea}
                    value={factory.values}
                    onChange={(e) =>
                      setFactory({ ...factory, values: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField
                  label="Linhas de produtos (uma por linha)"
                  help="Ex.: Camas Box"
                >
                  <textarea
                    className={siteTextarea}
                    value={(factory.lines || []).join("\n")}
                    onChange={(e) =>
                      setFactory({
                        ...factory,
                        lines: e.target.value
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
            id: "blocos",
            label: "2. Diferenciais e processo",
            content: (
              <div className="max-w-3xl space-y-6">
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                  <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">
                    Diferenciais
                  </p>
                  {(factory.differentials || []).map((item, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <SiteField label={`Card ${i + 1} — título`}>
                        <input
                          className={siteInput}
                          value={item.title}
                          onChange={(e) => {
                            const differentials = [...factory.differentials];
                            differentials[i] = {
                              ...item,
                              title: e.target.value,
                            };
                            setFactory({ ...factory, differentials });
                          }}
                        />
                      </SiteField>
                      <SiteField label="Texto">
                        <input
                          className={siteInput}
                          value={item.text}
                          onChange={(e) => {
                            const differentials = [...factory.differentials];
                            differentials[i] = {
                              ...item,
                              text: e.target.value,
                            };
                            setFactory({ ...factory, differentials });
                          }}
                        />
                      </SiteField>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                  <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">
                    Etapas do processo
                  </p>
                  {(factory.processSteps || []).map((step, i) => (
                    <div
                      key={i}
                      className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-3"
                    >
                      <SiteField label="Nº">
                        <input
                          className={siteInput}
                          value={step.n}
                          onChange={(e) => {
                            const processSteps = [...factory.processSteps];
                            processSteps[i] = { ...step, n: e.target.value };
                            setFactory({ ...factory, processSteps });
                          }}
                        />
                      </SiteField>
                      <SiteField label="Título">
                        <input
                          className={siteInput}
                          value={step.title}
                          onChange={(e) => {
                            const processSteps = [...factory.processSteps];
                            processSteps[i] = {
                              ...step,
                              title: e.target.value,
                            };
                            setFactory({ ...factory, processSteps });
                          }}
                        />
                      </SiteField>
                      <SiteField label="Texto">
                        <input
                          className={siteInput}
                          value={step.text}
                          onChange={(e) => {
                            const processSteps = [...factory.processSteps];
                            processSteps[i] = {
                              ...step,
                              text: e.target.value,
                            };
                            setFactory({ ...factory, processSteps });
                          }}
                        />
                      </SiteField>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                  <p className="text-[11px] font-semibold uppercase text-[#C8A96A]">
                    CTA final
                  </p>
                  <SiteField label="Título">
                    <input
                      className={siteInput}
                      value={factory.ctaTitle || ""}
                      onChange={(e) =>
                        setFactory({ ...factory, ctaTitle: e.target.value })
                      }
                    />
                  </SiteField>
                  <SiteField label="Texto">
                    <textarea
                      className={siteTextarea}
                      value={factory.ctaText || ""}
                      onChange={(e) =>
                        setFactory({ ...factory, ctaText: e.target.value })
                      }
                    />
                  </SiteField>
                  <SiteField label="Botão">
                    <input
                      className={siteInput}
                      value={factory.ctaButton || ""}
                      onChange={(e) =>
                        setFactory({ ...factory, ctaButton: e.target.value })
                      }
                    />
                  </SiteField>
                </div>
              </div>
            ),
          },
          {
            id: "fotos",
            label: "3. Banners e fotos",
            hint: "Cada imagem em campo separado.",
            content: (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <ImageField
                    label="Banner principal da página"
                    value={factory.banner}
                    onChange={(url) => setFactory({ ...factory, banner: url })}
                    folder="fabrica"
                    usedIn="Fábrica · Banner"
                  />
                  <ImageField
                    label="Foto da história"
                    value={factory.historyImage}
                    onChange={(url) =>
                      setFactory({ ...factory, historyImage: url })
                    }
                    folder="fabrica"
                    usedIn="Fábrica · História"
                  />
                </div>
                <GalleryField
                  label="Galeria principal"
                  value={factory.gallery || []}
                  onChange={(urls) => setFactory({ ...factory, gallery: urls })}
                  folder="fabrica"
                  usedIn="Fábrica · Galeria"
                />
                <GalleryField
                  label="Fotos de produção"
                  value={factory.productionPhotos || []}
                  onChange={(urls) =>
                    setFactory({ ...factory, productionPhotos: urls })
                  }
                  folder="fabrica"
                  usedIn="Fábrica · Produção"
                />
                <GalleryField
                  label="Fotos da equipe"
                  value={factory.teamPhotos || []}
                  onChange={(urls) =>
                    setFactory({ ...factory, teamPhotos: urls })
                  }
                  folder="fabrica"
                  usedIn="Fábrica · Equipe"
                />
                <GalleryField
                  label="Imagens da linha do tempo"
                  value={factory.timelineImages || []}
                  onChange={(urls) =>
                    setFactory({ ...factory, timelineImages: urls })
                  }
                  folder="fabrica"
                  usedIn="Fábrica · Timeline"
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
        previewHref="/sobre"
      />
    </AdminShell>
  );
}
