export type CatalogBadge = "Novo" | "Mais vendido" | "Promoção" | "Exclusivo";

export type CatalogCategoryId =
  | "todos"
  | "camas-box"
  | "camas-box-bau"
  | "camas-com-colchao"
  | "colchoes"
  | "cabeceiras"
  | "bases"
  | "baus"
  | "acessorios";

export type CatalogCategory = {
  id: CatalogCategoryId;
  label: string;
  href: string;
  visible: boolean;
  order: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  categoryId: Exclude<CatalogCategoryId, "todos">;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  badge?: CatalogBadge;
  featured: boolean;
  order: number;
};

const images = [
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80",
];

function makeProducts(
  categoryId: Exclude<CatalogCategoryId, "todos">,
  items: Array<{
    name: string;
    price: number;
    rating: number;
    reviews: number;
    badge?: CatalogBadge;
  }>,
): CatalogProduct[] {
  return items.map((item, index) => ({
    id: `${categoryId}-${index + 1}`,
    name: item.name,
    categoryId,
    image: images[index % images.length],
    price: item.price,
    rating: item.rating,
    reviews: item.reviews,
    badge: item.badge,
    featured: true,
    order: index + 1,
  }));
}

/**
 * Configuração da vitrine da Home.
 * Futuramente alimentada pelo painel administrativo (sem alterar código).
 */
export const homeCatalogConfig = {
  defaultCategoryId: "camas-box-bau" as CatalogCategoryId,
  productsPerCategory: 6,
  categories: [
    { id: "todos", label: "Todos", href: "/categorias", visible: false, order: 0 },
    { id: "camas-box", label: "Camas Box", href: "/categorias/camas-box", visible: true, order: 1 },
    {
      id: "camas-box-bau",
      label: "Camas Box Baú",
      href: "/categorias/camas-box-bau",
      visible: true,
      order: 2,
    },
    {
      id: "camas-com-colchao",
      label: "Camas com Colchão",
      href: "/categorias/camas-com-colchao",
      visible: true,
      order: 3,
    },
    { id: "colchoes", label: "Colchões", href: "/categorias/colchoes", visible: true, order: 4 },
    {
      id: "cabeceiras",
      label: "Cabeceiras",
      href: "/categorias/cabeceiras",
      visible: true,
      order: 5,
    },
    { id: "bases", label: "Bases", href: "/categorias/bases", visible: true, order: 6 },
    { id: "baus", label: "Baús", href: "/categorias/baus", visible: true, order: 7 },
    {
      id: "acessorios",
      label: "Acessórios",
      href: "/categorias/acessorios",
      visible: true,
      order: 8,
    },
  ] satisfies CatalogCategory[],
  products: [
    ...makeProducts("camas-box", [
      { name: "Cama Box Imperial", price: 2490, rating: 4.9, reviews: 128, badge: "Mais vendido" },
      { name: "Cama Box Classic", price: 1890, rating: 4.7, reviews: 84, badge: "Novo" },
      { name: "Cama Box Soft Line", price: 2190, rating: 4.8, reviews: 96 },
      { name: "Cama Box Essential", price: 1690, rating: 4.5, reviews: 52 },
      { name: "Cama Box Queen Gold", price: 2790, rating: 4.8, reviews: 71, badge: "Exclusivo" },
      { name: "Cama Box Comfort Plus", price: 1990, rating: 4.6, reviews: 63 },
    ]),
    ...makeProducts("camas-box-bau", [
      { name: "Cama Box Baú Premium", price: 1890, rating: 4.9, reviews: 328, badge: "Mais vendido" },
      { name: "Cama Box Baú Premium", price: 1890, rating: 4.9, reviews: 328 },
      { name: "Cama Box Baú Premium", price: 1890, rating: 4.9, reviews: 328 },
      { name: "Cama Box Baú Premium", price: 1890, rating: 4.9, reviews: 328 },
      { name: "Cama Box Baú Premium", price: 1890, rating: 4.9, reviews: 328 },
      { name: "Cama Box Baú Premium", price: 1890, rating: 4.9, reviews: 328 },
    ]),
    ...makeProducts("camas-com-colchao", [
      { name: "Cama Box + Colchão Duo", price: 3490, rating: 4.8, reviews: 91, badge: "Exclusivo" },
      { name: "Cama Box + Colchão Soft", price: 3190, rating: 4.5, reviews: 47 },
      { name: "Cama Box + Colchão Lux", price: 3690, rating: 4.7, reviews: 58 },
      { name: "Cama Box + Colchão Gold", price: 3890, rating: 4.9, reviews: 66 },
      { name: "Cama Box + Colchão Air", price: 3290, rating: 4.6, reviews: 39 },
      { name: "Cama Box + Colchão Nest", price: 3590, rating: 4.8, reviews: 44 },
    ]),
    ...makeProducts("colchoes", [
      { name: "Colchão Majesty", price: 1890, rating: 4.8, reviews: 96, badge: "Novo" },
      { name: "Colchão Ortobom Airtech", price: 2190, rating: 4.9, reviews: 112, badge: "Mais vendido" },
      { name: "Colchão Molas Ensacadas", price: 2590, rating: 4.7, reviews: 73, badge: "Exclusivo" },
      { name: "Colchão D33 Comfort", price: 1490, rating: 4.5, reviews: 81 },
      { name: "Colchão Soft Memory", price: 2790, rating: 4.8, reviews: 64 },
      { name: "Colchão Premium Nest", price: 2990, rating: 4.9, reviews: 55 },
    ]),
    ...makeProducts("cabeceiras", [
      { name: "Cabeceira Royale", price: 980, rating: 5.0, reviews: 54, badge: "Exclusivo" },
      { name: "Cabeceira Linho Soft", price: 790, rating: 4.6, reviews: 38, badge: "Novo" },
      { name: "Cabeceira Capitonê", price: 1190, rating: 4.9, reviews: 58, badge: "Mais vendido" },
      { name: "Cabeceira Velvet", price: 890, rating: 4.7, reviews: 41 },
      { name: "Cabeceira Minimal", price: 690, rating: 4.4, reviews: 27 },
      { name: "Cabeceira Gold Line", price: 1290, rating: 4.8, reviews: 49 },
    ]),
    ...makeProducts("bases", [
      { name: "Base Box Reforçada", price: 690, rating: 4.5, reviews: 41 },
      { name: "Base Bipartida King", price: 980, rating: 4.7, reviews: 29, badge: "Promoção" },
      { name: "Base Casal Classic", price: 790, rating: 4.6, reviews: 33 },
      { name: "Base Queen Plus", price: 890, rating: 4.5, reviews: 24 },
      { name: "Base Solteiro Slim", price: 590, rating: 4.3, reviews: 18 },
      { name: "Base King Premium", price: 1090, rating: 4.8, reviews: 36 },
    ]),
    ...makeProducts("baus", [
      { name: "Baú Capitonê", price: 590, rating: 4.8, reviews: 67, badge: "Mais vendido" },
      { name: "Baú Modular", price: 490, rating: 4.4, reviews: 22 },
      { name: "Baú Linho Soft", price: 640, rating: 4.6, reviews: 31 },
      { name: "Baú Velvet", price: 720, rating: 4.7, reviews: 28 },
      { name: "Baú Compact", price: 430, rating: 4.3, reviews: 19 },
      { name: "Baú Premium Gold", price: 820, rating: 4.9, reviews: 40 },
    ]),
    ...makeProducts("acessorios", [
      { name: "Kit Travesseiros Premium", price: 290, rating: 4.9, reviews: 143, badge: "Novo" },
      { name: "Protetor Impermeável", price: 189, rating: 4.6, reviews: 88, badge: "Promoção" },
      { name: "Capa de Colchão Soft", price: 249, rating: 4.5, reviews: 52 },
      { name: "Jogo de Lençóis Premium", price: 390, rating: 4.8, reviews: 74 },
      { name: "Manta Decorativa", price: 220, rating: 4.4, reviews: 35 },
      { name: "Kit Conforto Home Queen", price: 459, rating: 4.7, reviews: 61 },
    ]),
  ] satisfies CatalogProduct[],
};

export function getVisibleCategories() {
  return [...homeCatalogConfig.categories]
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order);
}

export function getProductsByCategory(categoryId: CatalogCategoryId) {
  const limit = homeCatalogConfig.productsPerCategory;
  const list = [...homeCatalogConfig.products]
    .filter((p) => p.featured)
    .filter((p) => (categoryId === "todos" ? true : p.categoryId === categoryId))
    .sort((a, b) => a.order - b.order);

  return list.slice(0, limit);
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
