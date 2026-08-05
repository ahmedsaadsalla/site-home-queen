import type { CatalogProduct } from "@/data/homeCatalog";
import type { ProductOverride } from "@/data/admin";

export type CatalogViewMode = "retail" | "wholesale";

export function mergeProductOverride(
  product: CatalogProduct,
  override?: ProductOverride | null,
  mode: CatalogViewMode = "retail",
): CatalogProduct & {
  wholesalePrice?: number;
  minQty?: number;
  stock?: number;
  active?: boolean;
  cover?: string;
  gallery?: string[];
  video?: string;
  wholesaleImage?: string;
  wholesaleCover?: string;
  wholesaleGallery?: string[];
  colors?: Array<{ name: string; hex: string }>;
  defaultColor?: string;
} {
  if (!override) {
    return {
      ...product,
      active: true,
    };
  }

  const retailImage =
    override.image || override.cover || override.gallery?.[0] || product.image;
  const wholesaleImage =
    override.wholesaleImage ||
    override.wholesaleCover ||
    override.wholesaleGallery?.[0] ||
    "";

  const base = {
    ...product,
    name: override.name || product.name,
    price: override.retailPrice ?? product.price,
    image: retailImage,
    featured: override.featured ?? product.featured,
    active: override.active ?? true,
    cover: override.cover,
    gallery: override.gallery,
    video: override.video,
    colors: override.colors,
    defaultColor: override.defaultColor,
  };

  if (mode === "wholesale") {
    return {
      ...base,
      // Só revendedor vê fotos de atacado; se não houver, mantém a foto de varejo
      image: wholesaleImage || retailImage,
      cover: override.wholesaleCover || override.cover,
      gallery:
        override.wholesaleGallery?.length
          ? override.wholesaleGallery
          : override.gallery,
      wholesalePrice: override.wholesalePrice,
      minQty: override.minQty,
      stock: override.stock,
      wholesaleImage: override.wholesaleImage,
      wholesaleCover: override.wholesaleCover,
      wholesaleGallery: override.wholesaleGallery,
    };
  }

  // Varejo / CPF: sem preço de atacado, min. pedido, estoque B2B nem galeria de atacado
  return base;
}

export function indexOverrides(list: ProductOverride[] = []) {
  return new Map(list.map((o) => [o.id, o]));
}

/** Remove campos de atacado do payload público (cliente CPF / visitante). */
export function stripWholesaleFromOverride(
  o: ProductOverride,
): ProductOverride {
  const {
    wholesalePrice: _wp,
    minQty: _mq,
    stock: _st,
    wholesaleImage: _wi,
    wholesaleCover: _wc,
    wholesaleGallery: _wg,
    ...retail
  } = o;
  return retail;
}
