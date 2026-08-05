"use client";

import { useEffect, useState } from "react";
import { IconStar } from "@/components/icons";
import type { HomeTestimonialItem } from "@/data/admin";

const FALLBACK_TITLE = "Clientes satisfeitos";
const FALLBACK: HomeTestimonialItem[] = [
  {
    name: "Mariana Silva",
    city: "Chapecó - SC",
    text: "Qualidade impressionante e entrega rápida. O quarto ficou com cara de hotel.",
    rating: 5,
  },
  {
    name: "Carlos Mendes",
    city: "Curitiba - PR",
    text: "Comprei para minha loja e o atendimento do atacado foi excelente.",
    rating: 5,
  },
  {
    name: "Ana Paula",
    city: "Porto Alegre - RS",
    text: "Conforto premium e acabamento impecável. Recomendo a Home Queen.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [title, setTitle] = useState(FALLBACK_TITLE);
  const [items, setItems] = useState<HomeTestimonialItem[]>(FALLBACK);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (typeof cms?.home?.testimonialsEnabled === "boolean") {
          setEnabled(cms.home.testimonialsEnabled);
        }
        if (cms?.home?.testimonialsTitle) setTitle(cms.home.testimonialsTitle);
        if (cms?.home?.testimonials?.length) setItems(cms.home.testimonials);
      })
      .catch(() => undefined);
  }, []);

  if (!enabled) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <h2 className="font-display text-[30px] sm:text-[34px]">{title}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={`${item.name}-${item.city}`}
              className="rounded-[16px] border border-[#EAEAEA] bg-white p-6 shadow-[0_8px_30px_rgba(15,15,16,0.05)]"
            >
              <div className="flex gap-1 text-[#C5A059]">
                {Array.from({ length: item.rating || 5 }).map((_, i) => (
                  <IconStar key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-[14px] leading-7 text-[#2E2E2E]">
                {item.text}
              </p>
              <p className="mt-4 text-[13px] font-bold">{item.name}</p>
              <p className="text-[12px] text-[#6B6B6B]">{item.city}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
