"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const defaultPhotos = [
  {
    src: "/fabrica/cama-01.jpg",
    alt: "Produção de camas box na fábrica Home Queen",
  },
  {
    src: "/fabrica/cama-02.jpg",
    alt: "Acabamento e costura premium",
  },
  {
    src: "/fabrica/cama-03.jpg",
    alt: "Linha de produção de colchões",
  },
  {
    src: "/fabrica/cama-04.jpg",
    alt: "Controle de qualidade na fábrica",
  },
  {
    src: "/fabrica/cama-05.jpg",
    alt: "Estrutura e montagem Home Queen",
  },
];

export function FactorySection() {
  const [active, setActive] = useState(0);
  const [title, setTitle] = useState("Conheça nossa fábrica");
  const [text, setText] = useState(
    "Processos modernos, controle de qualidade e produção própria para entregar conforto premium com excelência em cada detalhe.",
  );
  const [factoryPhotos, setFactoryPhotos] = useState(defaultPhotos);
  const current = factoryPhotos[active] ?? factoryPhotos[0];

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (cms?.home?.factoryTitle) setTitle(cms.home.factoryTitle);
        if (cms?.home?.factoryText) setText(cms.home.factoryText);
        const gallery: string[] = cms?.factory?.gallery || [];
        if (gallery.length) {
          setFactoryPhotos(
            gallery.map((src, i) => ({
              src,
              alt: defaultPhotos[i]?.alt || `Galeria fábrica ${i + 1}`,
            })),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <section
      id="fabrica"
      className="relative overflow-hidden bg-[#EEEEEE] py-12 text-[#0F0F10] sm:py-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(197,160,89,0.12),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(197,160,89,0.08),transparent_45%)]"
      />

      <div className="relative mx-auto max-w-[980px] px-5 lg:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div>
            {/* Logo sem fundo — PNG transparente */}
            <Logo className="h-auto w-[120px] bg-transparent object-contain sm:w-[145px] lg:w-[160px]" />

            <h2 className="font-display mt-4 text-[22px] leading-tight text-[#0F0F10] sm:mt-5 sm:text-[28px]">
              {title.includes("fábrica") ? (
                <>
                  {title.split("fábrica")[0]}
                  <span className="text-[#C5A059]">fábrica</span>
                  {title.split("fábrica").slice(1).join("fábrica")}
                </>
              ) : (
                title
              )}
            </h2>
            <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-[#2E2E2E]/85 sm:text-[14px] sm:leading-6">
              {text}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                href="/sobre#onde-estamos"
                className="inline-flex items-center rounded-md bg-[#C5A059] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                Ver fábrica
              </Link>
              <button
                type="button"
                onClick={() => setActive((i) => (i + 1) % factoryPhotos.length)}
                className="inline-flex items-center rounded-md border border-[#C5A059]/55 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Próxima foto
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-2 rounded-[20px] bg-gradient-to-br from-[#C5A059]/25 via-transparent to-[#C5A059]/10 opacity-70 blur-sm"
            />
            <div className="relative overflow-hidden rounded-[16px] border border-[#C5A059]/25 bg-white shadow-[0_14px_36px_rgba(15,15,16,0.1)]">
              <div className="relative aspect-[16/10]">
                <Image
                  key={current.src}
                  src={current.src}
                  alt={current.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  quality={85}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-3.5 pb-3 pt-8">
                  <p className="text-[11px] font-medium text-white/90">
                    {current.alt}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 bg-white p-2">
                {factoryPhotos.map((photo, index) => {
                  const selected = index === active;
                  return (
                    <button
                      key={photo.src}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`Ver foto ${index + 1}`}
                      className={`relative aspect-[5/4] overflow-hidden rounded-[8px] transition ${
                        selected
                          ? "ring-2 ring-[#C5A059] ring-offset-1"
                          : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="90px"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
