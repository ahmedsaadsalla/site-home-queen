"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { IconChevron } from "@/components/icons";
import type { HeroSlide } from "@/data/admin";

const fallbackSlides: HeroSlide[] = [
  {
    id: "slide_1",
    imageDesktop:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1920&q=80",
    imageMobile:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80",
    eyebrow: "Conforto que transforma",
    title: "Excelência em cada detalhe",
    subtitle:
      "Tecnologia de ponta e materiais selecionados para o descanso perfeito da sua família.",
    cta1Label: "Comprar agora",
    cta1Href: "/#nosso-catalogo",
    cta2Label: "Fazer orçamento",
    cta2Href: "/orcamento",
    order: 1,
    durationMs: 6000,
    active: true,
  },
];

export function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [index, setIndex] = useState(0);

  const activeSlides = useMemo(
    () =>
      [...slides]
        .filter((s) => s.active)
        .sort((a, b) => a.order - b.order),
    [slides],
  );

  const slide = activeSlides[index] ?? activeSlides[0] ?? fallbackSlides[0];

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        const fromCms: HeroSlide[] = cms?.home?.slides || [];
        if (fromCms.length) {
          setSlides(fromCms);
          return;
        }
        if (cms?.home?.heroTitle) {
          setSlides((prev) => {
            const next = [...prev];
            next[0] = {
              ...next[0],
              title: cms.home.heroTitle || next[0].title,
              subtitle: cms.home.heroSubtitle || next[0].subtitle,
              imageDesktop: cms.home.heroImage || next[0].imageDesktop,
              imageMobile: cms.home.heroImage || next[0].imageMobile,
              cta1Label: cms.home.heroCta || next[0].cta1Label,
            };
            return next;
          });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const ms = slide?.durationMs || 6000;
    const t = window.setTimeout(() => {
      setIndex((i) => (i + 1) % activeSlides.length);
    }, ms);
    return () => window.clearTimeout(t);
  }, [index, activeSlides.length, slide?.durationMs]);

  useEffect(() => {
    setIndex(0);
  }, [activeSlides.length]);

  function goTo(next: number) {
    if (!activeSlides.length) return;
    setIndex((next + activeSlides.length) % activeSlides.length);
  }

  const imageSrc = slide.imageDesktop || slide.imageMobile || "/hero-home-queen.jpg";

  return (
    <section className="relative min-h-[280px] overflow-hidden bg-black text-white sm:min-h-[300px]">
      <Image
        key={imageSrc}
        src={imageSrc}
        alt={slide.title ? `${slide.title} — Home Queen` : "Home Queen — camas box premium"}
        title={slide.title || "Home Queen"}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* Mobile-specific image overlay via CSS background when different */}
      {slide.imageMobile && slide.imageMobile !== slide.imageDesktop ? (
        <div
          className="absolute inset-0 bg-cover bg-center md:hidden"
          style={{ backgroundImage: `url(${slide.imageMobile})` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      <div className="relative z-10 mx-auto flex min-h-[300px] max-w-[1240px] items-end px-5 pb-14 pt-8 sm:min-h-[320px] sm:items-center sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
        <div className="w-full max-w-[480px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C5A059] sm:text-[11px]">
            {slide.eyebrow}
          </p>
          <h1 className="font-display mt-2 text-[26px] leading-[1.15] sm:mt-3 sm:text-[34px] lg:text-[38px]">
            {slide.title}
          </h1>
          <p className="mt-3 text-[13px] leading-6 text-white/75 sm:mt-5 sm:text-[14px] sm:leading-7">
            {slide.subtitle}
          </p>
          <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <a
              href={slide.cta1Href || "/#nosso-catalogo"}
              className="relative z-20 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a] sm:w-auto"
            >
              {slide.cta1Label || "Comprar agora"}
              <IconChevron className="h-3.5 w-3.5" />
            </a>
            <a
              href={slide.cta2Href || "/orcamento"}
              className="inline-flex w-full items-center justify-center rounded-md border border-white/50 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059] sm:w-auto"
            >
              {slide.cta2Label || "Fazer orçamento"}
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white/80 backdrop-blur-sm transition hover:border-[#C5A059] hover:text-[#C5A059] lg:flex"
        aria-label="Slide anterior"
      >
        <IconChevron direction="left" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white/80 backdrop-blur-sm transition hover:border-[#C5A059] hover:text-[#C5A059] lg:flex"
        aria-label="Próximo slide"
      >
        <IconChevron direction="right" className="h-4 w-4" />
      </button>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-8 bg-[#C5A059]" : "w-2 bg-white/40"
            }`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
