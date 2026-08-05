"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatBRL } from "@/data/homeCatalog";
import { useCustomer } from "@/context/CustomerContext";
import { useShop } from "@/context/ShopContext";
import type { CartItem } from "@/lib/shopTypes";
import { formatCep, lookupCep } from "@/lib/cep";
import {
  cardBrandLabel,
  detectCardBrand,
  type CardBrand,
} from "@/lib/cardBrand";
import { buildDemoPixCode, pixQrImageUrl } from "@/lib/pix";
import { formatCpf } from "@/lib/wholesalePricing";

const steps = [
  "Carrinho",
  "Identificação",
  "Endereço",
  "Frete",
  "Pagamento",
  "Confirmação",
] as const;

type PayMethod = "pix" | "card" | "boleto";
type AddressMode = "saved" | "new";

function CardBrandMark({ brand }: { brand: CardBrand }) {
  if (brand === "visa") {
    return (
      <svg viewBox="0 0 64 24" className="h-7 w-14" aria-hidden>
        <text
          x="2"
          y="18"
          fill="#FFFFFF"
          fontFamily="Arial, sans-serif"
          fontWeight="800"
          fontSize="18"
          letterSpacing="1"
        >
          VISA
        </text>
      </svg>
    );
  }
  if (brand === "mastercard") {
    return (
      <svg viewBox="0 0 48 30" className="h-8 w-12" aria-hidden>
        <circle cx="18" cy="15" r="10" fill="#EB001B" />
        <circle cx="30" cy="15" r="10" fill="#F79E1B" />
        <path
          d="M24 7.6a10 10 0 010 14.8 10 10 0 000-14.8z"
          fill="#FF5F00"
        />
      </svg>
    );
  }
  if (brand === "amex") {
    return (
      <span className="rounded bg-[#2E77BC] px-2 py-1 text-[10px] font-bold tracking-wide text-white">
        AMEX
      </span>
    );
  }
  if (brand === "elo") {
    return (
      <Image
        src="/pagamentos/elo.png"
        alt="Elo"
        width={40}
        height={40}
        className="h-8 w-8 object-contain"
      />
    );
  }
  if (brand === "hipercard") {
    return (
      <span className="rounded bg-[#B3131B] px-2 py-1 text-[10px] font-bold tracking-wide text-white">
        HIPER
      </span>
    );
  }
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
      Cartão
    </span>
  );
}

function CreditCardVisual({
  number,
  name,
  expiry,
  brand,
}: {
  number: string;
  name: string;
  expiry: string;
  brand: CardBrand;
}) {
  const displayNumber =
    number.replace(/\s/g, "").padEnd(16, "•").replace(/(.{4})/g, "$1 ").trim() ||
    "•••• •••• •••• ••••";

  return (
    <div className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-[18px] bg-gradient-to-br from-[#1a1a1c] via-[#2a2418] to-[#0F0F10] p-5 text-white shadow-[0_20px_50px_rgba(15,15,16,0.28)] sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#C8A96A]/20 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#C8A96A]/10 blur-2xl"
      />

      <div className="relative flex items-start justify-between">
        <div className="h-9 w-12 rounded-md bg-gradient-to-br from-[#E8D5A3] to-[#C8A96A] opacity-90" />
        <CardBrandMark brand={brand} />
      </div>

      <p className="relative mt-7 font-mono text-[18px] tracking-[0.18em] sm:text-[20px]">
        {displayNumber}
      </p>

      <div className="relative mt-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/50">
            Titular
          </p>
          <p className="mt-1 truncate text-[13px] font-semibold uppercase tracking-[0.06em]">
            {name || "SEU NOME"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/50">
            Validade
          </p>
          <p className="mt-1 text-[13px] font-semibold tracking-[0.08em]">
            {expiry || "MM/AA"}
          </p>
        </div>
      </div>

      {brand !== "unknown" ? (
        <p className="relative mt-4 text-[11px] text-[#C8A96A]">
          {cardBrandLabel(brand)} identificado
        </p>
      ) : (
        <p className="relative mt-4 text-[11px] text-white/45">
          Digite o número para identificar a bandeira
        </p>
      )}
    </div>
  );
}

function PayIcons({ method }: { method: PayMethod }) {
  if (method === "pix") {
    return (
      <Image
        src="/pagamentos/pix.png"
        alt=""
        width={40}
        height={40}
        className="h-9 w-9 object-contain"
      />
    );
  }
  if (method === "card") {
    return (
      <span className="inline-flex items-center gap-2">
        <svg viewBox="0 0 48 24" className="h-6 w-12" aria-hidden>
          <text
            x="0"
            y="17"
            fill="#1A1F71"
            fontFamily="Arial, sans-serif"
            fontWeight="800"
            fontSize="14"
          >
            VISA
          </text>
        </svg>
        <svg viewBox="0 0 40 24" className="h-6 w-10" aria-hidden>
          <circle cx="14" cy="12" r="8" fill="#EB001B" />
          <circle cx="26" cy="12" r="8" fill="#F79E1B" />
          <path
            d="M20 6.2a8 8 0 010 11.6 8 8 0 000-11.6z"
            fill="#FF5F00"
          />
        </svg>
      </span>
    );
  }
  return (
    <svg viewBox="0 0 48 32" className="h-7 w-11" aria-hidden>
      <rect x="2" y="4" width="2.2" height="24" fill="#0F0F10" />
      <rect x="6" y="4" width="1.2" height="24" fill="#0F0F10" />
      <rect x="9" y="4" width="3" height="24" fill="#0F0F10" />
      <rect x="14" y="4" width="1.2" height="24" fill="#0F0F10" />
      <rect x="17.5" y="4" width="2" height="24" fill="#0F0F10" />
      <rect x="22" y="4" width="1.2" height="24" fill="#0F0F10" />
      <rect x="25" y="4" width="3.5" height="24" fill="#0F0F10" />
      <rect x="30.5" y="4" width="1.2" height="24" fill="#0F0F10" />
      <rect x="34" y="4" width="2.2" height="24" fill="#0F0F10" />
      <rect x="38.5" y="4" width="1.2" height="24" fill="#0F0F10" />
      <rect x="42" y="4" width="2.5" height="24" fill="#0F0F10" />
    </svg>
  );
}

const field =
  "w-full rounded-[16px] border border-[#E5E5E5] bg-white px-4 py-3.5 text-[14px] text-[#0F0F10] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#C8A96A]";
const btnGold =
  "inline-flex items-center justify-center rounded-[16px] bg-[#C8A96A] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F]";
const btnGhost =
  "inline-flex items-center justify-center rounded-[16px] border border-[#0F0F10]/20 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:border-[#C8A96A]";

export function CheckoutPageView() {
  const { cart, cartSubtotal, clearCart } = useShop();
  const { customer, isCustomer, setCustomer } = useCustomer();
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState("");
  const [pay, setPay] = useState<PayMethod>("pix");
  const [addressMode, setAddressMode] = useState<AddressMode>("new");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "SC",
    freight: "pac",
  });
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    installments: "1",
  });
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [paidTotal, setPaidTotal] = useState(0);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [cardPayPhase, setCardPayPhase] = useState<0 | 1 | 2>(0);
  const [cardLast4, setCardLast4] = useState("");
  const [boletoReady, setBoletoReady] = useState(false);

  const previewItems = orderId ? orderItems : cart;

  const freightPrice =
    form.freight === "sedex" ? 89.9 : form.freight === "hq" ? 69.9 : 54.9;
  const total = cartSubtotal + freightPrice;

  const pixCode = useMemo(() => {
    if (!orderId || pay !== "pix") return "";
    return buildDemoPixCode(orderId, paidTotal || total);
  }, [orderId, pay, paidTotal, total]);

  const cardBrand = useMemo(
    () => detectCardBrand(card.number),
    [card.number],
  );

  useEffect(() => {
    if (!orderId || pay !== "card") return;
    setCardPayPhase(0);
    const t1 = window.setTimeout(() => setCardPayPhase(1), 1400);
    const t2 = window.setTimeout(() => setCardPayPhase(2), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [orderId, pay]);

  useEffect(() => {
    if (!orderId || pay !== "boleto") return;
    setBoletoReady(false);
    const t = window.setTimeout(() => setBoletoReady(true), 2200);
    return () => window.clearTimeout(t);
  }, [orderId, pay]);

  const boletoLine = useMemo(() => {
    if (!orderId) return "";
    const seed = orderId.replace(/\D/g, "") || "34191";
    const base = `${seed}000000${String(Math.round((paidTotal || total) * 100)).padStart(10, "0")}`.slice(0, 47);
    return base.replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})?/, (_, a, b, c, d, e, f, g, h) =>
      [a, b, c, d, e, f, g, h].filter(Boolean).join(" "),
    ) || `34191.79001 01043.510047 91020.150008 1 ${base.slice(0, 14)}`;
  }, [orderId, paidTotal, total]);

  function openBoletoView() {
    const w = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Boleto ${orderId}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#0F0F10;background:#F8F8F6}
        .card{background:#fff;border:1px solid #E8E4DC;border-radius:16px;padding:28px;max-width:640px;margin:0 auto}
        h1{font-size:22px;margin:0 0 8px}
        .muted{color:#6B6B6B;font-size:13px}
        .bars{display:flex;gap:2px;height:56px;margin:24px 0;align-items:stretch}
        .bars span{display:block;background:#0F0F10;width:2px}
        .bars span:nth-child(3n){width:4px}
        .bars span:nth-child(5n){width:1px}
        .line{font-family:monospace;font-size:14px;letter-spacing:1px;word-break:break-all;border:1px dashed #C8A96A;padding:12px;border-radius:10px;background:#FAF7F0}
        .row{display:flex;justify-content:space-between;margin-top:16px;font-size:14px}
        @media print{body{background:#fff;padding:0}.card{border:none}}
      </style></head><body>
      <div class="card">
        <h1>Home Queen — Boleto bancário</h1>
        <p class="muted">Pedido ${orderId} · Vencimento em 3 dias úteis</p>
        <div class="bars">${Array.from({ length: 60 }, (_, i) => `<span style="height:${40 + (i % 5) * 4}px"></span>`).join("")}</div>
        <div class="line">${boletoLine}</div>
        <div class="row"><span>Beneficiário</span><strong>Home Queen Camas Box</strong></div>
        <div class="row"><span>Valor</span><strong>${formatBRL(paidTotal || total)}</strong></div>
        <div class="row"><span>Status</span><strong>Aguardando pagamento</strong></div>
        <p class="muted" style="margin-top:20px">Documento demonstrativo para visualização. Em produção, o boleto oficial será gerado pelo gateway.</p>
        <script>setTimeout(function(){window.print()},400)</script>
      </div></body></html>`);
    w.document.close();
  }

  const savedAddresses = customer?.addresses ?? [];
  const hasSavedAddresses = savedAddresses.length > 0;

  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      ...f,
      name: f.name || customer.name,
      email: f.email || customer.email,
      phone: f.phone || customer.phone || customer.whatsapp,
      cpf: f.cpf || formatCpf(customer.cpf),
    }));
    if (customer.addresses.length > 0) {
      const def =
        customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
      setAddressMode("saved");
      setSelectedAddressId(def.id);
      applyAddress(def);
    }
  }, [customer]);

  function applyAddress(addr: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  }) {
    setForm((f) => ({
      ...f,
      cep: addr.cep,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || "",
      district: addr.district,
      city: addr.city,
      state: addr.state,
    }));
  }

  async function onCepChange(value: string) {
    const formatted = formatCep(value);
    setForm((f) => ({ ...f, cep: formatted }));
    setCepError("");

    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const found = await lookupCep(digits);
      if (!found) {
        setCepError("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }
      setForm((f) => ({
        ...f,
        cep: found.cep,
        street: found.street || f.street,
        district: found.district || f.district,
        city: found.city || f.city,
        state: found.state || f.state,
      }));
    } catch {
      setCepError("Não foi possível consultar o CEP. Edite o endereço à mão.");
    } finally {
      setCepLoading(false);
    }
  }

  const progress = useMemo(() => {
    if (step >= 5 && orderId) return 5;
    return step;
  }, [step, orderId]);

  function formatCardNumber(value: string) {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim();
  }

  function formatExpiry(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 4);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  }

  function nextFromIdentity(e: FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  function nextFromAddress(e: FormEvent) {
    e.preventDefault();
    setStep(3);
  }

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (pay === "card") {
      const digits = card.number.replace(/\D/g, "");
      if (digits.length < 13) return;
      if (!card.name.trim() || card.expiry.length < 4 || card.cvv.length < 3) {
        return;
      }
      setCardLast4(digits.slice(-4));
      setCardPayPhase(0);
    }

    const id = `HQ${Date.now().toString(36).toUpperCase()}`;
    setOrderItems([...cart]);
    setPaidTotal(total);
    setOrderId(id);
    setStep(5);

    if (isCustomer) {
      try {
        const res = await fetch("/api/cliente/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            total,
            items: cart.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              image: item.image,
            })),
          }),
        });
        const data = (await res.json()) as { customer?: typeof customer };
        if (data.customer) setCustomer(data.customer);
      } catch {
        /* pedido local segue mesmo se sync falhar */
      }
    }

    clearCart();
  }

  if (cart.length === 0 && !orderId) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16 text-center lg:px-8">
        <h1 className="font-display text-[32px] text-[#0F0F10]">Checkout</h1>
        <p className="mt-3 text-[14px] text-[#6B6B6B]">
          Seu carrinho está vazio. Adicione produtos para finalizar a compra.
        </p>
        <Link href="/#nosso-catalogo" className={`${btnGold} mt-6`}>
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-12 lg:px-8">
      <h1 className="font-display text-[32px] text-[#0F0F10] sm:text-[36px]">
        Finalizar Compra
      </h1>

      <ol className="mt-8 flex flex-wrap gap-2">
        {steps.map((label, i) => {
          const active = i === progress;
          const done = i < progress;
          return (
            <li
              key={label}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                active
                  ? "bg-[#C8A96A] text-[#0F0F10]"
                  : done
                    ? "bg-[#0F0F10] text-white"
                    : "bg-[#EAEAEA] text-[#6B6B6B]"
              }`}
            >
              {label}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_12px_36px_rgba(15,15,16,0.05)] sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              {step === 1 ? (
                <form onSubmit={nextFromIdentity} className="space-y-4">
                  <h2 className="font-display text-[24px] text-[#0F0F10]">
                    Identificação
                  </h2>
                  <input
                    required
                    className={field}
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <input
                    required
                    type="email"
                    className={field}
                    placeholder="E-mail"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      className={field}
                      placeholder="Telefone / WhatsApp"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                    <input
                      required
                      className={field}
                      placeholder="CPF"
                      value={form.cpf}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          cpf: formatCpf(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <button type="submit" className={btnGold}>
                    Continuar para endereço
                  </button>
                </form>
              ) : null}

              {step === 2 ? (
                <form onSubmit={nextFromAddress} className="space-y-4">
                  <h2 className="font-display text-[24px] text-[#0F0F10]">
                    Endereço
                  </h2>

                  {hasSavedAddresses ? (
                    <div className="space-y-3">
                      <p className="text-[13px] text-[#6B6B6B]">
                        Escolha um endereço do seu cadastro ou informe um novo.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAddressMode("saved")}
                          className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                            addressMode === "saved"
                              ? "bg-[#C8A96A] text-[#0F0F10]"
                              : "bg-[#F8F8F6] text-[#6B6B6B]"
                          }`}
                        >
                          Meus endereços
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressMode("new")}
                          className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                            addressMode === "new"
                              ? "bg-[#C8A96A] text-[#0F0F10]"
                              : "bg-[#F8F8F6] text-[#6B6B6B]"
                          }`}
                        >
                          Novo endereço
                        </button>
                      </div>

                      {addressMode === "saved" ? (
                        <div className="space-y-2">
                          {savedAddresses.map((addr) => {
                            const selected = selectedAddressId === addr.id;
                            return (
                              <label
                                key={addr.id}
                                className={`flex cursor-pointer gap-3 rounded-[16px] border px-4 py-3.5 transition ${
                                  selected
                                    ? "border-[#C8A96A] bg-[#FAF7F0]"
                                    : "border-[#EAEAEA] bg-[#F8F8F6] hover:border-[#C8A96A]/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="saved-address"
                                  className="mt-1 accent-[#C8A96A]"
                                  checked={selected}
                                  onChange={() => {
                                    setSelectedAddressId(addr.id);
                                    applyAddress(addr);
                                  }}
                                />
                                <span className="min-w-0 text-[13px]">
                                  <span className="font-semibold text-[#0F0F10]">
                                    {addr.label}
                                    {addr.isDefault ? (
                                      <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">
                                        Padrão
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="mt-1 block text-[#6B6B6B]">
                                    {addr.street}, {addr.number}
                                    {addr.complement
                                      ? ` — ${addr.complement}`
                                      : ""}
                                    <br />
                                    {addr.district} · {addr.city}/{addr.state} ·
                                    CEP {addr.cep}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : isCustomer ? (
                    <p className="rounded-[16px] border border-dashed border-[#D6D0C6] bg-[#F8F8F6] px-4 py-3 text-[13px] text-[#6B6B6B]">
                      Você ainda não tem endereço salvo. Preencha abaixo — ele
                      poderá ser guardado na área do cliente.
                    </p>
                  ) : (
                    <p className="text-[13px] text-[#6B6B6B]">
                      <Link
                        href="/minha-conta"
                        className="font-semibold text-[#C8A96A] hover:underline"
                      >
                        Entre na área do cliente
                      </Link>{" "}
                      para usar endereços salvos nas próximas compras.
                    </p>
                  )}

                  {addressMode === "new" || !hasSavedAddresses ? (
                    <>
                      <div>
                        <input
                          required
                          className={field}
                          placeholder="CEP"
                          inputMode="numeric"
                          value={form.cep}
                          onChange={(e) => void onCepChange(e.target.value)}
                        />
                        {cepLoading ? (
                          <p className="mt-1.5 text-[12px] text-[#C8A96A]">
                            Buscando endereço...
                          </p>
                        ) : null}
                        {cepError ? (
                          <p className="mt-1.5 text-[12px] text-red-600">
                            {cepError}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[12px] text-[#6B6B6B]">
                            Digite o CEP para preencher automaticamente. Você
                            pode editar qualquer campo.
                          </p>
                        )}
                      </div>
                      <input
                        required
                        className={field}
                        placeholder="Rua"
                        value={form.street}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, street: e.target.value }))
                        }
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input
                          required
                          className={field}
                          placeholder="Número"
                          value={form.number}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, number: e.target.value }))
                          }
                        />
                        <input
                          className={field}
                          placeholder="Complemento"
                          value={form.complement}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              complement: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <input
                        required
                        className={field}
                        placeholder="Bairro"
                        value={form.district}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, district: e.target.value }))
                        }
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input
                          required
                          className={field}
                          placeholder="Cidade"
                          value={form.city}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, city: e.target.value }))
                          }
                        />
                        <input
                          required
                          className={field}
                          placeholder="UF"
                          value={form.state}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, state: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className={btnGhost}
                    >
                      Voltar
                    </button>
                    <button type="submit" className={btnGold}>
                      Continuar para frete
                    </button>
                  </div>
                </form>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <h2 className="font-display text-[24px] text-[#0F0F10]">
                    Frete
                  </h2>
                  {(
                    [
                      ["pac", "PAC", "7 a 12 dias úteis", 54.9],
                      ["sedex", "Sedex", "3 a 5 dias úteis", 89.9],
                      ["hq", "Home Queen Express", "5 a 8 dias úteis", 69.9],
                    ] as const
                  ).map(([id, name, days, price]) => {
                    const selected = form.freight === id;
                    return (
                      <label
                        key={id}
                        className={`flex cursor-pointer items-center justify-between rounded-[16px] border px-4 py-3.5 transition ${
                          selected
                            ? "border-[#C8A96A] bg-[#FAF7F0]"
                            : "border-[#EAEAEA] hover:border-[#C8A96A]/40"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-[13px]">
                          <input
                            type="radio"
                            name="freight"
                            className="accent-[#C8A96A]"
                            checked={selected}
                            onChange={() =>
                              setForm((f) => ({ ...f, freight: id }))
                            }
                          />
                          <span>
                            <strong className="text-[#0F0F10]">{name}</strong>
                            <span className="block text-[#8A8A8A]">{days}</span>
                          </span>
                        </span>
                        <span className="font-semibold text-[#0F0F10]">
                          {formatBRL(price)}
                        </span>
                      </label>
                    );
                  })}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className={btnGhost}
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className={btnGold}
                    >
                      Continuar para pagamento
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <form onSubmit={placeOrder} className="space-y-4">
                  <h2 className="font-display text-[24px] text-[#0F0F10]">
                    Pagamento
                  </h2>
                  {(
                    [
                      ["pix", "PIX", "Aprovação imediata"],
                      ["card", "Cartão de crédito", "Em até 10x sem juros"],
                      ["boleto", "Boleto", "Vencimento em 3 dias úteis"],
                    ] as const
                  ).map(([id, label, hint]) => {
                    const selected = pay === id;
                    return (
                      <label
                        key={id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-[16px] border px-4 py-3.5 transition ${
                          selected
                            ? "border-[#C8A96A] bg-[#FAF7F0]"
                            : "border-[#EAEAEA] hover:border-[#C8A96A]/40"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <input
                            type="radio"
                            name="pay"
                            className="accent-[#C8A96A]"
                            checked={selected}
                            onChange={() => setPay(id)}
                          />
                          <span>
                            <span className="block text-[14px] font-semibold text-[#0F0F10]">
                              {label}
                            </span>
                            <span className="text-[12px] text-[#6B6B6B]">
                              {hint}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 opacity-90">
                          <PayIcons method={id} />
                        </span>
                      </label>
                    );
                  })}

                  <AnimatePresence initial={false}>
                    {pay === "card" ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 space-y-4 rounded-[16px] border border-[#C8A96A]/35 bg-[#F8F8F6] p-4 sm:p-5">
                          <CreditCardVisual
                            number={card.number}
                            name={card.name}
                            expiry={card.expiry}
                            brand={cardBrand}
                          />

                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                required={pay === "card"}
                                className={`${field} pr-16`}
                                placeholder="Número do cartão"
                                inputMode="numeric"
                                autoComplete="cc-number"
                                value={card.number}
                                onChange={(e) =>
                                  setCard((c) => ({
                                    ...c,
                                    number: formatCardNumber(e.target.value),
                                  }))
                                }
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-90">
                                {cardBrand === "visa" ? (
                                  <svg viewBox="0 0 48 24" className="h-5 w-10" aria-hidden>
                                    <text
                                      x="0"
                                      y="17"
                                      fill="#1A1F71"
                                      fontFamily="Arial, sans-serif"
                                      fontWeight="800"
                                      fontSize="14"
                                    >
                                      VISA
                                    </text>
                                  </svg>
                                ) : cardBrand === "mastercard" ? (
                                  <svg viewBox="0 0 40 24" className="h-5 w-9" aria-hidden>
                                    <circle cx="14" cy="12" r="8" fill="#EB001B" />
                                    <circle cx="26" cy="12" r="8" fill="#F79E1B" />
                                  </svg>
                                ) : cardBrand === "elo" ? (
                                  <Image
                                    src="/pagamentos/elo.png"
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="h-7 w-7 object-contain"
                                  />
                                ) : cardBrand !== "unknown" ? (
                                  <span className="text-[10px] font-bold uppercase text-[#C8A96A]">
                                    {cardBrandLabel(cardBrand)}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                            <input
                              required={pay === "card"}
                              className={field}
                              placeholder="Nome impresso no cartão"
                              autoComplete="cc-name"
                              value={card.name}
                              onChange={(e) =>
                                setCard((c) => ({
                                  ...c,
                                  name: e.target.value.toUpperCase(),
                                }))
                              }
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                              <input
                                required={pay === "card"}
                                className={field}
                                placeholder="Validade MM/AA"
                                inputMode="numeric"
                                autoComplete="cc-exp"
                                value={card.expiry}
                                onChange={(e) =>
                                  setCard((c) => ({
                                    ...c,
                                    expiry: formatExpiry(e.target.value),
                                  }))
                                }
                              />
                              <input
                                required={pay === "card"}
                                className={field}
                                placeholder="CVV"
                                inputMode="numeric"
                                autoComplete="cc-csc"
                                maxLength={cardBrand === "amex" ? 4 : 3}
                                value={card.cvv}
                                onChange={(e) =>
                                  setCard((c) => ({
                                    ...c,
                                    cvv: e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, cardBrand === "amex" ? 4 : 3),
                                  }))
                                }
                              />
                              <select
                                className={field}
                                value={card.installments}
                                onChange={(e) =>
                                  setCard((c) => ({
                                    ...c,
                                    installments: e.target.value,
                                  }))
                                }
                              >
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(
                                  (n) => (
                                    <option key={n} value={String(n)}>
                                      {n}x de{" "}
                                      {formatBRL(Math.round(total / n))}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {pay === "pix" ? (
                    <p className="rounded-[16px] bg-[#F8F8F6] px-4 py-3 text-[13px] text-[#6B6B6B]">
                      Após confirmar, o QR Code PIX será gerado para pagamento
                      imediato.
                    </p>
                  ) : null}
                  {pay === "boleto" ? (
                    <p className="rounded-[16px] bg-[#F8F8F6] px-4 py-3 text-[13px] text-[#6B6B6B]">
                      O boleto será enviado por e-mail com vencimento em 3 dias
                      úteis.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className={btnGhost}
                    >
                      Voltar
                    </button>
                    <button type="submit" className={btnGold}>
                      {pay === "card"
                        ? `Conferir e pagar · ${formatBRL(total)}`
                        : `Confirmar pedido · ${formatBRL(total)}`}
                    </button>
                  </div>
                </form>
              ) : null}

              {step === 5 && orderId ? (
                <div className="space-y-5 text-center sm:text-left">
                  <h2 className="font-display text-[28px] text-[#0F0F10]">
                    {pay === "pix"
                      ? "Pedido gerado — pague com PIX"
                      : pay === "card"
                        ? cardPayPhase < 2
                          ? "Processando pagamento"
                          : "Pedido solicitado"
                        : pay === "boleto"
                          ? boletoReady
                            ? "Boleto gerado"
                            : "Gerando boleto"
                          : "Pedido confirmado"}
                  </h2>
                  <p className="text-[14px] text-[#2E2E2E]">
                    Número do pedido: <strong>{orderId}</strong>
                  </p>

                  {pay === "pix" && pixCode ? (
                    <div className="rounded-[16px] border border-[#C8A96A]/40 bg-[#F8F8F6] p-5 text-center">
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
                        Escaneie o QR Code
                      </p>
                      <p className="mt-1 text-[13px] text-[#6B6B6B]">
                        Valor:{" "}
                        <strong className="text-[#0F0F10]">
                          {formatBRL(paidTotal || total)}
                        </strong>
                      </p>
                      <div className="mx-auto mt-4 flex h-[220px] w-[220px] items-center justify-center overflow-hidden rounded-[16px] border border-[#EEEAE4] bg-white p-3 shadow-[0_8px_24px_rgba(15,15,16,0.06)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={pixQrImageUrl(pixCode)}
                          alt="QR Code PIX"
                          width={196}
                          height={196}
                          className="h-[196px] w-[196px]"
                        />
                      </div>

                      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
                        Pix Copia e Cola
                      </p>
                      <div className="mt-2 break-all rounded-[16px] border border-[#E5E5E5] bg-white px-4 py-3 text-left text-[11px] leading-5 text-[#2E2E2E]">
                        {pixCode}
                      </div>
                      <button
                        type="button"
                        className={`${btnGold} mt-3 w-full sm:w-auto`}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(pixCode);
                            setPixCopied(true);
                            window.setTimeout(() => setPixCopied(false), 2000);
                          } catch {
                            setPixCopied(false);
                          }
                        }}
                      >
                        {pixCopied ? "Código copiado" : "Copiar código PIX"}
                      </button>
                      <p className="mt-3 text-[12px] leading-5 text-[#6B6B6B]">
                        Abra o app do banco, escolha PIX e cole o código ou
                        escaneie o QR. O pedido é confirmado após o pagamento.
                      </p>
                    </div>
                  ) : null}

                  {pay === "card" ? (
                    <div className="rounded-[16px] border border-[#C8A96A]/35 bg-[#F8F8F6] p-5">
                      <p className="text-[13px] text-[#6B6B6B]">
                        Cartão {cardBrandLabel(cardBrand)} final{" "}
                        <strong className="text-[#0F0F10]">
                          •••• {cardLast4 || "****"}
                        </strong>
                        {" · "}
                        {card.installments}x de{" "}
                        {formatBRL(
                          Math.round(
                            (paidTotal || total) / Number(card.installments || 1),
                          ),
                        )}
                      </p>

                      <ol className="mt-5 space-y-3">
                        {(
                          [
                            {
                              phase: 0 as const,
                              title: "Conferindo pagamento",
                              text: "Validando dados do cartão com a operadora.",
                            },
                            {
                              phase: 1 as const,
                              title: "Pagamento confirmado",
                              text: "Cobrança autorizada com sucesso.",
                            },
                            {
                              phase: 2 as const,
                              title: "Pedido solicitado",
                              text: "Seu pedido foi registrado e seguirá para produção.",
                            },
                          ] as const
                        ).map((item) => {
                          const done = cardPayPhase > item.phase;
                          const active = cardPayPhase === item.phase;
                          return (
                            <li
                              key={item.title}
                              className={`flex gap-3 rounded-[14px] border px-4 py-3 transition ${
                                active || done
                                  ? "border-[#C8A96A] bg-white"
                                  : "border-[#EAEAEA] bg-white/60 opacity-55"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                  done
                                    ? "bg-[#C8A96A] text-[#0F0F10]"
                                    : active
                                      ? "border-2 border-[#C8A96A] text-[#C8A96A]"
                                      : "border border-[#D6D0C6] text-[#9A9A9A]"
                                }`}
                              >
                                {done ? "✓" : active ? "…" : item.phase + 1}
                              </span>
                              <span className="min-w-0 text-left">
                                <span className="block text-[14px] font-semibold text-[#0F0F10]">
                                  {item.title}
                                  {active && item.phase < 2 ? (
                                    <span className="ml-2 text-[11px] font-medium text-[#C8A96A]">
                                      em andamento
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block text-[12px] text-[#6B6B6B]">
                                  {item.text}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ol>

                      {cardPayPhase >= 2 ? (
                        <p className="mt-4 text-[13px] leading-6 text-[#2E2E2E]">
                          Pagamento confirmado e pedido solicitado. Acompanhe o
                          status na área do cliente.
                        </p>
                      ) : (
                        <p className="mt-4 text-[13px] text-[#6B6B6B]">
                          Aguarde enquanto confirmamos o pagamento do cartão…
                        </p>
                      )}
                    </div>
                  ) : null}

                  {pay === "boleto" ? (
                    <div className="rounded-[16px] border border-[#C8A96A]/35 bg-[#F8F8F6] p-5 text-center sm:text-left">
                      {!boletoReady ? (
                        <div className="flex flex-col items-center py-6">
                          <span
                            className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#E8E4DC] border-t-[#C8A96A]"
                            aria-hidden
                          />
                          <p className="mt-4 text-[14px] font-semibold text-[#0F0F10]">
                            Gerando boleto…
                          </p>
                          <p className="mt-1 text-[13px] text-[#6B6B6B]">
                            Preparando envio por e-mail
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-[14px] border border-[#C8A96A]/40 bg-white px-4 py-3">
                            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#C8A96A]">
                              Boleto enviado por e-mail
                            </p>
                            <p className="mt-1 text-[13px] text-[#6B6B6B]">
                              Enviamos o boleto para{" "}
                              <strong className="text-[#0F0F10]">
                                {form.email || "seu e-mail"}
                              </strong>
                              .
                            </p>
                          </div>

                          <div className="rounded-[14px] border border-[#EAEAEA] bg-white px-4 py-3">
                            <p className="text-[14px] font-semibold text-[#0F0F10]">
                              Aguardando o pagamento
                            </p>
                            <p className="mt-1 text-[13px] text-[#6B6B6B]">
                              Vencimento em 3 dias úteis · Valor{" "}
                              <strong className="text-[#0F0F10]">
                                {formatBRL(paidTotal || total)}
                              </strong>
                            </p>
                          </div>

                          <div className="overflow-hidden rounded-[14px] border border-dashed border-[#C8A96A]/50 bg-white px-4 py-4">
                            <div className="flex h-12 items-end justify-center gap-[2px]">
                              {Array.from({ length: 42 }, (_, i) => (
                                <span
                                  key={i}
                                  className="w-[2px] bg-[#0F0F10]"
                                  style={{ height: `${28 + (i % 6) * 4}px` }}
                                />
                              ))}
                            </div>
                            <p className="mt-3 break-all text-center font-mono text-[11px] tracking-wide text-[#2E2E2E]">
                              {boletoLine}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={openBoletoView}
                            className={`${btnGold} w-full sm:w-auto`}
                          >
                            Visualizar boleto
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {pay !== "pix" && pay !== "card" && pay !== "boleto" ? (
                    <p className="text-[14px] leading-7 text-[#6B6B6B]">
                      Recebemos seu pedido. Você pode acompanhar o status e o
                      rastreamento na área do cliente.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Link href="/" className={btnGold}>
                      Voltar à home
                    </Link>
                    <Link href="/minha-conta" className={btnGhost}>
                      Área do cliente
                    </Link>
                    <Link href="/contato" className={btnGhost}>
                      Falar com atendimento
                    </Link>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="h-fit rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_12px_36px_rgba(15,15,16,0.05)] sm:p-6">
          <h3 className="text-[14px] font-semibold text-[#0F0F10]">
            {orderId ? "Produtos do pedido" : "Seus produtos"}
          </h3>
          <p className="mt-1 text-[12px] text-[#6B6B6B]">
            Visualização do item — apenas para conferência.
          </p>

          <ul className="mt-4 space-y-4">
            {previewItems.length === 0 ? (
              <li className="rounded-[16px] border border-dashed border-[#D6D0C6] bg-[#F8F8F6] px-4 py-8 text-center text-[13px] text-[#6B6B6B]">
                Nenhum produto no pedido.
              </li>
            ) : (
              previewItems.map((item) => (
                <li
                  key={item.key}
                  className="overflow-hidden rounded-[16px] border border-[#F0EBE3] bg-[#F8F8F6]"
                >
                  <div className="relative aspect-[4/3] w-full bg-[#EEEAE4]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 320px"
                    />
                  </div>
                  <div className="space-y-1.5 p-3.5">
                    <p className="font-display text-[17px] leading-snug text-[#0F0F10]">
                      {item.name}
                    </p>
                    <p className="text-[12px] leading-5 text-[#6B6B6B]">
                      {[
                        item.size,
                        item.color ? `Cor: ${item.color}` : null,
                        item.type,
                        item.mattress && item.mattress !== "Sem colchão"
                          ? item.mattress
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Configuração selecionada"}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[12px] text-[#6B6B6B]">
                        Qtd. <strong className="text-[#0F0F10]">{item.quantity}</strong>
                      </span>
                      <span className="text-[14px] font-semibold text-[#C8A96A]">
                        {formatBRL(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8A8A8A]">
                      Unitário {formatBRL(item.unitPrice)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>

          {!orderId ? (
            <dl className="mt-5 space-y-2 border-t border-[#EAEAEA] pt-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-[#8A8A8A]">Subtotal</dt>
                <dd>{formatBRL(cartSubtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8A8A8A]">Frete</dt>
                <dd>{formatBRL(freightPrice)}</dd>
              </div>
              <div className="flex justify-between text-[15px] font-semibold text-[#0F0F10]">
                <dt>Total</dt>
                <dd>{formatBRL(total)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 border-t border-[#EAEAEA] pt-4 text-[13px] text-[#6B6B6B]">
              Total pago:{" "}
              <strong className="text-[#0F0F10]">{formatBRL(paidTotal || total)}</strong>{" "}
              via {pay === "pix" ? "PIX" : pay === "card" ? "Cartão" : "Boleto"}
              {pay === "card" && Number(card.installments) > 1
                ? ` · ${card.installments}x`
                : ""}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
