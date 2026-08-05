/**
 * Helpers para mapear models Prisma ↔ tipos legados do App.
 */
import type { Prisma } from "@prisma/client";
import type { AdminProduct, AdminCategory, AdminCatalog } from "@/data/adminCatalog";
import type { AdminCms, AdminLog, AdminOrder, SeoPage, SiteBanner } from "@/data/admin";
import { defaultAdminCms } from "@/data/admin";
import type { CustomerRecord, CustomerOrder, CustomerAddress } from "@/data/customer";
import type { DealerRecord, WholesaleQuote } from "@/data/wholesale";
import type { QuoteRecord } from "@/data/quotes";
import type { MediaAsset, MediaLibrary } from "@/data/media";
import type { ContactMessage, ContactSettings } from "@/data/contact";
import { DEFAULT_CONTACT_SETTINGS } from "@/data/contact";

export function iso(d: Date | string | null | undefined) {
  if (!d) return new Date().toISOString();
  return typeof d === "string" ? d : d.toISOString();
}

export function categoryToAdmin(c: {
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
  ogImage: string;
  indexable: boolean;
  minQty: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): AdminCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    banner: c.banner,
    icon: c.icon,
    image: c.image,
    order: c.order,
    parentId: c.parentId,
    description: c.description,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    seoKeywords: c.seoKeywords,
    ogImage: c.ogImage || undefined,
    indexable: c.indexable,
    minQty: c.minQty,
    active: c.active,
    createdAt: iso(c.createdAt),
    updatedAt: iso(c.updatedAt),
    deletedAt: c.deletedAt ? iso(c.deletedAt) : null,
  };
}

export function productToAdmin(p: {
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
  wholesaleImage: string;
  wholesaleCover: string;
  wholesaleGallery: string[];
  video: string;
  colors: unknown;
  defaultColor: string;
  retailPrice: number;
  wholesalePrice: number;
  minQty: number;
  stock: number;
  active: boolean;
  featured: boolean;
  promotion: boolean;
  launch: boolean;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  indexable: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  blingSyncedAt: Date | null;
}): AdminProduct {
  const colors = Array.isArray(p.colors)
    ? (p.colors as Array<{ name: string; hex: string }>)
    : [];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    code: p.code,
    categoryId: p.categoryId,
    brand: p.brand,
    image: p.image,
    cover: p.cover,
    gallery: p.gallery || [],
    wholesaleImage: p.wholesaleImage || "",
    wholesaleCover: p.wholesaleCover || "",
    wholesaleGallery: p.wholesaleGallery || [],
    video: p.video || "",
    colors,
    defaultColor: p.defaultColor || "",
    retailPrice: p.retailPrice,
    wholesalePrice: p.wholesalePrice,
    minQty: p.minQty,
    stock: p.stock,
    active: p.active,
    featured: p.featured,
    promotion: p.promotion,
    launch: p.launch,
    description: p.description || "",
    seoTitle: p.seoTitle || undefined,
    seoDescription: p.seoDescription || undefined,
    seoKeywords: p.seoKeywords || undefined,
    ogImage: p.ogImage || undefined,
    indexable: p.indexable,
    order: p.order,
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
    deletedAt: p.deletedAt ? iso(p.deletedAt) : null,
    blingSyncedAt: p.blingSyncedAt ? iso(p.blingSyncedAt) : null,
  };
}

export function productToDb(p: Partial<AdminProduct> & { id: string; name: string }) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug || p.id,
    sku: p.sku || "",
    code: p.code || "",
    categoryId: p.categoryId || "",
    brand: p.brand || "Home Queen",
    image: p.image || "",
    cover: p.cover || p.image || "",
    gallery: p.gallery || [],
    wholesaleImage: p.wholesaleImage || "",
    wholesaleCover: p.wholesaleCover || "",
    wholesaleGallery: p.wholesaleGallery || [],
    video: p.video || "",
    colors: (p.colors || []) as unknown as Prisma.InputJsonValue,
    defaultColor: p.defaultColor || "",
    retailPrice: p.retailPrice ?? 0,
    wholesalePrice: p.wholesalePrice ?? 0,
    minQty: p.minQty ?? 3,
    stock: p.stock ?? 0,
    active: p.active ?? true,
    featured: p.featured ?? false,
    promotion: p.promotion ?? false,
    launch: p.launch ?? false,
    description: p.description || "",
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    seoKeywords: p.seoKeywords || "",
    ogImage: p.ogImage || "",
    indexable: p.indexable !== false,
    order: p.order ?? 0,
    deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
    blingSyncedAt: p.blingSyncedAt ? new Date(p.blingSyncedAt) : null,
  };
}

export function categoryToDb(c: Partial<AdminCategory> & { id: string; name: string }) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug || c.id,
    banner: c.banner || "",
    icon: c.icon || "",
    image: c.image || "",
    order: c.order ?? 0,
    parentId: c.parentId ?? null,
    description: c.description || "",
    seoTitle: c.seoTitle || "",
    seoDescription: c.seoDescription || "",
    seoKeywords: c.seoKeywords || "",
    ogImage: c.ogImage || "",
    indexable: c.indexable !== false,
    minQty: c.minQty ?? 3,
    active: c.active ?? true,
    deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
  };
}

/** Monta AdminCms a partir das seções Prisma + tabelas relacionadas */
export function assembleCms(opts: {
  sections: Record<string, unknown>;
  banners: Array<{
    id: string;
    title: string;
    image: string;
    link: string;
    page: string;
    order: number;
    active: boolean;
  }>;
  coupons: Array<{ id: string; code: string; discount: number; active: boolean }>;
  orders: AdminOrder[];
  logs: AdminLog[];
}): AdminCms {
  const base = defaultAdminCms();
  const s = opts.sections;
  return {
    ...base,
    home: { ...base.home, ...((s.home as object) || {}) },
    factory: { ...base.factory, ...((s.factory as object) || {}) },
    wholesale: { ...base.wholesale, ...((s.wholesale as object) || {}) },
    contactPage: { ...base.contactPage, ...((s.contactPage as object) || {}) },
    quotePage: { ...base.quotePage, ...((s.quotePage as object) || {}) },
    seo: { ...base.seo, ...((s.seo as Record<string, SeoPage>) || {}) },
    pageMedia: {
      ...base.pageMedia,
      ...((s.pageMedia as object) || {}),
    },
    productOverrides:
      (s.productOverrides as AdminCms["productOverrides"]) ||
      base.productOverrides,
    categoryOverrides:
      (s.categoryOverrides as AdminCms["categoryOverrides"]) ||
      base.categoryOverrides,
    integrations: {
      ...base.integrations,
      ...((s.integrations as object) || {}),
    },
    banners: opts.banners.map(
      (b): SiteBanner => ({
        id: b.id,
        title: b.title,
        image: b.image,
        link: b.link,
        page: b.page as SiteBanner["page"],
        order: b.order,
        active: b.active,
      }),
    ),
    coupons: opts.coupons,
    orders: opts.orders,
    logs: opts.logs,
    users: base.users,
    updatedAt: new Date().toISOString(),
  };
}

export type { AdminCatalog, CustomerRecord, DealerRecord, WholesaleQuote, QuoteRecord, MediaAsset, MediaLibrary, ContactMessage, ContactSettings, CustomerOrder, CustomerAddress, AdminOrder, AdminLog };
export { DEFAULT_CONTACT_SETTINGS, defaultAdminCms };
