"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CustomerAddress, CustomerPublic } from "@/data/customer";
import {
  formatBRL,
  homeCatalogConfig,
} from "@/data/homeCatalog";
import { useCustomer } from "@/context/CustomerContext";
import { useShop } from "@/context/ShopContext";
import { formatCep, lookupCep } from "@/lib/cep";
import { formatCpf } from "@/lib/wholesalePricing";
import { PasswordInput } from "@/components/PasswordInput";

const inputClass =
  "w-full rounded-[16px] border border-[#E5E5E5] bg-white px-4 py-3.5 text-[14px] text-[#0F0F10] outline-none transition placeholder:text-[#9A9A9A] focus:border-[#C8A96A]";

type AuthMode = "login" | "register" | "forgot" | "reset";
type PanelSection =
  | "pedidos"
  | "favoritos"
  | "enderecos"
  | "garantias"
  | "notas"
  | "conta";

const navItems: Array<{ id: PanelSection; label: string }> = [
  { id: "pedidos", label: "Meus Pedidos" },
  { id: "favoritos", label: "Favoritos" },
  { id: "enderecos", label: "Endereços" },
  { id: "garantias", label: "Garantias" },
  { id: "notas", label: "Notas Fiscais" },
  { id: "conta", label: "Minha Conta" },
];

function GoldDot() {
  return (
    <span className="h-2 w-2 shrink-0 rounded-full bg-[#C8A96A]" aria-hidden />
  );
}

function GoldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#C8A96A]/15 text-[14px] font-bold text-[#C8A96A]">
      {children}
    </span>
  );
}

function AuthScreen({
  onSuccess,
}: {
  onSuccess: (customer: CustomerPublic, created: boolean) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [devLink, setDevLink] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [login, setLogin] = useState({ cpfOrEmail: "", password: "", remember: true });
  const [forgotIdentity, setForgotIdentity] = useState("");
  const [newPassword, setNewPassword] = useState({ password: "", confirm: "" });
  const [reg, setReg] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    whatsapp: "",
    password: "",
    passwordConfirm: "",
    acceptTerms: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = new URLSearchParams(window.location.search).get("redefinir");
    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, []);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const raw = login.cpfOrEmail.trim();
      const isEmail = raw.includes("@");
      const res = await fetch("/api/cliente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isEmail ? raw : undefined,
          cpf: isEmail ? undefined : raw,
          password: login.password,
          remember: login.remember,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.customer) {
        setError(data.error || "Falha no login.");
        return;
      }
      onSuccess(data.customer, false);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setDevLink("");
    setBusy(true);
    try {
      const res = await fetch("/api/cliente/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: forgotIdentity }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        devLink?: string;
      };
      if (!res.ok) {
        setError(data.error || "Não foi possível processar.");
        return;
      }
      setInfo(
        data.message ||
          "Se o cadastro existir, enviamos um link de redefinição.",
      );
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (newPassword.password !== newPassword.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/cliente/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword.password,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Não foi possível redefinir.");
        return;
      }
      setInfo(data.message || "Senha redefinida. Faça login.");
      setMode("login");
      setNewPassword({ password: "", confirm: "" });
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("redefinir");
        window.history.replaceState({}, "", url.pathname);
      }
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch("/api/cliente/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg),
      });
      const data = (await res.json()) as {
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.customer) {
        setError(data.error || "Falha no cadastro.");
        return;
      }
      onSuccess(data.customer, true);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1100px] gap-10 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
      <div>
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
          Área do Cliente
        </p>
        <h1 className="font-display mt-3 text-[34px] leading-tight text-[#0F0F10] sm:text-[42px]">
          Sua jornada Home Queen
        </h1>
        <p className="mt-4 max-w-[420px] text-[15px] leading-7 text-[#2E2E2E]/85">
          Acompanhe pedidos com rastreamento, favoritos sincronizados,
          endereços, garantias e notas fiscais.
        </p>
        <ul className="mt-8 space-y-3 text-[14px] text-[#2E2E2E]">
            {[
              "Rastreamento da entrega",
              "Lista de favoritos sincronizada",
              "Pedidos, notas e garantias em um só lugar",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <GoldIcon>OK</GoldIcon>
                {t}
              </li>
            ))}
        </ul>
      </div>

      <motion.div
        layout
        className="rounded-[16px] border border-[#EEEAE4] bg-white p-6 shadow-[0_16px_40px_rgba(15,15,16,0.06)] sm:p-8"
      >
        {mode === "forgot" || mode === "reset" ? null : (
          <div className="flex rounded-[16px] bg-[#F8F8F6] p-1">
            {(
              [
                ["login", "Entrar"],
                ["register", "Criar conta"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setError("");
                  setInfo("");
                }}
                className={`flex-1 rounded-[12px] py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition ${
                  mode === id
                    ? "bg-[#0F0F10] text-white"
                    : "text-[#6B6B6B] hover:text-[#0F0F10]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <input
              className={inputClass}
              placeholder="CPF ou e-mail"
              value={login.cpfOrEmail}
              onChange={(e) =>
                setLogin((s) => ({ ...s, cpfOrEmail: e.target.value }))
              }
              required
            />
            <PasswordInput
              className={inputClass}
              placeholder="Senha"
              value={login.password}
              onChange={(e) =>
                setLogin((s) => ({ ...s, password: e.target.value }))
              }
              required
              autoComplete="current-password"
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[13px] text-[#2E2E2E]">
                <input
                  type="checkbox"
                  checked={login.remember}
                  onChange={(e) =>
                    setLogin((s) => ({ ...s, remember: e.target.checked }))
                  }
                  className="accent-[#C8A96A]"
                />
                Lembrar acesso
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setInfo("");
                  setForgotIdentity(login.cpfOrEmail);
                }}
                className="text-[13px] text-[#6B6B6B] underline-offset-2 transition hover:text-[#C8A96A] hover:underline"
              >
                Esqueci a senha
              </button>
            </div>
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            {info ? <p className="text-[13px] text-[#C8A96A]">{info}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-[16px] bg-[#C8A96A] py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F] disabled:opacity-60"
            >
              {busy ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : mode === "forgot" ? (
          <form onSubmit={onForgot} className="mt-2 space-y-4">
            <h2 className="font-display text-[24px] text-[#0F0F10]">
              Esqueci a senha
            </h2>
            <p className="text-[14px] leading-6 text-[#2E2E2E]/80">
              Informe seu CPF ou e-mail. Enviaremos um link para redefinir a
              senha.
            </p>
            <input
              className={inputClass}
              placeholder="CPF ou e-mail"
              value={forgotIdentity}
              onChange={(e) => setForgotIdentity(e.target.value)}
              required
            />
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            {info ? <p className="text-[13px] text-[#C8A96A]">{info}</p> : null}
            {devLink ? (
              <p className="break-all text-[12px] text-[#6B6B6B]">
                Link de teste:{" "}
                <a href={devLink} className="text-[#C8A96A] underline">
                  {devLink}
                </a>
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-[16px] bg-[#C8A96A] py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F] disabled:opacity-60"
            >
              {busy ? "Enviando..." : "Enviar link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
              className="w-full text-center text-[13px] text-[#6B6B6B] hover:text-[#C8A96A]"
            >
              Voltar ao login
            </button>
          </form>
        ) : mode === "reset" ? (
          <form onSubmit={onReset} className="mt-2 space-y-4">
            <h2 className="font-display text-[24px] text-[#0F0F10]">
              Nova senha
            </h2>
            <p className="text-[14px] leading-6 text-[#2E2E2E]/80">
              Defina uma nova senha para sua conta.
            </p>
            <PasswordInput
              className={inputClass}
              placeholder="Nova senha"
              value={newPassword.password}
              onChange={(e) =>
                setNewPassword((s) => ({ ...s, password: e.target.value }))
              }
              required
              minLength={6}
              autoComplete="new-password"
            />
            <PasswordInput
              className={inputClass}
              placeholder="Confirmar senha"
              value={newPassword.confirm}
              onChange={(e) =>
                setNewPassword((s) => ({ ...s, confirm: e.target.value }))
              }
              required
              minLength={6}
              autoComplete="new-password"
            />
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            {info ? <p className="text-[13px] text-[#C8A96A]">{info}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-[16px] bg-[#C8A96A] py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F] disabled:opacity-60"
            >
              {busy ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister} className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              className={`${inputClass} sm:col-span-2`}
              placeholder="Nome completo *"
              value={reg.name}
              onChange={(e) => setReg((s) => ({ ...s, name: e.target.value }))}
              required
            />
            <input
              className={inputClass}
              placeholder="CPF *"
              value={reg.cpf}
              onChange={(e) =>
                setReg((s) => ({ ...s, cpf: formatCpf(e.target.value) }))
              }
              required
            />
            <input
              type="email"
              className={inputClass}
              placeholder="E-mail *"
              value={reg.email}
              onChange={(e) => setReg((s) => ({ ...s, email: e.target.value }))}
              required
            />
            <input
              className={inputClass}
              placeholder="Telefone"
              value={reg.phone}
              onChange={(e) => setReg((s) => ({ ...s, phone: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="WhatsApp"
              value={reg.whatsapp}
              onChange={(e) =>
                setReg((s) => ({ ...s, whatsapp: e.target.value }))
              }
            />
            <PasswordInput
              className={inputClass}
              placeholder="Senha *"
              value={reg.password}
              onChange={(e) =>
                setReg((s) => ({ ...s, password: e.target.value }))
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
                setReg((s) => ({ ...s, passwordConfirm: e.target.value }))
              }
              required
              minLength={6}
              autoComplete="new-password"
            />
            <label className="sm:col-span-2 flex items-start gap-2 text-[13px] text-[#2E2E2E]">
              <input
                type="checkbox"
                checked={reg.acceptTerms}
                onChange={(e) =>
                  setReg((s) => ({ ...s, acceptTerms: e.target.checked }))
                }
                className="mt-1 accent-[#C8A96A]"
                required
              />
              Aceito os termos de uso e a política de privacidade Home Queen.
            </label>
            {error ? (
              <p className="sm:col-span-2 text-[13px] text-red-600">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="sm:col-span-2 w-full rounded-[16px] bg-[#C8A96A] py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F] disabled:opacity-60"
            >
              {busy ? "Criando..." : "Criar conta"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function SuccessScreen({
  name,
  onContinue,
}: {
  name: string;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto max-w-[560px] px-6 py-20 text-center lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[16px] border border-[#EEEAE4] bg-white px-8 py-12 shadow-[0_16px_40px_rgba(15,15,16,0.06)]"
      >
        <GoldIcon>OK</GoldIcon>
        <h1 className="font-display mt-5 text-[32px] text-[#0F0F10]">
          Conta criada
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-[#6B6B6B]">
          Olá, {name}. Sua área do cliente está pronta para acompanhar pedidos,
          favoritos e muito mais.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-8 inline-flex rounded-[16px] bg-[#C8A96A] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F]"
        >
          Ir para o painel
        </button>
      </motion.div>
    </div>
  );
}

function CustomerPanel({ customer }: { customer: CustomerPublic }) {
  const { setCustomer, logout, refresh } = useCustomer();
  const { favorites, toggleFavorite, clearFavorites } = useShop();
  const [section, setSection] = useState<PanelSection>("pedidos");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [profile, setProfile] = useState({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    whatsapp: customer.whatsapp,
  });
  const [addressForm, setAddressForm] = useState({
    label: "Casa",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "SC",
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  useEffect(() => {
    setProfile({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
    });
  }, [customer]);

  // Sincroniza favoritos locais ↔ conta
  useEffect(() => {
    const localIds = favorites.map((f) => f.productId);
    const remote = customer.favoriteProductIds || [];
    const merged = [...new Set([...remote, ...localIds])];
    const same =
      merged.length === remote.length &&
      merged.every((id) => remote.includes(id));
    if (same) return;

    void fetch("/api/cliente/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoriteProductIds: merged }),
    })
      .then((r) => r.json())
      .then((data: { customer?: CustomerPublic }) => {
        if (data.customer) setCustomer(data.customer);
      });

    for (const id of remote) {
      if (localIds.includes(id)) continue;
      const product = homeCatalogConfig.products.find((p) => p.id === id);
      if (!product) continue;
      toggleFavorite({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        category: product.categoryId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once when ids diverge
  }, [customer.id]);

  const syncedFavorites = useMemo(() => {
    const ids = new Set([
      ...(customer.favoriteProductIds || []),
      ...favorites.map((f) => f.productId),
    ]);
    return [...ids]
      .map((id) => {
        const local = favorites.find((f) => f.productId === id);
        if (local) return local;
        const product = homeCatalogConfig.products.find((p) => p.id === id);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          category: product.categoryId,
        };
      })
      .filter(Boolean) as typeof favorites;
  }, [customer.favoriteProductIds, favorites]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/cliente/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = (await res.json()) as {
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok) {
        setMsg(data.error || "Erro ao salvar.");
        return;
      }
      if (data.customer) setCustomer(data.customer);
      setMsg("Dados atualizados.");
    } finally {
      setBusy(false);
    }
  }

  async function onAddressCepChange(value: string) {
    const formatted = formatCep(value);
    setAddressForm((s) => ({ ...s, cep: formatted }));
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
      setAddressForm((s) => ({
        ...s,
        cep: found.cep,
        street: found.street || s.street,
        district: found.district || s.district,
        city: found.city || s.city,
        state: found.state || s.state,
      }));
    } catch {
      setCepError("Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  async function addAddress(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const next: CustomerAddress = {
      id: `addr_${Date.now().toString(36)}`,
      ...addressForm,
      isDefault: customer.addresses.length === 0,
    };
    const addresses = [...customer.addresses, next];
    const res = await fetch("/api/cliente/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses }),
    });
    const data = (await res.json()) as { customer?: CustomerPublic };
    if (data.customer) setCustomer(data.customer);
    setAddressForm({
      label: "Casa",
      cep: "",
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "SC",
    });
    setBusy(false);
    setMsg("Endereço salvo.");
  }

  async function createDemoOrder() {
    setBusy(true);
    const res = await fetch("/api/cliente/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true }),
    });
    const data = (await res.json()) as { customer?: CustomerPublic };
    if (data.customer) setCustomer(data.customer);
    else await refresh();
    setBusy(false);
    setSection("pedidos");
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
            Painel do Cliente
          </p>
          <h1 className="font-display mt-2 text-[32px] text-[#0F0F10] sm:text-[36px]">
            Olá, {customer.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">
            CPF {formatCpf(customer.cpf)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-[16px] border border-[#E5E5E5] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B6B6B] transition hover:border-[#C8A96A] hover:text-[#0F0F10]"
        >
          Sair
        </button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-[16px] border border-[#EEEAE4] bg-white p-3 shadow-[0_10px_30px_rgba(15,15,16,0.04)]">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setMsg("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[13px] font-medium transition ${
                    active
                      ? "bg-[#C8A96A] text-[#0F0F10]"
                      : "text-[#2E2E2E] hover:bg-[#F8F8F6]"
                  }`}
                >
                  <GoldDot />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="rounded-[16px] border border-[#EEEAE4] bg-white p-5 shadow-[0_10px_30px_rgba(15,15,16,0.04)] sm:p-7"
          >
            {section === "pedidos" ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-[24px]">Meus Pedidos</h2>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void createDemoOrder()}
                    className="rounded-[12px] border border-[#C8A96A] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0F0F10] transition hover:bg-[#C8A96A]/15"
                  >
                    Simular pedido
                  </button>
                </div>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">
                  Rastreamento da entrega e status de produção.
                </p>
                {customer.orders.length === 0 ? (
                  <div className="mt-8 rounded-[16px] border border-dashed border-[#D6D0C6] bg-[#F8F8F6] px-6 py-12 text-center">
                    <p className="text-[14px] text-[#6B6B6B]">
                      Nenhum pedido ainda.
                    </p>
                    <Link
                      href="/#nosso-catalogo"
                      className="mt-4 inline-flex text-[13px] font-semibold text-[#C8A96A] hover:underline"
                    >
                      Ver catálogo
                    </Link>
                  </div>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {customer.orders.map((order) => (
                      <li
                        key={order.id}
                        className="rounded-[16px] border border-[#F0EBE3] bg-[#F8F8F6] p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">
                              {order.status}
                            </p>
                            <p className="mt-1 text-[15px] font-semibold">
                              Pedido {order.id}
                            </p>
                            <p className="mt-1 text-[13px] text-[#6B6B6B]">
                              {new Date(order.createdAt).toLocaleString("pt-BR")}
                              {" · "}
                              {formatBRL(order.total)}
                            </p>
                          </div>
                          {order.trackingCode ? (
                            <div className="rounded-[12px] bg-white px-3 py-2 text-[12px]">
                              <p className="text-[#6B6B6B]">Rastreio</p>
                              <p className="font-semibold text-[#0F0F10]">
                                {order.trackingCode}
                              </p>
                              {order.carrier ? (
                                <p className="text-[#6B6B6B]">{order.carrier}</p>
                              ) : null}
                              {order.eta ? (
                                <p className="text-[#C8A96A]">Prazo: {order.eta}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <ul className="mt-3 space-y-1 text-[13px] text-[#2E2E2E]">
                          {order.items.map((item, i) => (
                            <li key={`${order.id}-${i}`}>
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {section === "favoritos" ? (
              <div>
                <h2 className="font-display text-[24px]">Favoritos</h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">
                  Lista sincronizada entre este dispositivo e sua conta.
                </p>
                {syncedFavorites.length === 0 ? (
                  <p className="mt-8 text-[14px] text-[#6B6B6B]">
                    Nenhum favorito ainda.{" "}
                    <Link href="/#nosso-catalogo" className="text-[#C8A96A]">
                      Explorar catálogo
                    </Link>
                  </p>
                ) : (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {syncedFavorites.map((item) => (
                      <Link
                        key={item.productId}
                        href={`/produto/${item.productId}`}
                        className="flex gap-3 rounded-[16px] border border-[#F0EBE3] bg-[#F8F8F6] p-3 transition hover:border-[#C8A96A]"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] bg-white">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold">{item.name}</p>
                          <p className="mt-1 text-[13px] text-[#C8A96A]">
                            {formatBRL(item.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {syncedFavorites.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => clearFavorites()}
                    className="mt-6 text-[12px] text-[#6B6B6B] hover:text-red-600"
                  >
                    Limpar favoritos locais
                  </button>
                ) : null}
              </div>
            ) : null}

            {section === "enderecos" ? (
              <div>
                <h2 className="font-display text-[24px]">Endereços</h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">
                  Usados no checkout e nas entregas.
                </p>
                <ul className="mt-5 space-y-3">
                  {customer.addresses.map((addr) => (
                    <li
                      key={addr.id}
                      className="rounded-[16px] border border-[#F0EBE3] bg-[#F8F8F6] px-4 py-3 text-[14px]"
                    >
                      <p className="font-semibold">
                        {addr.label}
                        {addr.isDefault ? (
                          <span className="ml-2 text-[11px] text-[#C8A96A]">
                            Padrão
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-[#6B6B6B]">
                        {addr.street}, {addr.number}
                        {addr.complement ? ` — ${addr.complement}` : ""}
                        <br />
                        {addr.district} · {addr.city}/{addr.state} · CEP{" "}
                        {addr.cep}
                      </p>
                    </li>
                  ))}
                </ul>
                <form onSubmit={addAddress} className="mt-6 grid gap-3 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    placeholder="Apelido (Casa, Trabalho)"
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm((s) => ({ ...s, label: e.target.value }))
                    }
                    required
                  />
                  <div>
                    <input
                      className={inputClass}
                      placeholder="CEP *"
                      inputMode="numeric"
                      value={addressForm.cep}
                      onChange={(e) => void onAddressCepChange(e.target.value)}
                      required
                    />
                    {cepLoading ? (
                      <p className="mt-1 text-[12px] text-[#C8A96A]">
                        Buscando endereço...
                      </p>
                    ) : null}
                    {cepError ? (
                      <p className="mt-1 text-[12px] text-red-600">{cepError}</p>
                    ) : null}
                  </div>
                  <input
                    className={`${inputClass} sm:col-span-2`}
                    placeholder="Rua *"
                    value={addressForm.street}
                    onChange={(e) =>
                      setAddressForm((s) => ({ ...s, street: e.target.value }))
                    }
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="Número *"
                    value={addressForm.number}
                    onChange={(e) =>
                      setAddressForm((s) => ({ ...s, number: e.target.value }))
                    }
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="Complemento"
                    value={addressForm.complement}
                    onChange={(e) =>
                      setAddressForm((s) => ({
                        ...s,
                        complement: e.target.value,
                      }))
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Bairro *"
                    value={addressForm.district}
                    onChange={(e) =>
                      setAddressForm((s) => ({ ...s, district: e.target.value }))
                    }
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="Cidade *"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm((s) => ({ ...s, city: e.target.value }))
                    }
                    required
                  />
                  <input
                    className={inputClass}
                    placeholder="UF *"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm((s) => ({ ...s, state: e.target.value }))
                    }
                    required
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="sm:col-span-2 rounded-[16px] bg-[#C8A96A] py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10]"
                  >
                    Salvar endereço
                  </button>
                </form>
                {msg ? <p className="mt-3 text-[13px] text-[#C8A96A]">{msg}</p> : null}
              </div>
            ) : null}

            {section === "garantias" ? (
              <div>
                <h2 className="font-display text-[24px]">Garantias</h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">
                  Acompanhe solicitações de garantia de fábrica.
                </p>
                {customer.warranties.length === 0 ? (
                  <div className="mt-8 rounded-[16px] border border-dashed border-[#D6D0C6] bg-[#F8F8F6] px-6 py-10 text-center text-[14px] text-[#6B6B6B]">
                    Nenhuma garantia aberta. Em caso de necessidade, fale pelo{" "}
                    <Link href="/contato" className="text-[#C8A96A]">
                      contato
                    </Link>
                    .
                  </div>
                ) : (
                  <ul className="mt-6 space-y-3">
                    {customer.warranties.map((w) => (
                      <li
                        key={w.id}
                        className="rounded-[16px] border border-[#F0EBE3] bg-[#F8F8F6] p-4"
                      >
                        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">
                          {w.status}
                        </p>
                        <p className="mt-1 font-semibold">{w.productName}</p>
                        <p className="mt-1 text-[13px] text-[#6B6B6B]">{w.notes}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {section === "notas" ? (
              <div>
                <h2 className="font-display text-[24px]">Notas Fiscais</h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">
                  Disponíveis após o faturamento do pedido.
                </p>
                <ul className="mt-6 space-y-3">
                  {customer.orders.filter((o) => o.invoiceUrl).length === 0 ? (
                    <li className="rounded-[16px] border border-dashed border-[#D6D0C6] bg-[#F8F8F6] px-6 py-10 text-center text-[14px] text-[#6B6B6B]">
                      Nenhuma nota fiscal disponível ainda.
                    </li>
                  ) : (
                    customer.orders
                      .filter((o) => o.invoiceUrl)
                      .map((o) => (
                        <li
                          key={o.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#F0EBE3] bg-[#F8F8F6] px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold">NF Pedido {o.id}</p>
                            <p className="text-[13px] text-[#6B6B6B]">
                              {formatBRL(o.total)}
                            </p>
                          </div>
                          <a
                            href={o.invoiceUrl}
                            className="rounded-[12px] bg-[#0F0F10] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white"
                          >
                            Baixar PDF
                          </a>
                        </li>
                      ))
                  )}
                </ul>
              </div>
            ) : null}

            {section === "conta" ? (
              <div>
                <h2 className="font-display text-[24px]">Minha Conta</h2>
                <p className="mt-2 text-[14px] text-[#6B6B6B]">
                  Atualize seus dados pessoais quando precisar.
                </p>
                <form onSubmit={saveProfile} className="mt-6 grid gap-3 sm:grid-cols-2">
                  <input
                    className={`${inputClass} sm:col-span-2`}
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((s) => ({ ...s, name: e.target.value }))
                    }
                    placeholder="Nome"
                    required
                  />
                  <input
                    className={inputClass}
                    value={formatCpf(customer.cpf)}
                    disabled
                    readOnly
                  />
                  <input
                    type="email"
                    className={inputClass}
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((s) => ({ ...s, email: e.target.value }))
                    }
                    placeholder="E-mail"
                    required
                  />
                  <input
                    className={inputClass}
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((s) => ({ ...s, phone: e.target.value }))
                    }
                    placeholder="Telefone"
                  />
                  <input
                    className={inputClass}
                    value={profile.whatsapp}
                    onChange={(e) =>
                      setProfile((s) => ({ ...s, whatsapp: e.target.value }))
                    }
                    placeholder="WhatsApp"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="sm:col-span-2 rounded-[16px] bg-[#C8A96A] py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10]"
                  >
                    Salvar alterações
                  </button>
                </form>
                {msg ? <p className="mt-3 text-[13px] text-[#C8A96A]">{msg}</p> : null}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function RetailAccountView() {
  const { customer, loading, setCustomer, isCustomer } = useCustomer();
  const [justCreated, setJustCreated] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[14px] text-[#6B6B6B]">
        Carregando área do cliente...
      </div>
    );
  }

  if (justCreated && customer) {
    return (
      <SuccessScreen
        name={customer.name}
        onContinue={() => setJustCreated(false)}
      />
    );
  }

  if (isCustomer && customer) {
    return <CustomerPanel customer={customer} />;
  }

  return (
    <AuthScreen
      onSuccess={(c, created) => {
        setCustomer(c);
        setJustCreated(created);
      }}
    />
  );
}
