"use client";

import { useEffect, useState } from "react";
import { IconBadge, IconShield, IconTruck } from "@/components/icons";
import type { TextBlock } from "@/data/admin";

const icons = [
  <IconShield key="s" className="h-6 w-6" />,
  <IconTruck key="t" className="h-6 w-6" />,
  <IconBadge key="b" className="h-6 w-6" />,
];

const FALLBACK_TITLE = "Porque escolher a Home Queen";
const FALLBACK_ITEMS: TextBlock[] = [
  {
    title: "Qualidade de fábrica",
    text: "Produção própria com materiais selecionados e padrão elevado.",
  },
  {
    title: "Entrega nacional",
    text: "Logística estruturada para todo Brasil com segurança.",
  },
  {
    title: "Experiência premium",
    text: "Design sofisticado, conforto e atendimento especializado.",
  },
];

export function WhyChooseSection() {
  const [title, setTitle] = useState(FALLBACK_TITLE);
  const [items, setItems] = useState<TextBlock[]>(FALLBACK_ITEMS);

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (cms?.home?.whyChooseTitle) setTitle(cms.home.whyChooseTitle);
        if (cms?.home?.whyChooseItems?.length)
          setItems(cms.home.whyChooseItems);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="sobre" className="bg-white py-20">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <h2 className="font-display text-[30px] sm:text-[34px]">{title}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="rounded-[16px] border border-[#EAEAEA] p-6 shadow-[0_6px_24px_rgba(15,15,16,0.05)]"
            >
              <div className="text-[#C5A059]">{icons[index % icons.length]}</div>
              <h3 className="mt-4 text-[16px] font-bold">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#6B6B6B]">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
