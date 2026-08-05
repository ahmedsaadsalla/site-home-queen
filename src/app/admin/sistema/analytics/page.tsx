"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

type An = {
  visitors24h: number;
  pageviews30d: number;
  usersOnline: number;
  topPages: Array<{ path: string; views: number }>;
  topProducts: Array<{ name: string; views: number }>;
  trafficSources: Array<{ referrer: string; views: number }>;
  conversionRate: number;
  orders30d: number;
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
    propertyUrl: string | null;
  };
};

export default function SistemaAnalyticsPage() {
  const [data, setData] = useState<An | null>(null);

  useEffect(() => {
    fetch("/api/admin/system/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <AdminShell
      title="Analytics"
      subtitle="Estatísticas do site · GA4 quando configurado nas Integrações"
    >
      <p className="mb-4 text-[12px] text-white/40">
        IDs do Google Analytics em{" "}
        <Link href="/admin/integracoes" className="text-[#C8A96A] hover:underline">
          Integrações
        </Link>
        .
      </p>

      {!data ? (
        <p className="text-white/40">Carregando…</p>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-[13px]">
            GA4:{" "}
            {data.googleAnalytics.enabled ? (
              <span className="text-emerald-300">
                ativo ({data.googleAnalytics.measurementId || "ok"})
              </span>
            ) : (
              <span className="text-white/45">não configurado</span>
            )}
            {data.googleAnalytics.propertyUrl ? (
              <a
                href={data.googleAnalytics.propertyUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-3 text-[#C8A96A] hover:underline"
              >
                Abrir Google Analytics →
              </a>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Visitantes (24h)", data.visitors24h],
              ["Pageviews (30d)", data.pageviews30d],
              ["Online agora", data.usersOnline],
              ["Pedidos (30d)", data.orders30d],
              ["Conversão", `${data.conversionRate}%`],
            ].map(([l, v]) => (
              <div
                key={String(l)}
                className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase text-white/40">
                  {l}
                </p>
                <p className="mt-1 text-[20px] font-semibold text-[#C8A96A]">
                  {v}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Block title="Páginas mais acessadas" rows={data.topPages.map((p) => [p.path, p.views])} />
            <Block title="Produtos mais vistos" rows={data.topProducts.map((p) => [p.name, p.views])} />
            <Block title="Origem do tráfego" rows={data.trafficSources.map((t) => [t.referrer, t.views])} />
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Block({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
      <h3 className="text-[13px] font-semibold text-[#C8A96A]">{title}</h3>
      <ul className="mt-3 space-y-2 text-[12px]">
        {rows.length === 0 ? (
          <li className="text-white/35">Sem dados ainda</li>
        ) : (
          rows.map(([a, b]) => (
            <li key={a} className="flex justify-between gap-2 text-white/75">
              <span className="truncate">{a}</span>
              <span className="text-white/40">{b}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
