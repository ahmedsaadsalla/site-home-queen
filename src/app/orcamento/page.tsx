import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { QuoteRequestView } from "@/components/QuoteRequestView";
import type { QuoteProductSnapshot } from "@/data/quotes";
import {
  calcPrice,
  getProductDetail,
  type ProductMattress,
  type ProductSize,
  type ProductType,
} from "@/data/productDetail";
import { readAdminCms } from "@/lib/adminStore";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildProductSnapshot(
  params: Record<string, string | string[] | undefined>,
): QuoteProductSnapshot {
  const productId = pick(params, "productId") || "";
  const detail = productId ? getProductDetail(productId) : null;

  const type =
    (pick(params, "tipo") as ProductType | undefined) ||
    detail?.defaultType ||
    "Box Baú";
  const size =
    (pick(params, "tamanho") as ProductSize | undefined) ||
    detail?.defaultSize ||
    "King Bipartido";
  const mattress =
    (pick(params, "colchao") as ProductMattress | undefined) ||
    detail?.defaultMattress ||
    "Sem colchão";
  const color =
    pick(params, "cor") || detail?.defaultColor || "Preto";
  const quantity = Math.max(1, Number(pick(params, "qty") || 1) || 1);
  const model =
    pick(params, "modelo") ||
    detail?.badge ||
    detail?.subcategory ||
    "Premium";

  const variant =
    detail?.variants.find((v) => v.size === size) ?? detail?.variants[0];

  const price = variant
    ? calcPrice(variant.price, type, mattress, quantity)
    : pick(params, "preco")
      ? Number(pick(params, "preco"))
      : null;

  const name =
    pick(params, "nome") ||
    detail?.name ||
    "Produto Home Queen";
  const category =
    pick(params, "categoria") ||
    detail?.categoryLabel ||
    "Camas Box";
  const categoryId =
    pick(params, "categoriaId") || detail?.categoryId || "camas-box";
  const sku = pick(params, "sku") || variant?.sku || "HQ-000";
  const code =
    pick(params, "codigo") ||
    (detail ? `HQ-${detail.categoryId.toUpperCase().slice(0, 2)}-${sku}` : sku);
  const image =
    pick(params, "imagem") ||
    variant?.images[0] ||
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80";

  return {
    productId: productId || detail?.id || "geral",
    name,
    category,
    categoryId,
    model,
    type,
    size,
    color,
    mattress,
    quantity,
    price,
    code,
    sku,
    image,
    rating: detail?.rating ?? 4.9,
    reviews: detail?.reviews ?? 0,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const cms = await readAdminCms();
  return buildPageMetadata({
    page: cms.seo.quote || {
      title: "Orçamento | Home Queen",
      description:
        "Solicite um orçamento personalizado para camas box, colchões e linha premium Home Queen.",
      keywords: "orçamento, cama box",
      slug: "/orcamento",
      ogImage: "",
      indexable: true,
    },
    fallbackTitle: "Orçamento | Home Queen",
    fallbackDescription:
      "Solicite um orçamento personalizado para camas box e produtos Home Queen.",
    fallbackPath: "/orcamento",
  });
}

export default async function OrcamentoPage({ searchParams }: Props) {
  const params = await searchParams;
  const product = buildProductSnapshot(params);
  const detail = product.productId
    ? getProductDetail(product.productId)
    : null;

  const breadcrumb = [
    { label: "Início", href: "/" },
    ...(detail
      ? [
          {
            label: detail.categoryLabel,
            href: "/#categorias",
          },
          {
            label: detail.name,
            href: `/produto/${detail.id}`,
          },
        ]
      : [{ label: "Produtos", href: "/#nosso-catalogo" }]),
    { label: "Solicitar Orçamento" },
  ];

  return (
    <main className="bg-[#F8F8F6] text-[#0F0F10]">
      <div className="bg-black">
        <TopBar />
        <SiteHeader />
      </div>
      <QuoteRequestView product={product} breadcrumb={breadcrumb} />
      <QuoteTrustBar />
      <SiteFooter />
    </main>
  );
}

function QuoteTrustBar() {
  const items = [
    { title: "Fábrica própria", icon: "factory" },
    { title: "Materiais premium", icon: "box" },
    { title: "Tecnologia moderna", icon: "tech" },
    { title: "Garantia de qualidade", icon: "shield" },
  ];

  return (
    <div className="border-t border-[#EEEAE4] bg-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-6 py-10 lg:grid-cols-4 lg:px-10">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C8A96A]/40 text-[#C8A96A]">
              ★
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F0F10]">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
