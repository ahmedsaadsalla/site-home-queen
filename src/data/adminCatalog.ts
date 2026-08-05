export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  banner: string;
  icon: string;
  image: string;
  order: number;
  parentId: string | null;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage?: string;
  indexable?: boolean;
  /** Pedido mínimo padrão (atacado) para a categoria */
  minQty: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type AdminProductColor = {
  name: string;
  hex: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  code: string;
  categoryId: string;
  brand: string;
  image: string;
  cover: string;
  gallery: string[];
  /** Fotos exclusivas do portal atacado (não aparecem para cliente CPF) */
  wholesaleImage?: string;
  wholesaleCover?: string;
  wholesaleGallery?: string[];
  video: string;
  /** Cores disponíveis do produto */
  colors: AdminProductColor[];
  defaultColor?: string;
  retailPrice: number;
  wholesalePrice: number;
  minQty: number;
  stock: number;
  active: boolean;
  featured: boolean;
  promotion: boolean;
  launch: boolean;
  description: string;
  /** SEO do produto (editável no painel) */
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImage?: string;
  indexable?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  blingSyncedAt?: string | null;
};

/** Paleta padrão para seleção rápida no admin */
export const PRODUCT_COLOR_PRESETS: AdminProductColor[] = [
  { name: "Preto", hex: "#1A1A1A" },
  { name: "Bege", hex: "#C8B89A" },
  { name: "Cinza", hex: "#C5C5C5" },
  { name: "Marrom", hex: "#5C4033" },
  { name: "Branco", hex: "#F5F5F0" },
  { name: "Creme", hex: "#E8DFC8" },
  { name: "Azul Petróleo", hex: "#1E3A45" },
  { name: "Verde Musgo", hex: "#4A5D4E" },
];

export type AdminCatalog = {
  categories: AdminCategory[];
  products: AdminProduct[];
  brands: string[];
  updatedAt: string;
};

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
