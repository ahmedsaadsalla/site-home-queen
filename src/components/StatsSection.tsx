"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconBadge,
  IconPackage,
  IconStar,
  IconTruck,
  IconUsers,
} from "@/components/icons";
import type { SiteStatItem } from "@/data/admin";

const DEFAULT_STATS: SiteStatItem[] = [
  {
    id: "clientes",
    value: 15000,
    suffix: "+",
    label: "Clientes atendidos",
    icon: "users",
  },
  {
    id: "produtos",
    value: 280000,
    suffix: "+",
    label: "Produtos fabricados",
    icon: "package",
  },
  {
    id: "entregas",
    value: 52000,
    suffix: "+",
    label: "Entregas realizadas",
    icon: "truck",
  },
  {
    id: "anos",
    value: 10,
    suffix: "+",
    label: "Anos de mercado",
    icon: "badge",
  },
  {
    id: "satisfacao",
    value: 98,
    suffix: "%",
    label: "Índice de satisfação",
    icon: "stars",
  },
];

function iconFor(kind: SiteStatItem["icon"]): ReactNode {
  if (kind === "users") return <IconUsers className="h-10 w-10" />;
  if (kind === "package") return <IconPackage className="h-10 w-10" />;
  if (kind === "truck") return <IconTruck className="h-10 w-10" />;
  if (kind === "badge") return <IconBadge className="h-10 w-10" />;
  return (
    <span className="inline-flex h-10 items-center gap-0.5">
      <IconStar className="h-8 w-8" />
      <IconStar className="h-8 w-8" />
      <IconStar className="h-8 w-8" />
      <IconStar className="h-8 w-8" />
      <IconStar className="h-8 w-8" />
    </span>
  );
}

function useCountUp(target: number, active: boolean, duration = 2000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);

  return value;
}

function StatCard({
  value,
  suffix = "+",
  label,
  icon,
  active,
  delay,
}: {
  value: number;
  suffix?: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  delay: number;
}) {
  const count = useCountUp(value, active);

  return (
    <article
      className={`flex min-h-[110px] flex-col rounded-[14px] bg-white px-4 py-3.5 shadow-[0_8px_30px_rgba(15,15,16,0.08)] transition-all duration-700 ${
        active ? "translate-y-0 opacity-100 scale-100" : "translate-y-6 opacity-0 scale-95"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-2 text-[#C5A059]">{icon}</div>
      <p className="text-[32px] font-bold leading-none tracking-tight text-[#0F0F10] sm:text-[36px]">
        {count.toLocaleString("pt-BR")}
        {suffix}
      </p>
      <p className="mt-2 text-[13px] leading-5 text-[#6B6B6B]">{label}</p>
    </article>
  );
}

export function StatsSection({
  stats: statsProp,
  title: titleProp,
}: {
  stats?: SiteStatItem[];
  title?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [stats, setStats] = useState<SiteStatItem[]>(statsProp || DEFAULT_STATS);
  const [title, setTitle] = useState(
    titleProp || "Nossos números falam por nós",
  );

  useEffect(() => {
    if (statsProp?.length) {
      setStats(statsProp);
      return;
    }
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (cms?.home?.stats?.length) setStats(cms.home.stats);
        if (cms?.home?.statsTitle) setTitle(cms.home.statsTitle);
      })
      .catch(() => undefined);
  }, [statsProp]);

  useEffect(() => {
    if (titleProp) setTitle(titleProp);
  }, [titleProp]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="numeros" ref={ref} className="scroll-mt-8 bg-[#F5F5F3] pb-4 pt-6">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <p className="text-center font-display text-[18px] italic text-[#C5A059] sm:text-[20px]">
          {title}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.id || stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={iconFor(stat.icon)}
              active={active}
              delay={index * 120}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
