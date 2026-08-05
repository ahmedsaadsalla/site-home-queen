"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

type PageCard = {
  href: string;
  title: string;
  preview: string | null;
  desc: string;
  fields: string[];
};

const sitePages: PageCard[] = [
  {
    href: "/admin/site/home",
    title: "Home (página inicial)",
    preview: "/",
    desc: "Tudo o que aparece na capa do site",
    fields: [
      "Textos do hero e catálogo",
      "Slides / banners do carrossel",
      "Benefícios (4 blocos)",
      "Números (atalho)",
      "Destaques e CTA atacado",
      "Depoimentos e parceiros",
      "Logo e imagens extras",
    ],
  },
  {
    href: "/admin/site/numeros",
    title: "Números e indicadores",
    preview: "/#numeros",
    desc: "Contadores da home e da página Sobre",
    fields: ["Título da seção", "Valor, sufixo e rótulo de cada indicador"],
  },
  {
    href: "/admin/fabrica",
    title: "Sobre / Nossa Fábrica",
    preview: "/sobre",
    desc: "Página institucional completa",
    fields: [
      "Banner e subtítulo",
      "História, missão, visão, valores",
      "Diferenciais e linhas",
      "Processo produtivo",
      "Galerias de fotos",
      "Bloco final (CTA)",
    ],
  },
  {
    href: "/admin/contato",
    title: "Contato",
    preview: "/contato",
    desc: "Textos, fotos e dados de atendimento",
    fields: [
      "Títulos e textos da página",
      "Banner, fachada e mapa",
      "Telefones, e-mails e endereço",
      "Perguntas frequentes",
    ],
  },
  {
    href: "/admin/site/atacado",
    title: "Atacado (portal)",
    preview: "/atacado",
    desc: "Textos e mídias do portal do revendedor",
    fields: [
      "Banner (título + texto + foto)",
      "Nota de pedido mínimo",
      "Benefícios e FAQ",
      "Imagens e logos",
    ],
  },
  {
    href: "/admin/site/orcamento",
    title: "Orçamento",
    preview: "/orcamento",
    desc: "Textos e banner da página de orçamento",
    fields: ["Título e subtítulo", "Banner", "Itens de confiança", "Mensagem de sucesso"],
  },
  {
    href: "/admin/banners",
    title: "Banners promocionais",
    preview: "/",
    desc: "Campanhas extras por página",
    fields: ["Imagem", "Título", "Link", "Página e ordem"],
  },
  {
    href: "/admin/seo",
    title: "SEO (Google)",
    preview: null,
    desc: "Título e descrição de cada página no Google",
    fields: ["Title", "Description", "Keywords", "Imagem OG"],
  },
  {
    href: "/admin/configuracoes",
    title: "Rodapé, login e áreas fixas",
    preview: "/",
    desc: "Imagens de áreas que se repetem no site",
    fields: [
      "Rodapé (logo / fundo)",
      "Login e cadastro",
      "Carrinho e favoritos",
    ],
  },
  {
    href: "/admin/midias",
    title: "Biblioteca de fotos",
    preview: null,
    desc: "Todas as imagens enviadas",
    fields: ["Upload", "Pastas", "Preview e reutilização"],
  },
];

const catalog: PageCard[] = [
  {
    href: "/admin/produtos",
    title: "Produtos",
    preview: "/#nosso-catalogo",
    desc: "Fotos, preços, cores e estoque por produto",
    fields: ["Foto principal e galeria", "Preços", "Cores", "Estoque e ativo"],
  },
  {
    href: "/admin/categorias",
    title: "Categorias",
    preview: "/#nosso-catalogo",
    desc: "Organização do catálogo",
    fields: ["Nome", "Banner da categoria", "Ativar / ocultar"],
  },
  {
    href: "/admin/atacado",
    title: "Catálogo atacado + revendedores",
    preview: "/atacado",
    desc: "Produtos de atacado e aprovação CNPJ",
    fields: ["Preço atacado e mínimo", "Fotos só CNPJ", "Ativar / excluir", "Revendedores"],
  },
];

function Card({ href, title, desc, fields, preview }: PageCard) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#151515] p-5 transition hover:border-[#C8A96A]/40">
      <h3 className="font-display text-[22px] text-[#F8F8F6]">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">{desc}</p>
      <ul className="mt-4 flex-1 space-y-1.5 border-t border-white/8 pt-4">
        {fields.map((f) => (
          <li key={f} className="flex gap-2 text-[12px] text-white/60">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8A96A]" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={href}
          className="rounded-full bg-[#C8A96A] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F0F10]"
        >
          Editar campos
        </Link>
        {preview ? (
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60 hover:border-[#C8A96A] hover:text-[#C8A96A]"
          >
            Ver página
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminSiteHubPage() {
  return (
    <AdminShell
      title="Editar o site"
      subtitle="Cada página com seus textos, banners e fotos em campos separados"
    >
      <div className="mb-8 rounded-2xl border border-[#C8A96A]/25 bg-[#C8A96A]/8 px-5 py-4 text-[13px] leading-relaxed text-white/75">
        Escolha a página → abra as abas (Textos, Banners, Fotos) → preencha cada
        campo → clique em <strong className="text-[#C8A96A]">Salvar</strong>. As
        alterações aparecem no site público.
      </div>

      <section>
        <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
          Páginas e seções do site
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sitePages.map((p) => (
            <Card key={p.href} {...p} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
          Catálogo e produtos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {catalog.map((p) => (
            <Card key={p.href} {...p} />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
