"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  QUOTE_STATUSES,
  type QuoteRecord,
  type QuoteStatus,
} from "@/data/quotes";

export function AdminQuotesView() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orcamentos");
      if (!res.ok) throw new Error("Falha ao carregar orçamentos.");
      const data = (await res.json()) as QuoteRecord[];
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateQuote(
    id: string,
    patch: { status?: QuoteStatus; responsible?: string },
  ) {
    const res = await fetch("/api/orcamentos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { quote: QuoteRecord };
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? data.quote : q)),
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-10 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C8A96A]">
            Painel administrativo
          </p>
          <h1 className="font-display mt-2 text-[32px] text-[#0F0F10]">
            Orçamentos
          </h1>
          <p className="mt-2 text-[14px] text-[#6B6B6B]">
            Solicitações recebidas pelo formulário do site.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-[10px] border border-[#0F0F10]/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em]"
          >
            Atualizar
          </button>
          <Link
            href="/"
            className="rounded-[10px] bg-[#C8A96A] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F0F10]"
          >
            Voltar ao site
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-[14px] text-[#6B6B6B]">Carregando...</p>
      ) : null}
      {error ? (
        <p className="mt-10 text-[14px] text-red-600">{error}</p>
      ) : null}

      {!loading && !error && quotes.length === 0 ? (
        <div className="mt-10 rounded-[16px] border border-dashed border-[#D6D0C6] bg-white px-6 py-12 text-center text-[14px] text-[#6B6B6B]">
          Nenhum orçamento recebido ainda.
        </div>
      ) : null}

      {quotes.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-[16px] border border-[#EEEAE4] bg-white shadow-[0_8px_30px_rgba(15,15,16,0.04)]">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-[#EEEAE4] bg-[#FBFBF9] text-[10px] uppercase tracking-[0.12em] text-[#8A8A8A]">
              <tr>
                <th className="px-4 py-3 font-bold">Nº</th>
                <th className="px-4 py-3 font-bold">Data</th>
                <th className="px-4 py-3 font-bold">Nome</th>
                <th className="px-4 py-3 font-bold">Empresa</th>
                <th className="px-4 py-3 font-bold">CPF/CNPJ</th>
                <th className="px-4 py-3 font-bold">Produto</th>
                <th className="px-4 py-3 font-bold">Qtd</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-[#F0EEEA] align-top last:border-0"
                >
                  <td className="px-4 py-3 font-semibold text-[#0F0F10]">
                    {quote.number}
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] whitespace-nowrap">
                    {new Date(quote.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{quote.customer.name || "—"}</td>
                  <td className="px-4 py-3">{quote.customer.company || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {quote.customer.cpf || quote.customer.cnpj || "—"}
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-medium text-[#0F0F10]">
                      {quote.product.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8A8A8A]">
                      {quote.product.size} · {quote.product.color}
                    </p>
                  </td>
                  <td className="px-4 py-3">{quote.product.quantity}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-[#E5E5E5] bg-white px-2 py-1.5 text-[12px] outline-none focus:border-[#C8A96A]"
                      value={quote.status}
                      onChange={(e) =>
                        void updateQuote(quote.id, {
                          status: e.target.value as QuoteStatus,
                        })
                      }
                    >
                      {QUOTE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-36 rounded-md border border-[#E5E5E5] px-2 py-1.5 text-[12px] outline-none focus:border-[#C8A96A]"
                      placeholder="Responsável"
                      defaultValue={quote.responsible}
                      onBlur={(e) => {
                        if (e.target.value !== quote.responsible) {
                          void updateQuote(quote.id, {
                            responsible: e.target.value,
                          });
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
