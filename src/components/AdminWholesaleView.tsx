"use client";

import { useEffect, useState } from "react";

type DealerRow = {
  id: string;
  createdAt: string;
  status: "Pendente" | "Aprovado" | "Recusado";
  cnpj: string;
  companyName: string;
  tradeName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  blocked?: boolean;
  priceTable?: string;
  globalMinOrder?: number;
  discountPercent?: number;
  creditLimit?: number;
  carrier?: string;
  region?: string;
  paymentMethod?: string;
};

type QuoteRow = {
  id: string;
  createdAt: string;
  name: string;
  company: string;
  product: string;
  quantity: number;
  whatsapp: string;
};

export function AdminWholesaleView() {
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    try {
      const [d, q] = await Promise.all([
        fetch("/api/atacado/dealers").then((r) => r.json()),
        fetch("/api/atacado/orcamento").then((r) => r.json()),
      ]);
      setDealers(Array.isArray(d) ? d : []);
      setQuotes(Array.isArray(q) ? q : []);
    } catch {
      setError("Não foi possível carregar os dados.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/atacado/dealers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-12 lg:px-8">
      <h1 className="font-display text-[30px] sm:text-[34px]">
        Painel Atacado
      </h1>
      <p className="mt-2 text-[14px] text-[#6B6B6B]">
        Aprove/bloqueie CNPJ e configure tabela, mínimo, desconto, crédito,
        transportadora, região e pagamento.
      </p>
      {error ? <p className="mt-4 text-[13px] text-red-600">{error}</p> : null}

      <h2 className="mt-10 text-[18px] font-bold">Revendedores</h2>
      <div className="mt-4 space-y-4">
        {dealers.length === 0 ? (
          <p className="rounded-[14px] border border-[#EAEAEA] bg-white px-4 py-8 text-center text-[13px] text-[#6B6B6B]">
            Nenhum cadastro ainda.
          </p>
        ) : (
          dealers.map((d) => (
            <article
              key={d.id}
              className="rounded-[14px] border border-[#EAEAEA] bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold">
                    {d.tradeName || d.companyName}
                  </p>
                  <p className="text-[13px] text-[#6B6B6B]">
                    {d.cnpj} · {d.city}/{d.state} · {d.contactName}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B6B6B]">
                    {d.email} · {d.whatsapp}
                  </p>
                  <p className="mt-2 text-[13px]">
                    Status: <strong>{d.status}</strong>
                    {d.blocked ? (
                      <span className="ml-2 font-semibold text-red-600">
                        Bloqueado
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => patch(d.id, { status: "Aprovado", blocked: false })}
                    className="rounded-md bg-[#C5A059] px-3 py-1.5 text-[10px] font-bold uppercase text-black"
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(d.id, { blocked: true })}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-[10px] font-bold uppercase text-red-700"
                  >
                    Bloquear
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(d.id, { status: "Recusado" })}
                    className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-[10px] font-bold uppercase"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing(editing === d.id ? null : d.id)
                    }
                    className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-[10px] font-bold uppercase"
                  >
                    Configurar
                  </button>
                </div>
              </div>

              {editing === d.id ? (
                <form
                  className="mt-4 grid gap-3 border-t border-[#F0F0F0] pt-4 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    void patch(d.id, {
                      priceTable: String(fd.get("priceTable") || ""),
                      globalMinOrder: Number(fd.get("globalMinOrder") || 0),
                      discountPercent: Number(fd.get("discountPercent") || 28),
                      creditLimit: Number(fd.get("creditLimit") || 0),
                      carrier: String(fd.get("carrier") || ""),
                      region: String(fd.get("region") || ""),
                      paymentMethod: String(fd.get("paymentMethod") || ""),
                    });
                    setEditing(null);
                  }}
                >
                  {(
                    [
                      ["priceTable", "Tabela de preço", d.priceTable || "Padrão"],
                      [
                        "discountPercent",
                        "Desconto %",
                        String(d.discountPercent ?? 28),
                      ],
                      [
                        "globalMinOrder",
                        "Pedido mínimo",
                        String(d.globalMinOrder ?? 0),
                      ],
                      [
                        "creditLimit",
                        "Limite de crédito",
                        String(d.creditLimit ?? 0),
                      ],
                      ["carrier", "Transportadora", d.carrier || ""],
                      ["region", "Região", d.region || ""],
                      [
                        "paymentMethod",
                        "Forma de pagamento",
                        d.paymentMethod || "PIX / Boleto",
                      ],
                    ] as const
                  ).map(([name, label, value]) => (
                    <label key={name} className="text-[12px]">
                      <span className="mb-1 block text-[#6B6B6B]">{label}</span>
                      <input
                        name={name}
                        defaultValue={value}
                        className="w-full rounded-[8px] border border-[#E5E5E5] px-3 py-2 text-[13px] outline-none focus:border-[#C5A059]"
                      />
                    </label>
                  ))}
                  <button
                    type="submit"
                    className="sm:col-span-3 mt-1 rounded-md bg-[#0F0F10] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white"
                  >
                    Salvar configurações
                  </button>
                </form>
              ) : null}
            </article>
          ))
        )}
      </div>

      <h2 className="mt-10 text-[18px] font-bold">Cotações recebidas</h2>
      <div className="mt-4 overflow-x-auto rounded-[14px] border border-[#EAEAEA] bg-white">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-[#EAEAEA] bg-[#F8F8F6] text-[11px] uppercase tracking-[0.08em] text-[#6B6B6B]">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Qtd</th>
              <th className="px-4 py-3">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#6B6B6B]">
                  Nenhuma cotação ainda.
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="border-b border-[#F0F0F0]">
                  <td className="px-4 py-3 whitespace-nowrap text-[#6B6B6B]">
                    {new Date(q.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {q.company}
                    <span className="block text-[#6B6B6B]">{q.name}</span>
                  </td>
                  <td className="px-4 py-3">{q.product}</td>
                  <td className="px-4 py-3">{q.quantity}</td>
                  <td className="px-4 py-3">{q.whatsapp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
