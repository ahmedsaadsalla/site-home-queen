"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

type Fin = {
  ordersToday: number;
  ordersMonth: number;
  revenueMonth: number;
  quotesTotal: number;
  quotesMonth: number;
  customersNew: number;
  ticketMedio: number;
  topProducts: Array<{ name: string; quantity: number }>;
  topCategories: Array<{ name: string; qty: number }>;
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SistemaFinanceiroPage() {
  const [data, setData] = useState<Fin | null>(null);

  useEffect(() => {
    fetch("/api/admin/system/finance")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <AdminShell
      title="Financeiro (operações)"
      subtitle="Pedidos, orçamentos e ticket · sem alterar o módulo financeiro existente"
    >
      <p className="mb-4 text-[12px] text-white/40">
        Módulo de pagamentos/NF permanece em{" "}
        <Link href="/admin/financeiro" className="text-[#C8A96A] hover:underline">
          Financeiro
        </Link>
        .
      </p>

      {!data ? (
        <p className="text-white/40">Carregando…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              ["Pedidos hoje", data.ordersToday],
              ["Pedidos mês", data.ordersMonth],
              ["Receita mês", money(data.revenueMonth)],
              ["Orçamentos (mês)", data.quotesMonth],
              ["Clientes novos", data.customersNew],
              ["Ticket médio", money(data.ticketMedio)],
            ].map(([l, v]) => (
              <div
                key={String(l)}
                className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                  {l}
                </p>
                <p className="mt-1 text-[18px] font-semibold text-[#C8A96A]">
                  {v}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
              <h3 className="text-[13px] font-semibold text-[#C8A96A]">
                Produtos mais vendidos
              </h3>
              <ul className="mt-3 space-y-2 text-[13px]">
                {data.topProducts.length === 0 ? (
                  <li className="text-white/35">Sem dados</li>
                ) : (
                  data.topProducts.map((p) => (
                    <li
                      key={p.name}
                      className="flex justify-between gap-2 text-white/75"
                    >
                      <span>{p.name}</span>
                      <span className="text-white/45">{p.quantity}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
              <h3 className="text-[13px] font-semibold text-[#C8A96A]">
                Categorias mais acessadas*
              </h3>
              <p className="mt-1 text-[11px] text-white/35">
                *proxy por volume de itens vendidos
              </p>
              <ul className="mt-3 space-y-2 text-[13px]">
                {data.topCategories.length === 0 ? (
                  <li className="text-white/35">Sem dados</li>
                ) : (
                  data.topCategories.map((c) => (
                    <li
                      key={c.name}
                      className="flex justify-between gap-2 text-white/75"
                    >
                      <span>{c.name}</span>
                      <span className="text-white/45">{c.qty}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
