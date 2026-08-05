"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { homeCatalogConfig } from "@/data/homeCatalog";
import type { ProductOverride } from "@/data/admin";

type StockRow = { id: string; name: string; stock: number; sku: string };

export default function AdminEstoquePage() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => {
        const overrides: ProductOverride[] = cms.productOverrides || [];
        setRows(
          homeCatalogConfig.products.map((p) => {
            const ov = overrides.find((x) => x.id === p.id);
            return {
              id: p.id,
              name: p.name,
              sku: p.id,
              stock: ov?.stock ?? 20 + (p.order % 15),
            };
          }),
        );
      });
  }, []);

  async function saveAll() {
    const cmsRes = await fetch("/api/admin/cms");
    const cms = await cmsRes.json();
    const overrides: ProductOverride[] = cms.productOverrides || [];
    const next = homeCatalogConfig.products.map((p) => {
      const ov = overrides.find((x) => x.id === p.id) || { id: p.id };
      const row = rows.find((r) => r.id === p.id);
      return { ...ov, id: p.id, name: p.name, stock: row?.stock ?? ov.stock ?? 20 };
    });
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "productOverrides",
        data: next,
        action: "Estoque",
        detail: "Saldos de estoque atualizados",
      }),
    });
    setMsg(res.ok ? "Estoque salvo." : "Erro ao salvar.");
  }

  const low = rows.filter((r) => r.stock <= 8);

  return (
    <AdminShell title="Estoque" subtitle="Saldo por SKU e alertas de falta">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void saveAll()}
          className="rounded-xl bg-[#C8A96A] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10]"
        >
          Salvar estoque
        </button>
        <Link href="/admin/produtos" className="text-[12px] text-[#C8A96A] hover:underline">
          Editar produto completo
        </Link>
        {msg ? <span className="text-[13px] text-[#C8A96A]">{msg}</span> : null}
      </div>

      {low.length > 0 ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">
          {low.length} produto(s) com estoque baixo (≤ 8 un.).
        </p>
      ) : null}

      <div className="max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-[#151515]">
        <table className="min-w-full text-left text-[13px]">
          <thead className="sticky top-0 border-b border-white/10 bg-[#151515] text-[11px] uppercase tracking-[0.08em] text-white/45">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-2 text-white/50">{r.sku}</td>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={r.stock}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id
                            ? { ...x, stock: Number(e.target.value) || 0 }
                            : x,
                        ),
                      )
                    }
                    className={`w-24 rounded-lg border px-2 py-1.5 outline-none ${
                      r.stock <= 8
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                        : "border-white/15 bg-white/5 text-white"
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
