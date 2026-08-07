import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readAdminCms } from "@/lib/adminStore";
import { readAdminCatalog } from "@/lib/catalogAdminStore";
import { stripWholesaleFromOverride } from "@/lib/catalogOverrides";
import { readDealers } from "@/lib/wholesaleStore";

export const runtime = "nodejs";

async function isApprovedDealerSession() {
  const jar = await cookies();
  const id = jar.get("hq_dealer_session")?.value;
  if (!id) return false;
  const dealers = await readDealers();
  const dealer = dealers.find((d) => d.id === id);
  return Boolean(dealer && dealer.status === "Aprovado" && !dealer.blocked);
}

/** Conteúdo público do CMS (sem logs, usuários ou chaves de integração). */
export async function GET() {
  try {
    const [cms, catalog, isWholesale] = await Promise.all([
      readAdminCms(),
      readAdminCatalog(),
      isApprovedDealerSession().catch(() => false),
    ]);

    const fromCatalog = catalog.products
      .filter((p) => !p.deletedAt)
      .map((p) => {
        const retail = {
          id: p.id,
          name: p.name,
          retailPrice: p.retailPrice,
          active: p.active,
          featured: p.featured,
          description: p.description,
          image: p.image,
          cover: p.cover,
          gallery: p.gallery,
          video: p.video,
          colors: p.colors || [],
          defaultColor: p.defaultColor || p.colors?.[0]?.name || "",
        };

        if (!isWholesale) return retail;

        return {
          ...retail,
          wholesalePrice: p.wholesalePrice,
          minQty: p.minQty,
          stock: p.stock,
          wholesaleImage: p.wholesaleImage || "",
          wholesaleCover: p.wholesaleCover || "",
          wholesaleGallery: p.wholesaleGallery || [],
        };
      });

    const overrideMap = new Map(
      (cms.productOverrides || []).map((o) => [o.id, o]),
    );
    for (const row of fromCatalog) {
      overrideMap.set(row.id, { ...(overrideMap.get(row.id) || {}), ...row });
    }

    let productOverrides = [...overrideMap.values()];
    if (!isWholesale) {
      productOverrides = productOverrides.map(stripWholesaleFromOverride);
    }

    const catalogCategories = catalog.categories
      .filter((c) => !c.deletedAt)
      .map((c) => {
        if (isWholesale) return c;
        const { minQty: _m, ...rest } = c;
        return rest;
      });

    return NextResponse.json(
      {
        home: cms.home,
        factory: cms.factory,
        wholesale: cms.wholesale,
        contactPage: cms.contactPage,
        quotePage: cms.quotePage,
        seo: cms.seo,
        productOverrides,
        categoryOverrides: cms.categoryOverrides,
        pageMedia: cms.pageMedia,
        banners: cms.banners,
        catalogCategories,
        wholesalePricingEnabled: isWholesale,
        whatsapp: cms.integrations.whatsapp?.number || "",
        updatedAt: cms.updatedAt,
      },
      {
        headers: {
          "Cache-Control": isWholesale
            ? "private, no-store"
            : "public, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (e) {
    console.error("[api/cms]", e);
    return NextResponse.json(
      { error: "CMS temporariamente indisponível" },
      { status: 503 },
    );
  }
}
