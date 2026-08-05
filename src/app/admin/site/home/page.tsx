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
import type { HeroSlide, HomeCms } from "@/data/admin";

function emptySlide(order: number): HeroSlide {
  return {
    id: `slide_${Date.now().toString(36)}`,
    imageDesktop: "",
    imageMobile: "",
    eyebrow: "Home Queen",
    title: "Novo slide",
    subtitle: "",
    cta1Label: "Comprar agora",
    cta1Href: "/#nosso-catalogo",
    cta2Label: "Fazer orçamento",
    cta2Href: "/orcamento",
    order,
    durationMs: 6000,
    active: true,
  };
}

export default function AdminHomeCmsPage() {
  const [home, setHome] = useState<HomeCms | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [openSlide, setOpenSlide] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setHome(cms.home));
  }, []);

  async function save() {
    if (!home) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "home",
          data: home,
          action: "Editar Home",
          detail: "Home atualizada",
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

  if (!home) {
    return (
      <AdminShell title="Home">
        <p className="text-white/50">Carregando…</p>
      </AdminShell>
    );
  }

  const slides = [...(home.slides || [])].sort((a, b) => a.order - b.order);

  function patchSlide(id: string, patch: Partial<HeroSlide>) {
    setHome((h) =>
      h
        ? {
            ...h,
            slides: h.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          }
        : h,
    );
  }

  return (
    <AdminShell
      title="Editar Home"
      subtitle="Altere o que o visitante vê na página inicial"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/site"
          className="text-[12px] text-white/45 hover:text-[#C8A96A]"
        >
          ← Todas as páginas
        </Link>
        <Link
          href="/admin/site/numeros"
          className="rounded-full border border-[#C8A96A]/50 px-3 py-1.5 text-[11px] font-semibold text-[#C8A96A] hover:bg-[#C8A96A] hover:text-[#0F0F10]"
        >
          Editar números da home →
        </Link>
      </div>

      <SiteEditorTabs
        defaultTab="textos"
        tabs={[
          {
            id: "textos",
            label: "1. Textos",
            hint: "Títulos e frases principais da home.",
            content: (
              <div className="max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#151515] p-5">
                <SiteField label="Título principal (Hero)" help="Grande título no banner">
                  <input
                    className={siteInput}
                    value={home.heroTitle}
                    onChange={(e) => setHome({ ...home, heroTitle: e.target.value })}
                  />
                </SiteField>
                <SiteField label="Subtítulo" help="Frase curta abaixo do título">
                  <textarea
                    className={siteTextarea}
                    value={home.heroSubtitle}
                    onChange={(e) =>
                      setHome({ ...home, heroSubtitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Texto do botão">
                  <input
                    className={siteInput}
                    value={home.heroCta}
                    onChange={(e) => setHome({ ...home, heroCta: e.target.value })}
                  />
                </SiteField>
                <SiteField label="Título do catálogo">
                  <input
                    className={siteInput}
                    value={home.catalogTitle}
                    onChange={(e) =>
                      setHome({ ...home, catalogTitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Texto do catálogo">
                  <textarea
                    className={siteTextarea}
                    value={home.catalogSubtitle}
                    onChange={(e) =>
                      setHome({ ...home, catalogSubtitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Título da fábrica (bloco na home)">
                  <input
                    className={siteInput}
                    value={home.factoryTitle}
                    onChange={(e) =>
                      setHome({ ...home, factoryTitle: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Texto da fábrica">
                  <textarea
                    className={siteTextarea}
                    value={home.factoryText}
                    onChange={(e) =>
                      setHome({ ...home, factoryText: e.target.value })
                    }
                  />
                </SiteField>
                <SiteField label="Nota do rodapé">
                  <input
                    className={siteInput}
                    value={home.footerNote}
                    onChange={(e) =>
                      setHome({ ...home, footerNote: e.target.value })
                    }
                  />
                </SiteField>
                <div className="flex flex-wrap gap-5 pt-1 text-[13px]">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={home.testimonialsEnabled}
                      onChange={(e) =>
                        setHome({ ...home, testimonialsEnabled: e.target.checked })
                      }
                      className="accent-[#C8A96A]"
                    />
                    Mostrar depoimentos
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={home.partnersEnabled}
                      onChange={(e) =>
                        setHome({ ...home, partnersEnabled: e.target.checked })
                      }
                      className="accent-[#C8A96A]"
                    />
                    Mostrar parceiros
                  </label>
                </div>
              </div>
            ),
          },
          {
            id: "slides",
            label: "2. Banners / Slides",
            hint: "Cada slide é um banner do carrossel. Clique para abrir e editar.",
            content: (
              <div className="space-y-3">
                <button
                  type="button"
                  className="rounded-full bg-[#C8A96A] px-5 py-2.5 text-[12px] font-bold text-[#0F0F10]"
                  onClick={() => {
                    const s = emptySlide(home.slides.length + 1);
                    setHome({ ...home, slides: [...home.slides, s] });
                    setOpenSlide(s.id);
                  }}
                >
                  + Adicionar slide
                </button>
                {slides.map((slide, index) => {
                  const open = openSlide === slide.id;
                  return (
                    <div
                      key={slide.id}
                      className="rounded-2xl border border-white/10 bg-[#151515] overflow-hidden"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
                        onClick={() => setOpenSlide(open ? null : slide.id)}
                      >
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-black/40">
                          {slide.imageDesktop ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={slide.imageDesktop}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[#F8F8F6]">
                            Slide {index + 1}: {slide.title || "Sem título"}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {slide.active ? "Visível" : "Oculto"} · clique para editar
                          </p>
                        </div>
                        <span className="text-[#C8A96A]">{open ? "−" : "+"}</span>
                      </button>
                      {open ? (
                        <div className="space-y-3 border-t border-white/10 p-4">
                          <div className="grid gap-3 lg:grid-cols-2">
                            <ImageField
                              label="Foto do banner (desktop)"
                              value={slide.imageDesktop}
                              onChange={(url) =>
                                patchSlide(slide.id, { imageDesktop: url })
                              }
                              folder="banners"
                              usedIn={`Home slide ${index + 1}`}
                            />
                            <ImageField
                              label="Foto no celular (opcional)"
                              value={slide.imageMobile}
                              onChange={(url) =>
                                patchSlide(slide.id, { imageMobile: url })
                              }
                              folder="banners"
                              usedIn={`Home slide ${index + 1} mobile`}
                            />
                          </div>
                          <SiteField label="Título do slide">
                            <input
                              className={siteInput}
                              value={slide.title}
                              onChange={(e) =>
                                patchSlide(slide.id, { title: e.target.value })
                              }
                            />
                          </SiteField>
                          <SiteField label="Texto do slide">
                            <textarea
                              className={siteTextarea}
                              value={slide.subtitle}
                              onChange={(e) =>
                                patchSlide(slide.id, { subtitle: e.target.value })
                              }
                            />
                          </SiteField>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <SiteField label="Botão 1 — texto">
                              <input
                                className={siteInput}
                                value={slide.cta1Label}
                                onChange={(e) =>
                                  patchSlide(slide.id, {
                                    cta1Label: e.target.value,
                                  })
                                }
                              />
                            </SiteField>
                            <SiteField label="Botão 1 — link">
                              <input
                                className={siteInput}
                                value={slide.cta1Href}
                                onChange={(e) =>
                                  patchSlide(slide.id, {
                                    cta1Href: e.target.value,
                                  })
                                }
                              />
                            </SiteField>
                            <SiteField label="Botão 2 — texto">
                              <input
                                className={siteInput}
                                value={slide.cta2Label}
                                onChange={(e) =>
                                  patchSlide(slide.id, {
                                    cta2Label: e.target.value,
                                  })
                                }
                              />
                            </SiteField>
                            <SiteField label="Botão 2 — link">
                              <input
                                className={siteInput}
                                value={slide.cta2Href}
                                onChange={(e) =>
                                  patchSlide(slide.id, {
                                    cta2Href: e.target.value,
                                  })
                                }
                              />
                            </SiteField>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              className="rounded-full border border-white/15 px-3 py-1.5 text-[11px]"
                              onClick={() =>
                                patchSlide(slide.id, { active: !slide.active })
                              }
                            >
                              {slide.active ? "Ocultar slide" : "Mostrar slide"}
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-red-400/30 px-3 py-1.5 text-[11px] text-red-300"
                              onClick={() => {
                                if (!window.confirm("Excluir este slide?")) return;
                                setHome({
                                  ...home,
                                  slides: home.slides.filter(
                                    (s) => s.id !== slide.id,
                                  ),
                                });
                                setOpenSlide(null);
                              }}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ),
          },
          {
            id: "imagens",
            label: "3. Outras imagens",
            hint: "Logo, parceiros e fotos extras da home.",
            content: (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <ImageField
                    label="Logo"
                    value={home.logo}
                    onChange={(url) => setHome({ ...home, logo: url })}
                    folder="home"
                    usedIn="Home · Logo"
                  />
                  <ImageField
                    label="Imagem de apoio do Hero"
                    value={home.heroImage}
                    onChange={(url) => setHome({ ...home, heroImage: url })}
                    folder="home"
                    usedIn="Home · Hero"
                  />
                  <ImageField
                    label="Fundo do rodapé (imagem)"
                    value={home.footerBg}
                    onChange={(url) => setHome({ ...home, footerBg: url })}
                    folder="home"
                    usedIn="Home · Fundo rodapé"
                  />
                </div>
                <GalleryField
                  label="Parceiros (logos)"
                  value={home.partnersLogos || []}
                  onChange={(urls) => setHome({ ...home, partnersLogos: urls })}
                  folder="home"
                  usedIn="Home · Parceiros"
                />
                <GalleryField
                  label="Fotos de depoimentos"
                  value={home.testimonialPhotos || []}
                  onChange={(urls) =>
                    setHome({ ...home, testimonialPhotos: urls })
                  }
                  folder="home"
                  usedIn="Home · Depoimentos"
                />
                <GalleryField
                  label="Imagens de diferenciais"
                  value={home.differentialImages || []}
                  onChange={(urls) =>
                    setHome({ ...home, differentialImages: urls })
                  }
                  folder="home"
                  usedIn="Home · Diferenciais"
                />
              </div>
            ),
          },
          {
            id: "beneficios",
            label: "4. Benefícios",
            hint: "Os 4 blocos escuros logo abaixo do banner.",
            content: (
              <div className="space-y-3">
                {(home.benefits || []).map((item, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-[#151515] p-4 sm:grid-cols-2"
                  >
                    <SiteField label={`Benefício ${i + 1} — título`}>
                      <input
                        className={siteInput}
                        value={item.title}
                        onChange={(e) => {
                          const benefits = [...home.benefits];
                          benefits[i] = { ...item, title: e.target.value };
                          setHome({ ...home, benefits });
                        }}
                      />
                    </SiteField>
                    <SiteField label="Texto">
                      <input
                        className={siteInput}
                        value={item.description}
                        onChange={(e) => {
                          const benefits = [...home.benefits];
                          benefits[i] = {
                            ...item,
                            description: e.target.value,
                          };
                          setHome({ ...home, benefits });
                        }}
                      />
                    </SiteField>
                  </div>
                ))}
              </div>
            ),
          },
          {
            id: "secoes",
            label: "5. Outras seções",
            hint: "Destaques, porque escolher, atacado e depoimentos.",
            content: (
              <div className="max-w-3xl space-y-6">
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C8A96A]">
                    Destaques
                  </p>
                  <SiteField label="Título">
                    <input
                      className={siteInput}
                      value={home.featuredTitle || ""}
                      onChange={(e) =>
                        setHome({ ...home, featuredTitle: e.target.value })
                      }
                    />
                  </SiteField>
                  <SiteField label="Subtítulo">
                    <input
                      className={siteInput}
                      value={home.featuredSubtitle || ""}
                      onChange={(e) =>
                        setHome({ ...home, featuredSubtitle: e.target.value })
                      }
                    />
                  </SiteField>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C8A96A]">
                    Porque escolher
                  </p>
                  <SiteField label="Título da seção">
                    <input
                      className={siteInput}
                      value={home.whyChooseTitle || ""}
                      onChange={(e) =>
                        setHome({ ...home, whyChooseTitle: e.target.value })
                      }
                    />
                  </SiteField>
                  {(home.whyChooseItems || []).map((item, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      <SiteField label={`Card ${i + 1} — título`}>
                        <input
                          className={siteInput}
                          value={item.title}
                          onChange={(e) => {
                            const whyChooseItems = [...home.whyChooseItems];
                            whyChooseItems[i] = {
                              ...item,
                              title: e.target.value,
                            };
                            setHome({ ...home, whyChooseItems });
                          }}
                        />
                      </SiteField>
                      <SiteField label="Texto">
                        <input
                          className={siteInput}
                          value={item.text}
                          onChange={(e) => {
                            const whyChooseItems = [...home.whyChooseItems];
                            whyChooseItems[i] = {
                              ...item,
                              text: e.target.value,
                            };
                            setHome({ ...home, whyChooseItems });
                          }}
                        />
                      </SiteField>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C8A96A]">
                    Bloco atacado (home)
                  </p>
                  <SiteField label="Título">
                    <input
                      className={siteInput}
                      value={home.wholesaleCtaTitle || ""}
                      onChange={(e) =>
                        setHome({ ...home, wholesaleCtaTitle: e.target.value })
                      }
                    />
                  </SiteField>
                  <SiteField label="Texto">
                    <textarea
                      className={siteTextarea}
                      value={home.wholesaleCtaText || ""}
                      onChange={(e) =>
                        setHome({ ...home, wholesaleCtaText: e.target.value })
                      }
                    />
                  </SiteField>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SiteField label="Botão 1">
                      <input
                        className={siteInput}
                        value={home.wholesaleCtaButton1 || ""}
                        onChange={(e) =>
                          setHome({
                            ...home,
                            wholesaleCtaButton1: e.target.value,
                          })
                        }
                      />
                    </SiteField>
                    <SiteField label="Botão 2">
                      <input
                        className={siteInput}
                        value={home.wholesaleCtaButton2 || ""}
                        onChange={(e) =>
                          setHome({
                            ...home,
                            wholesaleCtaButton2: e.target.value,
                          })
                        }
                      />
                    </SiteField>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#151515] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C8A96A]">
                    Depoimentos
                  </p>
                  <SiteField label="Título da seção">
                    <input
                      className={siteInput}
                      value={home.testimonialsTitle || ""}
                      onChange={(e) =>
                        setHome({ ...home, testimonialsTitle: e.target.value })
                      }
                    />
                  </SiteField>
                  <SiteField label="Título parceiros">
                    <input
                      className={siteInput}
                      value={home.partnersTitle || ""}
                      onChange={(e) =>
                        setHome({ ...home, partnersTitle: e.target.value })
                      }
                    />
                  </SiteField>
                  {(home.testimonials || []).map((item, i) => (
                    <div
                      key={i}
                      className="space-y-2 border-t border-white/10 pt-3"
                    >
                      <p className="text-[12px] text-white/40">
                        Depoimento {i + 1}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          className={siteInput}
                          placeholder="Nome"
                          value={item.name}
                          onChange={(e) => {
                            const testimonials = [...home.testimonials];
                            testimonials[i] = {
                              ...item,
                              name: e.target.value,
                            };
                            setHome({ ...home, testimonials });
                          }}
                        />
                        <input
                          className={siteInput}
                          placeholder="Cidade"
                          value={item.city}
                          onChange={(e) => {
                            const testimonials = [...home.testimonials];
                            testimonials[i] = {
                              ...item,
                              city: e.target.value,
                            };
                            setHome({ ...home, testimonials });
                          }}
                        />
                      </div>
                      <textarea
                        className={siteTextarea}
                        placeholder="Texto do depoimento"
                        value={item.text}
                        onChange={(e) => {
                          const testimonials = [...home.testimonials];
                          testimonials[i] = { ...item, text: e.target.value };
                          setHome({ ...home, testimonials });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
        ]}
      />

      <SiteSaveBar
        onSave={() => void save()}
        busy={busy}
        msg={msg}
        previewHref="/"
      />
    </AdminShell>
  );
}
