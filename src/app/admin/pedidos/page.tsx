"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminOrder, OrderStatus } from "@/data/admin";

const statuses: OrderStatus[] = [
  "Aguardando pagamento",
  "Pago",
  "Em produção",
  "Separação",
  "Expedição",
  "Enviado",
  "Entregue",
  "Cancelado",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  async function load() {
    const res = await fetch("/api/admin/cms?view=dashboard");
    const data = await res.json();
    setOrders(data.ultimosPedidos || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: OrderStatus) {
    const cmsRes = await fetch("/api/admin/cms");
    const cms = await cmsRes.json();
    const existing: AdminOrder[] = cms.orders || [];
    const found = existing.find((o) => o.id === id);
    const fromDash = orders.find((o) => o.id === id);
    const nextOrder: AdminOrder = found
      ? { ...found, status }
      : {
          id,
          createdAt: fromDash?.createdAt || new Date().toISOString(),
          customerName: fromDash?.customerName || "Cliente",
          customerType: "CPF",
          total: fromDash?.total || 0,
          status,
          payment: "Checkout",
          items: [],
        };
    const next = [...existing.filter((o) => o.id !== id), nextOrder];
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "orders",
        data: next,
        action: "Status pedido",
        detail: `${id} → ${status}`,
      }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    );
  }

  return (
    <AdminShell title="Pedidos" subtitle="Status operacional e integração Bling (stub)">
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#151515]">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.08em] text-white/45">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-white/40">
                  Nenhum pedido registrado.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">
                    {o.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) =>
                        void setStatus(o.id, e.target.value as OrderStatus)
                      }
                      className="rounded-lg border border-white/15 bg-[#0F0F10] px-2 py-1.5 text-[12px] outline-none focus:border-[#C8A96A]"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
