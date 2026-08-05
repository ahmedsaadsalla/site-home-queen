"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK = [
  { name: "Loja Premium", logo: "/parceiros/loja-premium.svg" },
  { name: "Casa & Conforto", logo: "/parceiros/casa-conforto.svg" },
  { name: "Sleep House", logo: "/parceiros/sleep-house.svg" },
  { name: "Decor Móveis", logo: "/parceiros/decor-moveis.svg" },
  { name: "Rep Home", logo: "/parceiros/rep-home.svg" },
  { name: "Box Center", logo: "/parceiros/box-center.svg" },
];

export function PartnersSection() {
  const [title, setTitle] = useState("Empresas parceiras");
  const [enabled, setEnabled] = useState(true);
  const [logos, setLogos] = useState(FALLBACK);

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (typeof cms?.home?.partnersEnabled === "boolean") {
          setEnabled(cms.home.partnersEnabled);
        }
        if (cms?.home?.partnersTitle) setTitle(cms.home.partnersTitle);
        if (cms?.home?.partnersLogos?.length) {
          setLogos(
            cms.home.partnersLogos.map((url: string, i: number) => ({
              name: `Parceiro ${i + 1}`,
              logo: url,
            })),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  if (!enabled) return null;

  return (
    <section className="bg-[#ECECEC] py-16">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <h2 className="font-display text-center text-[32px] sm:text-[36px]">
          {title}
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {logos.map((partner) => (
            <article
              key={partner.logo + partner.name}
              className="flex h-28 items-center justify-center rounded-[12px] border border-black/5 bg-white px-5 py-4 sm:h-32"
              title={partner.name}
            >
              <Image
                src={partner.logo}
                alt={`Logo ${partner.name}`}
                width={180}
                height={70}
                unoptimized
                className="h-[52px] w-auto max-w-full object-contain opacity-90 transition duration-300 hover:opacity-100 sm:h-14"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
