/**
 * Camada de SEO do site (metadata, paths, scores, JSON-LD helpers).
 * Integra-se ao CMS e ao catálogo — não duplica rotas de negócio.
 */
import type { Metadata } from "next";
import type { SeoPage } from "@/data/admin";
import { slugify } from "@/data/adminCatalog";

export const SITE_NAME = "Home Queen";
export const SITE_DEFAULT_TITLE = "Home Queen | Camas Box Premium e Baús";
export const SITE_DEFAULT_DESCRIPTION =
  "Conheça as camas box premium, baús, colchões e acessórios Home Queen. Qualidade, conforto e entrega para todo o Brasil.";

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.homequeen.com.br";
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return getSiteUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  // Ignore hash-only SEO slugs for canonicals
  if (p.includes("#")) {
    return `${getSiteUrl()}${p.split("#")[0] || "/"}`;
  }
  return `${getSiteUrl()}${p}`;
}

export function productPath(product: { id: string; slug?: string | null }) {
  const slug = (product.slug || "").trim() || slugify(product.id) || product.id;
  return `/produto/${slug}`;
}

export function categoryPath(category: { slug?: string | null; id?: string }) {
  const slug =
    (category.slug || "").trim() ||
    (category.id ? slugify(category.id) : "") ||
    "categoria";
  return `/categoria/${slug}`;
}

export function normalizePath(slugOrPath: string | undefined | null, fallback = "/") {
  if (!slugOrPath) return fallback;
  let s = slugOrPath.trim();
  if (!s) return fallback;
  if (s.includes("#")) s = s.split("#")[0] || fallback;
  if (s.startsWith("http")) {
    try {
      return new URL(s).pathname || fallback;
    } catch {
      return fallback;
    }
  }
  return s.startsWith("/") ? s : `/${s}`;
}

export function emptySeoPage(partial?: Partial<SeoPage>): SeoPage {
  return {
    title: "",
    description: "",
    keywords: "",
    slug: "/",
    canonical: "",
    ogImage: "",
    ogTitle: "",
    ogDescription: "",
    indexable: true,
    ...partial,
  };
}

type BuildMetaOpts = {
  page: Partial<SeoPage> | null | undefined;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackPath?: string;
  fallbackImage?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
};

export function buildPageMetadata(opts: BuildMetaOpts): Metadata {
  const page = emptySeoPage(opts.page || undefined);
  const title =
    (page.title || opts.fallbackTitle || SITE_DEFAULT_TITLE).trim() ||
    SITE_DEFAULT_TITLE;
  const description =
    (page.description || opts.fallbackDescription || SITE_DEFAULT_DESCRIPTION).trim() ||
    SITE_DEFAULT_DESCRIPTION;
  const path = normalizePath(
    page.canonical || page.slug || opts.fallbackPath,
    opts.fallbackPath || "/",
  );
  const canonical = absoluteUrl(path);
  const image =
    page.ogImage ||
    opts.fallbackImage ||
    "/hero-home-queen.jpg";
  const ogTitle = (page.ogTitle || title).trim();
  const ogDescription = (page.ogDescription || description).trim();
  const keywords = page.keywords
    ? page.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined;

  const indexable =
    opts.noIndex === true
      ? false
      : page.indexable === false
        ? false
        : true;

  const absImage = absoluteUrl(image);

  return {
    title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: {
      canonical,
    },
    openGraph: {
      type: opts.type === "product" ? "website" : opts.type || "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      images: [
        {
          url: absImage,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [absImage],
    },
  };
}

export type SeoScoreLevel = "excelente" | "bom" | "melhorar";

export type SeoScoreResult = {
  score: number;
  level: SeoScoreLevel;
  label: string;
  color: "green" | "yellow" | "red";
  checks: Array<{ id: string; ok: boolean; label: string }>;
};

export function scoreSeo(input: {
  title?: string;
  description?: string;
  slug?: string;
  ogImage?: string;
  keywords?: string;
  content?: string;
  hasAlt?: boolean;
  hasImage?: boolean;
}): SeoScoreResult {
  const title = (input.title || "").trim();
  const description = (input.description || "").trim();
  const slug = (input.slug || "").trim();
  const checks = [
    {
      id: "title",
      ok: title.length >= 30 && title.length <= 65,
      label: "Título entre 30 e 65 caracteres",
    },
    {
      id: "titlePresent",
      ok: title.length > 0,
      label: "Título SEO preenchido",
    },
    {
      id: "description",
      ok: description.length >= 120 && description.length <= 160,
      label: "Meta description entre 120 e 160 caracteres",
    },
    {
      id: "descPresent",
      ok: description.length >= 50,
      label: "Descrição com conteúdo útil",
    },
    {
      id: "slug",
      ok: Boolean(slug) && !slug.includes("?") && !/[A-Z\s]/.test(slug),
      label: "Slug amigável",
    },
    {
      id: "og",
      ok: Boolean(input.ogImage),
      label: "Imagem social (Open Graph)",
    },
    {
      id: "keywords",
      ok: Boolean((input.keywords || "").trim()),
      label: "Palavras-chave",
    },
    {
      id: "content",
      ok: (input.content || "").trim().length >= 80,
      label: "Conteúdo descritivo",
    },
    {
      id: "image",
      ok: input.hasImage !== false,
      label: "Imagem principal",
    },
    {
      id: "alt",
      ok: input.hasAlt !== false,
      label: "Alt text das imagens",
    },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  let level: SeoScoreLevel = "melhorar";
  let color: "green" | "yellow" | "red" = "red";
  let label = "Precisa melhorar";
  if (score >= 80) {
    level = "excelente";
    color = "green";
    label = "Excelente";
  } else if (score >= 55) {
    level = "bom";
    color = "yellow";
    label = "Bom";
  }

  return { score, level, label, color, checks };
}

export function jsonLdScript(data: object | object[]) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function organizationJsonLd(opts?: {
  logo?: string;
  phone?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl(opts?.logo || "/logo-home-queen.png"),
    ...(opts?.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: opts.phone,
            contactType: "customer service",
            areaServed: "BR",
            availableLanguage: "Portuguese",
          },
        }
      : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(input: {
  name: string;
  description: string;
  path: string;
  image?: string | string[];
  sku?: string;
  brand?: string;
  price?: number;
  currency?: string;
  availability?: boolean;
  rating?: number;
  reviewCount?: number;
}) {
  const images = Array.isArray(input.image)
    ? input.image
    : input.image
      ? [input.image]
      : [];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    image: images.map((img) => absoluteUrl(img)),
    sku: input.sku,
    brand: {
      "@type": "Brand",
      name: input.brand || SITE_NAME,
    },
    ...(typeof input.rating === "number" && input.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(typeof input.price === "number"
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(input.path),
            priceCurrency: input.currency || "BRL",
            price: input.price.toFixed(2),
            availability:
              input.availability === false
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: SITE_NAME,
            },
          },
        }
      : {}),
  };
}

export function collectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  };
}

export function autoSeoDescription(input: {
  name: string;
  extra?: string;
  kind?: "product" | "category" | "page";
}) {
  const base =
    input.kind === "category"
      ? `Confira ${input.name} Home Queen — qualidade premium, fábrica própria e entrega para todo o Brasil.`
      : input.kind === "product"
        ? `${input.name} Home Queen. Conforto, acabamento premium e entrega nacional.`
        : SITE_DEFAULT_DESCRIPTION;
  const extra = (input.extra || "").replace(/\s+/g, " ").trim();
  if (!extra) return base.slice(0, 160);
  const merged = `${extra} ${base}`.replace(/\s+/g, " ").trim();
  return merged.length > 160 ? `${merged.slice(0, 157)}…` : merged;
}
