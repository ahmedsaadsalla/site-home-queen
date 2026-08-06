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
      className="relative overflow-hidden bg-[#EEEEEE] py-20 text-[#0F0F10]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(197,160,89,0.12),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(197,160,89,0.08),transparent_45%)]"
      />

      <div className="relative mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <Logo className="h-auto w-[160px] max-w-full object-contain sm:w-[200px] lg:w-[220px]" />

            <h2 className="font-display mt-5 text-[28px] leading-tight text-[#0F0F10] sm:mt-7 sm:text-[38px]">
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
            <p className="mt-5 max-w-[420px] text-[15px] leading-7 text-[#2E2E2E]/85">
              {text}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sobre#onde-estamos"
                className="inline-flex items-center rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                Ver fábrica
              </Link>
              <button
                type="button"
                onClick={() => setActive((i) => (i + 1) % factoryPhotos.length)}
                className="inline-flex items-center rounded-md border border-[#C5A059]/55 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Próxima foto
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[#C5A059]/25 via-transparent to-[#C5A059]/10 opacity-70 blur-sm"
            />
            <div className="relative overflow-hidden rounded-[22px] border border-[#C5A059]/25 bg-white shadow-[0_20px_50px_rgba(15,15,16,0.12)]">
              <div className="relative aspect-[16/10]">
                <Image
                  key={current.src}
                  src={current.src}
                  alt={current.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  quality={90}
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-5 pb-4 pt-12">
                  <p className="text-[12px] font-medium text-white/90">
                    {current.alt}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 bg-white p-3">
                {factoryPhotos.map((photo, index) => {
                  const selected = index === active;
                  return (
                    <button
                      key={photo.src}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`Ver foto ${index + 1}`}
                      className={`relative aspect-[5/4] overflow-hidden rounded-[10px] transition ${
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
                        sizes="120px"
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
