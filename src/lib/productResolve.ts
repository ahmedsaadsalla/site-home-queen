import { readAdminCatalog } from "@/lib/catalogAdminStore";
import { getProductDetail, type ProductDetail } from "@/data/productDetail";
import type { AdminCategory, AdminProduct } from "@/data/adminCatalog";
import { slugify } from "@/data/adminCatalog";
import { productPath } from "@/lib/seo";

export type ResolvedStoreProduct = {
  detail: ProductDetail;
  admin: AdminProduct | null;
  category: AdminCategory | null;
  path: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  indexable: boolean;
  slug: string;
};

function detailFromAdmin(admin: AdminProduct): ProductDetail {
  const images = [admin.cover, admin.image, ...(admin.gallery || [])].filter(
    Boolean,
  ) as string[];
  return {
    id: admin.id,
    name: admin.name,
    brand: admin.brand || "Home Queen",
    categoryId: (admin.categoryId as ProductDetail["categoryId"]) || "camas-box",
    categoryLabel: "",
    description:
      admin.description || `Produto ${admin.name} da linha Home Queen.`,
    rating: 4.8,
    reviews: 12,
    types: ["Box", "Box Baú", "Box + Colchão"],
    mattresses: ["Sem colchão", "D33", "D45"],
    colors: (admin.colors || []).map((c) => ({ name: c.name, hex: c.hex })),
    variants: [
      {
        size: "Casal Inteiriço",
        price: admin.retailPrice || 0,
        stock: admin.stock,
        sku: admin.sku,
        width: "—",
        depth: "—",
        height: "—",
        weight: "—",
        images: images.length ? images : ["/hero-home-queen.jpg"],
      },
    ],
    defaultType: "Box Baú",
    defaultSize: "Casal Inteiriço",
    defaultMattress: "Sem colchão",
    defaultColor: admin.defaultColor || admin.colors?.[0]?.name || "Preto",
    specs: [
      { label: "SKU", value: admin.sku },
      { label: "Marca", value: admin.brand },
    ],
    materials: [],
    warranty: "Garantia de 1 ano contra defeitos de fabricação.",
    faqs: [],
    relatedIds: [],
  };
}

export async function resolveStoreProduct(
  param: string,
): Promise<ResolvedStoreProduct | null> {
  const key = decodeURIComponent(param).trim();
  if (!key) return null;

  const catalog = await readAdminCatalog();
  const admin =
    catalog.products.find(
      (p) =>
        !p.deletedAt &&
        (p.id === key || p.slug === key || slugify(p.name) === key),
    ) || null;

  const detailId = admin?.id || key;
  let detail: ProductDetail | null = getProductDetail(detailId);
  if (!detail && admin) {
    detail = detailFromAdmin(admin);
  }
  if (!detail) return null;

  const category =
    catalog.categories.find(
      (c) =>
        c.id === (admin?.categoryId || detail!.categoryId) && !c.deletedAt,
    ) || null;

  if (admin) {
    detail = {
      ...detail,
      name: admin.name || detail.name,
      brand: admin.brand || detail.brand,
      description: admin.description || detail.description,
      colors:
        admin.colors?.length > 0
          ? admin.colors.map((c) => ({ name: c.name, hex: c.hex }))
          : detail.colors,
      defaultColor: admin.defaultColor || detail.defaultColor,
    };
  }

  const resolved = detail;
  const slug = admin?.slug || slugify(resolved.name) || resolved.id;
  const path = productPath({ id: resolved.id, slug });
  const seoTitle =
    admin?.seoTitle?.trim() || `${resolved.name} | Home Queen`;
  const seoDescription =
    admin?.seoDescription?.trim() ||
    resolved.description ||
    `${resolved.name} Home Queen.`;
  const seoKeywords =
    admin?.seoKeywords?.trim() ||
    [resolved.name, resolved.categoryLabel, "Home Queen", "cama box"]
      .filter(Boolean)
      .join(", ");
  const ogImage =
    admin?.ogImage ||
    admin?.cover ||
    admin?.image ||
    resolved.variants?.[0]?.images?.[0] ||
    "/hero-home-queen.jpg";

  return {
    detail: {
      ...resolved,
      categoryLabel:
        category?.name || resolved.categoryLabel || "Produtos",
    },
    admin,
    category,
    path,
    seoTitle,
    seoDescription,
    seoKeywords,
    ogImage,
    indexable: admin?.indexable !== false && admin?.active !== false,
    slug,
  };
}

export async function resolveStoreCategory(param: string) {
  const key = decodeURIComponent(param).trim();
  const catalog = await readAdminCatalog();
  const category =
    catalog.categories.find(
      (c) =>
        !c.deletedAt &&
        c.active &&
        (c.slug === key || c.id === key || slugify(c.name) === key),
    ) || null;
  if (!category) return null;
  const products = catalog.products.filter(
    (p) =>
      !p.deletedAt &&
      p.active &&
      (p.categoryId === category.id || p.categoryId === category.slug),
  );
  return { category, products };
}
