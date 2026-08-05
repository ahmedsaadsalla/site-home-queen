import {
  getVisibleCategories,
  homeCatalogConfig,
  type CatalogCategory,
  type CatalogCategoryId,
} from "@/data/homeCatalog";
import { getProductDetail } from "@/data/productDetail";

export type SearchProductHit = {
  id: string;
  name: string;
  categoryId: Exclude<CatalogCategoryId, "todos">;
  categoryLabel: string;
  image: string;
  price: number;
  stock?: number;
  code: string;
  skus: string[];
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryLabel(id: Exclude<CatalogCategoryId, "todos">) {
  return (
    homeCatalogConfig.categories.find((c) => c.id === id)?.label || id
  );
}

function buildProductIndex(): SearchProductHit[] {
  return homeCatalogConfig.products.map((product) => {
    const detail = getProductDetail(product.id);
    const skus = detail?.variants.map((v) => v.sku).filter(Boolean) ?? [];
    const code =
      skus[0] ||
      `HQ-${product.categoryId.toUpperCase().replace(/-/g, "").slice(0, 4)}-${product.id.split("-").pop()}`;

    return {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      categoryLabel: categoryLabel(product.categoryId),
      image: product.image,
      price: product.price,
      stock: detail?.variants[0]?.stock,
      code,
      skus,
    };
  });
}

const productIndex = buildProductIndex();

export function searchSite(query: string): {
  products: SearchProductHit[];
  categories: CatalogCategory[];
} {
  const q = normalize(query);
  if (!q) return { products: [], categories: [] };

  const categories = getVisibleCategories().filter((c) => {
    const label = normalize(c.label);
    const id = normalize(c.id);
    return (
      label.includes(q) ||
      q.includes(label) ||
      id.includes(q) ||
      // common singulars
      (q.includes("colchao") && c.id === "colchoes") ||
      (q.includes("cama") && c.id.startsWith("camas")) ||
      (q.includes("cabeceira") && c.id === "cabeceiras") ||
      (q.includes("bau") && (c.id === "baus" || c.id === "camas-box-bau")) ||
      (q.includes("acessorio") && c.id === "acessorios")
    );
  });

  const products = productIndex
    .map((product) => {
      const haystack = normalize(
        [
          product.name,
          product.categoryLabel,
          product.categoryId,
          product.code,
          ...product.skus,
          product.id,
        ].join(" "),
      );
      let score = 0;
      if (normalize(product.name).startsWith(q)) score += 40;
      if (normalize(product.name).includes(q)) score += 25;
      if (normalize(product.categoryLabel).includes(q)) score += 15;
      if (normalize(product.code).includes(q)) score += 20;
      if (product.skus.some((sku) => normalize(sku).includes(q))) score += 20;
      if (haystack.includes(q)) score += 5;
      return { product, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 8)
    .map((row) => row.product);

  return { products, categories: categories.slice(0, 4) };
}

export function getSearchSuggestions() {
  return getVisibleCategories().slice(0, 5);
}
