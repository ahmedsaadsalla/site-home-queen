"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BRAZIL_STATES } from "@/data/contact";
import {
  formatBRL,
  getVisibleCategories,
  homeCatalogConfig,
} from "@/data/homeCatalog";
import { useDealer } from "@/context/DealerContext";
import {
  formatCnpj,
  getMinQty,
  getWholesaleUnit,
} from "@/lib/wholesalePricing";
import { PasswordInput } from "@/components/PasswordInput";

const inputClass =
  "w-full rounded-md border border-[#E5E5E5] bg-white px-4 py-3 text-[14px] text-[#0F0F10] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#C5A059]";

export function WholesalePageView() {
  const { dealer, loading, setDealer, logout, isReseller } = useDealer();

  const [loginCnpj, setLoginCnpj] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [reg, setReg] = useState({
    companyName: "",
    tradeName: "",
    cnpj: "",
    stateRegistration: "",
    contactName: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "",
    state: "SC",
    password: "",
    passwordConfirm: "",
    acceptTerms: false,
  });
  const [regError, setRegError] = useState("");
  const [regOk, setRegOk] = useState(false);
  const [regBusy, setRegBusy] = useState(false);
  const [cmsBanner, setCmsBanner] = useState({
    title: "Seja um Revendedor Home Queen",
    text: "Trabalhe com uma fábrica especializada em camas box premium e tenha acesso a preços exclusivos, suporte comercial e entrega para todo o Brasil.",
    image: "/fabrica/cama-03.jpg",
    minOrderNote: "",
    benefits: [] as string[],
  });

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (!cms?.wholesale) return;
        setCmsBanner({
          title: cms.wholesale.bannerTitle || cmsBanner.title,
          text: cms.wholesale.bannerText || cmsBanner.text,
          image:
            cms.wholesale.bannerImage ||
            cms.wholesale.background ||
            cmsBanner.image,
          minOrderNote: cms.wholesale.minOrderNote || "",
          benefits: cms.wholesale.benefits || [],
        });
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#acesso") return;
    const t = window.setTimeout(() => {
      document.getElementById("acesso")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [loading, isReseller]);

  const categories = useMemo(() => {
    const visible = getVisibleCategories();
    return visible.map((cat) => {
      const count = homeCatalogConfig.products.filter(
        (p) => p.categoryId === cat.id,
      ).length;
      const sample = homeCatalogConfig.products.find(
        (p) => p.categoryId === cat.id,
      );
      const retail = sample?.price ?? 0;
      const wholesale = getWholesaleUnit(retail, dealer?.discountPercent);
      const minQty = getMinQty(cat.id, dealer?.globalMinOrder);
      return {
        ...cat,
        count,
        wholesale,
        minQty,
        discount: dealer?.discountPercent ?? 28,
      };
    });
  }, [dealer?.discountPercent, dealer?.globalMinOrder]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      const res = await fetch("/api/atacado/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnpj: loginCnpj,
          password: loginPassword,
          remember,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        dealer?: typeof dealer;
      };
      if (!res.ok) {
        setLoginError(data.error || "Falha no login.");
        return;
      }
      if (data.dealer) setDealer(data.dealer);
      setLoginPassword("");
    } catch {
      setLoginError("Falha de conexão.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegBusy(true);
    try {
      const res = await fetch("/api/atacado/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setRegError(data.error || "Falha no cadastro.");
        return;
      }
      setRegOk(true);
      setReg((r) => ({
        ...r,
        password: "",
        passwordConfirm: "",
        acceptTerms: false,
      }));
    } catch {
      setRegError("Falha de conexão.");
    } finally {
      setRegBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F5F5F3] text-[14px] text-[#6B6B6B]">
        Carregando portal...
      </div>
    );
  }

  if (isReseller && dealer) {
    return (
      <div className="bg-[#F5F5F3] text-[#0F0F10]">
        <section className="border-b border-[#E8E4DC] bg-[#0F0F10] text-white">
          <div className="mx-auto max-w-[1240px] px-6 py-12 lg:px-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#C8A96A]">
              Portal do Revendedor
            </p>
            <h1 className="font-display mt-3 text-[32px] sm:text-[40px]">
              Olá, {dealer.tradeName || dealer.companyName}
            </h1>
            <p className="mt-3 max-w-[560px] text-[15px] leading-7 text-white/75">
              Bem-vindo ao Portal Atacado. Preços exclusivos, pedido mínimo e
              estoque no mesmo catálogo da Home Queen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/#nosso-catalogo"
                className="inline-flex rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                Ver produtos
              </Link>
              <Link
                href="/carrinho"
                className="inline-flex rounded-md border border-white/35 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Pedidos / Carrinho
              </Link>
              <Link
                href="/orcamento"
                className="inline-flex rounded-md border border-white/35 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Orçamentos
              </Link>
              <Link
                href="/minha-conta"
                className="inline-flex rounded-md border border-white/35 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Minha conta
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex rounded-md border border-white/20 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:text-white"
              >
                Sair
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 py-12 lg:px-8">
          <h2 className="font-display text-[26px] sm:text-[30px]">
            Produtos em destaque
          </h2>
          <p className="mt-2 text-[14px] text-[#6B6B6B]">
            Preço de atacado e pedido mínimo liberados para o seu CNPJ.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {homeCatalogConfig.products.slice(0, 6).map((product) => {
              const wholesale = getWholesaleUnit(
                product.price,
                dealer?.discountPercent,
              );
              const minQty = getMinQty(
                product.categoryId,
                dealer?.globalMinOrder,
              );
              return (
                <Link
                  key={product.id}
                  href={`/produto/${product.id}`}
                  className="overflow-hidden rounded-[16px] border border-[#E8E4DC] bg-white shadow-[0_8px_24px_rgba(15,15,16,0.05)] transition hover:-translate-y-0.5 hover:border-[#C8A96A]/40"
                >
                  <div className="relative aspect-[4/3] bg-[#EEEAE4]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-[20px] leading-snug">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-[12px] text-[#6B6B6B] line-through">
                      Varejo {formatBRL(product.price)}
                    </p>
                    <p className="mt-1 text-[20px] font-bold text-[#0F0F10]">
                      Atacado {formatBRL(wholesale)}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[#C5A059]">
                      Pedido mínimo: {minQty} un.
                    </p>
                    <span className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[#C5A059] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-black">
                      Ver produto
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 pb-16 lg:px-8">
          <h2 className="font-display text-[26px] sm:text-[30px]">Categorias</h2>
          <p className="mt-2 text-[14px] text-[#6B6B6B]">
            Quantidade mínima, desconto e preço de referência por linha.
          </p>
          <div className="mt-8 divide-y divide-[#E8E4DC] rounded-[16px] border border-[#E8E4DC] bg-white">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/?categoria=${cat.id}#nosso-catalogo`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#FAFAF8]"
              >
                <div>
                  <p className="text-[15px] font-semibold">{cat.label}</p>
                  <p className="mt-0.5 text-[12px] text-[#6B6B6B]">
                    {cat.count} produtos ·{" "}
                    <span className="font-semibold text-[#C5A059]">
                      mín. {cat.minQty} un.
                    </span>{" "}
                    · {cat.discount}% off
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-[#C5A059]">
                  a partir de {formatBRL(cat.wholesale)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F3] text-[#0F0F10]">
      <section className="relative h-[340px] overflow-hidden bg-black text-white sm:h-[380px]">
        <Image
          src={cmsBanner.image}
          alt="Portal atacado Home Queen"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-black/72" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1240px] items-center px-6 lg:px-8">
          <div className="max-w-[640px]">
            <h1 className="font-display text-[32px] leading-[1.12] sm:text-[40px] lg:text-[44px]">
              {cmsBanner.title}
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-white/78">
              {cmsBanner.text}
            </p>
            {cmsBanner.minOrderNote ? (
              <p className="mt-3 text-[13px] font-semibold text-[#C8A96A]">
                {cmsBanner.minOrderNote}
              </p>
            ) : null}
            {cmsBanner.benefits.length ? (
              <ul className="mt-4 space-y-1 text-[13px] text-white/70">
                {cmsBanner.benefits.slice(0, 4).map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#acesso"
                className="inline-flex rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a]"
              >
                Login | Cadastro CNPJ
              </a>
              <a
                href="https://wa.me/5549999999999?text=Ol%C3%A1!%20Quero%20entrar%20como%20revendedor%20Home%20Queen."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-md border border-white/40 bg-black/40 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:border-[#C5A059] hover:text-[#C5A059]"
              >
                Falar com comercial
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="acesso" className="scroll-mt-8 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
          <div>
            <h2 className="font-display text-[30px] sm:text-[34px]">
              Login | Cadastro CNPJ
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#2E2E2E]/80">
              Os preços de atacado ficam visíveis apenas para parceiros
              aprovados pelo administrador.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[18px] border border-[#EAEAEA] bg-[#FBFBF9] p-6 shadow-[0_10px_30px_rgba(15,15,16,0.04)] sm:p-8">
              <h3 className="font-display text-[24px]">Já sou parceiro</h3>
              <form onSubmit={onLogin} className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
                    CNPJ
                  </span>
                  <input
                    value={loginCnpj}
                    onChange={(e) => setLoginCnpj(formatCnpj(e.target.value))}
                    className={inputClass}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
                    Senha
                  </span>
                  <PasswordInput
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </label>
                <label className="flex items-center gap-2 text-[13px] text-[#2E2E2E]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[#C5A059]"
                  />
                  Lembrar acesso
                </label>
                {loginError ? (
                  <p className="text-[13px] text-red-600">{loginError}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={loginBusy}
                  className="rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a] disabled:opacity-60"
                >
                  {loginBusy ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </div>

            <div className="rounded-[18px] border border-[#C5A059]/25 bg-[#0F0F10] p-6 text-white shadow-[0_16px_40px_rgba(15,15,16,0.18)] sm:p-8">
              <h3 className="font-display text-[24px]">Quero ser parceiro</h3>

              {regOk ? (
                <div className="mt-6 rounded-[12px] border border-[#C5A059]/40 bg-white/5 p-5">
                  <p className="font-display text-[22px] text-[#C5A059]">
                    Cadastro enviado.
                  </p>
                  <p className="mt-3 text-[14px] leading-7 text-white/80">
                    Nossa equipe analisará seu CNPJ. Você receberá um e-mail
                    quando sua conta for aprovada.
                  </p>
                </div>
              ) : (
                <form onSubmit={onRegister} className="mt-5 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      placeholder="Razão Social *"
                      value={reg.companyName}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, companyName: e.target.value }))
                      }
                      required
                    />
                    <input
                      className={inputClass}
                      placeholder="Nome Fantasia"
                      value={reg.tradeName}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, tradeName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      placeholder="CNPJ *"
                      value={reg.cnpj}
                      onChange={(e) =>
                        setReg((r) => ({
                          ...r,
                          cnpj: formatCnpj(e.target.value),
                        }))
                      }
                      required
                    />
                    <input
                      className={inputClass}
                      placeholder="Inscrição Estadual"
                      value={reg.stateRegistration}
                      onChange={(e) =>
                        setReg((r) => ({
                          ...r,
                          stateRegistration: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      placeholder="Nome do responsável *"
                      value={reg.contactName}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, contactName: e.target.value }))
                      }
                      required
                    />
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="E-mail *"
                      value={reg.email}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      placeholder="Telefone"
                      value={reg.phone}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, phone: e.target.value }))
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="WhatsApp *"
                      value={reg.whatsapp}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, whatsapp: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className={inputClass}
                      value={reg.state}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, state: e.target.value }))
                      }
                    >
                      {BRAZIL_STATES.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                    <input
                      className={inputClass}
                      placeholder="Cidade *"
                      value={reg.city}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, city: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PasswordInput
                      className={inputClass}
                      placeholder="Senha de acesso *"
                      value={reg.password}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, password: e.target.value }))
                      }
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <PasswordInput
                      className={inputClass}
                      placeholder="Confirmar senha *"
                      value={reg.passwordConfirm}
                      onChange={(e) =>
                        setReg((r) => ({
                          ...r,
                          passwordConfirm: e.target.value,
                        }))
                      }
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-[13px] text-white/80">
                    <input
                      type="checkbox"
                      checked={reg.acceptTerms}
                      onChange={(e) =>
                        setReg((r) => ({
                          ...r,
                          acceptTerms: e.target.checked,
                        }))
                      }
                      className="mt-1 accent-[#C5A059]"
                      required
                    />
                    Aceito os termos de parceria Home Queen.
                  </label>
                  {regError ? (
                    <p className="text-[13px] text-red-300">{regError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={regBusy}
                    className="rounded-md bg-[#C5A059] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d4b06a] disabled:opacity-60"
                  >
                    {regBusy ? "Enviando..." : "Solicitar cadastro"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
