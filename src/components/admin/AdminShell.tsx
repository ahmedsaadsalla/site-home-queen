"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";

/** Menu simplificado — o que o dia a dia precisa. Restante em “Mais opções”. */
export const adminNavMain = [
  { href: "/admin", label: "Início", group: "main" },
  { href: "/admin/site", label: "Editar o site", group: "main" },
  { href: "/admin/produtos", label: "Produtos", group: "main" },
  { href: "/admin/categorias", label: "Categorias", group: "main" },
  { href: "/admin/pedidos", label: "Pedidos", group: "main" },
  { href: "/admin/orcamentos", label: "Orçamentos", group: "main" },
  { href: "/admin/clientes", label: "Clientes", group: "main" },
  { href: "/admin/atacado", label: "Atacado", group: "main" },
  { href: "/admin/midias", label: "Fotos", group: "main" },
  { href: "/admin/seguranca", label: "Segurança", group: "main" },
] as const;

export const adminNavMore = [
  { href: "/admin/site/home", label: "Home (detalhe)" },
  { href: "/admin/site/numeros", label: "Números" },
  { href: "/admin/fabrica", label: "Sobre / Fábrica" },
  { href: "/admin/contato", label: "Contato" },
  { href: "/admin/site/atacado", label: "Atacado (textos)" },
  { href: "/admin/site/orcamento", label: "Orçamento (textos)" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/colecoes", label: "Coleções" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/avaliacoes", label: "Avaliações" },
  { href: "/admin/garantias", label: "Garantias" },
  { href: "/admin/transportadoras", label: "Transportadoras" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/seguranca", label: "Segurança" },
  { href: "/admin/configuracoes", label: "Rodapé e áreas" },
  { href: "/admin/integracoes", label: "Integrações" },
  { href: "/admin/logs", label: "Logs (auditoria)" },
  { href: "/admin/backup", label: "Backup" },
  { href: "/admin/sistema/status", label: "Sistema · Status" },
  { href: "/admin/sistema/alertas", label: "Sistema · Alertas" },
  { href: "/admin/sistema/logs", label: "Sistema · Logs" },
  { href: "/admin/sistema/seguranca", label: "Sistema · Segurança" },
  { href: "/admin/sistema/sessoes", label: "Sistema · Sessões" },
  { href: "/admin/sistema/atualizacoes", label: "Sistema · Atualizações" },
  { href: "/admin/sistema/financeiro", label: "Sistema · Financeiro" },
  { href: "/admin/sistema/analytics", label: "Sistema · Analytics" },
  { href: "/admin/sistema/integridade", label: "Sistema · Integridade" },
  { href: "/admin/sistema/relatorios", label: "Sistema · Relatórios" },
  { href: "/admin/sistema/sobre", label: "Sistema · Sobre" },
  { href: "/admin/configuracoes/site", label: "Configurações · Site" },
  { href: "/admin/configuracoes/backup", label: "Configurações · Backup" },
] as const;

/** Compat: busca global em todos os links */
export const adminNav = [
  ...adminNavMain.map((n) => ({ ...n, group: "Menu" as const })),
  ...adminNavMore.map((n) => ({ ...n, group: "Mais" as const })),
];

export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return adminNav.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/site") {
      return pathname === "/admin/site" || pathname.startsWith("/admin/site/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F8F8F6]">
      <div className="flex min-h-screen">
        <aside
          className={`sticky top-0 flex h-screen flex-col border-r border-white/10 bg-[#0F0F10] transition-all ${
            collapsed ? "w-[78px]" : "w-[240px]"
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
            {!collapsed ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
                  Home Queen
                </p>
                <p className="text-[13px] font-semibold">Painel simples</p>
              </div>
            ) : (
              <span className="font-bold text-[#C8A96A]">HQ</span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/70 hover:border-[#C8A96A] hover:text-[#C8A96A]"
              aria-label="Recolher menu"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <ul className="space-y-0.5">
              {adminNavMain.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={`block rounded-lg px-3 py-2.5 text-[13px] transition ${
                        active
                          ? "bg-[#C8A96A] font-semibold text-[#0F0F10]"
                          : "text-white/75 hover:bg-white/5 hover:text-[#C8A96A]"
                      }`}
                    >
                      {collapsed ? item.label.slice(0, 1) : item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {!collapsed ? (
              <div className="mt-5 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 hover:text-[#C8A96A]"
                >
                  Mais opções
                  <span>{moreOpen ? "−" : "+"}</span>
                </button>
                {moreOpen ? (
                  <ul className="mt-1 space-y-0.5">
                    {adminNavMore.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`block rounded-lg px-3 py-2 text-[12px] transition ${
                              active
                                ? "bg-white/10 text-[#C8A96A]"
                                : "text-white/50 hover:bg-white/5 hover:text-white/80"
                            }`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </nav>

          <div className="border-t border-white/10 p-3 space-y-2">
            <Link
              href="/"
              className="block rounded-lg border border-white/15 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-white/70 transition hover:border-[#C8A96A] hover:text-[#C8A96A]"
            >
              {collapsed ? "←" : "Ver site"}
            </Link>
            <button
              type="button"
              onClick={() => {
                void fetch("/api/admin/logout", { method: "POST" }).then(() => {
                  window.location.href = "/admin/login";
                });
              }}
              className="block w-full rounded-lg border border-white/10 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45 transition hover:border-red-400/40 hover:text-red-200"
            >
              {collapsed ? "×" : "Sair"}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0F0F10]/95 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 lg:px-8">
              <div className="min-w-0 flex-1">
                {title ? (
                  <>
                    <h1 className="font-display text-[22px] text-[#F8F8F6] sm:text-[26px]">
                      {title}
                    </h1>
                    {subtitle ? (
                      <p className="text-[13px] text-white/50">{subtitle}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-[13px] text-white/50">Painel Home Queen</p>
                )}
              </div>
              <div className="relative w-full max-w-[300px]">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar no painel…"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-[#C8A96A]"
                />
                {searchHits.length > 0 ? (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-full overflow-hidden rounded-xl border border-white/10 bg-[#161616] shadow-2xl">
                    {searchHits.map((hit) => (
                      <Link
                        key={hit.href}
                        href={hit.href}
                        onClick={() => setQuery("")}
                        className="block px-4 py-2.5 text-[13px] text-white/80 hover:bg-white/5 hover:text-[#C8A96A]"
                      >
                        {hit.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
