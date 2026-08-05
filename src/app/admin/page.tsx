"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Dash = {
  pedidosHoje: number;
  vendasHoje: number;
  faturamento: number;
  orcamentos: number;
  clientesCpf: number;
  clientesCnpj: number;
  produtos: number;
  categorias: number;
  produtosFalta: number;
  pedidosPendentes: number;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const editCards = [
  {
    href: "/admin/site",
    title: "Editar o site",
    desc: "Textos, fotos e páginas — o jeito mais simples",
    primary: true,
  },
  {
    href: "/admin/site/home",
    title: "Home",
    desc: "Banner, títulos e slides da página inicial",
  },
  {
    href: "/admin/produtos",
    title: "Produtos",
    desc: "Preços, fotos e estoque",
  },
  {
    href: "/admin/categorias",
    title: "Categorias",
    desc: "Organizar o catálogo",
  },
  {
    href: "/admin/pedidos",
    title: "Pedidos",
    desc: "Status e acompanhar vendas",
  },
  {
    href: "/admin/midias",
    title: "Fotos",
    desc: "Biblioteca de imagens",
  },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/admin/cms?view=dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <AdminShell
      title="Olá! O que deseja fazer?"
      subtitle="Escolha uma opção — sem complicação"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {editCards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`rounded-2xl border p-5 transition ${
              c.primary
                ? "border-[#C8A96A]/50 bg-[#C8A96A]/10 hover:bg-[#C8A96A]/15"
                : "border-white/10 bg-[#151515] hover:border-[#C8A96A]/40"
            }`}
          >
            <h2
              className={`font-display text-[22px] ${
                c.primary ? "text-[#C8A96A]" : "text-[#F8F8F6]"
              }`}
            >
              {c.title}
            </h2>
            <p className="mt-2 text-[13px] text-white/50">{c.desc}</p>
            <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
              Abrir →
            </span>
          </Link>
        ))}
      </div>

      {data ? (
        <section className="mt-10">
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">
            Resumo rápido
          </h2>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Pedidos hoje", value: String(data.pedidosHoje) },
              { label: "Vendas hoje", value: brl(data.vendasHoje) },
              { label: "Pendentes", value: String(data.pedidosPendentes) },
              { label: "Orçamentos", value: String(data.orcamentos) },
              { label: "Produtos", value: String(data.produtos) },
              { label: "Sem estoque", value: String(data.produtosFalta) },
              { label: "Clientes CPF", value: String(data.clientesCpf) },
              { label: "Clientes CNPJ", value: String(data.clientesCnpj) },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3"
              >
                <p className="text-[11px] text-white/40">{c.label}</p>
                <p className="mt-1 font-display text-[20px] text-[#F8F8F6]">
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-8 text-[13px] text-white/40">Carregando resumo…</p>
      )}
    </AdminShell>
  );
}
