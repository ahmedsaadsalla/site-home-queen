import type { MetadataRoute } from "next";
import { readAdminCatalog } from "@/lib/catalogAdminStore";
import { categoryPath, getSiteUrl, productPath } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/sobre`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/contato`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/atacado`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${base}/orcamento`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    const catalog = await readAdminCatalog();
    const categories = catalog.categories
      .filter((c) => !c.deletedAt && c.active && c.indexable !== false)
      .map((c) => ({
        url: `${base}${categoryPath(c)}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    const products = catalog.products
      .filter(
        (p) =>
          !p.deletedAt &&
          p.active &&
          p.indexable !== false,
      )
      .map((p) => ({
        url: `${base}${productPath(p)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));

    return [...staticRoutes, ...categories, ...products];
  } catch {
    return staticRoutes;
  }
}
