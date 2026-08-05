"use client";

import { useEffect, useState } from "react";

const FALLBACK = {
  title: "Área exclusiva do atacado",
  text: "Cadastro com CNPJ, aprovação administrativa, tabelas exclusivas e preços especiais para revendedores.",
  btn1: "Quero revender",
  btn2: "Login revendedor",
};

export function HomeWholesaleBand() {
  const [cta, setCta] = useState(FALLBACK);

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (!cms?.home) return;
        setCta({
          title: cms.home.wholesaleCtaTitle || FALLBACK.title,
          text: cms.home.wholesaleCtaText || FALLBACK.text,
          btn1: cms.home.wholesaleCtaButton1 || FALLBACK.btn1,
          btn2: cms.home.wholesaleCtaButton2 || FALLBACK.btn2,
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="atacado" className="bg-[#F0F0F0] py-20 text-[#0F0F10]">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <h2 className="font-display text-[30px] sm:text-[34px]">{cta.title}</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#2E2E2E]/80">
          {cta.text}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/atacado#acesso"
            className="rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
          >
            {cta.btn1}
          </a>
          <a
            href="/atacado#acesso"
            className="rounded-md border border-[#0F0F10]/20 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:border-[#C5A059] hover:text-[#C5A059]"
          >
            {cta.btn2}
          </a>
        </div>
      </div>
    </section>
  );
}
