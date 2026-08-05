"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminBtn, adminInput } from "@/components/admin/AdminCmsForm";

type Coupon = { id: string; code: string; discount: number; active: boolean };

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((cms) => setCoupons(cms.coupons || []));
  }, []);

  async function save(next: Coupon[]) {
    const res = await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "coupons",
        data: next,
        action: "Cupons",
        detail: "Lista de cupons atualizada",
      }),
    });
    if (res.ok) {
      setCoupons(next);
      setMsg("Cupons salvos.");
    } else setMsg("Erro ao salvar.");
  }

  return (
    <AdminShell title="Cupons" subtitle="Códigos de desconto da loja">
      <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-[#151515] p-4">
        <input
          className={`${adminInput} max-w-[180px]`}
          placeholder="Código"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <input
          type="number"
          className={`${adminInput} max-w-[120px]`}
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
        />
        <button
          type="button"
          className={adminBtn}
          onClick={() => {
            if (!code.trim()) return;
            void save([
              ...coupons,
              {
                id: `cp_${Date.now().toString(36)}`,
                code: code.trim(),
                discount,
                active: true,
              },
            ]);
            setCode("");
          }}
        >
          Adicionar
        </button>
      </div>
      {msg ? <p className="mb-3 text-[13px] text-[#C8A96A]">{msg}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#151515]">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.08em] text-white/45">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto %</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-semibold text-[#C8A96A]">{c.code}</td>
                <td className="px-4 py-3">{c.discount}%</td>
                <td className="px-4 py-3">{c.active ? "Ativo" : "Inativo"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="mr-3 text-[12px] text-white/60 hover:text-[#C8A96A]"
                    onClick={() =>
                      void save(
                        coupons.map((x) =>
                          x.id === c.id ? { ...x, active: !x.active } : x,
                        ),
                      )
                    }
                  >
                    {c.active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    className="text-[12px] text-red-300/80 hover:text-red-300"
                    onClick={() => void save(coupons.filter((x) => x.id !== c.id))}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
