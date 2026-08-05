import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { CategoryCatalogView } from "@/components/CategoryCatalogView";
import { JsonLd, SiteBreadcrumb } from "@/components/SeoChrome";
import { resolveStoreCategory } from "@/lib/productResolve";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  categoryPath,
  collectionPageJsonLd,
} from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveStoreCategory(slug);
  if (!resolved) {
    return { title: "Categoria | Home Queen", robots: { index: false } };
  }
  const { category } = resolved;
  const path = categoryPath(category);
  const title = category.seoTitle || `${category.name} | Home Queen`;
  const description =
    category.seoDescription ||
    category.description ||
    `Confira ${category.name} Home Queen — qualidade premium e entrega nacional.`;
  return buildPageMetadata({
    page: {
      title,
      description,
      keywords: category.seoKeywords,
      slug: path,
      canonical: path,
      ogImage: category.ogImage || category.image || category.banner || "",
      indexable: category.indexable !== false,
    },
    fallbackPath: path,
    type: "website",
  });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveStoreCategory(slug);
  if (!resolved) notFound();
  const { category, products } = resolved;
  const path = categoryPath(category);

  return (
    <main className="bg-[#F5F5F3]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <div className="mx-auto max-w-[1240px] px-6 pt-6 lg:px-8">
        <SiteBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: category.name },
          ]}
        />
        <header className="mt-4 mb-2">
          <h1 className="font-display text-[32px] text-[#0F0F10] sm:text-[40px]">
            {category.name}
          </h1>
          {category.description || category.seoDescription ? (
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#0F0F10]/65">
              {category.description || category.seoDescription}
            </p>
          ) : null}
        </header>
      </div>
      <CategoryCatalogView
        categoryId={category.id}
        categorySlug={category.slug}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.cover || p.image,
          price: p.retailPrice,
          categoryId: p.categoryId,
        }))}
      />
      <SiteFooter />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: category.name, path },
          ]),
          collectionPageJsonLd({
            name: category.seoTitle || category.name,
            description:
              category.seoDescription ||
              category.description ||
              category.name,
            path,
          }),
        ]}
      />
    </main>
  );
}
