"use client";

import { useEffect, useState } from "react";
import {
  IconBadge,
  IconHeadset,
  IconShield,
  IconTruck,
} from "@/components/icons";
import type { HomeBenefitItem } from "@/data/admin";

const icons = [
  <IconShield key="s" className="h-7 w-7" />,
  <IconTruck key="t" className="h-7 w-7" />,
  <IconBadge key="b" className="h-7 w-7" />,
  <IconHeadset key="h" className="h-7 w-7" />,
];

const FALLBACK: HomeBenefitItem[] = [
  {
    title: "Qualidade garantida",
    description: "Matéria-prima selecionada e garantia de fábrica.",
  },
  {
    title: "Entrega rápida",
    description: "Agilidade e segurança para todo Brasil.",
  },
  {
    title: "Tecnologia premium",
    description: "Processos modernos para maior durabilidade.",
  },
  {
    title: "Atendimento especializado",
    description: "Suporte dedicado para melhor experiência.",
  },
];

export function BenefitsBar() {
  const [benefits, setBenefits] = useState<HomeBenefitItem[]>(FALLBACK);

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (cms?.home?.benefits?.length) setBenefits(cms.home.benefits);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="relative z-30 -mt-6 mb-[-3rem] px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="rounded-[20px] bg-[#171717] px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:px-5 sm:py-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-3">
            {benefits.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={`flex items-center gap-2 ${
                  index < benefits.length - 1
                    ? "lg:border-r lg:border-[#C5A059]/20 lg:pr-3"
                    : ""
                }`}
              >
                <div className="shrink-0 text-[#C5A059]">
                  {icons[index % icons.length]}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#C5A059]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-4 text-white/70">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
