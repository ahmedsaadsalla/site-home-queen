"use client";

import Link from "next/link";
import { RetailAccountView } from "@/components/RetailAccountView";
import { useCustomer } from "@/context/CustomerContext";
import { useDealer } from "@/context/DealerContext";
import { formatCnpj } from "@/lib/wholesalePricing";

const dealerLinks = [
  { href: "/carrinho", label: "Pedidos / Carrinho" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/orcamento", label: "Orçamentos" },
  { href: "/#nosso-catalogo", label: "Catálogo" },
  { href: "/contato", label: "Atendimento" },
];

function DealerAccountBlock() {
  const { dealer, logout } = useDealer();
  if (!dealer) return null;

  return (
    <div className="mx-auto max-w-[820px] px-6 py-16 lg:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#C5A059]">
        Portal Atacado
      </p>
      <h1 className="font-display mt-2 text-[32px] sm:text-[36px]">
        Minha Conta
      </h1>
      <p className="mt-2 text-[14px] text-[#6B6B6B]">
        Dados da empresa, pedidos e condições comerciais.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[14px] border border-[#EEEAE4] bg-white p-5 sm:col-span-2">
          <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#C5A059]">
            Empresa
          </h2>
          <dl className="mt-4 grid gap-3 text-[14px] sm:grid-cols-2">
            <div>
              <dt className="text-[#6B6B6B]">Razão social</dt>
              <dd className="font-semibold">{dealer.companyName}</dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B]">Nome fantasia</dt>
              <dd className="font-semibold">
                {dealer.tradeName || dealer.companyName}
              </dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B]">CNPJ</dt>
              <dd className="font-semibold">{formatCnpj(dealer.cnpj)}</dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B]">E-mail</dt>
              <dd className="font-semibold">{dealer.email}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[14px] border border-[#EEEAE4] bg-white p-5 sm:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {dealerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[12px] border border-[#EEEAE4] px-5 py-3 text-[14px] font-semibold transition hover:border-[#C5A059]"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-[12px] border border-[#E5E5E5] px-5 py-3 text-left text-[14px] font-semibold text-[#6B6B6B] transition hover:border-red-300 hover:text-red-600"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountPageView() {
  const { isReseller, loading: dealerLoading } = useDealer();
  const { loading: customerLoading } = useCustomer();

  if (dealerLoading || customerLoading) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16 text-[14px] text-[#6B6B6B] lg:px-8">
        Carregando...
      </div>
    );
  }

  if (isReseller) {
    return <DealerAccountBlock />;
  }

  return (
    <div className="bg-[#F8F8F6]">
      <RetailAccountView />
    </div>
  );
}
