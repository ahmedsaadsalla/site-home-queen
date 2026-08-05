"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Cpf = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  createdAt: string;
  orders: unknown[];
};
type Cnpj = {
  id: string;
  companyName: string;
  tradeName: string;
  cnpj: string;
  status: string;
  city: string;
  state: string;
  blocked?: boolean;
};

export default function AdminClientesPage() {
  const [tab, setTab] = useState<"cpf" | "cnpj">("cpf");
  const [cpf, setCpf] = useState<Cpf[]>([]);
  const [cnpj, setCnpj] = useState<Cnpj[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/clients").then((r) => r.json()).catch(() => ({ cpf: [], cnpj: [] })),
      fetch("/api/atacado/dealers").then((r) => r.json()).catch(() => []),
    ]).then(([clients, dealers]) => {
      setCpf(Array.isArray(clients.cpf) ? clients.cpf : []);
      setCnpj(Array.isArray(dealers) ? dealers : []);
    });
  }, []);

  return (
    <AdminShell title="Clientes" subtitle="Pessoa Física (CPF) e Pessoa Jurídica (CNPJ)">
      <div className="mb-5 flex gap-2">
        {(
          [
            ["cpf", "Pessoa Física"],
            ["cnpj", "Pessoa Jurídica"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] ${
              tab === id
                ? "bg-[#C8A96A] text-[#0F0F10]"
                : "border border-white/15 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "cpf" ? (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#151515]">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.08em] text-white/45">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {cpf.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                    Nenhum cliente CPF.
                  </td>
                </tr>
              ) : (
                cpf.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{c.cpf}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.orders?.length || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#151515]">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.08em] text-white/45">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {cnpj.map((d) => (
                <tr key={d.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{d.tradeName || d.companyName}</td>
                  <td className="px-4 py-3">{d.cnpj}</td>
                  <td className="px-4 py-3">
                    {d.city}/{d.state}
                  </td>
                  <td className="px-4 py-3 text-[#C8A96A]">
                    {d.blocked ? "Bloqueado" : d.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
