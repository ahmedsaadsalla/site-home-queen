"use client";

import Image from "next/image";
import Link from "next/link";
import { IconStar } from "@/components/icons";
import { useDealer } from "@/context/DealerContext";
import { formatBRL, homeCatalogConfig } from "@/data/homeCatalog";
import { getMinQty, getWholesaleUnit } from "@/lib/wholesalePricing";
import { useEffect, useState } from "react";

const FEATURED_IDS = ["camas-box-1", "colchoes-1", "cabeceiras-1"] as const;

const FALLBACK = [
  {
    id: "camas-box-1",
    name: "Cama Box Imperial",
    image:
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    price: 2490,
    rating: 4.9,
    reviews: 128,
    badge: "Mais vendido",
    categoryId: "camas-box" as const,
  },
  {
    id: "colchoes-1",
    name: "Colchão Majesty",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    price: 1890,
    rating: 4.8,
    reviews: 96,
    badge: "Lançamento",
    categoryId: "colchoes" as const,
  },
  {
    id: "cabeceiras-1",
    name: "Cabeceira Royale",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
    price: 980,
    rating: 5.0,
    reviews: 54,
    badge: "Exclusivo",
    categoryId: "cabeceiras" as const,
  },
];

export function FeaturedProductsSection() {
  const { isReseller, dealer } = useDealer();
  const [featuredTitle, setFeaturedTitle] = useState(
    "Linhas premium para o seu quarto",
  );
  const [featuredSubtitle, setFeaturedSubtitle] = useState("");

  useEffect(() => {
    void fetch("/api/cms")
      .then((r) => r.json())
      .then((cms) => {
        if (cms?.home?.featuredTitle) setFeaturedTitle(cms.home.featuredTitle);
        if (cms?.home?.featuredSubtitle)
          setFeaturedSubtitle(cms.home.featuredSubtitle);
      })
      .catch(() => undefined);
  }, []);

  const products = FEATURED_IDS.map((id, i) => {
    const fromCatalog = homeCatalogConfig.products.find((p) => p.id === id);
    return fromCatalog
      ? {
          id: fromCatalog.id,
          name: fromCatalog.name,
          image: fromCatalog.image,
          price: fromCatalog.price,
          rating: fromCatalog.rating,
          reviews: fromCatalog.reviews,
          badge: fromCatalog.badge || FALLBACK[i].badge,
          categoryId: fromCatalog.categoryId,
        }
      : FALLBACK[i];
  });

  return (
    <section id="destaques" className="bg-white pb-12 pt-8 sm:pb-16 sm:pt-10">
      <div className="mx-auto max-w-[1240px] lg:px-8">
        <div className="px-5 lg:px-0">
          <h2 className="font-display text-[24px] sm:text-[30px]">
            {isReseller ? "Destaques do atacado" : featuredTitle}
          </h2>
          {isReseller ? (
            <p className="mt-1.5 text-[13px] text-[#6B6B6B] sm:mt-2 sm:text-[14px]">
              Preço de revenda e pedido mínimo por produto.
            </p>
          ) : featuredSubtitle ? (
            <p className="mt-1.5 text-[13px] text-[#6B6B6B] sm:mt-2 sm:text-[14px]">
              {featuredSubtitle}
            </p>
          ) : null}
        </div>

        {/* Celular: carrossel horizontal · Desktop: 3 colunas */}
        <div className="mt-6 flex gap-3 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory sm:mt-8 sm:gap-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {products.map((product) => {
            const wholesale = getWholesaleUnit(
              product.price,
              dealer?.discountPercent,
            );
            const minQty = getMinQty(
              product.categoryId,
              dealer?.globalMinOrder,
            );

            return (
              <article
                key={product.id}
                className="group w-[72vw] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-[14px] border border-[#EAEAEA] bg-white shadow-[0_8px_24px_rgba(15,15,16,0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(15,15,16,0.1)] sm:w-[240px] lg:w-auto lg:max-w-none"
              >
                <Link href={`/produto/${product.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#171717]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 72vw, 33vw"
                    />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-[#C5A059] px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-black sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[9px]">
                      {product.badge}
                    </span>
                  </div>
                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-center gap-1 text-[#C5A059]">
                      <IconStar className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" />
                      <span className="text-[11px] font-semibold text-[#0F0F10] sm:text-[12px]">
                        {product.rating}
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] sm:text-[12px]">
                        ({product.reviews})
                      </span>
                    </div>
                    <h3 className="font-display mt-2 text-[16px] leading-snug sm:mt-2.5 sm:text-[18px]">
                      {product.name}
                    </h3>

                    {isReseller ? (
                      <div className="mt-2 space-y-0.5 sm:mt-2.5">
                        <p className="text-[11px] text-[#6B6B6B] line-through">
                          Varejo {formatBRL(product.price)}
                        </p>
                        <p className="text-[16px] font-bold text-[#0F0F10] sm:text-[18px]">
                          Atacado {formatBRL(wholesale)}
                        </p>
                        <p className="text-[11px] font-semibold text-[#C5A059] sm:text-[12px]">
                          Mín. {minQty} un.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-[16px] font-bold text-[#0F0F10] sm:mt-2.5 sm:text-[18px]">
                          {formatBRL(product.price)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6B6B6B]">
                          10x de {formatBRL(Math.round(product.price / 10))}
                        </p>
                      </>
                    )}

                    <span className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-[#C5A059] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black transition group-hover:bg-[#d4b06a] sm:mt-4 sm:py-2.5 sm:text-[11px]">
                      {isReseller ? "Comprar no atacado" : "Comprar"}
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
