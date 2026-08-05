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
    <section id="destaques" className="bg-white pb-20 pt-10">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div>
          <h2 className="font-display text-[30px] sm:text-[34px]">
            {isReseller ? "Destaques do atacado" : featuredTitle}
          </h2>
          {isReseller ? (
            <p className="mt-2 text-[14px] text-[#6B6B6B]">
              Preço de revenda e pedido mínimo por produto.
            </p>
          ) : featuredSubtitle ? (
            <p className="mt-2 text-[14px] text-[#6B6B6B]">{featuredSubtitle}</p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
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
                className="group overflow-hidden rounded-[16px] border border-[#EAEAEA] bg-white shadow-[0_8px_30px_rgba(15,15,16,0.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,15,16,0.1)]"
              >
                <Link href={`/produto/${product.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#171717]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-[#C5A059] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-black">
                      {product.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1 text-[#C5A059]">
                      <IconStar className="h-3.5 w-3.5 fill-current" />
                      <span className="text-[12px] font-semibold text-[#0F0F10]">
                        {product.rating}
                      </span>
                      <span className="text-[12px] text-[#6B6B6B]">
                        ({product.reviews} avaliações)
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-[22px]">
                      {product.name}
                    </h3>

                    {isReseller ? (
                      <div className="mt-3 space-y-1">
                        <p className="text-[12px] text-[#6B6B6B] line-through">
                          Varejo {formatBRL(product.price)}
                        </p>
                        <p className="text-[22px] font-bold text-[#0F0F10]">
                          Atacado {formatBRL(wholesale)}
                        </p>
                        <p className="text-[13px] font-semibold text-[#C5A059]">
                          Pedido mínimo: {minQty} un.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="mt-3 text-[22px] font-bold text-[#0F0F10]">
                          {formatBRL(product.price)}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B6B6B]">
                          10x de {formatBRL(Math.round(product.price / 10))}
                        </p>
                      </>
                    )}

                    <span className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-[#C5A059] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition group-hover:bg-[#d4b06a]">
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
