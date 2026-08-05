"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatBRL } from "@/data/homeCatalog";
import { useShop } from "@/context/ShopContext";

export function FavoritesPageView() {
  const {
    favorites,
    clearFavorites,
    removeFavorite,
    moveFavoriteToCart,
    moveAllFavoritesToCart,
  } = useShop();
  const [category, setCategory] = useState("Todos");

  const categories = useMemo(() => {
    const set = new Set(
      favorites.map((f) => f.category || "Outros").filter(Boolean),
    );
    return ["Todos", ...Array.from(set)];
  }, [favorites]);

  const filtered =
    category === "Todos"
      ? favorites
      : favorites.filter((f) => (f.category || "Outros") === category);

  async function shareList() {
    const text =
      favorites.length === 0
        ? "Minha lista de favoritos Home Queen está vazia."
        : `Favoritos Home Queen:\n${favorites
            .map((f) => `• ${f.name} — ${formatBRL(f.price)}`)
            .join("\n")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Favoritos Home Queen", text });
        return;
      } catch {
        /* fallthrough */
      }
    }
    await navigator.clipboard.writeText(text);
    alert("Lista copiada para a área de transferência.");
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] sm:text-[36px]">❤️ Favoritos</h1>
          <p className="mt-2 text-[14px] text-[#6B6B6B]">
            {favorites.length}{" "}
            {favorites.length === 1 ? "produto salvo" : "produtos salvos"}
          </p>
        </div>
        {favorites.length > 0 ? (
          <button
            type="button"
            onClick={shareList}
            className="rounded-md border border-[#0F0F10]/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition hover:border-[#C5A059]"
          >
            Compartilhar lista
          </button>
        ) : null}
      </div>

      <div className="mt-8 border-y border-[#EAEAEA] py-4">
        <h2 className="text-[14px] font-semibold">❤️ Produtos Salvos</h2>
      </div>

      {categories.length > 1 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition ${
                category === c
                  ? "bg-[#C5A059] text-black"
                  : "bg-white text-[#2E2E2E] ring-1 ring-[#E5E5E5] hover:ring-[#C5A059]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-[16px] border border-dashed border-[#D6D0C6] bg-white px-6 py-16 text-center">
          <p className="text-[15px] text-[#6B6B6B]">
            Nenhum favorito por aqui ainda.
          </p>
          <Link
            href="/#nosso-catalogo"
            className="mt-5 inline-flex rounded-md bg-[#C5A059] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[#EAEAEA] rounded-[16px] border border-[#EEEAE4] bg-white">
          {filtered.map((item) => (
            <li key={item.productId} className="flex flex-wrap gap-4 p-5 sm:flex-nowrap">
              <Link
                href={`/produto/${item.productId}`}
                className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[12px] bg-[#F5F5F3]"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produto/${item.productId}`}
                  className="text-[16px] font-semibold text-[#0F0F10] hover:text-[#C5A059]"
                >
                  {item.name}
                </Link>
                {item.sizeLabel ? (
                  <p className="mt-1 text-[13px] text-[#6B6B6B]">{item.sizeLabel}</p>
                ) : null}
                <p className="mt-2 text-[15px] font-semibold">
                  {formatBRL(item.price)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/produto/${item.productId}`}
                    className="rounded-md border border-[#0F0F10]/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition hover:border-[#C5A059]"
                  >
                    Ver Produto
                  </Link>
                  <button
                    type="button"
                    onClick={() => moveFavoriteToCart(item.productId)}
                    className="rounded-md bg-[#C5A059] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-black"
                  >
                    Mover para o carrinho
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(item.productId)}
                    className="rounded-md px-3 py-2 text-[11px] text-[#8A8A8A] hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {favorites.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={moveAllFavoritesToCart}
            className="rounded-md bg-[#C5A059] px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black"
          >
            🛒 Adicionar todos ao carrinho
          </button>
          <button
            type="button"
            onClick={clearFavorites}
            className="rounded-md border border-[#0F0F10]/20 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            🗑 Limpar favoritos
          </button>
        </div>
      ) : null}
    </div>
  );
}
