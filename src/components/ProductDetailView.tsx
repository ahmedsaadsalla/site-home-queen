"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  IconHeart,
} from "@/components/icons";
import { useDealer } from "@/context/DealerContext";
import { useShop } from "@/context/ShopContext";
import {
  calcPrice,
  formatBRL,
  getRelatedProducts,
  type ProductDetail,
  type ProductMattress,
  type ProductSize,
  type ProductType,
} from "@/data/productDetail";
import {
  getMinQty,
  getSavings,
  getWholesaleUnit,
} from "@/lib/wholesalePricing";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition duration-300 ${
        active
          ? "border-[#C8A96A] bg-[#C8A96A] text-[#0F0F10]"
          : "border-[#0F0F10]/12 bg-white text-[#0F0F10] hover:border-[#C8A96A]"
      }`}
    >
      {children}
    </button>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-[#C8A96A]">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={`h-4 w-4 ${filled || half ? "fill-current" : "fill-none stroke-current"}`}
            aria-hidden
          >
            <path d="M10 1.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14l-4.8 2.4.9-5.4L2.2 7.2l5.4-.8L10 1.5z" />
          </svg>
        );
      })}
    </div>
  );
}

function Seal({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-white">
      <span className="text-[#C8A96A]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function ProductDetailView({
  product,
}: {
  product: ProductDetail;
}) {
  const [type, setType] = useState<ProductType>(product.defaultType);
  const [size, setSize] = useState<ProductSize>(product.defaultSize);
  const [mattress, setMattress] = useState<ProductMattress>(
    product.defaultMattress,
  );
  const [color, setColor] = useState(product.defaultColor);
  const [qty, setQty] = useState(1);
  const [thumb, setThumb] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const variant = useMemo(
    () =>
      product.variants.find((v) => v.size === size) ?? product.variants[0],
    [product.variants, size],
  );

  const { dealer, isReseller, loading: dealerLoading } = useDealer();
  const [ov, setOv] = useState<{
    wholesalePrice?: number;
    minQty?: number;
    stock?: number;
    wholesaleImage?: string;
    wholesaleCover?: string;
    wholesaleGallery?: string[];
    colors?: Array<{ name: string; hex: string }>;
    defaultColor?: string;
  } | null>(null);

  useEffect(() => {
    if (dealerLoading) return;
    void fetch("/api/cms", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((cms) => {
        const row = (cms.productOverrides || []).find(
          (p: { id: string }) => p.id === product.id,
        );
        if (!row) {
          setOv(null);
          return;
        }
        setOv({
          wholesalePrice: isReseller ? row.wholesalePrice : undefined,
          minQty: isReseller ? row.minQty : undefined,
          stock: isReseller ? row.stock : undefined,
          wholesaleImage: isReseller ? row.wholesaleImage : undefined,
          wholesaleCover: isReseller ? row.wholesaleCover : undefined,
          wholesaleGallery: isReseller ? row.wholesaleGallery : undefined,
          colors: row.colors,
          defaultColor: row.defaultColor,
        });
      })
      .catch(() => setOv(null));
  }, [dealerLoading, isReseller, product.id]);

  const retailUnit = calcPrice(variant.price, type, mattress, 1);
  const wholesaleUnit =
    isReseller && typeof ov?.wholesalePrice === "number" && ov.wholesalePrice > 0
      ? ov.wholesalePrice
      : getWholesaleUnit(retailUnit, dealer?.discountPercent);
  const unit = isReseller ? wholesaleUnit : retailUnit;
  const minQty = isReseller
    ? getMinQty(product.categoryId, ov?.minQty ?? dealer?.globalMinOrder)
    : 1;
  const price = unit * qty;
  const installment = Math.round(price / 10);
  const wholesaleGallery =
    isReseller && ov?.wholesaleGallery?.length
      ? ov.wholesaleGallery
      : isReseller && ov?.wholesaleImage
        ? [ov.wholesaleImage, ...(ov.wholesaleCover ? [ov.wholesaleCover] : [])]
        : null;
  const images = wholesaleGallery?.length ? wholesaleGallery : variant.images;
  const productColors =
    ov?.colors && ov.colors.length > 0 ? ov.colors : product.colors;
  const related = getRelatedProducts(product.relatedIds);
  const router = useRouter();
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const favorited = isFavorite(product.id);

  useEffect(() => {
    if (ov?.defaultColor) {
      setColor(ov.defaultColor);
    } else if (ov?.colors?.length) {
      setColor(ov.colors[0].name);
    }
  }, [ov?.defaultColor, ov?.colors]);

  useEffect(() => {
    setThumb(0);
  }, [images[0], isReseller]);

  useEffect(() => {
    if (isReseller && qty < minQty) setQty(minQty);
  }, [isReseller, minQty, qty]);

  function bump(fn: () => void) {
    fn();
    setPulse(true);
    window.setTimeout(() => setPulse(false), 280);
  }

  function addCurrent(open = true) {
    const qtyToAdd = isReseller ? Math.max(qty, minQty) : qty;
    const stockVal =
      isReseller && typeof ov?.stock === "number" ? ov.stock : variant.stock;
    addToCart(
      {
        productId: product.id,
        name: product.name,
        image: images[thumb] ?? images[0],
        size,
        color,
        type,
        mattress,
        unitPrice: unit,
        retailUnitPrice: retailUnit,
        category: product.categoryLabel,
        stock: stockVal,
        quantity: qtyToAdd,
        minQty: isReseller ? minQty : 1,
        mode: isReseller ? "wholesale" : "retail",
      },
      { open },
    );
  }

  function onFavorite() {
    toggleFavorite({
      productId: product.id,
      name: product.name,
      image: images[0],
      price: unit,
      sizeLabel: size,
      category: product.categoryLabel,
    });
  }

  function buyNow() {
    addCurrent(false);
    router.push("/checkout");
  }

  const quoteHref = useMemo(() => {
    const params = new URLSearchParams({
      productId: product.id,
      nome: product.name,
      categoria: product.categoryLabel,
      categoriaId: product.categoryId,
      modelo: product.badge || product.subcategory || "Premium",
      tipo: type,
      tamanho: size,
      cor: color,
      colchao: mattress,
      qty: String(qty),
      sku: variant.sku,
      codigo: `HQ-${product.categoryId.toUpperCase().replace(/-/g, "").slice(0, 4)}-${variant.sku}`,
      imagem: images[thumb] || images[0] || "",
      preco: String(price),
    });
    return `/orcamento?${params.toString()}`;
  }, [
    product,
    type,
    size,
    color,
    mattress,
    qty,
    variant.sku,
    images,
    thumb,
    price,
  ]);

  function selectSize(next: ProductSize) {
    bump(() => {
      setSize(next);
      setThumb(0);
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#0F0F10]">
      <div className="mx-auto max-w-[1800px] px-5 py-8 sm:px-8 lg:px-16 xl:px-20">
        {/* Breadcrumb */}
        <nav className="mb-6 text-[12px] text-[#6B6B6B]">
          <Link href="/" className="transition hover:text-[#C8A96A]">
            Início
          </Link>
          <span className="mx-2">›</span>
          <Link
            href={`/categorias/${product.categoryId}`}
            className="transition hover:text-[#C8A96A]"
          >
            {product.categoryLabel}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[#0F0F10]">{product.name}</span>
        </nav>

        {/* Main 55 / 45 */}
        <div className="grid gap-10 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Galeria */}
          <div>
            <div className="flex gap-4">
              <div className="hidden w-[90px] shrink-0 flex-col gap-2.5 sm:flex">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setThumb(i)}
                    className={`relative h-[90px] w-[90px] overflow-hidden rounded-[12px] border-2 transition duration-300 ${
                      thumb === i
                        ? "border-[#C8A96A]"
                        : "border-transparent hover:border-[#C8A96A]/40"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="90px" />
                  </button>
                ))}
              </div>

              <div className="relative min-w-0 flex-1">
                <div
                  className={`relative aspect-[850/650] overflow-hidden rounded-[20px] bg-[#EEEAE4] transition duration-300 ${
                    pulse ? "opacity-70" : "opacity-100"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${variant.size}-${thumb}-${color}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={images[thumb] ?? images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-300 hover:scale-105"
                        sizes="(max-width: 1280px) 100vw, 55vw"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute right-4 top-4 flex gap-2">
                    <button
                      type="button"
                      aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
                      onClick={onFavorite}
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(15,15,16,0.15)] transition hover:scale-105 ${
                        favorited
                          ? "text-[#C5A059]"
                          : "text-[#0F0F10]/70 hover:text-[#C5A059]"
                      }`}
                    >
                      <IconHeart className="h-[18px] w-[18px]" filled={favorited} />
                    </button>
                    <button
                      type="button"
                      aria-label="Compartilhar"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[14px] text-[#0F0F10] transition hover:text-[#C8A96A]"
                    >
                      ↗
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-x-6 gap-y-2 bg-[#0F0F10]/72 px-5 py-3.5 backdrop-blur-sm">
                    <Seal label="Produto Premium" icon="◆" />
                    <Seal label="Fabricação Própria" icon="◎" />
                    <Seal label="Garantia de 1 ano" icon="✓" />
                    <Seal label="Entrega Nacional" icon="☰" />
                  </div>
                </div>

                <div className="mt-3 flex gap-2 sm:hidden">
                  {images.map((src, i) => (
                    <button
                      key={`m-${i}`}
                      type="button"
                      onClick={() => setThumb(i)}
                      className={`relative h-16 w-16 overflow-hidden rounded-[10px] border-2 ${
                        thumb === i ? "border-[#C8A96A]" : "border-transparent"
                      }`}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Medidas */}
            <motion.div
              key={`${variant.size}-measures`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`mt-5 rounded-[20px] bg-white p-5 shadow-[0_10px_40px_rgba(15,15,16,0.05)] transition duration-300 ${
                pulse ? "ring-1 ring-[#C8A96A]/40" : ""
              }`}
            >
              <p className="text-[14px] font-semibold text-[#0F0F10]">
                Medidas da opção selecionada
              </p>
              <p className="mt-1 text-[13px] text-[#C8A96A]">{variant.size}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-[#2E2E2E] sm:grid-cols-4">
                <p>
                  <span className="text-[#6B6B6B]">Largura: </span>
                  <strong>{variant.width}</strong>
                </p>
                <p>
                  <span className="text-[#6B6B6B]">Profundidade: </span>
                  <strong>{variant.depth}</strong>
                </p>
                <p>
                  <span className="text-[#6B6B6B]">Altura: </span>
                  <strong>{variant.height}</strong>
                </p>
                <p>
                  <span className="text-[#6B6B6B]">Peso: </span>
                  <strong>{variant.weight}</strong>
                </p>
              </div>
              <button
                type="button"
                className="mt-4 text-[12px] font-medium text-[#C8A96A] transition hover:underline"
              >
                Ver informações completas
              </button>
            </motion.div>
          </div>

          {/* Info */}
          <div>
            <h1 className="font-display text-[32px] leading-tight text-[#0F0F10] sm:text-[40px]">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Stars rating={product.rating} />
              <span className="text-[13px] text-[#6B6B6B]">
                {product.rating.toFixed(1)} ({product.reviews} avaliações)
              </span>
            </div>

            <div className="mt-5">
              {isReseller ? (
                <div className="space-y-3 rounded-[14px] border border-[#C5A059]/35 bg-[#FAF7F0] p-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[12px] text-[#6B6B6B]">Preço varejo</p>
                      <p className="text-[18px] text-[#6B6B6B] line-through">
                        {formatBRL(retailUnit * qty)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C5A059]">
                        Seu preço
                      </p>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={price}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.3 }}
                          className={`font-display text-[34px] leading-none sm:text-[40px] ${
                            pulse ? "text-[#C8A96A]" : "text-[#0F0F10]"
                          }`}
                        >
                          {formatBRL(price)}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#2E2E2E]">
                    Economia{" "}
                    <strong className="text-emerald-700">
                      {formatBRL(getSavings(retailUnit, wholesaleUnit) * qty)}
                    </strong>
                  </p>
                  <p className="text-[13px] text-[#2E2E2E]">
                    Pedido mínimo <strong>{minQty} unidades</strong>
                    {" · "}Disponível{" "}
                    <strong
                      className={
                        (typeof ov?.stock === "number" ? ov.stock : variant.stock) >
                        0
                          ? "text-emerald-700"
                          : "text-red-600"
                      }
                    >
                      {(typeof ov?.stock === "number" ? ov.stock : variant.stock) >
                      0
                        ? `${typeof ov?.stock === "number" ? ov.stock : variant.stock} unidades`
                        : "Indisponível"}
                    </strong>
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-[#6B6B6B]">A partir de</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={price}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className={`font-display text-[36px] leading-none sm:text-[42px] ${
                        pulse ? "text-[#C8A96A]" : "text-[#0F0F10]"
                      }`}
                    >
                      {formatBRL(price)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="mt-2 text-[13px] text-[#6B6B6B]">
                    10x de {formatBRL(installment)} sem juros{" "}
                    <button
                      type="button"
                      className="text-[#C8A96A] hover:underline"
                    >
                      Ver parcelas
                    </button>
                  </p>
                  <p className="mt-2 text-[12px] text-[#2E2E2E]">
                    PIX: <strong>{formatBRL(Math.round(price * 0.95))}</strong>{" "}
                    <span className="text-[#6B6B6B]">(5% off)</span>
                  </p>
                  <p className="mt-3 rounded-[10px] border border-dashed border-[#C5A059]/50 bg-[#FAF7F0] px-3 py-2.5 text-[12px] text-[#2E2E2E]">
                    Preço exclusivo para revendedores —{" "}
                    <Link
                      href="/atacado"
                      className="font-semibold text-[#C5A059] hover:underline"
                    >
                      Entrar no Portal Atacado
                    </Link>
                  </p>
                  <p className="mt-2 text-[12px] text-[#2E2E2E]">
                    Disponibilidade:{" "}
                    <strong
                      className={
                        variant.stock > 0 ? "text-emerald-700" : "text-red-600"
                      }
                    >
                      {variant.stock > 0
                        ? `${variant.stock} em estoque`
                        : "Indisponível"}
                    </strong>
                    {" · "}SKU:{" "}
                    <strong className="text-[#C8A96A]">{variant.sku}</strong>
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <p className="mb-2.5 text-[13px] font-semibold text-[#0F0F10]">
                  1. Escolha o tipo
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.types.map((item) => (
                    <Pill
                      key={item}
                      active={type === item}
                      onClick={() => bump(() => setType(item))}
                    >
                      {item}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-semibold text-[#0F0F10]">
                  2. Escolha o tamanho
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((item) => (
                    <Pill
                      key={item.size}
                      active={size === item.size}
                      onClick={() => selectSize(item.size)}
                    >
                      {item.size}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-semibold text-[#0F0F10]">
                  3. Escolha o colchão (opcional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.mattresses.map((item) => (
                    <Pill
                      key={item}
                      active={mattress === item}
                      onClick={() => bump(() => setMattress(item))}
                    >
                      {item}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-semibold text-[#0F0F10]">
                  4. Escolha a cor
                </p>
                <div className="flex gap-3">
                  {productColors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      aria-label={c.name}
                      onClick={() => bump(() => setColor(c.name))}
                      className={`h-9 w-9 rounded-full border-2 transition duration-300 ${
                        color === c.name
                          ? "border-[#C8A96A]"
                          : "border-transparent hover:border-[#C8A96A]/40"
                      }`}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-semibold text-[#0F0F10]">
                  Quantidade
                </p>
                <div className="inline-flex items-center rounded-full border border-[#0F0F10]/12 bg-white">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-[#2E2E2E] transition hover:text-[#C8A96A]"
                    onClick={() =>
                      setQty((q) => Math.max(isReseller ? minQty : 1, q - 1))
                    }
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center text-[14px]">{qty}</span>
                  <button
                    type="button"
                    className="px-4 py-2.5 text-[#2E2E2E] transition hover:text-[#C8A96A]"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={buyNow}
                  className="flex h-[60px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#C8A96A] text-[12px] font-bold uppercase tracking-[0.14em] text-[#0F0F10] transition duration-300 hover:bg-[#B8934F]"
                >
                  <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M8 7V6a4 4 0 118 0v1h2.2c.7 0 1.2.6 1.1 1.3l-1.2 10A1.5 1.5 0 0116.6 20H7.4a1.5 1.5 0 01-1.5-1.7l-1.2-10A1.1 1.1 0 015.8 7H8zm2 0h4V6a2 2 0 10-4 0v1z" />
                  </svg>
                  Comprar agora
                </button>
                <Link
                  href={quoteHref}
                  className="flex h-[60px] w-full items-center justify-center rounded-[12px] border-2 border-[#0F0F10] bg-transparent text-[12px] font-bold uppercase tracking-[0.14em] text-[#0F0F10] transition duration-300 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                >
                  Fazer orçamento
                </Link>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => addCurrent(true)}
                    className="flex h-16 items-center justify-center gap-3 rounded-[12px] border-2 border-[#C8A96A] bg-white px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F0F10] transition duration-300 hover:bg-[#C8A96A]/15"
                  >
                    <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0 text-[#C8A96A]" fill="currentColor" aria-hidden>
                      <path d="M8 7V6a4 4 0 118 0v1h2.2c.7 0 1.2.6 1.1 1.3l-1.2 10A1.5 1.5 0 0116.6 20H7.4a1.5 1.5 0 01-1.5-1.7l-1.2-10A1.1 1.1 0 015.8 7H8zm2 0h4V6a2 2 0 10-4 0v1z" />
                    </svg>
                    Adicionar ao carrinho
                  </button>
                  <a
                    href="https://wa.me/5549999999999"
                    className="flex h-16 items-center justify-center gap-3 rounded-[12px] border-2 border-[#C8A96A] bg-white px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F0F10] transition duration-300 hover:bg-[#C8A96A]/15"
                  >
                    <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0 text-[#C8A96A]" fill="currentColor" aria-hidden>
                      <path d="M12.04 2C6.58 2 2.14 6.38 2.14 11.78c0 1.95.55 3.8 1.6 5.43L2 22l4.96-1.64a10.05 10.05 0 004.98 1.28h.01c5.46 0 9.9-4.38 9.9-9.78S17.5 2 12.04 2zm5.77 13.86c-.24.68-1.4 1.24-1.94 1.32-.5.07-1.13.1-1.82-.11-.42-.13-.95-.3-1.64-.59-2.88-1.24-4.76-4.14-4.91-4.33-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.1.2-.14.32-.28.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.16.28.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seções inferiores */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(15,15,16,0.05)] sm:p-8">
            <h2 className="font-display text-[24px] text-[#0F0F10]">
              Descrição do produto
            </h2>
            <p className="mt-4 text-[14px] leading-7 text-[#2E2E2E]">
              {product.description}
            </p>
          </section>

          <section className="rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(15,15,16,0.05)] sm:p-8">
            <h2 className="font-display text-[24px] text-[#0F0F10]">
              Especificações técnicas
            </h2>
            <dl className="mt-4 space-y-2.5 text-[14px]">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 border-b border-[#0F0F10]/06 py-2">
                  <dt className="text-[#6B6B6B]">{s.label}</dt>
                  <dd className="text-right font-medium text-[#0F0F10]">{s.value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-b border-[#0F0F10]/06 py-2">
                <dt className="text-[#6B6B6B]">Volume</dt>
                <dd className="font-medium text-[#0F0F10]">{variant.volume}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-[#6B6B6B]">Capacidade</dt>
                <dd className="font-medium text-[#0F0F10]">{variant.capacity}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(15,15,16,0.05)] sm:p-8">
            <h2 className="font-display text-[24px] text-[#0F0F10]">Materiais</h2>
            <ul className="mt-4 space-y-2 text-[14px] text-[#2E2E2E]">
              {product.materials.map((m) => (
                <li key={m} className="flex gap-2">
                  <span className="text-[#C8A96A]">•</span>
                  {m}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(15,15,16,0.05)] sm:p-8">
            <h2 className="font-display text-[24px] text-[#0F0F10]">Garantia</h2>
            <p className="mt-4 text-[14px] leading-7 text-[#2E2E2E]">
              {product.warranty}
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(15,15,16,0.05)] sm:p-8">
          <h2 className="font-display text-[24px] text-[#0F0F10]">
            Avaliações dos clientes
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Stars rating={product.rating} />
            <span className="text-[15px] font-semibold text-[#0F0F10]">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-[13px] text-[#6B6B6B]">
              baseado em {product.reviews} avaliações
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(15,15,16,0.05)] sm:p-8">
          <h2 className="font-display text-[24px] text-[#0F0F10]">
            Perguntas frequentes
          </h2>
          <div className="mt-4 space-y-2">
            {product.faqs.map((faq, i) => (
              <div key={faq.q} className="rounded-[12px] border border-[#0F0F10]/08">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[14px] font-medium text-[#0F0F10]"
                >
                  {faq.q}
                  <span className="text-[#C8A96A]">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i ? (
                  <p className="border-t border-[#0F0F10]/06 px-4 py-3 text-[13px] leading-6 text-[#2E2E2E]">
                    {faq.a}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Relacionados */}
        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-display text-[28px] text-[#0F0F10]">
              Produtos relacionados
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/produto/${item.id}`}
                  className="group overflow-hidden rounded-[16px] bg-white shadow-[0_10px_40px_rgba(15,15,16,0.06)] transition duration-300 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#EEEAE4]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="280px"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-[18px] text-[#0F0F10]">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-[14px] font-semibold text-[#0F0F10]">
                      A partir de {formatBRL(item.price)}
                    </p>
                    <span className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#C8A96A] px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10] transition hover:bg-[#B8934F]">
                      Comprar
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
