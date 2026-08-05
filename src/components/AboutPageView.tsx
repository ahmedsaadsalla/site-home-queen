"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { IconBadge, IconShield, IconTruck } from "@/components/icons";

const heroImage =
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1920&q=80";
const historyImage =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0 },
};

const fadeRight = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88, y: 18 },
  show: { opacity: 1, scale: 1, y: 0 },
};

const staggerPhotos = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const staggerSteps = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.15 },
  },
};

const viewport = { once: true, amount: 0.2 } as const;

const differentials = [
  {
    title: "Fábrica própria",
    text: "Produzimos camas box e baú com controle total de qualidade.",
    icon: <IconBadge className="h-6 w-6" />,
  },
  {
    title: "Qualidade premium",
    text: "Acabamento sofisticado e materiais selecionados.",
    icon: <IconShield className="h-6 w-6" />,
  },
  {
    title: "Entrega nacional",
    text: "Enviamos para todo o Brasil com segurança.",
    icon: <IconTruck className="h-6 w-6" />,
  },
];

const lines = ["Camas Box", "Camas Baú", "Solteiro & Casal", "Queen & King"];

const factoryPhotos = [
  { label: "Máquinas", src: "/fabrica/cama-01.jpg" },
  { label: "Costura", src: "/fabrica/cama-02.jpg" },
  { label: "Produção", src: "/fabrica/cama-03.jpg" },
  { label: "Acabamento", src: "/fabrica/cama-04.jpg" },
  { label: "Expedição", src: "/fabrica/cama-05.jpg" },
];

const processSteps = [
  {
    n: "01",
    title: "Matéria-prima",
    text: "Selecionamos os melhores materiais do mercado.",
  },
  {
    n: "02",
    title: "Produção",
    text: "Tecnologia e precisão em cada etapa do processo.",
  },
  {
    n: "03",
    title: "Montagem",
    text: "Montagem realizada por profissionais especializados.",
  },
  {
    n: "04",
    title: "Controle de qualidade",
    text: "Inspeção rigorosa para garantir excelência.",
  },
  {
    n: "05",
    title: "Embalagem",
    text: "Embalagem segura para proteção do produto.",
  },
  {
    n: "06",
    title: "Entrega",
    text: "Entrega rápida e segura para todo o Brasil.",
  },
];

const defaultAboutStats = [
  { value: 15000, suffix: "+", label: "Clientes" },
  { value: 280000, suffix: "+", label: "Produtos" },
  { value: 52000, suffix: "+", label: "Entregas" },
  { value: 10, suffix: "+", label: "Anos" },
  { value: 98, suffix: "%", label: "Satisfação" },
];

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 4))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);
  return value;
}

function StatItem({
  value,
  suffix,
  label,
  active,
}: (typeof defaultAboutStats)[number] & { active: boolean }) {
  const count = useCountUp(value, active);
  return (
    <article className="rounded-[14px] bg-white px-4 py-5 text-center shadow-[0_8px_30px_rgba(15,15,16,0.06)]">
      <p className="text-[28px] font-bold text-[#0F0F10] sm:text-[32px]">
        {count.toLocaleString("pt-BR")}
        <span className="text-[#C5A059]">{suffix}</span>
      </p>
      <p className="mt-2 text-[12px] text-[#6B6B6B]">{label}</p>
    </article>
  );
}

export function AboutPageView() {
  const statsRef = useRef<HTMLElement>(null);
  const [statsActive, setStatsActive] = useState(false);
  const [stats, setStats] = useState(defaultAboutStats);
  const [statsTitle, setStatsTitle] = useState("Nossos números falam por nós");
  const [factoryCms, setFactoryCms] = useState({
    title: "Nossa Fábrica",
    subtitle: "Produção própria, qualidade e acabamento premium.",
    history: "A Home Queen nasceu da paixão por conforto e acabamento premium.",
    mission: "Entregar conforto premium com excelência em cada detalhe.",
    vision: "Ser referência nacional em camas box de fábrica própria.",
    values: "Qualidade, transparência, atendimento e inovação.",
    banner: heroImage,
    historyImage,
    gallery: [] as string[],
    productionPhotos: factoryPhotos.map((p) => p.src),
    differentials,
    lines,
    processSteps,
    ctaTitle: "Quer conhecer os produtos?",
    ctaText: "Explore o catálogo e solicite um orçamento personalizado.",
    ctaButton: "Ver catálogo",
  });

  useEffect(() => {
    const node = statsRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsActive(true);
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (cms?.home?.statsTitle) setStatsTitle(cms.home.statsTitle);
        if (cms?.home?.stats?.length) {
          setStats(
            cms.home.stats.map(
              (s: {
                value: number;
                suffix: string;
                label: string;
              }) => ({
                value: s.value,
                suffix: s.suffix,
                label: s.label,
              }),
            ),
          );
        }
        if (cms?.factory) {
          setFactoryCms((prev) => ({
            ...prev,
            title: cms.factory.title || prev.title,
            subtitle: cms.factory.subtitle || prev.subtitle,
            history: cms.factory.history || prev.history,
            mission: cms.factory.mission || prev.mission,
            vision: cms.factory.vision || prev.vision,
            values: cms.factory.values || prev.values,
            banner: cms.factory.banner || prev.banner,
            historyImage: cms.factory.historyImage || prev.historyImage,
            gallery: cms.factory.gallery || prev.gallery,
            productionPhotos:
              cms.factory.productionPhotos?.length
                ? cms.factory.productionPhotos
                : prev.productionPhotos,
            differentials: cms.factory.differentials?.length
              ? cms.factory.differentials
              : prev.differentials,
            lines: cms.factory.lines?.length ? cms.factory.lines : prev.lines,
            processSteps: cms.factory.processSteps?.length
              ? cms.factory.processSteps
              : prev.processSteps,
            ctaTitle: cms.factory.ctaTitle || prev.ctaTitle,
            ctaText: cms.factory.ctaText || prev.ctaText,
            ctaButton: cms.factory.ctaButton || prev.ctaButton,
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="bg-[#F5F5F3] text-[#0F0F10]">
      {/* Hero — mesmo padrão da Home */}
      <section className="relative min-h-[280px] overflow-hidden bg-black text-white sm:min-h-[300px]">
        <Image
          src={factoryCms.banner}
          alt="Home Queen — camas box e baú"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        <div className="relative z-10 mx-auto flex min-h-[280px] max-w-[1240px] items-center px-6 pb-8 pt-4 sm:min-h-[300px] lg:px-8">
          <motion.div
            className="max-w-[480px]"
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C5A059]">
              Sobre nós
            </p>
            <h1 className="font-display mt-3 text-[28px] leading-[1.12] sm:text-[34px] lg:text-[38px]">
              {factoryCms.title}
            </h1>
            <p className="mt-5 text-[14px] leading-7 text-white/75">
              {factoryCms.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#nosso-catalogo"
                className="inline-flex items-center gap-2 rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                {factoryCms.ctaButton}
              </Link>
              <Link
                href="/orcamento"
                className="inline-flex items-center rounded-md border border-white/50 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Fazer orçamento
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Nossa fábrica (5 fotos) + Processo (6 etapas) */}
      <section className="bg-white py-4 lg:py-5">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.45 }}
            className="text-center text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]"
          >
            Nossa fábrica
          </motion.p>

          <motion.div
            className="mx-auto mt-3 flex max-w-[1240px] justify-center gap-3 overflow-x-auto pb-2 lg:gap-3.5 lg:overflow-visible lg:pb-0"
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={staggerPhotos}
          >
            {(factoryCms.productionPhotos.length
              ? factoryCms.productionPhotos
              : factoryPhotos.map((p) => p.src)
            ).map((src, i) => (
              <motion.article
                key={`${src}-${i}`}
                variants={scaleIn}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="relative aspect-[5/4] w-[78%] max-w-[230px] shrink-0 overflow-hidden rounded-[18px] bg-[#E8E4DE] shadow-[0_8px_24px_rgba(15,15,16,0.08)] lg:w-[230px] lg:max-w-[230px]"
              >
                <Image
                  src={src}
                  alt={`Produção ${i + 1}`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="230px"
                  quality={90}
                />
              </motion.article>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.45 }}
            className="mt-8 text-center text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]"
          >
            Nosso processo de produção
          </motion.p>

          <motion.div
            className="relative mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-3"
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={staggerSteps}
          >
            <motion.div
              className="pointer-events-none absolute left-[8%] right-[8%] top-5 hidden h-px origin-left border-t border-dashed border-[#C5A059]/50 lg:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewport}
              transition={{ duration: 1.1, ease: "easeInOut", delay: 0.2 }}
            />
            {factoryCms.processSteps.map((step) => (
              <motion.div
                key={step.n}
                variants={scaleIn}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative text-center"
              >
                <motion.div
                  className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#C5A059] bg-white text-[12px] font-bold text-[#C5A059]"
                  whileHover={{ scale: 1.12, backgroundColor: "#C5A059", color: "#0F0F10" }}
                  transition={{ duration: 0.2 }}
                >
                  {step.n}
                </motion.div>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F0F10]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[12px] leading-5 text-[#6B6B6B]">
                  {step.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* História — padrão FactorySection */}
      <section className="bg-[#F5F5F3] py-20">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={fadeLeft}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]">
                Nossa história
              </p>
              <h2 className="font-display mt-2 text-[32px] sm:text-[38px]">
                {factoryCms.title}
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#2E2E2E]">
                <p>{factoryCms.history}</p>
                <p>
                  <strong>Missão:</strong> {factoryCms.mission}
                </p>
                <p>
                  <strong>Visão:</strong> {factoryCms.vision}
                </p>
                <p>
                  <strong>Valores:</strong> {factoryCms.values}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={fadeRight}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
              className="relative aspect-video overflow-hidden rounded-[20px] bg-[#171717] shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
            >
              <Image
                src={factoryCms.historyImage}
                alt="Camas Home Queen"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Diferenciais — padrão WhyChoose */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]">
              Diferenciais
            </p>
            <h2 className="font-display mt-2 text-[30px] sm:text-[34px]">
              Por que escolher a Home Queen
            </h2>
          </motion.div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {factoryCms.differentials.map((item, index) => (
              <motion.article
                key={item.title}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={fadeUp}
                transition={{ duration: 0.45, delay: index * 0.12 }}
                className="rounded-[16px] border border-[#EAEAEA] p-6 shadow-[0_6px_24px_rgba(15,15,16,0.05)]"
              >
                <div className="text-[#C5A059]">
                  {
                    [
                      <IconBadge key="b" className="h-6 w-6" />,
                      <IconShield key="s" className="h-6 w-6" />,
                      <IconTruck key="t" className="h-6 w-6" />,
                    ][index % 3]
                  }
                </div>
                <h3 className="mt-4 text-[16px] font-bold">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#6B6B6B]">
                  {item.text}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Linha */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]">
              O que fabricamos
            </p>
            <h2 className="font-display mt-2 text-[28px] sm:text-[32px]">
              Linha completa para o quarto
            </h2>
          </motion.div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {factoryCms.lines.map((item, index) => (
              <motion.div
                key={item}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="rounded-[14px] border border-[#EAEAEA] bg-white px-4 py-5 text-center text-[13px] font-semibold shadow-[0_6px_24px_rgba(15,15,16,0.04)]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Números — padrão Stats */}
      <section ref={statsRef} className="bg-[#F5F5F3] pb-16 pt-4">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeUp}
            className="text-center font-display text-[18px] italic text-[#C5A059] sm:text-[20px]"
          >
            {statsTitle}
          </motion.p>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <StatItem {...stat} active={statsActive} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Localização — padrão MapSection */}
      <section id="onde-estamos" className="bg-white py-16">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]">
              Onde estamos
            </p>
            <h2 className="font-display mt-2 text-[28px] sm:text-[32px]">
              Fábrica em Chapecó/SC
            </h2>
          </motion.div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Endereço",
                body: (
                  <>
                    Rodovia SC-480, 1234
                    <br />
                    Bairro Industrial — Chapecó/SC
                    <br />
                    CEP 89801-970
                  </>
                ),
              },
              {
                title: "Contato",
                body: (
                  <>
                    (49) 99999-9999
                    <br />
                    contato@homequeen.com.br
                  </>
                ),
              },
              {
                title: "Horário",
                body: (
                  <>
                    Seg a Sex: 08h–18h
                    <br />
                    Sábado: 08h–12h
                  </>
                ),
              },
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                className="rounded-[14px] border border-[#EAEAEA] bg-[#FBFBF9] p-5 text-[14px] leading-7 text-[#2E2E2E]"
              >
                <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]">
                  {card.title}
                </p>
                <p className="mt-2">{card.body}</p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 overflow-hidden rounded-[16px] border border-[#EAEAEA] shadow-[0_8px_30px_rgba(15,15,16,0.06)]"
          >
            <iframe
              title="Mapa Home Queen Chapecó"
              className="h-[320px] w-full"
              src="https://maps.google.com/maps?q=Chapec%C3%B3%20SC&t=&z=13&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA — padrão seção Atacado */}
      <section className="bg-[#171717] py-16 text-white">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-[#C5A059] sm:text-[17px]">
              Home Queen
            </p>
            <h2 className="font-display mt-2 text-[30px] sm:text-[34px]">
              Encontre a cama ideal
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/65">
              Explore nossa linha de camas box e baú e solicite um orçamento
              personalizado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#nosso-catalogo"
                className="rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                Ver produtos
              </Link>
              <Link
                href="/orcamento"
                className="rounded-md border border-white/25 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Fazer orçamento
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
