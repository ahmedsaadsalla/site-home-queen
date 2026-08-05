"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatBRL } from "@/data/homeCatalog";
import { useShop } from "@/context/ShopContext";

function MiniPanel({
  open,
  title,
  countLabel,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  countLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-[90] bg-transparent"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label={title}
            className="fixed right-3 top-[84px] z-[95] flex w-[min(340px,calc(100vw-1.5rem))] max-h-[min(420px,calc(100vh-110px))] flex-col overflow-hidden rounded-[14px] border border-[#EAEAEA] bg-white shadow-[0_16px_40px_rgba(15,15,16,0.16)] sm:right-6"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-4 py-3">
              <div>
                <h2 className="text-[14px] font-semibold text-[#0F0F10]">
                  {title}
                </h2>
                <p className="text-[11px] text-[#8A8A8A]">{countLabel}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[16px] text-[#8A8A8A] transition hover:bg-[#F5F5F3] hover:text-[#0F0F10]"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {children}
            </div>
            <div className="shrink-0 border-t border-[#F0F0F0] bg-[#FAFAF8] px-4 py-3">
              {footer}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function CartDrawer() {
  const {
    drawer,
    closeDrawer,
    cart,
    cartCount,
    cartSubtotal,
    updateQty,
    removeFromCart,
  } = useShop();

  const preview = cart.slice(0, 4);

  return (
    <MiniPanel
      open={drawer === "cart"}
      title="🛒 Carrinho"
      countLabel={
        cartCount === 0
          ? "Nenhum produto"
          : `${cartCount} ${cartCount === 1 ? "produto" : "produtos"}`
      }
      onClose={closeDrawer}
      footer={
        <>
          <div className="mb-2.5 flex items-center justify-between text-[13px]">
            <span className="text-[#6B6B6B]">Subtotal</span>
            <span className="font-semibold">{formatBRL(cartSubtotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/carrinho"
              onClick={closeDrawer}
              className="rounded-lg border border-[#0F0F10]/20 px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.1em]"
            >
              Ver Carrinho
            </Link>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="rounded-lg bg-[#C5A059] px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-black"
            >
              Finalizar
            </Link>
          </div>
        </>
      }
    >
      {cart.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#8A8A8A]">
          Seu carrinho está vazio.
        </p>
      ) : (
        <ul className="space-y-3">
          {preview.map((item) => (
            <li key={item.key} className="flex gap-2.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F3]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold">{item.name}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center overflow-hidden rounded border border-[#E5E5E5] text-[11px]">
                    <button
                      type="button"
                      className="px-1.5 py-0.5"
                      onClick={() => updateQty(item.key, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-[1.25rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-1.5 py-0.5"
                      onClick={() => updateQty(item.key, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[12px] font-semibold">
                    {formatBRL(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.key)}
                  className="mt-1 text-[10px] text-[#8A8A8A] hover:text-red-600"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
          {cart.length > 4 ? (
            <p className="text-center text-[11px] text-[#8A8A8A]">
              +{cart.length - 4} no carrinho completo
            </p>
          ) : null}
        </ul>
      )}
    </MiniPanel>
  );
}

export function FavoritesDrawer() {
  const {
    drawer,
    closeDrawer,
    favorites,
    favoritesCount,
    removeFavorite,
    moveFavoriteToCart,
  } = useShop();

  const preview = favorites.slice(0, 4);

  return (
    <MiniPanel
      open={drawer === "favorites"}
      title="❤️ Favoritos"
      countLabel={
        favoritesCount === 0
          ? "Nenhum produto"
          : `${favoritesCount} ${favoritesCount === 1 ? "produto" : "produtos"}`
      }
      onClose={closeDrawer}
      footer={
        <Link
          href="/favoritos"
          onClick={closeDrawer}
          className="block rounded-lg bg-[#C5A059] px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-black"
        >
          Ver Todos
        </Link>
      }
    >
      {favorites.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[#8A8A8A]">
          Você ainda não salvou produtos.
        </p>
      ) : (
        <ul className="space-y-3">
          {preview.map((item) => (
            <li key={item.productId} className="flex gap-2.5">
              <Link
                href={`/produto/${item.productId}`}
                onClick={closeDrawer}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F3]"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produto/${item.productId}`}
                  onClick={closeDrawer}
                  className="block truncate text-[12px] font-semibold hover:text-[#C5A059]"
                >
                  {item.name}
                </Link>
                {item.sizeLabel ? (
                  <p className="text-[11px] text-[#8A8A8A]">{item.sizeLabel}</p>
                ) : null}
                <p className="mt-0.5 text-[12px] font-semibold">
                  {formatBRL(item.price)}
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveFavoriteToCart(item.productId)}
                    className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#C5A059]"
                  >
                    Carrinho
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(item.productId)}
                    className="text-[10px] text-[#8A8A8A] hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
          {favorites.length > 4 ? (
            <p className="text-center text-[11px] text-[#8A8A8A]">
              +{favorites.length - 4} na lista completa
            </p>
          ) : null}
        </ul>
      )}
    </MiniPanel>
  );
}

export function ShopDrawers() {
  return (
    <>
      <CartDrawer />
      <FavoritesDrawer />
    </>
  );
}
