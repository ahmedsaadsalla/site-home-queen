"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatBRL,
  homeCatalogConfig,
} from "@/data/homeCatalog";
import { useDealer } from "@/context/DealerContext";
import { useShop } from "@/context/ShopContext";

const COUPONS: Record<string, number> = {
  HOME10: 0.1,
  QUEEN15: 0.15,
  FRETEGRATIS: 0,
};

type FreightOption = {
  id: string;
  carrier: string;
  days: string;
  price: number;
};

export function CartPageView() {
  const { cart, updateQty, removeFromCart, cartSubtotal } = useShop();
  const { isReseller } = useDealer();
  const [cep, setCep] = useState("");
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [freightId, setFreightId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  const freight = freightOptions.find((f) => f.id === freightId);
  const discountRate = coupon && COUPONS[coupon] ? COUPONS[coupon] : 0;
  const discount =
    coupon === "FRETEGRATIS" ? freight?.price || 0 : cartSubtotal * discountRate;
  const shippingCost =
    coupon === "FRETEGRATIS" ? 0 : freight?.price ?? 0;
  const total = Math.max(0, cartSubtotal + shippingCost - discount);

  const recommended = useMemo(() => {
    const ids = new Set(cart.map((c) => c.productId));
    return homeCatalogConfig.products
      .filter((p) => p.featured && !ids.has(p.id))
      .slice(0, 4);
  }, [cart]);

  function calcFreight() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setFreightOptions([]);
      setFreightId("");
      return;
    }
    const opts: FreightOption[] = [
      {
        id: "sedex",
        carrier: "Sedex",
        days: "3 a 5 dias úteis",
        price: 89.9,
      },
      {
        id: "pac",
        carrier: "PAC",
        days: "7 a 12 dias úteis",
        price: 54.9,
      },
      {
        id: "hq",
        carrier: "Home Queen Express",
        days: "5 a 8 dias úteis",
        price: 69.9,
      },
    ];
    setFreightOptions(opts);
    setFreightId(opts[0].id);
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!COUPONS[code] && code !== "FRETEGRATIS") {
      setCoupon("");
      setCouponMsg("Cupom inválido.");
      return;
    }
    setCoupon(code);
    setCouponMsg(
      code === "FRETEGRATIS"
        ? "Frete grátis aplicado."
        : `Cupom ${code} aplicado.`,
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-12 lg:px-8">
      <h1 className="font-display text-[32px] sm:text-[36px]">
        Meu Carrinho
      </h1>

      {cart.length === 0 ? (
        <div className="mt-10 rounded-[16px] border border-dashed border-[#D6D0C6] bg-white px-6 py-16 text-center">
          <p className="text-[15px] text-[#6B6B6B]">Seu carrinho está vazio.</p>
          <Link
            href="/#nosso-catalogo"
            className="mt-5 inline-flex rounded-md bg-[#C5A059] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black"
          >
            Continuar comprando
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)]">
          <div className="space-y-4">
            {cart.map((item) => (
              <article
                key={item.key}
                className="flex flex-wrap gap-4 rounded-[16px] border border-[#EEEAE4] bg-white p-4 sm:flex-nowrap sm:p-5"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[12px] bg-[#F5F5F3]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold">{item.name}</h2>
                  <p className="mt-1 text-[13px] text-[#6B6B6B]">
                    {[item.size, item.color ? `Cor: ${item.color}` : null, item.type]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.mode === "wholesale" && isReseller ? (
                    <p className="mt-1 text-[12px] text-[#C5A059]">
                      Preço atacado {formatBRL(item.unitPrice)}
                      {item.minQty ? ` · mín. ${item.minQty} un.` : ""}
                      {item.retailUnitPrice
                        ? ` · varejo ${formatBRL(item.retailUnitPrice)}`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">
                      Unitário{" "}
                      {formatBRL(
                        item.mode === "wholesale" && item.retailUnitPrice
                          ? item.retailUnitPrice
                          : item.unitPrice,
                      )}
                    </p>
                  )}
                  {item.stock !== undefined && item.stock <= 0 ? (
                    <p className="mt-1 text-[12px] font-medium text-red-600">
                      Indisponível no momento
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="inline-flex items-center overflow-hidden rounded-[10px] border border-[#E5E5E5]">
                      <button
                        type="button"
                        className="px-3 py-2"
                        onClick={() => updateQty(item.key, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center text-[13px]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-2"
                        onClick={() => updateQty(item.key, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-[#6B6B6B]">Subtotal</p>
                      <p className="text-[15px] font-semibold">
                        {formatBRL(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="text-[12px] text-[#8A8A8A] hover:text-red-600"
                    >
                      🗑 Remover
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <div className="rounded-[16px] border border-[#EEEAE4] bg-white p-5">
              <h3 className="text-[14px] font-semibold">Cálculo do Frete</h3>
              <p className="mt-1 text-[12px] text-[#8A8A8A]">
                Digite seu CEP antes do pagamento.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="w-40 rounded-[10px] border border-[#E5E5E5] px-3 py-2.5 text-[14px] outline-none focus:border-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={calcFreight}
                  className="rounded-[10px] bg-[#0F0F10] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white"
                >
                  Calcular Frete
                </button>
              </div>
              {freightOptions.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {freightOptions.map((opt) => (
                    <li key={opt.id}>
                      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-[#EAEAEA] px-3 py-2.5 text-[13px] has-[:checked]:border-[#C5A059]">
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="freight"
                            checked={freightId === opt.id}
                            onChange={() => setFreightId(opt.id)}
                          />
                          <span>
                            <strong>{opt.carrier}</strong>
                            <span className="block text-[12px] text-[#8A8A8A]">
                              {opt.days}
                            </span>
                          </span>
                        </span>
                        <span className="font-semibold">{formatBRL(opt.price)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {recommended.length > 0 ? (
              <div className="pt-4">
                <h3 className="font-display text-[24px]">
                  Quem comprou também levou
                </h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {recommended.map((p) => (
                    <Link
                      key={p.id}
                      href={`/produto/${p.id}`}
                      className="group overflow-hidden rounded-[14px] border border-[#EEEAE4] bg-white"
                    >
                      <div className="relative aspect-[4/3] bg-[#F5F5F3]">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="220px"
                        />
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 text-[13px] font-medium">
                          {p.name}
                        </p>
                        <p className="mt-1 text-[13px] font-semibold text-[#C5A059]">
                          {formatBRL(p.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_8px_30px_rgba(15,15,16,0.04)] lg:sticky lg:top-6">
            <h2 className="text-[15px] font-semibold">Resumo do Pedido</h2>
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-[#8A8A8A]">Subtotal</dt>
                <dd>{formatBRL(cartSubtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8A8A8A]">Frete</dt>
                <dd>
                  {freight
                    ? coupon === "FRETEGRATIS"
                      ? "Grátis"
                      : formatBRL(shippingCost)
                    : "Calcule o CEP"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8A8A8A]">Cupom</dt>
                <dd>{coupon || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8A8A8A]">Desconto</dt>
                <dd>{discount > 0 ? `- ${formatBRL(discount)}` : "—"}</dd>
              </div>
              {freight ? (
                <div className="flex justify-between">
                  <dt className="text-[#8A8A8A]">Prazo</dt>
                  <dd>{freight.days}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[#EAEAEA] pt-3 text-[15px] font-semibold">
                <dt>TOTAL</dt>
                <dd>{formatBRL(total)}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <label className="text-[12px] font-medium text-[#2E2E2E]">
                Cupom
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="HOME10"
                  className="min-w-0 flex-1 rounded-[10px] border border-[#E5E5E5] px-3 py-2.5 text-[13px] outline-none focus:border-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-[10px] border border-[#0F0F10]/20 px-3 py-2.5 text-[11px] font-bold uppercase"
                >
                  Aplicar
                </button>
              </div>
              {couponMsg ? (
                <p className="mt-1.5 text-[12px] text-[#6B6B6B]">{couponMsg}</p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-2">
              <Link
                href="/#nosso-catalogo"
                className="rounded-[10px] border border-[#0F0F10]/25 px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.12em]"
              >
                Continuar Comprando
              </Link>
              <Link
                href="/checkout"
                className="rounded-[10px] bg-[#C5A059] px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                Finalizar Compra
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
