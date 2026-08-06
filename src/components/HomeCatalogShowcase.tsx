"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { IconChevron, IconHeart } from "@/components/icons";
import { useDealer } from "@/context/DealerContext";
import { useShop } from "@/context/ShopContext";
import {
  formatBRL,
  getProductsByCategory,
  getVisibleCategories,
  homeCatalogConfig,
  type CatalogCategoryId,
  type CatalogProduct,
} from "@/data/homeCatalog";
import { getMinQty, getWholesaleUnit } from "@/lib/wholesalePricing";
import {
  indexOverrides,
  mergeProductOverride,
} from "@/lib/catalogOverrides";
import type { ProductOverride } from "@/data/admin";

const sizes = [
  "Solteiro",
  "Casal",
  "Queen",
  "King",
  "King Bipartido",
] as const;

const types = ["Box", "Box Baú", "Box + Colchão"] as const;

const colorSwatches = [
  { name: "Preto", hex: "#1A1A1A" },
  { name: "Bege", hex: "#C8B89A" },
  { name: "Cinza", hex: "#C5C5C5" },
  { name: "Marrom", hex: "#5C4033" },
] as const;

const categoryCopy: Partial<Record<CatalogCategoryId, string>> = {
  "camas-box":
    "Estrutura reforçada, acabamento sofisticado e conforto de alto padrão para o seu quarto.",
  "camas-box-bau":
    "Modelos com baú embutido, acabamento premium e armazenamento inteligente para o seu quarto.",
  "camas-com-colchao":
    "Conjuntos completos com colchão incluso, prontos para transformar o seu descanso.",
  colchoes:
    "Tecnologia e conforto em cada camada — escolha o colchão ideal para o seu sono.",
  cabeceiras:
    "Design elegante e acabamentos sofisticados para completar a identidade do quarto.",
  bases: "Bases reforçadas e estáveis, pensadas para durabilidade e suporte.",
  baus: "Baús compactos e sofisticados para organização com estilo.",
  acessorios:
    "Complementos selecionados para elevar o conforto e a experiência Home Queen.",
};

const categoryIcons: Partial<Record<CatalogCategoryId, ReactNode>> = {
  "camas-box": <BedIcon />,
  "camas-box-bau": <BedIcon />,
  "camas-com-colchao": <BedIcon />,
  colchoes: <MattressIcon />,
  cabeceiras: <HeadboardIcon />,
  bases: <BaseIcon />,
  baus: <ChestIcon />,
  acessorios: <AccessoryIcon />,
};

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M3 18V9h3a4 4 0 014-4h7a4 4 0 014 4v9M3 14h18M7 14v4M17 14v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MattressIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect
        x="3"
        y="9"
        width="18"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 16h18M7 9V7m10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeadboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M5 19V8a4 4 0 014-4h6a4 4 0 014 4v11M5 15h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="3" y="10" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 16v3M18 16v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="4" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12h16M12 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AccessoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stars() {
  return (
    <div className="flex items-center gap-0.5 text-[#C8A96A]">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
          <path d="M10 1.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14l-4.8 2.4.9-5.4L2.2 7.2l5.4-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({
  product,
  override,
}: {
  product: CatalogProduct;
  override?: ProductOverride | null;
}) {
  const { toggleFavorite, isFavorite, addToCart } = useShop();
  const { isReseller, dealer } = useDealer();
  const viewMode = isReseller ? "wholesale" : "retail";
  const merged = mergeProductOverride(product, override, viewMode);
  const favorited = isFavorite(product.id);
  const categoryLabel =
    homeCatalogConfig.categories.find((c) => c.id === product.categoryId)
      ?.label || product.categoryId;
  const minQty = isReseller
    ? getMinQty(
        product.categoryId,
        override?.minQty ?? dealer?.globalMinOrder,
      )
    : 1;
  const wholesale = isReseller
    ? (override?.wholesalePrice ??
      getWholesaleUnit(merged.price, dealer?.discountPercent))
    : merged.price;
  const stockHint = isReseller
    ? (override?.stock ?? 24 + (product.order % 40))
    : undefined;
  const displayImage = merged.image;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_10px_40px_rgba(15,15,16,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(15,15,16,0.1)] sm:rounded-[16px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EEEAE4]">
        <Link href={`/produto/${product.id}`} className="absolute inset-0">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 28vw"
          />
        </Link>
        <button
          type="button"
          aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
          onClick={() =>
            toggleFavorite({
              productId: product.id,
              name: merged.name,
              image: displayImage,
              price: isReseller ? wholesale : merged.price,
              category: categoryLabel,
            })
          }
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-[0_4px_14px_rgba(15,15,16,0.18)] transition duration-300 hover:scale-105 sm:right-3 sm:top-3 sm:h-10 sm:w-10 ${
            favorited
              ? "text-[#C5A059]"
              : "text-[#0F0F10]/70 hover:text-[#C5A059]"
          }`}
        >
          <IconHeart className="h-4 w-4 sm:h-[18px] sm:w-[18px]" filled={favorited} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
        <Link href={`/produto/${product.id}`}>
          <h3 className="font-display text-[14px] leading-snug text-[#0F0F10] transition hover:text-[#C5A059] sm:text-[20px]">
            {merged.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
          <Stars />
          <span className="text-[10px] text-[#6B6B6B] sm:text-[12px]">
            {product.rating.toFixed(1)} ({product.reviews})
          </span>
        </div>

        {isReseller ? (
          <div className="mt-2 space-y-0.5 sm:mt-3 sm:space-y-1">
            <p className="text-[10px] text-[#6B6B6B] line-through sm:text-[12px]">
              Varejo {formatBRL(merged.price)}
            </p>
            <p className="text-[13px] font-semibold text-[#0F0F10] sm:text-[15px]">
              Atacado {formatBRL(wholesale)}
            </p>
            <p className="text-[10px] text-[#2E2E2E] sm:text-[12px]">
              Pedido mínimo {minQty} un.
              {typeof stockHint === "number" ? ` · ${stockHint} em estoque` : ""}
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-[13px] font-semibold text-[#0F0F10] sm:mt-3 sm:text-[15px]">
              A partir de {formatBRL(merged.price)}
            </p>
            <p className="mt-0.5 text-[10px] text-[#6B6B6B] sm:mt-1 sm:text-[12px]">
              10x de {formatBRL(Math.round(merged.price / 10))} sem juros
            </p>
          </>
        )}

        <div className="mt-3 flex flex-col gap-1.5 sm:mt-4">
          <Link
            href={`/produto/${product.id}`}
            className="inline-flex h-8 w-full items-center justify-center rounded-md bg-[#C8A96A] px-2 text-[9px] font-bold uppercase tracking-[0.08em] text-[#0F0F10] transition duration-300 hover:bg-[#B8934F] sm:h-9 sm:px-3 sm:text-[10px] sm:tracking-[0.1em]"
          >
            Comprar
          </Link>

          <button
            type="button"
            onClick={() =>
              addToCart(
                {
                  productId: product.id,
                  name: merged.name,
                  image: displayImage,
                  unitPrice: isReseller ? wholesale : merged.price,
                  retailUnitPrice: merged.price,
                  category: categoryLabel,
                  minQty: isReseller ? minQty : 1,
                  mode: isReseller ? "wholesale" : "retail",
                  stock: isReseller ? stockHint : undefined,
                  quantity: isReseller ? minQty : 1,
                },
                { open: true },
              )
            }
            className="hidden h-8 w-full items-center justify-center whitespace-nowrap rounded-md border border-[#C8A96A] px-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#0F0F10] transition hover:bg-[#C8A96A]/15 sm:inline-flex"
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function HomeCatalogShowcase() {
  const searchParams = useSearchParams();
  const { isReseller, dealer, loading: dealerLoading } = useDealer();
  const categories = useMemo(() => getVisibleCategories(), []);

  const [activeId, setActiveId] = useState<CatalogCategoryId>("camas-box-bau");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Box Baú"]);
  const [selectedColor, setSelectedColor] = useState("Preto");
  const [sort, setSort] = useState("Mais vendidos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [overrides, setOverrides] = useState<Map<string, ProductOverride>>(
    () => new Map(),
  );
  const [catalogTitle, setCatalogTitle] = useState("Nosso catálogo");
  const [catalogSubtitle, setCatalogSubtitle] = useState("");

  useEffect(() => {
    if (dealerLoading) return;
    void fetch("/api/cms", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((cms) => {
        setOverrides(indexOverrides(cms.productOverrides || []));
        if (cms?.home?.catalogTitle) setCatalogTitle(cms.home.catalogTitle);
        if (cms?.home?.catalogSubtitle)
          setCatalogSubtitle(cms.home.catalogSubtitle);
      })
      .catch(() => undefined);
  }, [dealerLoading, isReseller]);

  useEffect(() => {
    const fromUrl = searchParams.get("categoria") as CatalogCategoryId | null;
    if (!fromUrl) return;
    const exists = categories.some((c) => c.id === fromUrl);
    if (!exists) return;
    setActiveId(fromUrl);

    const timer = window.setTimeout(() => {
      document
        .getElementById("nosso-catalogo")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [searchParams, categories]);

  const activeCategory = categories.find((c) => c.id === activeId) ?? categories[0];
  const viewMode = isReseller ? "wholesale" : "retail";

  const products = useMemo(() => {
    const list = getProductsByCategory(activeId)
      .map((p) => mergeProductOverride(p, overrides.get(p.id), viewMode))
      .filter((p) => p.active !== false);
    if (sort === "Menor preço") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "Maior preço") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "Melhor avaliação") return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [activeId, sort, overrides, viewMode]);

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFiltersOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const filterPanel = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F0F10]">
        Categorias
      </p>
      <ul className="mt-3 space-y-1">
        {categories.map((category) => {
          const active = category.id === activeId;
          const count = homeCatalogConfig.products.filter(
            (p) => p.categoryId === category.id,
          ).length;
          const min = getMinQty(category.id, dealer?.globalMinOrder);
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(category.id);
                  setFiltersOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition duration-300 ${
                  active
                    ? "bg-[#C8A96A] font-semibold text-black"
                    : "text-[#2E2E2E] hover:bg-[#F8F8F6]"
                }`}
              >
                <span className={active ? "text-black" : "text-[#C8A96A]"}>
                  {categoryIcons[category.id]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">{category.label}</span>
                  {isReseller ? (
                    <span
                      className={`block text-[10px] font-normal ${
                        active ? "text-black/70" : "text-[#6B6B6B]"
                      }`}
                    >
                      {count} produtos · mín. {min}
                    </span>
                  ) : null}
                </span>
                <IconChevron
                  direction="right"
                  className={`h-3.5 w-3.5 ${
                    active ? "text-[#0F0F10]" : "text-[#2E2E2E]/35"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-7 border-t border-[#0F0F10]/08 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F0F10]">
          Filtrar por
        </p>

        <div className="mt-5">
          <p className="text-[12px] font-semibold text-[#0F0F10]">Tamanho</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const on = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    on
                      ? "border-[#C8A96A] bg-[#C8A96A] text-black"
                      : "border-[#0F0F10]/12 bg-white text-[#2E2E2E] hover:border-[#C8A96A]/60"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[12px] font-semibold text-[#0F0F10]">Tipo</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {types.map((type) => {
              const on = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    on
                      ? "border-[#C8A96A] bg-[#C8A96A] text-black"
                      : "border-[#0F0F10]/12 bg-white text-[#2E2E2E] hover:border-[#C8A96A]/60"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[12px] font-semibold text-[#0F0F10]">Cor</p>
          <div className="mt-2.5 flex gap-2">
            {colorSwatches.map((color) => (
              <button
                key={color.name}
                type="button"
                aria-label={color.name}
                onClick={() => setSelectedColor(color.name)}
                className={`h-7 w-7 rounded-md border-2 transition duration-300 ${
                  selectedColor === color.name
                    ? "border-[#C8A96A]"
                    : "border-transparent"
                }`}
                style={{ background: color.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <section id="nosso-catalogo" className="scroll-mt-8 w-full bg-[#F8F8F6]">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-4 sm:px-8 lg:px-10 lg:pb-16 lg:pt-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8 xl:grid-cols-[280px_1fr] xl:gap-10">
          {/* Sidebar desktop */}
          <aside className="hidden h-fit rounded-[16px] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,16,0.05)] lg:sticky lg:top-6 lg:block lg:p-6">
            {filterPanel}
          </aside>

          {/* Conteúdo */}
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                {catalogTitle ? (
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8A96A]">
                    {catalogTitle}
                  </p>
                ) : null}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="font-display text-[28px] leading-tight text-[#0F0F10] sm:text-[40px]">
                      {activeCategory?.label}
                    </h2>
                    <p className="mt-2 text-[13px] leading-6 text-[#6B6B6B] sm:mt-3 sm:text-[14px] sm:leading-7">
                      {catalogSubtitle ||
                        categoryCopy[activeId] ||
                        "Conheça a linha Home Queen selecionada para esta categoria."}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="group relative inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full border border-[#C8A96A]/45 bg-[#0F0F10] px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8A96A] shadow-[0_10px_28px_rgba(15,15,16,0.18)] transition hover:border-[#C8A96A] hover:text-[#E2C48A] lg:hidden"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-[#C8A96A]/10 via-transparent to-[#C8A96A]/10 opacity-80"
                  />
                  <svg viewBox="0 0 24 24" className="relative h-4 w-4" fill="none" aria-hidden>
                    <path
                      d="M4 6h16M7 12h10M10 18h4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="relative">Categorias e filtros</span>
                </button>
                <label className="flex w-full shrink-0 items-center justify-between gap-2 text-[12px] text-[#2E2E2E] sm:w-auto sm:justify-start">
                  <span className="text-[#6B6B6B]">Ordenar por:</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-[#0F0F10]/12 bg-white px-3 py-2 text-[12px] text-[#0F0F10] outline-none transition focus:border-[#C8A96A] sm:flex-none"
                  >
                    <option>Mais vendidos</option>
                    <option>Menor preço</option>
                    <option>Maior preço</option>
                    <option>Melhor avaliação</option>
                  </select>
                </label>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeId + sort}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 xl:grid-cols-3"
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    override={overrides.get(product.id)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {products.length === 0 ? (
              <p className="mt-16 text-center text-[14px] text-[#6B6B6B]">
                Nenhum produto nesta categoria no momento.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Fechar filtros"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-white p-5 shadow-[0_-12px_40px_rgba(15,15,16,0.2)] sm:inset-y-0 sm:left-0 sm:right-auto sm:w-[340px] sm:max-h-none sm:rounded-none sm:rounded-r-[16px]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#0F0F10]">
                Filtros
              </p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-[#0F0F10]/12 px-3 py-1.5 text-[12px] font-semibold text-[#0F0F10]"
              >
                Fechar
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0F0F10] text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8A96A]"
            >
              Ver produtos
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
