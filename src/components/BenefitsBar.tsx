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
    <section className="relative z-30 -mt-4 mb-[-2rem] px-4 sm:-mt-6 sm:mb-[-3rem] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="rounded-[16px] bg-[#171717] px-3 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:rounded-[20px] sm:px-5 sm:py-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {benefits.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={`flex items-start gap-2.5 rounded-[12px] bg-white/[0.03] px-2.5 py-2 sm:items-center sm:bg-transparent sm:px-0 sm:py-0 ${
                  index < benefits.length - 1
                    ? "lg:border-r lg:border-[#C5A059]/20 lg:pr-3"
                    : ""
                }`}
              >
                <div className="shrink-0 text-[#C5A059] [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7">
                  {icons[index % icons.length]}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C5A059] sm:text-[12px]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-white/70 sm:text-[12px]">
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
