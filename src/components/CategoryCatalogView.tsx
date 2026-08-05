"use client";

import Image from "next/image";
import Link from "next/link";
import { productPath } from "@/lib/seo";
import { formatBRL } from "@/data/homeCatalog";

type Item = {
  id: string;
  name: string;
  slug?: string;
  image: string;
  price: number;
  categoryId: string;
};

export function CategoryCatalogView({
  categoryId,
  categorySlug,
  products,
}: {
  categoryId: string;
  categorySlug: string;
  products: Item[];
}) {
  void categoryId;
  void categorySlug;

  if (!products.length) {
    return (
      <section className="mx-auto max-w-[1240px] px-6 py-16 lg:px-8">
        <p className="text-[#0F0F10]/55">
          Nenhum produto nesta categoria no momento.
        </p>
        <Link href="/#nosso-catalogo" className="mt-4 inline-block text-[#C8A96A]">
          Ver catálogo completo
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-8 pb-16 lg:px-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const href = productPath(product);
          const alt = product.name;
          return (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
            >
              <Link href={href} className="block">
                <div className="relative aspect-[4/3] bg-[#EDEDEB]">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={alt}
                      title={alt}
                      fill
                      loading="lazy"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <h2 className="text-[14px] font-semibold text-[#0F0F10]">
                    {product.name}
                  </h2>
                  <p className="mt-1 text-[13px] font-bold text-[#C8A96A]">
                    {formatBRL(product.price)}
                  </p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
