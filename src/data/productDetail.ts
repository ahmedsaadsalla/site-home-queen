import {
  homeCatalogConfig,
  type CatalogCategoryId,
  type CatalogProduct,
} from "@/data/homeCatalog";

export type ProductType = "Box" | "Box Baú" | "Box + Colchão";
export type ProductSize =
  | "Solteiro"
  | "Solteiro com Auxiliar"
  | "Viúva"
  | "Casal Inteiriço"
  | "Casal Bipartido"
  | "Queen Bipartido"
  | "King Bipartido";
export type ProductMattress =
  | "Sem colchão"
  | "Airtech Ortobom"
  | "D33"
  | "D45"
  | "Molas Ensacadas";

export type ProductColor = {
  name: string;
  hex: string;
};

export type SizeVariant = {
  size: ProductSize;
  price: number;
  stock: number;
  sku: string;
  width: string;
  depth: string;
  height: string;
  weight: string;
  volume?: string;
  material?: string;
  capacity?: string;
  images: string[];
};

export type ProductDetail = {
  id: string;
  name: string;
  brand: string;
  categoryId: Exclude<CatalogCategoryId, "todos">;
  categoryLabel: string;
  subcategory?: string;
  description: string;
  rating: number;
  reviews: number;
  badge?: string;
  types: ProductType[];
  mattresses: ProductMattress[];
  colors: ProductColor[];
  variants: SizeVariant[];
  defaultType: ProductType;
  defaultSize: ProductSize;
  defaultMattress: ProductMattress;
  defaultColor: string;
  specs: Array<{ label: string; value: string }>;
  materials: string[];
  warranty: string;
  faqs: Array<{ q: string; a: string }>;
  relatedIds: string[];
};

const gallery = [
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
];

const sizeBase: Array<
  Omit<SizeVariant, "price" | "stock" | "sku" | "images"> & {
    price: number;
    stock: number;
    sku: string;
  }
> = [
  {
    size: "Solteiro",
    price: 1290,
    stock: 15,
    sku: "HQB-001",
    width: "88 cm",
    depth: "188 cm",
    height: "42 cm",
    weight: "28 kg",
    volume: "0.70 m³",
    material: "Madeira + tecido",
    capacity: "—",
  },
  {
    size: "Solteiro com Auxiliar",
    price: 1590,
    stock: 9,
    sku: "HQB-002",
    width: "88 cm",
    depth: "188 cm",
    height: "62 cm",
    weight: "36 kg",
    volume: "0.90 m³",
    material: "Madeira + tecido",
    capacity: "Auxiliar incluso",
  },
  {
    size: "Viúva",
    price: 1690,
    stock: 12,
    sku: "HQB-003",
    width: "128 cm",
    depth: "188 cm",
    height: "42 cm",
    weight: "38 kg",
    volume: "0.95 m³",
    material: "Madeira + tecido",
    capacity: "—",
  },
  {
    size: "Casal Inteiriço",
    price: 1790,
    stock: 8,
    sku: "HQB-004",
    width: "138 cm",
    depth: "188 cm",
    height: "42 cm",
    weight: "42 kg",
    volume: "1.05 m³",
    material: "Madeira + tecido",
    capacity: "—",
  },
  {
    size: "Casal Bipartido",
    price: 2090,
    stock: 7,
    sku: "HQB-005",
    width: "138 cm",
    depth: "188 cm",
    height: "42 cm",
    weight: "48 kg",
    volume: "1.10 m³",
    material: "Madeira + tecido",
    capacity: "Bipartido",
  },
  {
    size: "Queen Bipartido",
    price: 2290,
    stock: 6,
    sku: "HQB-006",
    width: "158 cm",
    depth: "198 cm",
    height: "42 cm",
    weight: "52 kg",
    volume: "1.25 m³",
    material: "Madeira + tecido",
    capacity: "Bipartido",
  },
  {
    size: "King Bipartido",
    price: 2490,
    stock: 5,
    sku: "HQB-007",
    width: "193 cm",
    depth: "203 cm",
    height: "68 cm",
    weight: "64 kg",
    volume: "1.55 m³",
    material: "Madeira + tecido",
    capacity: "Baú amplo",
  },
];

const typeExtra: Record<ProductType, number> = {
  Box: 0,
  "Box Baú": 400,
  "Box + Colchão": 900,
};

const mattressExtra: Record<ProductMattress, number> = {
  "Sem colchão": 0,
  "Airtech Ortobom": 890,
  D33: 650,
  D45: 780,
  "Molas Ensacadas": 1200,
};

const categoryLabels: Record<Exclude<CatalogCategoryId, "todos">, string> = {
  "camas-box": "Camas Box",
  "camas-box-bau": "Camas Box Baú",
  "camas-com-colchao": "Camas com Colchão",
  colchoes: "Colchões",
  cabeceiras: "Cabeceiras",
  bases: "Bases",
  baus: "Baús",
  acessorios: "Acessórios",
};

function buildVariants(basePrice?: number): SizeVariant[] {
  const ratio = basePrice ? basePrice / 1890 : 1;
  return sizeBase.map((v, i) => ({
    ...v,
    price: Math.round(v.price * ratio),
    images: [
      gallery[i % gallery.length],
      gallery[(i + 1) % gallery.length],
      gallery[(i + 2) % gallery.length],
      gallery[(i + 3) % gallery.length],
      gallery[(i + 4) % gallery.length],
    ],
  }));
}

function fromCatalogProduct(product: CatalogProduct): ProductDetail {
  const isBau = product.categoryId.includes("bau") || product.categoryId === "camas-box-bau";
  return {
    id: product.id,
    name: product.name,
    brand: "Home Queen",
    categoryId: product.categoryId,
    categoryLabel: categoryLabels[product.categoryId],
    subcategory: categoryLabels[product.categoryId],
    description:
      "Modelo com acabamento premium, estrutura reforçada e personalização completa de tipo, tamanho, colchão e cor. Preço, estoque, medidas e SKU atualizam automaticamente conforme a configuração.",
    rating: product.rating,
    reviews: product.reviews,
    badge: product.badge,
    types: ["Box", "Box Baú", "Box + Colchão"],
    mattresses: [
      "Sem colchão",
      "Airtech Ortobom",
      "D33",
      "D45",
      "Molas Ensacadas",
    ],
    colors: [
      { name: "Preto", hex: "#1A1A1A" },
      { name: "Bege", hex: "#E8D9B8" },
      { name: "Cinza", hex: "#A8A8A8" },
      { name: "Marrom", hex: "#5C4033" },
    ],
    variants: buildVariants(product.price),
    defaultType: isBau ? "Box Baú" : "Box",
    defaultSize: "King Bipartido",
    defaultMattress: "Sem colchão",
    defaultColor: "Preto",
    specs: [
      { label: "Marca", value: "Home Queen" },
      { label: "Linha", value: categoryLabels[product.categoryId] },
      { label: "Estrutura", value: "Madeira maciça reforçada" },
      { label: "Acabamento", value: "Tecido premium" },
      { label: "Origem", value: "Fabricação própria" },
    ],
    materials: [
      "Estrutura em madeira selecionada",
      "Revestimento em tecido de alta durabilidade",
      "Sistema de abertura reforçado (quando baú)",
      "Pés estabilizadores",
    ],
    warranty: "Garantia de 1 ano contra defeitos de fabricação.",
    faqs: [
      {
        q: "O preço muda conforme o tamanho?",
        a: "Sim. Ao selecionar tipo, tamanho ou colchão, o preço, o SKU e o estoque atualizam automaticamente.",
      },
      {
        q: "Posso comprar sem colchão?",
        a: "Sim. Selecione a opção “Sem colchão” na configuração do produto.",
      },
      {
        q: "Fazem entrega para todo o Brasil?",
        a: "Sim. A Home Queen realiza entregas para todo o território nacional.",
      },
    ],
    relatedIds: homeCatalogConfig.products
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4)
      .map((p) => p.id),
  };
}

/** Produto destaque alinhado ao mockup */
export const featuredProductDetail: ProductDetail = {
  id: "cama-box-bau-premium",
  name: "Cama Box Baú Premium",
  brand: "Home Queen",
  categoryId: "camas-box-bau",
  categoryLabel: "Camas Box Baú",
  subcategory: "Camas Box Baú",
  description:
    "Modelos com baú embutido, acabamento premium e armazenamento inteligente para o seu quarto.",
  rating: 4.9,
  reviews: 328,
  badge: "Mais vendido",
  types: ["Box", "Box Baú", "Box + Colchão"],
  mattresses: [
    "Sem colchão",
    "Airtech Ortobom",
    "D33",
    "D45",
    "Molas Ensacadas",
  ],
  colors: [
    { name: "Preto", hex: "#1A1A1A" },
    { name: "Bege", hex: "#E8D9B8" },
    { name: "Cinza", hex: "#A8A8A8" },
    { name: "Marrom", hex: "#5C4033" },
  ],
  variants: buildVariants(1890),
  defaultType: "Box Baú",
  defaultSize: "King Bipartido",
  defaultMattress: "Sem colchão",
  defaultColor: "Preto",
  specs: [
    { label: "Marca", value: "Home Queen" },
    { label: "Linha", value: "Camas Box Baú" },
    { label: "Estrutura", value: "Madeira maciça reforçada" },
    { label: "Acabamento", value: "Tecido premium" },
    { label: "Origem", value: "Fabricação própria" },
  ],
  materials: [
    "Estrutura em madeira selecionada",
    "Revestimento em tecido de alta durabilidade",
    "Sistema de abertura reforçado do baú",
    "Pés estabilizadores",
  ],
  warranty: "Garantia de 1 ano contra defeitos de fabricação.",
  faqs: [
    {
      q: "O preço muda conforme o tamanho?",
      a: "Sim. Ao selecionar tipo, tamanho ou colchão, o preço, o SKU e o estoque atualizam automaticamente.",
    },
    {
      q: "Posso comprar sem colchão?",
      a: "Sim. Selecione a opção “Sem colchão” na configuração do produto.",
    },
    {
      q: "Fazem entrega para todo o Brasil?",
      a: "Sim. A Home Queen realiza entregas para todo o território nacional.",
    },
  ],
  relatedIds: ["camas-box-bau-2", "camas-box-bau-3", "camas-box-bau-4", "camas-box-1"],
};

export function getProductDetail(id: string): ProductDetail | null {
  if (id === featuredProductDetail.id) return featuredProductDetail;

  const catalog = homeCatalogConfig.products.find((p) => p.id === id);
  if (catalog) return fromCatalogProduct(catalog);

  // Alias: qualquer id de baú premium
  if (id.includes("bau") || id.includes("premium")) {
    return { ...featuredProductDetail, id };
  }

  return null;
}

export function getAllProductIds(): string[] {
  const ids = new Set<string>([featuredProductDetail.id]);
  homeCatalogConfig.products.forEach((p) => ids.add(p.id));
  return [...ids];
}

export function calcPrice(
  base: number,
  type: ProductType,
  mattress: ProductMattress,
  qty = 1,
) {
  return (base + typeExtra[type] + mattressExtra[mattress]) * qty;
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getRelatedProducts(ids: string[]): CatalogProduct[] {
  return ids
    .map((id) => homeCatalogConfig.products.find((p) => p.id === id))
    .filter((p): p is CatalogProduct => Boolean(p));
}
