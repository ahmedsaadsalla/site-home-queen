import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { ProductDetailView } from "@/components/ProductDetailView";
import { JsonLd, SiteBreadcrumb } from "@/components/SeoChrome";
import { resolveStoreProduct } from "@/lib/productResolve";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  categoryPath,
  productJsonLd,
} from "@/lib/seo";

type Props = {
  params: Promise<{ id?: string; slug?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const key = p.slug || p.id || "";
  const resolved = await resolveStoreProduct(key);
  if (!resolved) {
    return { title: "Produto | Home Queen", robots: { index: false } };
  }
  return buildPageMetadata({
    page: {
      title: resolved.seoTitle,
      description: resolved.seoDescription,
      keywords: resolved.seoKeywords,
      slug: resolved.path,
      canonical: resolved.path,
      ogImage: resolved.ogImage,
      indexable: resolved.indexable,
    },
    fallbackTitle: resolved.seoTitle,
    fallbackDescription: resolved.seoDescription,
    fallbackPath: resolved.path,
    fallbackImage: resolved.ogImage,
    type: "product",
    noIndex: !resolved.indexable,
  });
}

export default async function ProductByParamPage({ params }: Props) {
  const p = await params;
  const key = p.slug || p.id || "";
  const resolved = await resolveStoreProduct(key);
  if (!resolved) notFound();

  const { detail, category, path, ogImage } = resolved;
  const categoryHref = category
    ? categoryPath(category)
    : "/?categoria=" + encodeURIComponent(detail.categoryId) + "#nosso-catalogo";

  const crumbs = [
    { label: "Home", href: "/" },
    {
      label: category?.name || detail.categoryLabel || "Produtos",
      href: categoryHref,
    },
    { label: detail.name },
  ];

  const price = detail.variants?.[0]?.price;
  const images = [
    ogImage,
    ...(detail.variants?.[0]?.images || []),
  ].filter(Boolean);

  return (
    <main className="bg-[#F8F8F6]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <div className="mx-auto max-w-[1240px] px-6 pt-5 lg:px-8">
        <SiteBreadcrumb items={crumbs} />
      </div>
      <ProductDetailView product={detail} />
      <SiteFooter />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            {
              name: category?.name || detail.categoryLabel || "Produtos",
              path: categoryHref,
            },
            { name: detail.name, path },
          ]),
          productJsonLd({
            name: detail.name,
            description: resolved.seoDescription,
            path,
            image: images,
            sku: detail.variants?.[0]?.sku,
            brand: detail.brand,
            price,
            availability: (detail.variants?.[0]?.stock ?? 1) > 0,
            rating: detail.rating,
            reviewCount: detail.reviews,
          }),
        ]}
      />
    </main>
  );
}
