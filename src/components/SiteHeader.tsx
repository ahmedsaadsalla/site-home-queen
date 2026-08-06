"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { CategoriesNavDropdown } from "@/components/CategoriesNavDropdown";
import { HeaderSearch } from "@/components/HeaderSearch";
import { useCustomer } from "@/context/CustomerContext";
import { useDealer } from "@/context/DealerContext";
import { useShop } from "@/context/ShopContext";

function Badge({ count }: { count: number }) {
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#C8A96A] px-1 text-[9px] font-bold text-black">
      {label}
    </span>
  );
}

function AccountMenu() {
  const { dealer, isReseller, logout: logoutDealer } = useDealer();
  const { customer, isCustomer, logout: logoutCustomer } = useCustomer();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const greetName = isReseller
    ? dealer?.tradeName || dealer?.companyName || dealer?.contactName || ""
    : isCustomer
      ? customer?.name.split(" ")[0] || "Cliente"
      : "";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (isReseller || isCustomer) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="inline-flex max-w-[140px] items-center gap-2 rounded-full border border-white/20 p-2.5 text-[13px] font-medium text-white transition hover:border-[#C8A96A] hover:text-[#C8A96A] sm:px-3 sm:py-2 lg:max-w-[160px]"
          title={greetName || undefined}
          aria-label={greetName || (isReseller ? "Revendedor" : "Cliente")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span className="hidden truncate sm:inline">
            {greetName || (isReseller ? "Revendedor" : "Cliente")}
          </span>
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+10px)] z-[90] w-[220px] overflow-hidden rounded-[12px] border border-white/10 bg-[#141414] py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          >
            <div className="border-b border-white/10 px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                {isReseller ? "Portal atacado" : "Minha conta"}
              </p>
              <p className="mt-0.5 truncate text-[13px] font-semibold text-[#C8A96A]">
                {greetName || "Usuário"}
              </p>
            </div>
            <a
              href="/minha-conta"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/5 hover:text-[#C8A96A]"
            >
              Minha Conta
            </a>
            {isReseller ? (
              <a
                href="/#nosso-catalogo"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/5 hover:text-[#C8A96A]"
              >
                Catálogo atacado
              </a>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void (isReseller ? logoutDealer() : logoutCustomer());
              }}
              className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-white/80 transition hover:bg-white/5 hover:text-[#C8A96A]"
            >
              Sair
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 p-2.5 text-[13px] font-medium text-white transition hover:border-[#C8A96A] hover:text-[#C8A96A] sm:px-3 sm:py-2"
        aria-label="Minha conta"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <span className="hidden sm:inline">Olá !</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-[90] w-[220px] overflow-hidden rounded-[12px] border border-white/10 bg-[#141414] py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        >
          <a
            href="/minha-conta"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/5 hover:text-[#C8A96A]"
          >
            Cliente CPF
          </a>
          <a
            href="/atacado#acesso"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/5 hover:text-[#C8A96A]"
          >
            Cliente PJ
          </a>
        </div>
      ) : null}
    </div>
  );
}

const mobileCategories = [
  { id: "camas-box", label: "Camas Box" },
  { id: "camas-box-bau", label: "Camas Box Baú" },
  { id: "camas-com-colchao", label: "Camas com Colchão" },
  { id: "colchoes", label: "Colchões" },
  { id: "cabeceiras", label: "Cabeceiras" },
  { id: "bases", label: "Bases" },
  { id: "baus", label: "Baús" },
  { id: "acessorios", label: "Acessórios" },
] as const;

export function SiteHeader() {
  const { cartCount, favoritesCount, openDrawer } = useShop();
  const { isReseller } = useDealer();
  const [mobileOpen, setMobileOpen] = useState(false);

  /** Menu central — só links de navegação (conta/sair no menu do usuário) */
  const navLinks = isReseller
    ? [
        { href: "/#nosso-catalogo", label: "Produtos" },
        { href: "/carrinho", label: "Pedidos" },
        { href: "/orcamento", label: "Orçamentos" },
        { href: "/sobre", label: "Sobre" },
        { href: "/contato", label: "Contato" },
      ]
    : [
        { href: "/atacado", label: "Atacado" },
        { href: "/sobre", label: "Sobre" },
        { href: "/contato", label: "Contato" },
      ];

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <header className="relative z-[80] border-b border-white/5 bg-black">
      <div className="mx-auto grid h-[72px] max-w-[1240px] grid-cols-[auto_1fr_auto] items-center gap-2 overflow-visible px-3 sm:h-[78px] sm:gap-4 sm:px-4 lg:gap-6 lg:px-6">
        {/* Logo */}
        <a
          href="/"
          className="relative h-[56px] w-[130px] shrink-0 overflow-hidden sm:h-[66px] sm:w-[200px] lg:w-[220px]"
          aria-label="Home Queen"
        >
          <Logo
            priority
            className="absolute -left-2 top-1/2 h-[56px] w-[56px] -translate-y-1/2 origin-left scale-x-[2.1] scale-y-[1.85] sm:h-[66px] sm:w-[66px] sm:scale-x-[2.4] sm:scale-y-[2]"
          />
        </a>

        {/* Menu central */}
        <nav className="hidden items-center justify-center gap-5 text-[12px] font-medium uppercase tracking-[0.14em] text-white lg:flex xl:gap-7">
          {!isReseller ? (
            <Suspense fallback={<span className="uppercase">Categorias</span>}>
              <CategoriesNavDropdown />
            </Suspense>
          ) : null}
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap transition hover:text-[#C8A96A]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Ações à direita: menu | busca | conta | favoritos | carrinho */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2.5">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition hover:border-[#C8A96A] lg:hidden"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <HeaderSearch className="hidden md:block" />
          <AccountMenu />

          <button
            type="button"
            onClick={() => openDrawer("favorites")}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 transition hover:border-[#C8A96A]"
            aria-label="Favoritos"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="#FFFFFF"
              aria-hidden
            >
              <path d="M12.1 21.35l-1.1-1C6.1 15.4 2.5 12.2 2.5 8.5A4.5 4.5 0 017 4a4.9 4.9 0 015.1 2.3A4.9 4.9 0 0117.2 4a4.5 4.5 0 014.5 4.5c0 3.7-3.6 6.9-8.5 11.85l-1.1 1z" />
            </svg>
            <Badge count={favoritesCount} />
          </button>

          <button
            type="button"
            onClick={() => openDrawer("cart")}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 transition hover:border-[#C8A96A]"
            aria-label="Carrinho"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="#FFFFFF"
              aria-hidden
            >
              <path d="M8 7V6a4 4 0 118 0v1h2.2c.7 0 1.2.6 1.1 1.3l-1.2 10A1.5 1.5 0 0116.6 20H7.4a1.5 1.5 0 01-1.5-1.7l-1.2-10A1.1 1.1 0 015.8 7H8zm2 0h4V6a2 2 0 10-4 0v1z" />
            </svg>
            <Badge count={cartCount} />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-[#0F0F10] lg:hidden">
          <div className="mx-auto max-h-[min(70vh,560px)] max-w-[1240px] overflow-y-auto px-4 py-4">
            <div className="mb-4 md:hidden">
              <HeaderSearch className="w-full" />
            </div>

            {!isReseller ? (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
                  Categorias
                </p>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {mobileCategories.map((category) => (
                    <li key={category.id}>
                      <a
                        href={`/?categoria=${category.id}#nosso-catalogo`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/5 hover:text-[#C8A96A]"
                      >
                        {category.label}
                        <span className="text-white/35">›</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <nav className="flex flex-col gap-1 border-t border-white/10 pt-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[10px] px-3 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/5 hover:text-[#C8A96A]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/minha-conta"
                onClick={() => setMobileOpen(false)}
                className="rounded-[10px] px-3 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/5 hover:text-[#C8A96A]"
              >
                Minha conta
              </a>
              <a
                href="/orcamento"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-md bg-[#C8A96A] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-black"
              >
                Fazer orçamento
              </a>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
